import {
  heuristicDecision,
  normalizeDecision,
  validatePayload,
} from "./index.ts";

Deno.test("validatePayload rejects malformed body", () => {
  const result = validatePayload({ session_id: "demo_123" });
  if (result.ok) {
    throw new Error("Expected validation to fail for malformed payload");
  }
});

Deno.test("validatePayload accepts correct body", () => {
  const result = validatePayload({
    session_id: "demo_123",
    technique_id: "open_mediation_enactment",
    state_key: "state_open_floor",
    speaker: "Partner A",
    transcript: "I feel ignored.",
    event_type: "analysis_tick",
    chunk_index: 0,
    client_ts: new Date().toISOString(),
  });

  if (!result.ok) {
    throw new Error(`Expected valid payload, got error: ${result.error}`);
  }
});

Deno.test("normalizeDecision enforces canonical IDs and threshold", () => {
  const normalized = normalizeDecision({
    action_decision: "interrupt",
    confidence_score: 0.92,
    detected_tripwire: "the_escalation",
    reasoning_summary: "Escalation markers crossed the threshold.",
  });

  if (normalized.action_decision !== "interrupt") {
    throw new Error("Expected interrupt decision");
  }

  if (normalized.detected_tripwire !== "the_escalation") {
    throw new Error("Expected canonical tripwire id");
  }
});

Deno.test("heuristicDecision returns expected shape", () => {
  const decision = heuristicDecision(
    "You always do this. We are in circles again and never moving forward."
  );

  if (!(decision.action_decision === "interrupt" || decision.action_decision === "null")) {
    throw new Error("Invalid action_decision");
  }

  if (typeof decision.confidence_score !== "number") {
    throw new Error("confidence_score must be a number");
  }

  if (typeof decision.reasoning_summary !== "string" || !decision.reasoning_summary.length) {
    throw new Error("reasoning_summary must be a non-empty string");
  }
});
