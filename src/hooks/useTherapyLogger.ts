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
  audioBlob?: Blob | null;
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
  const uploadAudioBlob = useCallback(
    async (
      audioBlob: Blob,
      speaker: string,
      eventType: TherapyEventType
    ): Promise<{ audioUrl: string; path: string } | null> => {
      if (audioBlob.size < 500) return null;

      const speakerSlug = speaker.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
      const ext = audioBlob.type.includes("wav")
        ? "wav"
        : audioBlob.type.includes("mp4")
          ? "mp4"
          : audioBlob.type.includes("mpeg")
            ? "mp3"
            : "webm";
      const filePath = `${sessionId}/${speakerSlug || "speaker"}-${eventType}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("therapy_audio")
        .upload(filePath, audioBlob, {
          upsert: false,
          contentType: audioBlob.type || undefined,
          cacheControl: "3600",
        });

      if (uploadError) {
        console.warn("[TherapyLogger] storage upload failed:", uploadError.message);
        return null;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("therapy_audio").getPublicUrl(filePath);

      if (!publicUrl) {
        console.warn("[TherapyLogger] storage public URL is empty");
        return null;
      }

      return { audioUrl: publicUrl, path: filePath };
    },
    [sessionId]
  );

  const log = useCallback(
    async (entry: LogInput): Promise<TherapyDecisionResponse | null> => {
      let uploadedAudio: { audioUrl: string; path: string } | null = null;
      if (entry.audioBlob && techniqueId === "open_mediation_enactment") {
        uploadedAudio = await uploadAudioBlob(entry.audioBlob, entry.speaker, entry.eventType);
      }

      const safeTranscript =
        entry.transcript.trim().length > 0
          ? entry.transcript
          : uploadedAudio
            ? "[audio turn captured]"
            : "";

      if (!safeTranscript.trim()) {
        console.warn("[TherapyLogger] skipping log entry with empty transcript and no uploaded audio");
        return null;
      }

      const payload: TherapyEventRequest = {
        session_id: sessionId,
        technique_id: techniqueId,
        state_key: entry.stateKey,
        speaker: entry.speaker,
        transcript: safeTranscript,
        audio_url: uploadedAudio?.audioUrl ?? null,
        audio_path: uploadedAudio?.path ?? null,
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
    [sessionId, techniqueId, uploadAudioBlob]
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
      chunkIndex: number | null,
      audioBlob?: Blob | null
    ): Promise<TherapyDecisionResponse | null> => {
      if (!transcript.trim() && !audioBlob) return null;
      return log({
        speaker,
        transcript,
        stateKey,
        eventType: "turn_final",
        chunkIndex,
        audioBlob: audioBlob ?? null,
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
