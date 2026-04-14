import { useSearchParams, useNavigate } from "react-router-dom";
import { useSessionState } from "@/hooks/useSessionState";
import { useTherapyLogger } from "@/hooks/useTherapyLogger";
import { useAuth } from "@/contexts/AuthContext";
import { GroundingOverlay } from "@/components/GroundingOverlay";
import { PartnerZone } from "@/components/PartnerZone";
import { CenterMediator } from "@/components/CenterMediator";
import { HearthOrb } from "@/components/HearthOrb";
import { AIInterventionOverlay } from "@/components/AIInterventionOverlay";
import { imagoProtocol } from "@/data/imagoProtocol";
import { openMediationProtocol } from "@/data/openMediationProtocol";
import { toast } from "sonner";
import { Bug, X, AlertTriangle } from "lucide-react";
import UmayLogo from "@/components/UmayLogo";
import { useCallback, useMemo } from "react";

const PROTOCOLS: Record<string, typeof imagoProtocol> = {
  imago_core_dialogue: imagoProtocol,
  open_mediation_enactment: openMediationProtocol,
};

const TRIPWIRE_IDS = ["the_loop", "the_missed_drop", "the_escalation", "the_stonewall"];

const Session = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const techniqueId = searchParams.get("technique") || "imago_core_dialogue";
  const protocol = PROTOCOLS[techniqueId] ?? imagoProtocol;

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
  } = useSessionState(protocol);

  const currentTherapyState = getCurrentState();
  const activeRole = currentTherapyState?.active_role;
  const maxTime = getMaxRecordingTime();
  const layout = currentTherapyState?.layout;

  const handleStrike = () => {
    if (state.strikeCount >= 2) {
      toast.error("Hard Cut: AI Intervention", {
        description: "Toxicity threshold exceeded. Swapping roles.",
      });
    }
    triggerStrike();
  };

  // Determine layout mode
  const isGrounding = currentTherapyState?.type === "breathing_exercise";
  const isRoleReversal = currentTherapyState?.type === "role_reversal";
  const isOpenMic = currentTherapyState?.type === "open_mic_stream";
  const isIntervention = currentTherapyState?.type === "system_interruption";

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
        ? interventionState.intervention_templates[state.activeTripwire] ?? "Let us pause and take a breath together."
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
            <span className="font-headline text-lg font-semibold italic tracking-tight text-primary">Umay</span>
          </div>
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-high text-muted-foreground hover:bg-surface-container-highest transition-colors duration-200 pointer-events-auto"
          >
            <X className="w-5 h-5" />
          </button>
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
          onStartSpeaking={startSpeaking}
          onStopSpeaking={stopSpeaking}
          transcript={state.transcriptA || state.transcriptB}
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
              onClick={() => triggerIntervention(tw)}
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
          <span className="font-headline text-lg font-semibold italic tracking-tight text-primary">Umay</span>
        </div>
        <button
          onClick={() => navigate("/")}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-high text-muted-foreground hover:bg-surface-container-highest transition-colors duration-200 pointer-events-auto"
        >
          <X className="w-5 h-5" />
        </button>
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
        onStartSpeaking={startSpeaking}
        onStopSpeaking={stopSpeaking}
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
        onStartSpeaking={startSpeaking}
        onStopSpeaking={stopSpeaking}
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
