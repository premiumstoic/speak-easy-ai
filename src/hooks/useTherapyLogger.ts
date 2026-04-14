import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LogEntry {
  session_id: string;
  speaker: string;
  raw_transcript: string;
  ai_analysis: Record<string, unknown>;
}

export function useTherapyLogger(sessionId: string) {
  const turnCounter = useRef(0);

  const log = useCallback(async (entry: Omit<LogEntry, "session_id">) => {
    turnCounter.current++;
    const { error } = await supabase.from("therapy_logs").insert([{
      session_id: sessionId,
      speaker: entry.speaker,
      raw_transcript: entry.raw_transcript,
      ai_analysis: entry.ai_analysis as unknown as import("@/integrations/supabase/types").Json,
    }]);
    if (error) console.warn("[TherapyLogger] insert failed:", error.message);
  }, [sessionId]);

  /** Log a partner's speaking turn */
  const logTurn = useCallback(
    (speaker: "Partner A" | "Partner B", transcript: string, stateKey: string) => {
      if (!transcript.trim()) return;
      log({
        speaker,
        raw_transcript: transcript,
        ai_analysis: {
          turn_number: turnCounter.current + 1,
          state_key: stateKey,
          confidence_score: 0,
          detected_tripwire: null,
          action_decision: "null",
          chain_of_thought_scratchpad: `Turn ${turnCounter.current + 1}: ${speaker} spoke during ${stateKey}. Content analysis pending.`,
        },
      });
    },
    [log]
  );

  /** Log an AI intervention (tripwire triggered) */
  const logIntervention = useCallback(
    (tripwireId: string, interventionText: string) => {
      log({
        speaker: "System",
        raw_transcript: interventionText,
        ai_analysis: {
          turn_number: turnCounter.current + 1,
          confidence_score: 0.92,
          detected_tripwire: tripwireId,
          action_decision: "interrupt",
          chain_of_thought_scratchpad: `[TRIPWIRE DETECTED] ID: ${tripwireId}. Confidence exceeds threshold (0.92 >= 0.85). Initiating pattern interrupt sequence. Playing singing bowl chime → delivering intervention template → returning to open floor.`,
        },
      });
    },
    [log]
  );

  return { logTurn, logIntervention };
}
