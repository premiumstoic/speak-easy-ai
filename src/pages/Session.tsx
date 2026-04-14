import { useSessionState } from "@/hooks/useSessionState";
import { GroundingOverlay } from "@/components/GroundingOverlay";
import { PartnerZone } from "@/components/PartnerZone";
import { CenterMediator } from "@/components/CenterMediator";
import { imagoProtocol } from "@/data/imagoProtocol";
import { toast } from "sonner";
import { Bug, X } from "lucide-react";
import UmayLogo from "@/components/UmayLogo";
import { useNavigate } from "react-router-dom";

const Session = () => {
  const navigate = useNavigate();
  const {
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
  } = useSessionState(imagoProtocol);

  const currentTherapyState = getCurrentState();
  const activeRole = currentTherapyState?.active_role;
  const maxTime = getMaxRecordingTime();

  const handleStrike = () => {
    if (state.strikeCount >= 2) {
      toast.error("Hard Cut: AI Intervention", {
        description: "Toxicity threshold exceeded. Swapping roles.",
      });
    }
    triggerStrike();
  };

  // Determine which partner is active based on config's active_role
  const isGrounding = currentTherapyState?.type === "breathing_exercise";
  const isRoleReversal = currentTherapyState?.type === "role_reversal";

  // SENDER role: the activePartner speaks. RECEIVER role: the other partner speaks.
  const partnerAIsSender =
    activeRole === "SENDER"
      ? state.activePartner === "A"
      : activeRole === "RECEIVER"
      ? state.activePartner !== "A"
      : false;

  const partnerBIsSender = !partnerAIsSender;

  const partnerAActive =
    !isGrounding &&
    !isRoleReversal &&
    ((activeRole === "SENDER" && state.activePartner === "A") ||
      (activeRole === "RECEIVER" && state.activePartner !== "A"));

  const partnerBActive =
    !isGrounding &&
    !isRoleReversal &&
    ((activeRole === "SENDER" && state.activePartner === "B") ||
      (activeRole === "RECEIVER" && state.activePartner !== "B"));

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-surface relative">
      {/* Subtle background tints */}
      <div className="fixed -bottom-[20%] -left-[10%] w-[50%] h-[50%] bg-tertiary-container/5 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="fixed -top-[20%] -right-[10%] w-[50%] h-[50%] bg-primary-container/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Session Header */}
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

      {/* Grounding Overlay */}
      {isGrounding && (
        <GroundingOverlay
          durationSeconds={currentTherapyState?.duration_seconds ?? 60}
          onComplete={completeGrounding}
          onSkip={skipGrounding}
        />
      )}

      {/* Partner A Zone (Top) */}
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

      {/* Center Mediator */}
      <CenterMediator
        stateKey={state.currentStateKey}
        stateType={currentTherapyState?.type ?? "speaking_turn"}
        activeRole={activeRole}
        uiConfig={currentTherapyState?.ui_config}
        selectedEmotion={state.selectedEmotion}
        onSelectEmotion={selectEmotion}
        onAdvance={advanceState}
      />

      {/* Partner B Zone (Bottom) */}
      <PartnerZone
        partner="B"
        partnerName="Jordan"
        role={partnerBIsSender ? "SENDER" : "RECEIVER"}
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

      {/* Debug: Toxicity Strike Button */}
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
