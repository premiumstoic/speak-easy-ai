import { useState, useRef, useCallback, useEffect } from "react";
import { fal } from "@fal-ai/client";

// Configure fal client
fal.config({
  credentials: import.meta.env.VITE_FAL_KEY,
});

// Check for Web Speech API support
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
  const interimTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isStoppingRef = useRef(false);
  const transcriptRef = useRef("");
  const recognitionRef = useRef<any>(null);
  const webSpeechTextRef = useRef("");
  const falHasRespondedRef = useRef(false);

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
      console.warn("[useFalStreaming] transcription error:", err);
      return "";
    }
  }, []);

  const getAccumulatedBlob = useCallback((): Blob | null => {
    if (chunksRef.current.length === 0) return null;
    const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
    return new Blob([...chunksRef.current], { type: mimeType });
  }, []);

  // Start Web Speech API for instant interim results
  const startWebSpeech = useCallback(() => {
    if (!SpeechRecognition) return;
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";
        for (let i = 0; i < event.results.length; i++) {
          const r = event.results[i];
          if (r.isFinal) {
            final += r[0].transcript;
          } else {
            interim += r[0].transcript;
          }
        }
        const combined = (final + (interim ? " " + interim : "")).trim();
        webSpeechTextRef.current = combined;

        // Only show Web Speech results until fal.ai has responded
        if (!falHasRespondedRef.current && !isStoppingRef.current && combined) {
          transcriptRef.current = combined;
          setTranscript(combined);
        }
      };

      recognition.onerror = () => {}; // Silently ignore — fal.ai is primary
      recognition.onend = () => {
        // Restart if still recording (browser kills it after silence)
        if (!isStoppingRef.current && recognitionRef.current) {
          try { recognition.start(); } catch {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      // Web Speech not available — no-op, fal.ai handles everything
    }
  }, []);

  const stopWebSpeech = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript("");
    transcriptRef.current = "";
    webSpeechTextRef.current = "";
    falHasRespondedRef.current = false;
    chunksRef.current = [];
    isStoppingRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

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

      // Start Web Speech API for instant interim text
      startWebSpeech();

      // Periodic fal.ai transcription every 3s for higher accuracy
      interimTimerRef.current = setInterval(async () => {
        if (isStoppingRef.current) return;
        const blob = getAccumulatedBlob();
        if (!blob || blob.size < 1000) return;
        const text = await transcribeBlob(blob);
        if (text && !isStoppingRef.current) {
          falHasRespondedRef.current = true;
          transcriptRef.current = text;
          setTranscript(text);
        }
      }, 3000);
    } catch (err: any) {
      console.error("[useFalStreaming] mic error:", err);
      setError(
        err.name === "NotAllowedError"
          ? "Microphone permission denied. Please allow mic access."
          : "Could not access microphone."
      );
    }
  }, [transcribeBlob, getAccumulatedBlob, startWebSpeech]);

  const stopRecording = useCallback(async (): Promise<string> => {
    isStoppingRef.current = true;
    stopWebSpeech();

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

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }

        if (!finalBlob || finalBlob.size < 500) {
          resolve(transcriptRef.current);
          return;
        }

        // Final high-accuracy transcription from fal.ai
        const finalText = await transcribeBlob(finalBlob);
        if (finalText) {
          transcriptRef.current = finalText;
          setTranscript(finalText);
        }
        resolve(transcriptRef.current);
      };

      recorder.stop();
    });
  }, [cleanup, transcribeBlob, getAccumulatedBlob, stopWebSpeech]);

  return { transcript, isRecording, startRecording, stopRecording, error };
}
