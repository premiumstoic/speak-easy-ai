import { useState, useRef, useCallback, useEffect } from "react";
import { fal } from "@fal-ai/client";

const HARDCODED_FAL_KEY = "304998f9-4b85-480a-8110-4902ad069841:87b17f14c88fafbfb4e0490c9de7ee95";

fal.config({
  credentials: import.meta.env.VITE_FAL_KEY || HARDCODED_FAL_KEY,
});

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

interface UseFalStreamingReturn {
  transcript: string;
  lines: string[];
  interimTranscript: string;
  audioLevel: number;
  isRecording: boolean;
  isTranscribing: boolean;
  latestAudioBlob: Blob | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<{ transcript: string; audioBlob: Blob | null }>;
  error: string | null;
}

export function useFalStreaming(): UseFalStreamingReturn {
  const [transcript, setTranscript] = useState("");
  const [lines, setLines] = useState<string[]>([]);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestAudioBlob, setLatestAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const isStoppingRef = useRef(false);
  const transcriptRef = useRef("");
  const linesRef = useRef<string[]>([]);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => { cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanup = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
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
    setAudioLevel(0);
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
    setLines([]);
    setInterimTranscript("");
    transcriptRef.current = "";
    linesRef.current = [];
    chunksRef.current = [];
    isStoppingRef.current = false;
    setLatestAudioBlob(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Audio level analyser — drives the mic visualizer
      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      audioCtx.createMediaStreamSource(stream).connect(analyser);
      const freqData = new Uint8Array(analyser.frequencyBinCount);
      const tickLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(freqData);
        const avg = freqData.reduce((s, v) => s + v, 0) / freqData.length;
        setAudioLevel(avg / 255);
        animFrameRef.current = requestAnimationFrame(tickLevel);
      };
      animFrameRef.current = requestAnimationFrame(tickLevel);

      // Layer 1: Web Speech API — instant local transcript
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          if (isStoppingRef.current) return;
          const newFinals: string[] = [];
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const r = event.results[i];
            if (r.isFinal) {
              const text = r[0].transcript.trim();
              if (text) newFinals.push(text);
            } else {
              interim += r[0].transcript;
            }
          }
          if (newFinals.length > 0) {
            linesRef.current = [...linesRef.current, ...newFinals];
            setLines([...linesRef.current]);
            transcriptRef.current = linesRef.current.join(" ");
            setTranscript(transcriptRef.current);
          }
          setInterimTranscript(interim.trim());
        };

        recognition.onerror = (e: any) => {
          console.warn("[useFalStreaming] SpeechRecognition error:", e.error);
        };
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

  const stopRecording = useCallback(async (): Promise<{ transcript: string; audioBlob: Blob | null }> => {
    isStoppingRef.current = true;

    // Stop Web Speech immediately
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setInterimTranscript("");

    return new Promise<{ transcript: string; audioBlob: Blob | null }>((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        setIsRecording(false);
        const blob = getAccumulatedBlob();
        setLatestAudioBlob(blob);
        cleanup();
        resolve({ transcript: transcriptRef.current, audioBlob: blob });
        return;
      }

      recorder.onstop = async () => {
        setIsRecording(false);
        const finalBlob = getAccumulatedBlob();
        setLatestAudioBlob(finalBlob);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }

        if (!finalBlob || finalBlob.size < 500) {
          resolve({ transcript: transcriptRef.current, audioBlob: finalBlob });
          return;
        }

        // Layer 2: fal.ai Whisper for final high-accuracy transcript
        setIsTranscribing(true);
        const falText = await transcribeBlob(finalBlob);
        setIsTranscribing(false);
        if (falText) {
          transcriptRef.current = falText;
          setTranscript(falText);
          // On devices without Web Speech API (e.g. iOS/Android fallback),
          // lines will be empty — populate from FAL so the ticker has content
          if (linesRef.current.length === 0) {
            linesRef.current = [falText];
            setLines([falText]);
          }
        }
        resolve({ transcript: transcriptRef.current, audioBlob: finalBlob });
      };

      recorder.stop();
    });
  }, [cleanup, transcribeBlob, getAccumulatedBlob]);

  return {
    transcript,
    lines,
    interimTranscript,
    audioLevel,
    isRecording,
    isTranscribing,
    latestAudioBlob,
    startRecording,
    stopRecording,
    error,
  };
}
