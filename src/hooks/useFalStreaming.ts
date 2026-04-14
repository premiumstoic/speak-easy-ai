import { useState, useRef, useCallback, useEffect } from "react";
import { fal } from "@fal-ai/client";

fal.config({
  credentials: import.meta.env.VITE_FAL_KEY,
});

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

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
  const isStoppingRef = useRef(false);
  const transcriptRef = useRef("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => { cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanup = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    mediaRecorderRef.current = null;
  }, []);

  const transcribeBlob = useCallback(async (audioBlob: Blob): Promise<string> => {
    try {
      const audioUrl = await fal.storage.upload(
        new File([audioBlob], "audio.webm", { type: audioBlob.type })
      );
      const result = await fal.subscribe("fal-ai/whisper", {
        input: { audio_url: audioUrl, task: "transcribe", chunk_level: "segment" },
      });
      return (result.data as any)?.text?.trim() ?? "";
    } catch (err: any) {
      console.warn("[useFalStreaming] fal transcription error:", err);
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

      // Layer 1: Web Speech API — instant local transcript
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          if (isStoppingRef.current) return;
          let final = "";
          let interim = "";
          for (let i = 0; i < event.results.length; i++) {
            const r = event.results[i];
            if (r.isFinal) final += r[0].transcript;
            else interim += r[0].transcript;
          }
          const combined = (final + (interim ? " " + interim : "")).trim();
          if (combined) {
            transcriptRef.current = combined;
            setTranscript(combined);
          }
        };

        recognition.onerror = () => {};
        recognition.onend = () => {
          if (!isStoppingRef.current && recognitionRef.current) {
            try { recognition.start(); } catch {}
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      }

      // Layer 2: MediaRecorder captures audio for fal.ai final polish on stop
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 64000 });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start(500);
      setIsRecording(true);
    } catch (err: any) {
      console.error("[useFalStreaming] mic error:", err);
      setError(
        err.name === "NotAllowedError"
          ? "Microphone permission denied. Please allow mic access."
          : "Could not access microphone."
      );
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string> => {
    isStoppingRef.current = true;

    // Stop Web Speech immediately
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
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

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }

        if (!finalBlob || finalBlob.size < 500) {
          resolve(transcriptRef.current);
          return;
        }

        // Layer 2: fal.ai Whisper for final high-accuracy transcript
        const falText = await transcribeBlob(finalBlob);
        if (falText) {
          transcriptRef.current = falText;
          setTranscript(falText);
        }
        resolve(transcriptRef.current);
      };

      recorder.stop();
    });
  }, [cleanup, transcribeBlob, getAccumulatedBlob]);

  return { transcript, isRecording, startRecording, stopRecording, error };
}
