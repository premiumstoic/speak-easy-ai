import { useSessionState } from "@/hooks/useSessionState";
import { GroundingOverlay } from "@/components/GroundingOverlay";
import { PartnerZone } from "@/components/PartnerZone";
import { CenterMediator } from "@/components/CenterMediator";
import { toast } from "sonner";
import { Bug } from "lucide-react";

const Index = () => {
  const {
    state,
    skipGrounding,
    completeGrounding,
    startSpeaking,
    stopSpeaking,
    advanceState,
    triggerStrike,
    selectEmotion,
  } = useSessionState();

  const handleStrike = () => {
    if (state.strikeCount >= 2) {
      toast.error("Hard Cut: AI Intervention", {
        description: "Toxicity threshold exceeded. Swapping roles.",
      });
    }
    triggerStrike();
  };

  const isPartnerASender =
    state.sessionState === 1
      ? state.activePartner === "A"
      : state.sessionState >= 2 && state.sessionState <= 4
      ? state.activePartner !== "A"
      : state.activePartner === "A";

  const isPartnerBSender = !isPartnerASender;

  // Determine who can speak
  const partnerAActive =
    (state.sessionState === 1 && state.activePartner === "A") ||
    (state.sessionState >= 2 && state.sessionState <= 4 && state.activePartner !== "A");

  const partnerBActive =
    (state.sessionState === 1 && state.activePartner === "B") ||
    (state.sessionState >= 2 && state.sessionState <= 4 && state.activePartner !== "B");

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      {/* Grounding Overlay */}
      {state.sessionState === 0 && (
        <GroundingOverlay onComplete={completeGrounding} onSkip={skipGrounding} />
      )}

      {/* Partner A Zone (Top) */}
      <PartnerZone
        partner="A"
        role={isPartnerASender ? "SENDER" : "RECEIVER"}
        isActive={partnerAActive}
        transcript={state.transcriptA}
        isSpeaking={state.isSpeaking && partnerAActive}
        speakingTimer={partnerAActive ? state.speakingTimer : 0}
        micLocked={state.micLock || !partnerAActive}
        strikeFlash={partnerAActive ? state.strikeFlash : null}
        strikeCount={state.strikeCount}
        sessionState={state.sessionState}
        onStartSpeaking={startSpeaking}
        onStopSpeaking={stopSpeaking}
      />

      {/* Center Mediator */}
      <CenterMediator
        sessionState={state.sessionState}
        selectedEmotion={state.selectedEmotion}
        onSelectEmotion={selectEmotion}
        onAdvance={advanceState}
      />

      {/* Partner B Zone (Bottom) */}
      <PartnerZone
        partner="B"
        role={isPartnerBSender ? "SENDER" : "RECEIVER"}
        isActive={partnerBActive}
        transcript={state.transcriptB}
        isSpeaking={state.isSpeaking && partnerBActive}
        speakingTimer={partnerBActive ? state.speakingTimer : 0}
        micLocked={state.micLock || !partnerBActive}
        strikeFlash={partnerBActive ? state.strikeFlash : null}
        strikeCount={state.strikeCount}
        sessionState={state.sessionState}
        onStartSpeaking={startSpeaking}
        onStopSpeaking={stopSpeaking}
      />

      {/* Debug: Toxicity Strike Button */}
      <button
        onClick={handleStrike}
        className="fixed bottom-4 right-4 z-50 w-10 h-10 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center hover:bg-destructive/20 transition-colors"
        title="Trigger Toxicity Strike (Debug)"
      >
        <Bug className="w-4 h-4 text-destructive/60" />
      </button>
    </div>
  );
};

export default Index;
