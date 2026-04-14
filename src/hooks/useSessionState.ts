import { useState, useCallback, useRef } from "react";
import type { TherapyConfig, TherapyState } from "@/types/therapyConfig";

export interface SessionData {
  currentStateKey: string;
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
  activeTripwire: string | null;
  completedTurns: number;
  isSessionComplete: boolean;
}


export function useSessionState(config: TherapyConfig) {
  const initialState = config.states[config.initial_state];
  const groundingDuration = initialState?.duration_seconds ?? 60;

  const [state, setState] = useState<SessionData>({
    currentStateKey: config.initial_state,
    micLock: initialState?.type === "breathing_exercise",
    strikeCount: 0,
    activePartner: "A",
    transcriptA: "",
    transcriptB: "",
    isSpeaking: false,
    speakingTimer: 0,
    groundingTimer: groundingDuration,
    strikeFlash: null,
    selectedEmotion: null,
    activeTripwire: null,
    completedTurns: 0,
    isSessionComplete: false,
  });

  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getCurrentState = useCallback(
    (key?: string): TherapyState | undefined => config.states[key ?? state.currentStateKey],
    [config, state.currentStateKey]
  );

  const getMaxRecordingTime = useCallback(
    (key?: string): number => {
      const s = getCurrentState(key);
      return s?.ui_config?.max_recording_time ?? 45;
    },
    [getCurrentState]
  );

  const skipGrounding = useCallback(() => {
    const currentState = config.states[config.initial_state];
    const nextKey = currentState?.transitions?.on_complete ?? config.initial_state;
    setState((s) => ({
      ...s,
      currentStateKey: nextKey,
      micLock: false,
      activePartner: "A",
    }));
  }, [config]);

  const completeGrounding = useCallback(() => {
    const currentState = config.states[config.initial_state];
    const nextKey = currentState?.transitions?.on_complete ?? config.initial_state;
    setState((s) => ({
      ...s,
      currentStateKey: nextKey,
      micLock: false,
      activePartner: "A",
    }));
  }, [config]);

  const clearTimers = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  }, []);

  const startSpeaking = useCallback(() => {
    setState((s) => ({ ...s, isSpeaking: true, speakingTimer: 0 }));
    setState((s) => ({ ...s, isSpeaking: true, speakingTimer: 0 }));

    timerIntervalRef.current = setInterval(() => {
      setState((s) => {
        const maxTime = getMaxRecordingTime(s.currentStateKey);
        const newTimer = s.speakingTimer + 1;
        if (newTimer >= maxTime) {
          return { ...s, speakingTimer: newTimer, micLock: true, isSpeaking: false };
        }
        return { ...s, speakingTimer: newTimer };
      });
    }, 1000);
  }, [getMaxRecordingTime]);

  /** Update transcript from external source (e.g. STT) */
  const setTranscript = useCallback((text: string) => {
    setState((s) => {
      const currentType = config.states[s.currentStateKey]?.type;
      const key = currentType === "open_mic_stream" ? "transcriptA" : (s.activePartner === "A" ? "transcriptA" : "transcriptB");
      return { ...s, [key]: text };
    });
  }, [config]);

  const stopSpeaking = useCallback(() => {
    clearTimers();
    setState((s) => ({ ...s, isSpeaking: false }));
  }, [clearTimers]);

  const advanceState = useCallback(() => {
    setState((s) => {
      if (s.isSessionComplete) return s;

      const currentTherapyState = config.states[s.currentStateKey];
      if (!currentTherapyState) return s;

      const nextKey =
        currentTherapyState.transitions.on_complete ??
        currentTherapyState.transitions.on_pass ??
        s.currentStateKey;

      const nextTherapyState = config.states[nextKey];
      if (!nextTherapyState) return s;

      if (currentTherapyState.type === "role_reversal") {
        const nextCompletedTurns = s.completedTurns + 1;
        const hasTurnLimit = typeof config.max_turns === "number" && config.max_turns > 0;
        const reachedTurnLimit = hasTurnLimit && nextCompletedTurns >= config.max_turns;

        if (reachedTurnLimit) {
          return {
            ...s,
            completedTurns: nextCompletedTurns,
            isSessionComplete: true,
            micLock: true,
            strikeCount: 0,
            strikeFlash: null,
            selectedEmotion: null,
            isSpeaking: false,
            speakingTimer: 0,
          };
        }

        return {
          ...s,
          completedTurns: nextCompletedTurns,
          currentStateKey: nextKey,
          activePartner: s.activePartner === "A" ? "B" as const : "A" as const,
          micLock: false,
          strikeCount: 0,
          transcriptA: "",
          transcriptB: "",
          selectedEmotion: null,
          isSpeaking: false,
          speakingTimer: 0,
        };
      }

      return {
        ...s,
        currentStateKey: nextKey,
        micLock: false,
        isSpeaking: false,
        speakingTimer: 0,
      };
    });
  }, [config]);

  /** Trigger an AI intervention (for Open Mediation) */
  const triggerIntervention = useCallback((tripwireId: string) => {
    clearTimers();
    setState((s) => {
      if (s.isSessionComplete) return s;
      return {
        ...s,
        currentStateKey: "state_ai_intervention",
        micLock: true,
        isSpeaking: false,
        activeTripwire: tripwireId,
      };
    });
  }, [clearTimers]);

  /** Complete the AI intervention and return to open floor */
  const completeIntervention = useCallback(() => {
    const interventionState = config.states["state_ai_intervention"];
    const nextKey = interventionState?.transitions?.on_intervention_complete ?? "state_open_floor";
    setState((s) => {
      if (s.isSessionComplete) return s;
      return {
        ...s,
        currentStateKey: nextKey,
        micLock: false,
        activeTripwire: null,
        transcriptA: "",
        transcriptB: "",
      };
    });
  }, [config]);

  const triggerStrike = useCallback(() => {
    setState((s) => {
      const newCount = s.strikeCount + 1;
      const senderKey = Object.keys(config.states).find(
        (k) => config.states[k].active_role === "SENDER"
      ) ?? s.currentStateKey;

      if (newCount >= 3) {
        return {
          ...s,
          strikeCount: 0,
          strikeFlash: 3 as const,
          micLock: true,
          isSpeaking: false,
          currentStateKey: senderKey,
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

    setTimeout(() => {
      setState((s) => ({ ...s, strikeFlash: null }));
    }, 800);
  }, [config]);

  const selectEmotion = useCallback((emotion: string) => {
    setState((s) => ({ ...s, selectedEmotion: emotion }));
  }, []);

  return {
    state,
    config,
    getCurrentState,
    getMaxRecordingTime,
    skipGrounding,
    completeGrounding,
    startSpeaking,
    stopSpeaking,
    advanceState,
    triggerStrike,
    selectEmotion,
    triggerIntervention,
    completeIntervention,
    setTranscript,
  };
}
