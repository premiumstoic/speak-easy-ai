import { useState, useCallback, useRef } from "react";

export type SessionState = 0 | 1 | 2 | 3 | 4 | 5;

export interface SessionData {
  sessionState: SessionState;
  micLock: boolean;
  strikeCount: number;
  activePartner: "A" | "B";
  transcriptA: string;
  transcriptB: string;
  isSpeaking: boolean;
  speakingTimer: number;
  groundingTimer: number;
  strikeFlash: null | 1 | 2 | 3;
  selectedEmotion: string | null;
}

const MOCK_WORDS = [
  "I", "feel", "like", "when", "we", "talk", "about", "this",
  "it", "makes", "me", "feel", "really", "frustrated", "because",
  "I", "just", "want", "us", "to", "understand", "each", "other",
  "better", "and", "find", "a", "way", "to", "connect", "more",
  "deeply", "with", "one", "another", "through", "honest",
  "communication", "and", "mutual", "respect",
];

export function useSessionState() {
  const [state, setState] = useState<SessionData>({
    sessionState: 0,
    micLock: true,
    strikeCount: 0,
    activePartner: "A",
    transcriptA: "",
    transcriptB: "",
    isSpeaking: false,
    speakingTimer: 0,
    groundingTimer: 60,
    strikeFlash: null,
    selectedEmotion: null,
  });

  const speakingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wordIndexRef = useRef(0);

  const startGrounding = useCallback(() => {
    setState((s) => ({ ...s, sessionState: 0 as SessionState, groundingTimer: 60, micLock: true }));
  }, []);

  const skipGrounding = useCallback(() => {
    setState((s) => ({
      ...s,
      sessionState: 1 as SessionState,
      micLock: false,
      activePartner: "A" as const,
    }));
  }, []);

  const completeGrounding = useCallback(() => {
    setState((s) => ({
      ...s,
      sessionState: 1 as SessionState,
      micLock: false,
      activePartner: "A" as const,
    }));
  }, []);

  const startSpeaking = useCallback(() => {
    wordIndexRef.current = 0;
    setState((s) => ({ ...s, isSpeaking: true, speakingTimer: 0 }));

    timerIntervalRef.current = setInterval(() => {
      setState((s) => {
        const newTimer = s.speakingTimer + 1;
        if (newTimer >= 45) {
          return { ...s, speakingTimer: newTimer, micLock: true, isSpeaking: false };
        }
        return { ...s, speakingTimer: newTimer };
      });
    }, 1000);

    speakingIntervalRef.current = setInterval(() => {
      setState((s) => {
        const word = MOCK_WORDS[wordIndexRef.current % MOCK_WORDS.length];
        wordIndexRef.current++;
        const key = s.activePartner === "A" ? "transcriptA" : "transcriptB";
        const currentText = s[key as keyof SessionData] as string;
        return {
          ...s,
          [key]: currentText + (currentText ? " " : "") + word,
        };
      });
    }, 300);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (speakingIntervalRef.current) clearInterval(speakingIntervalRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setState((s) => ({ ...s, isSpeaking: false }));
  }, []);

  const advanceState = useCallback(() => {
    setState((s) => {
      const next = s.sessionState + 1;
      if (next > 5) {
        // Role reversal complete, restart cycle
        return {
          ...s,
          sessionState: 1 as SessionState,
          activePartner: s.activePartner === "A" ? "B" as const : "A" as const,
          micLock: false,
          strikeCount: 0,
          transcriptA: "",
          transcriptB: "",
          selectedEmotion: null,
        };
      }

      const isReceiverTurn = next >= 2 && next <= 4;
      return {
        ...s,
        sessionState: next as SessionState,
        activePartner: isReceiverTurn
          ? (s.activePartner === "A" ? "B" as const : "A" as const)
          : s.activePartner,
        micLock: false,
        isSpeaking: false,
        speakingTimer: 0,
      };
    });
  }, []);

  const triggerStrike = useCallback(() => {
    setState((s) => {
      const newCount = s.strikeCount + 1;
      if (newCount >= 3) {
        // Hard cut
        return {
          ...s,
          strikeCount: 0,
          strikeFlash: 3 as const,
          micLock: true,
          isSpeaking: false,
          sessionState: 1 as SessionState,
          activePartner: s.activePartner === "A" ? "B" as const : "A" as const,
          transcriptA: "",
          transcriptB: "",
        };
      }
      return {
        ...s,
        strikeCount: newCount,
        strikeFlash: newCount as 1 | 2,
      };
    });

    // Clear flash after animation
    setTimeout(() => {
      setState((s) => ({ ...s, strikeFlash: null }));
    }, 800);
  }, []);

  const selectEmotion = useCallback((emotion: string) => {
    setState((s) => ({ ...s, selectedEmotion: emotion }));
  }, []);

  return {
    state,
    startGrounding,
    skipGrounding,
    completeGrounding,
    startSpeaking,
    stopSpeaking,
    advanceState,
    triggerStrike,
    selectEmotion,
  };
}
