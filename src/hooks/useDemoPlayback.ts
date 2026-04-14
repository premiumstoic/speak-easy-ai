import { useState, useRef, useCallback } from "react";
import type { DemoTurn } from "@/data/demoScripts";
import type { TripwireId } from "@/types/therapyEvents";

interface UseDemoPlaybackOptions {
  script: DemoTurn[];
  onTranscript: (text: string) => void;
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
 * Prefers English voices; tries to get one male-sounding and one female-sounding.
 */
function pickVoices(): { voiceA: SpeechSynthesisVoice | null; voiceB: SpeechSynthesisVoice | null } {
  const all = window.speechSynthesis.getVoices();
  const english = all.filter((v) => v.lang.startsWith("en"));
  const pool = english.length >= 2 ? english : all;

  // Heuristic: names containing female-associated keywords vs the rest
  const femaleHints = /samantha|victoria|karen|fiona|moira|tessa|veena|female/i;
  const females = pool.filter((v) => femaleHints.test(v.name));
  const others = pool.filter((v) => !femaleHints.test(v.name));

  const voiceA = others[0] ?? pool[0] ?? null;
  const voiceB = females[0] ?? pool[1] ?? pool[0] ?? null;
  return { voiceA, voiceB };
}

function speakText(
  text: string,
  voice: SpeechSynthesisVoice | null,
  rate: number,
  onBoundary: () => void
): Promise<void> {
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = 1.0;

    // Fire on word boundaries to simulate audio level
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

    // Voices may not be loaded yet — give the browser a moment
    const run = async () => {
      // Wait for voices to populate (Chrome loads them async)
      await delay(200);
      const { voiceA, voiceB } = pickVoices();

      for (let i = 0; i < script.length; i++) {
        if (cancelledRef.current) break;

        const turn = script[i];
        setCurrentTurnIndex(i);

        // Simulate pressing the mic button
        onStartSpeaking();

        // Feed transcript word-by-word for a realistic typing effect
        const words = turn.text.split(" ");
        let partial = "";

        // Start speaking via SpeechSynthesis
        const voice = turn.speaker === "A" ? voiceA : voiceB;
        const wordBoundaryCb = () => {
          // Pulse the audio level on each word boundary
          setDemoAudioLevel(0.4 + Math.random() * 0.5);
        };

        // Stream words into transcript on a timer alongside speech
        const wordInterval = setInterval(() => {
          if (words.length === 0) {
            clearInterval(wordInterval);
            return;
          }
          const next = words.shift()!;
          partial = partial ? `${partial} ${next}` : next;
          onTranscript(partial);
        }, 180);

        await speakText(turn.text, voice, 1.0, wordBoundaryCb);

        clearInterval(wordInterval);

        // Ensure the full text is set
        onTranscript(turn.text);
        setDemoAudioLevel(0);

        if (cancelledRef.current) break;

        // Simulate releasing the mic
        onStopSpeaking();

        // Advance the state machine (e.g. sender → mirroring)
        onAdvanceState();

        // If this turn triggers a tripwire, fire it and wait for intervention
        if (turn.tripwire) {
          await delay(600);
          if (cancelledRef.current) break;
          onTripwire(turn.tripwire);
          // Wait for the AI intervention TTS to finish
          // The intervention auto-completes via the aiIsSpeaking effect in Session,
          // so we just need a generous pause here
          await delay(12000);
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
