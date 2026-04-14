import { useState, useRef, useCallback } from "react";
import type { DemoTurn } from "@/data/demoScripts";
import type { TripwireId } from "@/types/therapyEvents";

interface UseDemoPlaybackOptions {
  script: DemoTurn[];
  onTranscript: (partner: "A" | "B", text: string) => void;
  onTripwire: (tripwireId: TripwireId) => void;
  onAdvanceState: () => void;
  onStartSpeaking: () => void;
  onStopSpeaking: () => void;
}

interface UseDemoPlaybackReturn {
  isPlaying: boolean;
  currentTurnIndex: number;
  startPlayback: () => void;
  stopPlayback: () => void;
  /** Simulated audio level for the orb visualizer */
  demoAudioLevel: number;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Picks two distinct SpeechSynthesis voices for Partner A and Partner B.
 * Prefers Turkish voices; falls back to English.
 */
function pickVoices(): { voiceA: SpeechSynthesisVoice | null; voiceB: SpeechSynthesisVoice | null } {
  const all = window.speechSynthesis.getVoices();
  const turkish = all.filter((v) => v.lang.startsWith("tr"));

  // If we have Turkish voices, use them
  if (turkish.length >= 2) {
    return { voiceA: turkish[0], voiceB: turkish[1] };
  }
  if (turkish.length === 1) {
    // One Turkish voice — use it for both but with different pitch
    return { voiceA: turkish[0], voiceB: turkish[0] };
  }

  // Fallback to English
  const english = all.filter((v) => v.lang.startsWith("en"));
  const pool = english.length >= 2 ? english : all;
  return { voiceA: pool[0] ?? null, voiceB: pool[1] ?? pool[0] ?? null };
}

function speakText(
  text: string,
  voice: SpeechSynthesisVoice | null,
  rate: number,
  pitch: number,
  lang: string,
  onBoundary: () => void
): Promise<void> {
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.lang = lang;

    utterance.onboundary = onBoundary;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    window.speechSynthesis.speak(utterance);
  });
}

export function useDemoPlayback({
  script,
  onTranscript,
  onTripwire,
  onAdvanceState,
  onStartSpeaking,
  onStopSpeaking,
}: UseDemoPlaybackOptions): UseDemoPlaybackReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(-1);
  const [demoAudioLevel, setDemoAudioLevel] = useState(0);
  const cancelledRef = useRef(false);

  const stopPlayback = useCallback(() => {
    cancelledRef.current = true;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentTurnIndex(-1);
    setDemoAudioLevel(0);
  }, []);

  const startPlayback = useCallback(() => {
    if (isPlaying) return;
    cancelledRef.current = false;
    setIsPlaying(true);

    const run = async () => {
      // Wait for voices to populate (Chrome loads them async)
      await delay(300);
      const { voiceA, voiceB } = pickVoices();

      for (let i = 0; i < script.length; i++) {
        if (cancelledRef.current) break;

        const turn = script[i];
        setCurrentTurnIndex(i);

        // Clear previous transcript for this speaker
        onTranscript(turn.speaker, "");

        // Simulate pressing the mic button
        onStartSpeaking();

        // Stream words into transcript alongside speech
        const words = turn.text.split(" ");
        let partial = "";

        const voice = turn.speaker === "A" ? voiceA : voiceB;
        // Use different pitch for A vs B to distinguish voices
        const pitch = turn.speaker === "A" ? 1.2 : 0.9;

        const wordBoundaryCb = () => {
          setDemoAudioLevel(0.4 + Math.random() * 0.5);
        };

        const wordInterval = setInterval(() => {
          if (words.length === 0) {
            clearInterval(wordInterval);
            return;
          }
          const next = words.shift()!;
          partial = partial ? `${partial} ${next}` : next;
          onTranscript(turn.speaker, partial);
        }, 180);

        await speakText(turn.text, voice, 1.0, pitch, "tr-TR", wordBoundaryCb);

        clearInterval(wordInterval);
        onTranscript(turn.speaker, turn.text);
        setDemoAudioLevel(0);

        if (cancelledRef.current) break;

        // Simulate releasing the mic
        onStopSpeaking();

        // Advance the protocol state machine
        onAdvanceState();

        // If this turn triggers a tripwire, fire it and wait for AI intervention
        if (turn.tripwire) {
          await delay(600);
          if (cancelledRef.current) break;
          onTripwire(turn.tripwire);
          // Wait for the AI intervention TTS to finish — the intervention
          // auto-completes via the aiIsSpeaking effect in Session
          await delay(15000);
          if (cancelledRef.current) break;
        }

        // Pause between turns
        const pauseMs = turn.pauseAfter ?? 1200;
        await delay(pauseMs);
      }

      setIsPlaying(false);
      setCurrentTurnIndex(-1);
    };

    void run();
  }, [isPlaying, script, onTranscript, onTripwire, onAdvanceState, onStartSpeaking, onStopSpeaking]);

  return { isPlaying, currentTurnIndex, startPlayback, stopPlayback, demoAudioLevel };
}
