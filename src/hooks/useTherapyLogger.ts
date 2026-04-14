import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  TherapyDecisionResponse,
  TherapyEventRequest,
  TherapyEventType,
} from "@/types/therapyEvents";

interface LogInput {
  speaker: string;
  transcript: string;
  stateKey: string;
  eventType: TherapyEventType;
  chunkIndex: number | null;
}

function isDecisionResponse(value: unknown): value is TherapyDecisionResponse {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    (candidate.action_decision === "interrupt" || candidate.action_decision === "null") &&
    typeof candidate.confidence_score === "number" &&
    "detected_tripwire" in candidate &&
    typeof candidate.reasoning_summary === "string" &&
    "persisted_log_id" in candidate
  );
}

export function useTherapyLogger(sessionId: string, techniqueId: string) {
  const log = useCallback(
    async (entry: LogInput): Promise<TherapyDecisionResponse | null> => {
      const payload: TherapyEventRequest = {
        session_id: sessionId,
        technique_id: techniqueId,
        state_key: entry.stateKey,
        speaker: entry.speaker,
        transcript: entry.transcript,
        event_type: entry.eventType,
        chunk_index: entry.chunkIndex,
        client_ts: new Date().toISOString(),
      };

      const { data, error } = await supabase.functions.invoke("process-therapy-event", {
        body: payload,
      });

      if (error) {
        console.warn("[TherapyLogger] edge function invoke failed:", error.message);
        return null;
      }

      if (!isDecisionResponse(data)) {
        console.warn("[TherapyLogger] invalid edge function response shape");
        return null;
      }

      return data;
    },
    [sessionId, techniqueId]
  );

  const logAnalysisTick = useCallback(
    async (
      speaker: "Partner A" | "Partner B",
      transcript: string,
      stateKey: string,
      chunkIndex: number
    ): Promise<TherapyDecisionResponse | null> => {
      if (!transcript.trim()) return null;
      return log({
        speaker,
        transcript,
        stateKey,
        eventType: "analysis_tick",
        chunkIndex,
      });
    },
    [log]
  );

  const logTurn = useCallback(
    async (
      speaker: "Partner A" | "Partner B",
      transcript: string,
      stateKey: string,
      chunkIndex: number | null
    ): Promise<TherapyDecisionResponse | null> => {
      if (!transcript.trim()) return null;
      return log({
        speaker,
        transcript,
        stateKey,
        eventType: "turn_final",
        chunkIndex,
      });
    },
    [log]
  );

  const logIntervention = useCallback(
    async (interventionText: string): Promise<TherapyDecisionResponse | null> => {
      if (!interventionText.trim()) return null;
      return log({
        speaker: "System",
        transcript: interventionText,
        stateKey: "state_ai_intervention",
        eventType: "turn_final",
        chunkIndex: null,
      });
    },
    [log]
  );

  return { logAnalysisTick, logTurn, logIntervention };
}
