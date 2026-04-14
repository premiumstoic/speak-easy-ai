import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TRIPWIRE_IDS = [
  "the_loop",
  "the_missed_drop",
  "the_escalation",
  "the_stonewall",
] as const;

type TripwireId = (typeof TRIPWIRE_IDS)[number];
type EventType = "analysis_tick" | "turn_final";
type ActionDecision = "interrupt" | "null";
type DecisionResolutionSource = "fal_audio" | "openai_text" | "heuristic" | "not_applicable";

export interface TherapyEventRequest {
  session_id: string;
  technique_id: string;
  state_key: string;
  speaker: string;
  transcript: string;
  audio_url?: string | null;
  audio_path?: string | null;
  event_type: EventType;
  chunk_index: number | null;
  client_ts: string;
}

export interface TherapyDecisionResponse {
  action_decision: ActionDecision;
  confidence_score: number;
  detected_tripwire: TripwireId | null;
  reasoning_summary: string;
  persisted_log_id: string | null;
}

interface DecisionCandidate {
  action_decision?: unknown;
  confidence_score?: unknown;
  detected_tripwire?: unknown;
  reasoning_summary?: unknown;
}

const TRIPWIRE_KEYWORDS: Record<TripwireId, string[]> = {
  the_loop: [
    "always",
    "never",
    "same argument",
    "again",
    "in circles",
    "twist my words",
    "you always",
  ],
  the_missed_drop: [
    "i feel",
    "i need",
    "i miss",
    "hurt",
    "afraid",
    "overwhelmed",
    "not heard",
    "unseen",
  ],
  the_escalation: [
    "shut up",
    "your fault",
    "ridiculous",
    "whatever",
    "angry",
    "yell",
    "scream",
    "always your",
  ],
  the_stonewall: [
    "...",
    "fine",
    "nothing",
    "leave me alone",
    "i'm done",
    "stop",
    "can we not",
  ],
};

const CONFIDENCE_THRESHOLD = 0.85;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function isTripwireId(value: unknown): value is TripwireId {
  return typeof value === "string" && (TRIPWIRE_IDS as readonly string[]).includes(value);
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function validatePayload(payload: unknown):
  | { ok: true; value: TherapyEventRequest }
  | { ok: false; error: string } {
  if (!payload || typeof payload !== "object") {
    return { ok: false, error: "Request body must be an object." };
  }

  const candidate = payload as Record<string, unknown>;

  const requiredStringFields: Array<keyof TherapyEventRequest> = [
    "session_id",
    "technique_id",
    "state_key",
    "speaker",
    "transcript",
    "client_ts",
  ];

  for (const field of requiredStringFields) {
    const value = candidate[field];
    if (typeof value !== "string" || value.trim() === "") {
      return { ok: false, error: `Invalid '${field}'.` };
    }
  }

  if (candidate.event_type !== "analysis_tick" && candidate.event_type !== "turn_final") {
    return { ok: false, error: "Invalid 'event_type'. Must be analysis_tick or turn_final." };
  }

  const chunkIndex = candidate.chunk_index;
  if (!(chunkIndex === null || (typeof chunkIndex === "number" && Number.isInteger(chunkIndex) && chunkIndex >= 0))) {
    return { ok: false, error: "Invalid 'chunk_index'. Must be null or a non-negative integer." };
  }

  const timestamp = Date.parse(candidate.client_ts as string);
  if (Number.isNaN(timestamp)) {
    return { ok: false, error: "Invalid 'client_ts'." };
  }

  const audioUrl = candidate.audio_url;
  if (
    !(audioUrl === undefined || audioUrl === null || (typeof audioUrl === "string" && isHttpUrl(audioUrl)))
  ) {
    return { ok: false, error: "Invalid 'audio_url'. Must be a valid http(s) URL or null." };
  }

  const audioPath = candidate.audio_path;
  if (!(audioPath === undefined || audioPath === null || typeof audioPath === "string")) {
    return { ok: false, error: "Invalid 'audio_path'. Must be a string or null." };
  }

  return {
    ok: true,
    value: {
      session_id: candidate.session_id as string,
      technique_id: candidate.technique_id as string,
      state_key: candidate.state_key as string,
      speaker: candidate.speaker as string,
      transcript: candidate.transcript as string,
      audio_url: (candidate.audio_url as string | null | undefined) ?? null,
      audio_path: (candidate.audio_path as string | null | undefined) ?? null,
      event_type: candidate.event_type as EventType,
      chunk_index: candidate.chunk_index as number | null,
      client_ts: candidate.client_ts as string,
    },
  };
}

function extractFirstJsonObject(text: string): DecisionCandidate | null {
  const firstCurly = text.indexOf("{");
  const lastCurly = text.lastIndexOf("}");
  if (firstCurly === -1 || lastCurly === -1 || lastCurly <= firstCurly) return null;

  const jsonCandidate = text.slice(firstCurly, lastCurly + 1);
  try {
    const parsed = JSON.parse(jsonCandidate);
    if (parsed && typeof parsed === "object") {
      return parsed as DecisionCandidate;
    }
  } catch {
    // ignored
  }

  return null;
}

function extractOutputText(openAIResponse: unknown): string {
  if (!openAIResponse || typeof openAIResponse !== "object") return "";
  const payload = openAIResponse as Record<string, unknown>;

  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }

  if (!Array.isArray(payload.output)) return "";

  const chunks: string[] = [];
  for (const item of payload.output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;

    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const partObj = part as Record<string, unknown>;
      if (typeof partObj.text === "string") {
        chunks.push(partObj.text);
      }
    }
  }

  return chunks.join("\n");
}

function extractFalOutputText(falResponse: unknown): string {
  if (!falResponse || typeof falResponse !== "object") return "";
  const payload = falResponse as Record<string, unknown>;
  const direct = payload.output;
  if (typeof direct === "string" && direct.trim()) {
    return direct;
  }
  return "";
}

export function normalizeDecision(candidate: DecisionCandidate): Omit<TherapyDecisionResponse, "persisted_log_id"> {
  const rawDecision = candidate.action_decision;
  const rawConfidence = Number(candidate.confidence_score ?? 0);
  const rawDetected = candidate.detected_tripwire;
  const rawSummary = candidate.reasoning_summary;

  const detectedTripwire = isTripwireId(rawDetected) ? rawDetected : null;
  const confidenceScore = clamp01(rawConfidence);

  const actionDecision: ActionDecision =
    rawDecision === "interrupt" && detectedTripwire && confidenceScore >= CONFIDENCE_THRESHOLD
      ? "interrupt"
      : "null";

  let summary =
    typeof rawSummary === "string" && rawSummary.trim().length > 0
      ? rawSummary.trim()
      : "No intervention. Confidence remains below threshold.";

  if (summary.length > 220) {
    summary = `${summary.slice(0, 217)}...`;
  }

  return {
    action_decision: actionDecision,
    confidence_score: confidenceScore,
    detected_tripwire: detectedTripwire,
    reasoning_summary: summary,
  };
}

export function heuristicDecision(transcript: string): Omit<TherapyDecisionResponse, "persisted_log_id"> {
  const lower = transcript.toLowerCase();

  let bestTripwire: TripwireId | null = null;
  let bestMatchCount = 0;

  for (const tripwireId of TRIPWIRE_IDS) {
    const keywords = TRIPWIRE_KEYWORDS[tripwireId];
    const matchCount = keywords.reduce((count, keyword) => {
      return lower.includes(keyword) ? count + 1 : count;
    }, 0);

    if (matchCount > bestMatchCount) {
      bestMatchCount = matchCount;
      bestTripwire = tripwireId;
    }
  }

  if (!bestTripwire || bestMatchCount === 0) {
    return {
      action_decision: "null",
      confidence_score: 0.22,
      detected_tripwire: null,
      reasoning_summary:
        "No strong tripwire pattern detected in the latest text chunk.",
    };
  }

  const confidence = clamp01(0.55 + bestMatchCount * 0.17);
  const shouldInterrupt = confidence >= CONFIDENCE_THRESHOLD;

  return {
    action_decision: shouldInterrupt ? "interrupt" : "null",
    confidence_score: confidence,
    detected_tripwire: bestTripwire,
    reasoning_summary: shouldInterrupt
      ? `Tripwire '${bestTripwire}' crossed threshold from lexical pattern overlap.`
      : `Tripwire '${bestTripwire}' signs observed but below intervention threshold.`,
  };
}

async function decideWithModelIfConfigured(
  payload: TherapyEventRequest
): Promise<DecisionCandidate | null> {
  const openAIKey = Deno.env.get("OPENAI_API_KEY");
  const openAIModel = Deno.env.get("OPENAI_MODEL") ?? "gpt-4.1-mini";

  if (!openAIKey) {
    return null;
  }

  const prompt = [
    "You are an expert relationship process observer.",
    "Return only JSON with keys:",
    "action_decision (interrupt|null), confidence_score (0..1), detected_tripwire (the_loop|the_missed_drop|the_escalation|the_stonewall|null), reasoning_summary (<=180 chars).",
    "Do not include markdown.",
    `Threshold for interrupt is ${CONFIDENCE_THRESHOLD}.`,
    "Tripwire meanings:",
    "the_loop: repetitive circular argument with no progress.",
    "the_missed_drop: vulnerable emotional bid ignored or defended against.",
    "the_escalation: contempt, attack, or rapidly rising hostility.",
    "the_stonewall: shutdown, withdrawal, or abrupt disengagement.",
    `Input transcript: ${payload.transcript}`,
    `Speaker: ${payload.speaker}`,
    `State: ${payload.state_key}`,
    `Event type: ${payload.event_type}`,
  ].join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: openAIModel,
        temperature: 0,
        input: prompt,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const text = extractOutputText(data);
    const parsed = extractFirstJsonObject(text);
    if (!parsed) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

async function decideWithFalAudioIfConfigured(
  payload: TherapyEventRequest
): Promise<DecisionCandidate | null> {
  const falKey = Deno.env.get("FAL_KEY") ?? Deno.env.get("VITE_FAL_KEY");
  const falModel = Deno.env.get("FAL_AUDIO_MODEL") ?? "openai/gpt-4o-audio-preview";

  if (!falKey || !payload.audio_url) {
    return null;
  }

  const systemPrompt = [
    "You are an expert Clinical Process Observer operating within an Emotionally Focused Therapy and Structural Family Therapy framework.",
    "You are monitoring a live, unmediated partner exchange.",
    "Prime directive: maintain SILENCE 95% of the time.",
    "Do not intervene for ordinary disagreement.",
    "You may intervene only for these tripwires:",
    "1) the_loop, 2) the_missed_drop, 3) the_escalation, 4) the_stonewall.",
    "You must evaluate both semantics and acoustic evidence (tone, pacing, intensity, withdrawal).",
    "Return strict JSON only with keys:",
    "action_decision (interrupt|null), confidence_score (0..1), detected_tripwire (the_loop|the_missed_drop|the_escalation|the_stonewall|null), reasoning_summary (<=180 chars).",
    `If confidence_score is below ${CONFIDENCE_THRESHOLD}, action_decision must be 'null'.`,
    "No markdown.",
  ].join("\n");

  const prompt = [
    `Speaker: ${payload.speaker}`,
    `State: ${payload.state_key}`,
    `Event type: ${payload.event_type}`,
    `Text hint (may be partial): ${payload.transcript}`,
    "Analyze the provided audio and return the JSON decision.",
  ].join("\n");

  try {
    const response = await fetch("https://fal.run/openrouter/router/audio", {
      method: "POST",
      headers: {
        Authorization: `Key ${falKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: falModel,
        audio_url: payload.audio_url,
        system_prompt: systemPrompt,
        prompt,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const text = extractFalOutputText(data);
    if (!text) {
      return null;
    }

    const parsed = extractFirstJsonObject(text);
    return parsed;
  } catch {
    return null;
  }
}

async function resolveDecision(
  payload: TherapyEventRequest
): Promise<{
  decision: Omit<TherapyDecisionResponse, "persisted_log_id">;
  source: DecisionResolutionSource;
}> {
  if (payload.technique_id !== "open_mediation_enactment") {
    return {
      decision: {
        action_decision: "null",
        confidence_score: 0,
        detected_tripwire: null,
        reasoning_summary: "Technique does not require live tripwire intervention.",
      },
      source: "not_applicable",
    };
  }

  const heuristic = heuristicDecision(payload.transcript);
  const falAudioDecision = await decideWithFalAudioIfConfigured(payload);
  if (falAudioDecision) {
    return { decision: normalizeDecision(falAudioDecision), source: "fal_audio" };
  }

  const modelDecision = await decideWithModelIfConfigured(payload);
  if (modelDecision) {
    return { decision: normalizeDecision(modelDecision), source: "openai_text" };
  }

  return { decision: normalizeDecision(heuristic), source: "heuristic" };
}

function withJson(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
  });
}

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return withJson(405, { error: "Method not allowed" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return withJson(500, {
      error: "Missing Supabase environment variables for edge function runtime.",
    });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const authHeader = req.headers.get("Authorization");
  const jwt = authHeader?.replace("Bearer ", "").trim();

  if (!jwt) {
    return withJson(401, { error: "Missing bearer token" });
  }

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(jwt);

  if (authError || !user) {
    return withJson(401, { error: "Invalid user token" });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return withJson(400, { error: "Invalid JSON body" });
  }

  const validation = validatePayload(body);
  if (!validation.ok) {
    return withJson(400, { error: validation.error });
  }

  const payload = validation.value;
  const { decision, source } = await resolveDecision(payload);

  const aiAnalysis = {
    event_type: payload.event_type,
    chunk_index: payload.chunk_index,
    technique_id: payload.technique_id,
    state_key: payload.state_key,
    client_ts: payload.client_ts,
    action_decision: decision.action_decision,
    detected_tripwire: decision.detected_tripwire,
    confidence_score: decision.confidence_score,
    reasoning_summary: decision.reasoning_summary,
    audio_url: payload.audio_url ?? null,
    audio_path: payload.audio_path ?? null,
    decision_source: source,
    processed_at: new Date().toISOString(),
  };

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("therapy_logs")
    .insert({
      session_id: payload.session_id,
      speaker: payload.speaker,
      raw_transcript: payload.transcript,
      ai_analysis: aiAnalysis,
    })
    .select("id")
    .single();

  if (insertError) {
    return withJson(500, {
      error: "Failed to persist therapy event.",
      details: insertError.message,
    });
  }

  const response: TherapyDecisionResponse = {
    action_decision: decision.action_decision,
    confidence_score: decision.confidence_score,
    detected_tripwire: decision.detected_tripwire,
    reasoning_summary: decision.reasoning_summary,
    persisted_log_id: inserted?.id ?? null,
  };

  return withJson(200, response as unknown as Record<string, unknown>);
}

if (import.meta.main) {
  Deno.serve(handler);
}
