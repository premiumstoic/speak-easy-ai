export const TRIPWIRE_IDS = [
  "the_loop",
  "the_missed_drop",
  "the_escalation",
  "the_stonewall",
] as const;

export type TripwireId = (typeof TRIPWIRE_IDS)[number];

export type TherapyEventType = "analysis_tick" | "turn_final";
export type ActionDecision = "interrupt" | "null";

export interface TherapyEventRequest {
  session_id: string;
  technique_id: string;
  state_key: string;
  speaker: string;
  transcript: string;
  event_type: TherapyEventType;
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
