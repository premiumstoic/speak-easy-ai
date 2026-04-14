import { useSearchParams, useNavigate } from "react-router-dom";
import { useSessionState } from "@/hooks/useSessionState";
import { useTherapyLogger } from "@/hooks/useTherapyLogger";
import { useFalStreaming } from "@/hooks/useFalStreaming";
import { GroundingOverlay } from "@/components/GroundingOverlay";
import { PartnerZone } from "@/components/PartnerZone";
import { CenterMediator } from "@/components/CenterMediator";
import { HearthOrb } from "@/components/HearthOrb";
import { AIInterventionOverlay } from "@/components/AIInterventionOverlay";
import { imagoProtocol } from "@/data/imagoProtocol";
import { openMediationProtocol } from "@/data/openMediationProtocol";
import { toast } from "sonner";
import { Bug, X, AlertTriangle, ExternalLink } from "lucide-react";
import UmayLogo from "@/components/UmayLogo";
import { useCallback, useMemo, useEffect, useRef } from "react";
import { TRIPWIRE_IDS, type TripwireId } from "@/types/therapyEvents";

const PROTOCOLS: Record<string, typeof imagoProtocol> = {
  imago_core_dialogue: imagoProtocol,
  open_mediation_enactment: openMediationProtocol,
};

function buildObserverUrl(sessionId: string): string | null {
  const configuredBase =
    import.meta.env.VITE_OBSERVER_URL || "https://umay-demo.lovable.app";

  try {
    const url = new URL(configuredBase, window.location.origin);
    url.searchParams.set("view", "observer");
    url.searchParams.set("session_id", sessionId);
    return url.toString();
  } catch {
    return null;
  }
}

const Session = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const techniqueId = searchParams.get("technique") || "imago_core_dialogue";
  const protocol = PROTOCOLS[techniqueId] ?? imagoProtocol;

  // Stable demo-scoped session ID for streaming + observer links
  const sessionId = useMemo(
    () => `demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    []
  );

  const observerUrl = useMemo(() => buildObserverUrl(sessionId), [sessionId]);

  const {
    state,
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
  } = useSessionState(protocol);

  const { logAnalysisTick, logTurn, logIntervention } = useTherapyLogger(
    sessionId,
    techniqueId
  );

  const {
    transcript: sttTranscript,
    lines: sttLines,
    interimTranscript: sttInterim,
    audioLevel: sttAudioLevel,
    isRecording: sttIsRecording,
    startRecording,
    stopRecording,
    error: sttError,
  } = useFalStreaming();

  const chunkIndexRef = useRef(0);
  const lastChunkTranscriptRef = useRef("");
  const tickInFlightRef = useRef(false);
  const interventionInFlightRef = useRef(false);

  // Sync STT transcript into session state
  useEffect(() => {
    if (sttTranscript) {
      setTranscript(sttTranscript);
    }
  }, [sttTranscript, setTranscript]);

  // Show STT errors
  useEffect(() => {
    if (sttError) {
      toast.error("Microphone Error", { description: sttError });
    }
  }, [sttError]);

  const currentTherapyState = getCurrentState();
  const activeRole = currentTherapyState?.active_role;
  const maxTime = getMaxRecordingTime();

  // Determine layout mode
  const isGrounding = currentTherapyState?.type === "breathing_exercise";
  const isRoleReversal = currentTherapyState?.type === "role_reversal";
  const isOpenMic = currentTherapyState?.type === "open_mic_stream";
  const isIntervention = currentTherapyState?.type === "system_interruption";
  const isOpenMediationTechnique = techniqueId === "open_mediation_enactment";

  const getActiveSpeakerAndTranscript = useCallback(() => {
    const speaker = state.activePartner === "A" ? "Partner A" : "Partner B";
    const transcript =
      state.activePartner === "A" ? state.transcriptA : state.transcriptB;
    return { speaker, transcript };
  }, [state.activePartner, state.transcriptA, state.transcriptB]);

  const handleOpenObserver = useCallback(() => {
    if (!observerUrl) {
      toast.error("Observer URL is invalid", {
        description: "Check VITE_OBSERVER_URL in your environment.",
      });
      return;
    }
    window.open(observerUrl, "_blank", "noopener,noreferrer");
  }, [observerUrl]);

  const handleTriggerIntervention = useCallback(
    async (tripwireId: TripwireId) => {
      if (
        interventionInFlightRef.current ||
        state.currentStateKey === "state_ai_intervention"
      ) {
        return;
      }

      interventionInFlightRef.current = true;
      try {
        if (sttIsRecording) {
          const finalTranscript = await stopRecording();
          if (finalTranscript) {
            setTranscript(finalTranscript);
          }
        }

        stopSpeaking();

        const interventionState = protocol.states["state_ai_intervention"];
        const text =
          interventionState?.intervention_templates?.[tripwireId] ??
          "Let us pause.";

        await logIntervention(text);
        triggerIntervention(tripwireId);
      } finally {
        interventionInFlightRef.current = false;
      }
    },
    [
      state.currentStateKey,
      sttIsRecording,
      stopRecording,
      setTranscript,
      stopSpeaking,
      protocol,
      logIntervention,
      triggerIntervention,
    ]
  );

  // Combined start: session state + real mic
  const handleStartSpeaking = useCallback(() => {
    chunkIndexRef.current = 0;
    lastChunkTranscriptRef.current = "";

    startSpeaking();
    void startRecording();
  }, [startSpeaking, startRecording]);

  // Combined stop: stop mic, get final transcript, send final event, then stop session state
  const handleStopSpeaking = useCallback(async () => {
    const finalTranscript = await stopRecording();
    if (finalTranscript) {
      setTranscript(finalTranscript);
    }

    const { speaker, transcript: currentTranscript } = getActiveSpeakerAndTranscript();
    const transcript = finalTranscript || currentTranscript;
    const chunkIndex = chunkIndexRef.current > 0 ? chunkIndexRef.current - 1 : null;

    const decision = await logTurn(
      speaker,
      transcript,
      state.currentStateKey,
      chunkIndex
    );

    stopSpeaking();

    if (
      isOpenMediationTechnique &&
      decision?.action_decision === "interrupt" &&
      decision.detected_tripwire &&
      state.currentStateKey !== "state_ai_intervention"
    ) {
      await handleTriggerIntervention(decision.detected_tripwire);
    }
  }, [
    stopRecording,
    setTranscript,
    getActiveSpeakerAndTranscript,
    logTurn,
    state.currentStateKey,
    stopSpeaking,
    isOpenMediationTechnique,
    handleTriggerIntervention,
  ]);

  // Stream chunk analysis every 2s while actively speaking in Open Mediation
  useEffect(() => {
    if (!isOpenMediationTechnique || !state.isSpeaking || isIntervention) {
      return;
    }

    const intervalId = window.setInterval(async () => {
      if (tickInFlightRef.current || interventionInFlightRef.current) {
        return;
      }

      const { speaker, transcript } = getActiveSpeakerAndTranscript();
      const trimmed = transcript.trim();
      if (!trimmed || trimmed === lastChunkTranscriptRef.current) {
        return;
      }

      tickInFlightRef.current = true;
      try {
        const decision = await logAnalysisTick(
          speaker,
          trimmed,
          state.currentStateKey,
          chunkIndexRef.current
        );

        lastChunkTranscriptRef.current = trimmed;
        chunkIndexRef.current += 1;

        if (
          decision?.action_decision === "interrupt" &&
          decision.detected_tripwire &&
          state.currentStateKey !== "state_ai_intervention"
        ) {
          await handleTriggerIntervention(decision.detected_tripwire);
        }
      } finally {
        tickInFlightRef.current = false;
      }
    }, 2000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    isOpenMediationTechnique,
    state.isSpeaking,
    isIntervention,
    getActiveSpeakerAndTranscript,
    logAnalysisTick,
    state.currentStateKey,
    handleTriggerIntervention,
  ]);

  const handleStrike = () => {
    if (state.strikeCount >= 2) {
      toast.error("Hard Cut: AI Intervention", {
        description: "Toxicity threshold exceeded. Swapping roles.",
      });
    }
    triggerStrike();
  };

  // Split-screen partner logic (Imago)
  const partnerAIsSender =
    activeRole === "SENDER"
      ? state.activePartner === "A"
      : activeRole === "RECEIVER"
        ? state.activePartner !== "A"
        : false;

  const partnerAActive =
    !isGrounding &&
    !isRoleReversal &&
    !isOpenMic &&
    !isIntervention &&
    ((activeRole === "SENDER" && state.activePartner === "A") ||
      (activeRole === "RECEIVER" && state.activePartner !== "A"));

  const partnerBActive =
    !isGrounding &&
    !isRoleReversal &&
    !isOpenMic &&
    !isIntervention &&
    ((activeRole === "SENDER" && state.activePartner === "B") ||
      (activeRole === "RECEIVER" && state.activePartner !== "B"));

  // Open Mediation: HearthOrb layout
  if (isOpenMic || isIntervention) {
    const interventionState = protocol.states["state_ai_intervention"];
    const interventionText =
      state.activeTripwire && interventionState?.intervention_templates
        ? interventionState.intervention_templates[state.activeTripwire] ??
          "Let us pause and take a breath together."
        : "";

    return (
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-surface relative">
        {/* Background tints */}
        <div className="fixed -bottom-[20%] -left-[10%] w-[50%] h-[50%] bg-tertiary-container/5 rounded-full blur-[100px] pointer-events-none z-0" />
        <div className="fixed -top-[20%] -right-[10%] w-[50%] h-[50%] bg-primary-container/5 rounded-full blur-[100px] pointer-events-none z-0" />

        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-[60] pt-4 px-6 flex justify-between items-center pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <UmayLogo className="w-6 h-6 text-primary" />
            <span className="font-headline text-lg font-semibold italic tracking-tight text-primary">
              Umay
            </span>
          </div>
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={handleOpenObserver}
              className="px-3 h-10 rounded-full bg-surface-container-high text-muted-foreground hover:bg-surface-container-highest transition-colors duration-200 flex items-center gap-1.5 text-xs font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              Observer
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-high text-muted-foreground hover:bg-surface-container-highest transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Open mic label */}
        <div className="pt-20 pb-2 px-6 text-center z-10">
          <p className="text-xs font-body font-semibold uppercase tracking-widest text-muted-foreground">
            Open Floor — Both partners speak freely
          </p>
        </div>

        {/* HearthOrb */}
        <HearthOrb
          orbState={currentTherapyState?.ui_config?.orb_state ?? "pulsing_listening"}
          isSpeaking={state.isSpeaking}
          micLocked={state.micLock || isIntervention}
          onStartSpeaking={handleStartSpeaking}
          onStopSpeaking={handleStopSpeaking}
          transcript={state.transcriptA || state.transcriptB}
          liveLines={sttLines}
          liveInterim={sttInterim}
          audioLevel={sttAudioLevel}
        />

        {/* AI Intervention Overlay */}
        {isIntervention && state.activeTripwire && (
          <AIInterventionOverlay
            tripwireId={state.activeTripwire}
            interventionText={interventionText}
            onComplete={completeIntervention}
          />
        )}

        {/* Debug: Trigger tripwire buttons */}
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {TRIPWIRE_IDS.map((tw) => (
            <button
              key={tw}
              onClick={() => {
                void handleTriggerIntervention(tw);
              }}
              className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center hover:bg-tertiary/20 transition-colors duration-200"
              title={`Trigger: ${tw}`}
            >
              <AlertTriangle className="w-4 h-4 text-tertiary/60" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Imago Dialogue: existing split-screen layout
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-surface relative">
      <div className="fixed -bottom-[20%] -left-[10%] w-[50%] h-[50%] bg-tertiary-container/5 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="fixed -top-[20%] -right-[10%] w-[50%] h-[50%] bg-primary-container/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <header className="fixed top-0 left-0 right-0 z-[60] pt-4 px-6 flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <UmayLogo className="w-6 h-6 text-primary" />
          <span className="font-headline text-lg font-semibold italic tracking-tight text-primary">
            Umay
          </span>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={handleOpenObserver}
            className="px-3 h-10 rounded-full bg-surface-container-high text-muted-foreground hover:bg-surface-container-highest transition-colors duration-200 flex items-center gap-1.5 text-xs font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Observer
          </button>
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-high text-muted-foreground hover:bg-surface-container-highest transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {isGrounding && (
        <GroundingOverlay
          durationSeconds={currentTherapyState?.duration_seconds ?? 60}
          onComplete={completeGrounding}
          onSkip={skipGrounding}
        />
      )}

      <PartnerZone
        partner="A"
        partnerName="Alex"
        role={partnerAIsSender ? "SENDER" : "RECEIVER"}
        isActive={partnerAActive}
        transcript={state.transcriptA}
        isSpeaking={state.isSpeaking && partnerAActive}
        speakingTimer={partnerAActive ? state.speakingTimer : 0}
        maxRecordingTime={maxTime}
        micLocked={state.micLock || !partnerAActive}
        strikeFlash={partnerAActive ? state.strikeFlash : null}
        strikeCount={state.strikeCount}
        onStartSpeaking={handleStartSpeaking}
        onStopSpeaking={handleStopSpeaking}
        isLiveRecording={sttIsRecording && partnerAActive}
        liveLines={sttLines}
        liveInterim={sttInterim}
        audioLevel={sttAudioLevel}
      />

      <CenterMediator
        stateKey={state.currentStateKey}
        stateType={currentTherapyState?.type ?? "speaking_turn"}
        activeRole={activeRole}
        uiConfig={currentTherapyState?.ui_config}
        selectedEmotion={state.selectedEmotion}
        onSelectEmotion={selectEmotion}
        onAdvance={advanceState}
      />

      <PartnerZone
        partner="B"
        partnerName="Jordan"
        role={!partnerAIsSender ? "SENDER" : "RECEIVER"}
        isActive={partnerBActive}
        transcript={state.transcriptB}
        isSpeaking={state.isSpeaking && partnerBActive}
        speakingTimer={partnerBActive ? state.speakingTimer : 0}
        maxRecordingTime={maxTime}
        micLocked={state.micLock || !partnerBActive}
        strikeFlash={partnerBActive ? state.strikeFlash : null}
        strikeCount={state.strikeCount}
        onStartSpeaking={handleStartSpeaking}
        onStopSpeaking={handleStopSpeaking}
        isLiveRecording={sttIsRecording && partnerBActive}
        liveLines={sttLines}
        liveInterim={sttInterim}
        audioLevel={sttAudioLevel}
      />

      <button
        onClick={handleStrike}
        className="fixed bottom-4 right-4 z-50 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors duration-200"
        title="Trigger Toxicity Strike (Debug)"
      >
        <Bug className="w-4 h-4 text-destructive/60" />
      </button>
    </div>
  );
};

export default Session;
