#!/usr/bin/env node

import { fal } from "@fal-ai/client";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const TRIPWIRE_IDS = [
  "the_loop",
  "the_missed_drop",
  "the_escalation",
  "the_stonewall",
];

const CONFIDENCE_THRESHOLD = 0.85;
const DEFAULT_LLM_ENDPOINT = "openrouter/router";
const DEFAULT_LLM_MODEL = "openai/gpt-4o-mini";
const DEFAULT_AUDIO_LLM_MODEL = "openai/gpt-4o-audio-preview";

function loadEnvFile(pathname) {
  if (!existsSync(pathname)) return;

  const lines = readFileSync(pathname, "utf8").split("\n");
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const equalIndex = line.indexOf("=");
    if (equalIndex === -1) continue;

    const key = line.slice(0, equalIndex).trim();
    const value = line.slice(equalIndex + 1).trim().replace(/^"|"$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function bootstrapEnv() {
  loadEnvFile(resolve(".env.local"));
  loadEnvFile(resolve(".env"));
}

function extractFirstJsonObject(text) {
  if (typeof text !== "string") return null;

  const withoutCodeFence = text
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  const firstCurly = withoutCodeFence.indexOf("{");
  const lastCurly = withoutCodeFence.lastIndexOf("}");
  if (firstCurly === -1 || lastCurly === -1 || lastCurly < firstCurly) {
    return null;
  }

  const candidate = withoutCodeFence.slice(firstCurly, lastCurly + 1);

  try {
    const parsed = JSON.parse(candidate);
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

function makeSilentWav(seconds = 2) {
  const sampleRate = 16000;
  const numSamples = sampleRate * seconds;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + numSamples * 2, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(numSamples * 2, 40);

  return Buffer.concat([header, Buffer.alloc(numSamples * 2, 0)]);
}

async function callLlm({ systemPrompt, userPrompt }) {
  const endpoint = process.env.FAL_LLM_ENDPOINT || DEFAULT_LLM_ENDPOINT;
  const model = process.env.FAL_LLM_MODEL || DEFAULT_LLM_MODEL;

  const input =
    endpoint === "openrouter/router"
      ? {
          model,
          system_prompt: systemPrompt,
          prompt: userPrompt,
          temperature: 0,
        }
      : {
          model,
          prompt: `${systemPrompt}\n\n${userPrompt}`,
        };

  const result = await fal.subscribe(endpoint, { input });
  const output = result?.data?.output;

  if (typeof output !== "string" || !output.trim()) {
    throw new Error("LLM returned empty output.");
  }

  return {
    endpoint,
    model,
    rawOutput: output,
    usage: result?.data?.usage ?? null,
  };
}

async function callLlmForJson(params) {
  const call = await callLlm(params);
  const parsed = extractFirstJsonObject(call.rawOutput);

  if (!parsed) {
    throw new Error(`Model did not return parsable JSON. Output: ${call.rawOutput}`);
  }

  return { ...call, parsed };
}

async function callAudioLlmForJson({ systemPrompt, userPrompt, audioUrl }) {
  const model = process.env.FAL_AUDIO_MODEL || DEFAULT_AUDIO_LLM_MODEL;
  const result = await fal.subscribe("openrouter/router/audio", {
    input: {
      model,
      audio_url: audioUrl,
      system_prompt: systemPrompt,
      prompt: userPrompt,
      temperature: 0,
    },
  });

  const output = result?.data?.output;
  if (typeof output !== "string" || !output.trim()) {
    throw new Error("Audio LLM returned empty output.");
  }

  const parsed = extractFirstJsonObject(output);
  if (!parsed) {
    throw new Error(`Audio LLM did not return parsable JSON. Output: ${output}`);
  }

  return { parsed, rawOutput: output, usage: result?.data?.usage ?? null, model };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function isOneSentence(text) {
  if (typeof text !== "string") return false;
  const trimmed = text.trim();
  if (!trimmed) return false;
  const sentenceLikeCount = (trimmed.match(/[.!?](?:\s|$)/g) || []).length;
  return sentenceLikeCount <= 1;
}

async function runWhisperConnectivityTest() {
  const wavBuffer = makeSilentWav(2);
  const file = new File([wavBuffer], "umay-whisper-smoke.wav", {
    type: "audio/wav",
  });

  const audioUrl = await fal.storage.upload(file);
  const result = await fal.subscribe("fal-ai/whisper", {
    input: {
      audio_url: audioUrl,
      task: "transcribe",
      chunk_level: "segment",
    },
  });

  return {
    audioUrl,
    transcript: typeof result?.data?.text === "string" ? result.data.text : "",
  };
}

async function runInsightGeneratorTest() {
  const systemPrompt =
    "You are an AI couples therapist. Read this brief snippet of recent arguments and generate ONE short, kind, 1-sentence insight or question to display on their app home screen. E.g. 'I noticed you both argued about chores recently. Did you feel more appreciated today?'";

  const userPrompt = [
    "RECENT_ARGUMENT_SNIPPET:",
    "- Partner A: I feel invisible when I clean and nobody notices.",
    "- Partner B: I am exhausted too, and then I feel judged.",
    "- Partner A: I do not want to fight, I want us to feel like a team again.",
    "",
    "Return strict JSON:",
    "{",
    '  "insight": "one kind sentence only"',
    "}",
    "",
    "Rules:",
    "- Keep it to one sentence.",
    "- Keep tone warm and non-blaming.",
    "- No markdown.",
  ].join("\n");

  const response = await callLlmForJson({ systemPrompt, userPrompt });
  const insight = response.parsed.insight;

  assert(typeof insight === "string" && insight.trim().length > 0, "Missing 'insight' string.");
  assert(isOneSentence(insight), "Insight is not a single sentence.");
  assert(insight.length <= 220, "Insight exceeds 220 characters.");

  return {
    insight: insight.trim(),
    usage: response.usage,
  };
}

function validateObserverDecision(parsed) {
  const action = parsed.action_decision;
  const confidence = Number(parsed.confidence_score);
  const tripwire = parsed.detected_tripwire;
  const reasoning = parsed.reasoning_summary;

  assert(action === "interrupt" || action === "null", "Invalid action_decision.");
  assert(Number.isFinite(confidence) && confidence >= 0 && confidence <= 1, "Invalid confidence_score.");
  assert(
    tripwire === null || (typeof tripwire === "string" && TRIPWIRE_IDS.includes(tripwire)),
    "Invalid detected_tripwire."
  );
  assert(typeof reasoning === "string" && reasoning.trim().length > 0, "Missing reasoning_summary.");

  if (confidence < CONFIDENCE_THRESHOLD) {
    assert(action === "null", "confidence_score < 0.85 must produce action_decision='null'.");
  }

  if (action === "interrupt") {
    assert(tripwire !== null, "action_decision='interrupt' requires detected_tripwire.");
  }
}

async function runProcessObserverCase({ label, contextWindow, expectedAction, expectedTripwire = null }) {
  const systemPrompt = [
    "You are an expert Clinical Process Observer operating within an Emotionally Focused Therapy and Structural Family Therapy framework. You are currently monitoring a live, unmediated Guided Enactment between two partners.",
    "",
    "Your Prime Directive: You are a silent observer. Human couples must struggle through conflict to build relational resilience. You will NOT intervene in minor disagreements, content-based disputes, or healthy expressions of frustration. You must maintain SILENCE 95% of the time.",
    "",
    "Intervention Criteria: You are authorized to break silence ONLY if the interaction crosses one of the four defined Tripwires: 1. The Loop, 2. The Missed Drop, 3. The Escalation, or 4. The Stonewall.",
    "",
    "Reasoning Protocol: Evaluate semantic text and acoustic metadata tags before deciding.",
    "",
    "Output Constraint: Return strict JSON only with this schema:",
    "{",
    '  "action_decision": "interrupt" | "null",',
    '  "confidence_score": number,',
    '  "detected_tripwire": "the_loop" | "the_missed_drop" | "the_escalation" | "the_stonewall" | null,',
    '  "reasoning_summary": "short clinical reason (<= 180 chars)"',
    "}",
    "",
    "If confidence_score is less than 0.85, action_decision MUST be 'null'.",
    "No markdown.",
  ].join("\n");

  const userPrompt = [
    "CONTEXT_WINDOW_20_MESSAGES:",
    contextWindow,
    "",
    "Evaluate and return JSON now.",
  ].join("\n");

  const response = await callLlmForJson({ systemPrompt, userPrompt });
  validateObserverDecision(response.parsed);

  if (expectedAction) {
    assert(
      response.parsed.action_decision === expectedAction,
      `${label}: expected action_decision='${expectedAction}', got '${response.parsed.action_decision}'.`
    );
  }

  if (expectedTripwire) {
    assert(
      response.parsed.detected_tripwire === expectedTripwire,
      `${label}: expected detected_tripwire='${expectedTripwire}', got '${response.parsed.detected_tripwire}'.`
    );
  }

  return {
    label,
    decision: response.parsed,
    usage: response.usage,
  };
}

async function runProcessObserverAudioSchemaCase(audioUrl) {
  const systemPrompt = [
    "You are an expert Clinical Process Observer operating within an Emotionally Focused Therapy and Structural Family Therapy framework.",
    "Return strict JSON only:",
    "{",
    '  "action_decision": "interrupt" | "null",',
    '  "confidence_score": number,',
    '  "detected_tripwire": "the_loop" | "the_missed_drop" | "the_escalation" | "the_stonewall" | null,',
    '  "reasoning_summary": "short clinical reason (<= 180 chars)"',
    "}",
    `If confidence_score is less than ${CONFIDENCE_THRESHOLD}, action_decision MUST be 'null'.`,
    "No markdown.",
  ].join("\n");

  const userPrompt = [
    "Analyze this partner turn audio.",
    "If the audio is silent or unintelligible, return action_decision='null', confidence_score=0.0, detected_tripwire=null.",
    "Reasoning summary can state no audible speech was detected.",
    "Return JSON now.",
  ].join("\n");

  const response = await callAudioLlmForJson({ systemPrompt, userPrompt, audioUrl });
  validateObserverDecision(response.parsed);

  return {
    decision: response.parsed,
    model: response.model,
    usage: response.usage,
  };
}

async function runMirroringJudgeCase({ senderText, receiverText, expected }) {
  const systemPrompt = [
    "You are a clinical evaluator enforcing the 'Mirroring' phase of the Imago Dialogue. Compare RECEIVER_TEXT to SENDER_TEXT. Your goal is to ensure the Receiver provided a flat, accurate reflection of the Sender's reality.",
    "",
    "Fail the Receiver if they:",
    "1. Introduce their own perspective or defense.",
    "2. Use sarcasm or contempt.",
    "3. Offer unsolicited advice.",
    "",
    "Return strict JSON only:",
    "{",
    '  "result": "PASS" | "FAIL",',
    '  "reason": "short explanation"',
    "}",
    "No markdown.",
  ].join("\n");

  const userPrompt = [
    `SENDER_TEXT: ${senderText}`,
    `RECEIVER_TEXT: ${receiverText}`,
    "",
    "Evaluate now.",
  ].join("\n");

  const response = await callLlmForJson({ systemPrompt, userPrompt });
  const result = response.parsed.result;

  assert(result === "PASS" || result === "FAIL", "Mirroring judge returned invalid result.");
  assert(result === expected, `Mirroring judge expected '${expected}', got '${result}'.`);

  return {
    expected,
    actual: result,
    reason: response.parsed.reason ?? "",
    usage: response.usage,
  };
}

async function runEmpathyJudgeCase({ receiverText, expected }) {
  const systemPrompt = [
    "You are a clinical evaluator enforcing the 'Empathy' phase of the Imago Dialogue. Analyze RECEIVER_TEXT.",
    "",
    "Ensure the text contains a valid core emotion word (e.g., Angry, Sad, Lonely, Scared, Overwhelmed) and does not substitute a thought or accusation for a feeling.",
    "",
    "Fail if the user says forms like 'I feel like you are being unfair' or 'I feel that you do not care', because these are thoughts or accusations rather than core emotions.",
    "",
    "Return strict JSON only:",
    "{",
    '  "result": "PASS" | "FAIL",',
    '  "reason": "short explanation"',
    "}",
    "No markdown.",
  ].join("\n");

  const userPrompt = `RECEIVER_TEXT: ${receiverText}`;

  const response = await callLlmForJson({ systemPrompt, userPrompt });
  const result = response.parsed.result;

  assert(result === "PASS" || result === "FAIL", "Empathy judge returned invalid result.");
  assert(result === expected, `Empathy judge expected '${expected}', got '${result}'.`);

  return {
    expected,
    actual: result,
    reason: response.parsed.reason ?? "",
    usage: response.usage,
  };
}

function printSuccess(name, details) {
  const detailText = details ? ` | ${details}` : "";
  console.log(`[PASS] ${name}${detailText}`);
}

function printFailure(name, error) {
  console.error(`[FAIL] ${name} | ${error instanceof Error ? error.message : String(error)}`);
}

async function main() {
  bootstrapEnv();

  const falKey = process.env.FAL_KEY || process.env.VITE_FAL_KEY;
  if (!falKey) {
    console.error("Missing FAL key. Set FAL_KEY or VITE_FAL_KEY.");
    process.exit(1);
  }

  fal.config({ credentials: falKey });

  const endpoint = process.env.FAL_LLM_ENDPOINT || DEFAULT_LLM_ENDPOINT;
  const model = process.env.FAL_LLM_MODEL || DEFAULT_LLM_MODEL;
  console.log(`Running Umay AI stack checks with endpoint=${endpoint}, model=${model}`);

  let passed = 0;
  let failed = 0;

  async function runCheck(name, fn, formatter = null) {
    try {
      const data = await fn();
      passed += 1;
      const detail = formatter ? formatter(data) : null;
      printSuccess(name, detail);
      return data;
    } catch (error) {
      failed += 1;
      printFailure(name, error);
      return null;
    }
  }

  const whisperResult = await runCheck(
    "Whisper connectivity",
    runWhisperConnectivityTest,
    (data) => `transcript_length=${data.transcript.length}`
  );

  if (whisperResult?.audioUrl) {
    await runCheck(
      "Process Observer (native audio endpoint schema)",
      () => runProcessObserverAudioSchemaCase(whisperResult.audioUrl),
      (data) =>
        `model=${data.model}, action=${data.decision.action_decision}, confidence=${Number(data.decision.confidence_score).toFixed(2)}`
    );
  }

  await runCheck(
    "Insight Generator",
    runInsightGeneratorTest,
    (data) => `insight="${data.insight}"`
  );

  const mildContext = [
    "[1][speaker=A][tone=calm] I wish chores felt more balanced.",
    "[2][speaker=B][tone=calm] I hear that, I am willing to plan this together.",
    "[3][speaker=A][tone=soft] Thank you, I want teamwork not blame.",
    "[4][speaker=B][tone=soft] Same here, I care about us.",
    "[5][speaker=A][tone=calm] Maybe we can split weekdays and weekends.",
    "[6][speaker=B][tone=calm] That sounds fair.",
    "[7][speaker=A][tone=calm] I appreciate you listening.",
    "[8][speaker=B][tone=calm] I appreciate you bringing it up gently.",
    "[9][speaker=A][tone=calm] We are still figuring it out.",
    "[10][speaker=B][tone=calm] Yes, and we are staying connected.",
    "[11][speaker=A][tone=calm] I feel okay continuing this tomorrow.",
    "[12][speaker=B][tone=calm] Works for me.",
    "[13][speaker=A][tone=calm] No need to solve everything now.",
    "[14][speaker=B][tone=calm] Agreed.",
    "[15][speaker=A][tone=calm] I am not feeling attacked.",
    "[16][speaker=B][tone=calm] I am not attacking you.",
    "[17][speaker=A][tone=calm] Good.",
    "[18][speaker=B][tone=calm] Good.",
    "[19][speaker=A][tone=calm] Let us pause soon.",
    "[20][speaker=B][tone=calm] Okay.",
  ].join("\n");

  const escalationContext = [
    "[1][speaker=A][tone=sharp] You always do this.",
    "[2][speaker=B][tone=sharp] No, you always start it.",
    "[3][speaker=A][tone=heated] Stop twisting this.",
    "[4][speaker=B][tone=heated] You are impossible.",
    "[5][speaker=A][tone=heated] I am done explaining.",
    "[6][speaker=B][tone=heated] Shut up and listen for once.",
    "[7][speaker=A][tone=angry] Do not tell me to shut up.",
    "[8][speaker=B][tone=angry] Then stop acting ridiculous.",
    "[9][speaker=A][tone=angry] This is your fault, every time.",
    "[10][speaker=B][tone=angry] You never take responsibility.",
    "[11][speaker=A][tone=angry] Because you attack me constantly.",
    "[12][speaker=B][tone=angry] I attack because you lie.",
    "[13][speaker=A][tone=angry] That is garbage.",
    "[14][speaker=B][tone=angry] Whatever.",
    "[15][speaker=A][tone=angry] You are impossible to talk to.",
    "[16][speaker=B][tone=angry] Same to you.",
    "[17][speaker=A][tone=angry] This is toxic.",
    "[18][speaker=B][tone=angry] You made it toxic.",
    "[19][speaker=A][tone=angry] I cannot stand this.",
    "[20][speaker=B][tone=angry] Then leave.",
  ].join("\n");

  await runCheck(
    "Process Observer (mild disagreement -> silence)",
    () =>
      runProcessObserverCase({
        label: "mild_disagreement",
        contextWindow: mildContext,
        expectedAction: "null",
      }),
    (data) =>
      `action=${data.decision.action_decision}, confidence=${Number(data.decision.confidence_score).toFixed(2)}`
  );

  await runCheck(
    "Process Observer (escalation -> interrupt)",
    () =>
      runProcessObserverCase({
        label: "escalation_case",
        contextWindow: escalationContext,
        expectedAction: "interrupt",
        expectedTripwire: "the_escalation",
      }),
    (data) =>
      `action=${data.decision.action_decision}, tripwire=${data.decision.detected_tripwire}, confidence=${Number(data.decision.confidence_score).toFixed(2)}`
  );

  await runCheck(
    "Mirroring Judge (good mirror -> PASS)",
    () =>
      runMirroringJudgeCase({
        senderText:
          "I felt alone when I was cleaning after dinner and nobody noticed.",
        receiverText:
          "You felt alone when you were cleaning after dinner and it seemed like no one noticed your effort.",
        expected: "PASS",
      }),
    (data) => `result=${data.actual}`
  );

  await runCheck(
    "Mirroring Judge (defensive reply -> FAIL)",
    () =>
      runMirroringJudgeCase({
        senderText:
          "I felt alone when I was cleaning after dinner and nobody noticed.",
        receiverText:
          "You felt alone, but I was actually busy all day and you are ignoring that.",
        expected: "FAIL",
      }),
    (data) => `result=${data.actual}`
  );

  await runCheck(
    "Empathy Judge (core emotion -> PASS)",
    () =>
      runEmpathyJudgeCase({
        receiverText: "I feel sad and lonely right now.",
        expected: "PASS",
      }),
    (data) => `result=${data.actual}`
  );

  await runCheck(
    "Empathy Judge (accusation as feeling -> FAIL)",
    () =>
      runEmpathyJudgeCase({
        receiverText: "I feel like you are being unfair and you do not care.",
        expected: "FAIL",
      }),
    (data) => `result=${data.actual}`
  );

  const total = passed + failed;
  console.log(`\nSummary: ${passed}/${total} checks passed.`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
