import { useEffect, useState, useCallback } from "react";
import UmayLogo from "@/components/UmayLogo";

interface AIInterventionOverlayProps {
  tripwireId: string;
  interventionText: string;
  onComplete: () => void;
}

/** Play a short singing-bowl chime via Web Audio API */
function playChime() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(528, ctx.currentTime); // C5-ish, soothing
    osc.frequency.exponentialRampToValueAtTime(264, ctx.currentTime + 1.5);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.5);
  } catch {
    // Web Audio not available — silently skip
  }
}

const TRIPWIRE_LABELS: Record<string, string> = {
  the_loop: "Circular Pattern Detected",
  the_missed_drop: "Vulnerability Missed",
  the_escalation: "Escalation Detected",
  the_stonewall: "Emotional Withdrawal Detected",
};

export const AIInterventionOverlay = ({
  tripwireId,
  interventionText,
  onComplete,
}: AIInterventionOverlayProps) => {
  const [phase, setPhase] = useState<"chime" | "speaking" | "done">("chime");
  const [visibleText, setVisibleText] = useState("");

  // Phase 1: chime
  useEffect(() => {
    playChime();
    const timer = setTimeout(() => setPhase("speaking"), 1800);
    return () => clearTimeout(timer);
  }, []);

  // Phase 2: type out intervention text
  useEffect(() => {
    if (phase !== "speaking") return;
    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      setVisibleText(interventionText.slice(0, idx));
      if (idx >= interventionText.length) {
        clearInterval(interval);
        setTimeout(() => setPhase("done"), 1500);
      }
    }, 35);
    return () => clearInterval(interval);
  }, [phase, interventionText]);

  const handleContinue = useCallback(() => {
    onComplete();
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-lg animate-fade-in">
      {/* Amber glow */}
      <div className="absolute w-[60vw] h-[60vw] rounded-full bg-tertiary/10 blur-[100px]" />

      {/* Orb icon */}
      <div
        className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center mb-8 transition-all duration-700 ${
          phase === "chime"
            ? "bg-tertiary/20 scale-110 animate-pulse"
            : "bg-tertiary/30 scale-100"
        }`}
      >
        <UmayLogo className="w-10 h-10 text-tertiary" />
      </div>

      {/* Tripwire label */}
      <p className="relative z-10 text-xs font-body font-semibold uppercase tracking-widest text-tertiary mb-4">
        {TRIPWIRE_LABELS[tripwireId] ?? "AI Observation"}
      </p>

      {/* Intervention text */}
      <div className="relative z-10 max-w-md px-8">
        <p className="text-lg font-body text-foreground/90 leading-relaxed text-center min-h-[6rem]">
          {phase === "chime" ? "" : visibleText}
          {phase === "speaking" && (
            <span className="inline-block w-0.5 h-5 bg-tertiary/60 ml-0.5 animate-pulse align-text-bottom" />
          )}
        </p>
      </div>

      {/* Continue button */}
      {phase === "done" && (
        <button
          onClick={handleContinue}
          className="relative z-10 mt-10 px-8 py-3 rounded-full bg-primary text-primary-foreground font-body font-semibold text-sm hover:bg-primary-dim transition-colors duration-200 animate-fade-in"
        >
          Continue Conversation
        </button>
      )}
    </div>
  );
};
