import { useState, useRef, useCallback, useEffect } from "react";
import { fal } from "@fal-ai/client";

// Configure fal client
fal.config({
  credentials: import.meta.env.VITE_FAL_KEY,
});

interface UseFalStreamingReturn {
  transcript: string;
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string>;
  error: string | null;
}

export function useFalStreaming(): UseFalStreamingReturn {
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const interimTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isStoppingRef = useRef(false);
  const transcriptRef = useRef("");

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanup = useCallback(() => {
    if (interimTimerRef.current) {
      clearInterval(interimTimerRef.current);
      interimTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
  }, []);

  const blobToDataUrl = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const transcribeBlob = useCallback(async (audioBlob: Blob): Promise<string> => {
    try {
      // Upload blob to fal storage first
      const dataUrl = await blobToDataUrl(audioBlob);
      const audioUrl = await fal.storage.upload(
        new File([audioBlob], "audio.webm", { type: audioBlob.type })
      );

      const result = await fal.subscribe("fal-ai/whisper", {
        input: {
          audio_url: audioUrl,
          task: "transcribe",
          chunk_level: "segment",
        },
      });

      return (result.data as any)?.text?.trim() ?? "";
    } catch (err: any) {
      console.warn("[useFalStreaming] transcription error:", err);
      return "";
    }
  }, []);

  const getAccumulatedBlob = useCallback((): Blob | null => {
    if (chunksRef.current.length === 0) return null;
    const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
    return new Blob([...chunksRef.current], { type: mimeType });
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript("");
    transcriptRef.current = "";
    chunksRef.current = [];
    isStoppingRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 64000,
      });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.start(500); // 500ms chunks
      setIsRecording(true);

      // Periodic interim transcription every 3 seconds
      interimTimerRef.current = setInterval(async () => {
        if (isStoppingRef.current) return;
        const blob = getAccumulatedBlob();
        if (!blob || blob.size < 1000) return; // skip tiny blobs
        const text = await transcribeBlob(blob);
        if (text && !isStoppingRef.current) {
          transcriptRef.current = text;
          setTranscript(text);
        }
      }, 3000);
    } catch (err: any) {
      console.error("[useFalStreaming] mic error:", err);
      if (err.name === "NotAllowedError") {
        setError("Microphone permission denied. Please allow mic access.");
      } else {
        setError("Could not access microphone.");
      }
    }
  }, [transcribeBlob, getAccumulatedBlob]);

  const stopRecording = useCallback(async (): Promise<string> => {
    isStoppingRef.current = true;

    if (interimTimerRef.current) {
      clearInterval(interimTimerRef.current);
      interimTimerRef.current = null;
    }

    return new Promise<string>((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        setIsRecording(false);
        cleanup();
        resolve(transcriptRef.current);
        return;
      }

      recorder.onstop = async () => {
        setIsRecording(false);
        const finalBlob = getAccumulatedBlob();

        // Stop mic tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }

        if (!finalBlob || finalBlob.size < 500) {
          resolve(transcriptRef.current);
          return;
        }

        // Final transcription of full audio
        const finalText = await transcribeBlob(finalBlob);
        if (finalText) {
          transcriptRef.current = finalText;
          setTranscript(finalText);
        }
        resolve(transcriptRef.current);
      };

      recorder.stop();
    });
  }, [cleanup, transcribeBlob, getAccumulatedBlob]);

  return { transcript, isRecording, startRecording, stopRecording, error };
}
