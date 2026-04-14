import { useEffect, useState } from "react";
import { Wind, SkipForward } from "lucide-react";

interface GroundingOverlayProps {
  durationSeconds?: number;
  onComplete: () => void;
  onSkip: () => void;
}

export function GroundingOverlay({ durationSeconds = 60, onComplete, onSkip }: GroundingOverlayProps) {
  const [timer, setTimer] = useState(durationSeconds);
  const [thumbsHeld, setThumbsHeld] = useState({ left: false, right: false });
  const [phase, setPhase] = useState<"inhale" | "exhale">("inhale");

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          onComplete();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((p) => (p === "inhale" ? "exhale" : "inhale"));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const bothHeld = thumbsHeld.left && thumbsHeld.right;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface">
      {/* Warm gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary-container/10 via-surface to-tertiary-container/5" />

      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Timer */}
        <div className="text-on-surface-variant text-sm font-medium tracking-widest uppercase font-label">
          Grounding Phase
        </div>
        <div className="text-6xl font-light text-foreground tabular-nums font-headline">
          {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}
        </div>

        {/* Breathing Circle */}
        <div className="relative flex items-center justify-center w-56 h-56">
          <div
            className="absolute inset-0 rounded-full border border-primary/15"
            style={{ animation: "breathe-ring 8s ease-in-out infinite" }}
          />
          <div
            className="w-40 h-40 rounded-full bg-primary-container/20 flex items-center justify-center"
            style={{ animation: "breathe 8s ease-in-out infinite" }}
          >
            <Wind className="w-10 h-10 text-primary/50" />
          </div>
        </div>

        {/* Breathing instruction */}
        <div className="text-lg font-light text-primary/70 tracking-wide animate-fade-in font-headline italic">
          {phase === "inhale" ? "Breathe in..." : "Breathe out..."}
        </div>

        {/* Dual thumb zone */}
        <div className="flex gap-8 mt-4">
          <button
            onMouseDown={() => setThumbsHeld((s) => ({ ...s, left: true }))}
            onMouseUp={() => setThumbsHeld((s) => ({ ...s, left: false }))}
            onTouchStart={() => setThumbsHeld((s) => ({ ...s, left: true }))}
            onTouchEnd={() => setThumbsHeld((s) => ({ ...s, left: false }))}
            className={`w-20 h-20 rounded-full border-2 transition-all duration-200 flex items-center justify-center text-xs font-medium tracking-wider uppercase font-label ${
              thumbsHeld.left
                ? "border-primary bg-primary-container/30 text-primary scale-95"
                : "border-line text-on-surface-variant/50 hover:border-primary/50"
            }`}
          >
            Partner A
          </button>
          <button
            onMouseDown={() => setThumbsHeld((s) => ({ ...s, right: true }))}
            onMouseUp={() => setThumbsHeld((s) => ({ ...s, right: false }))}
            onTouchStart={() => setThumbsHeld((s) => ({ ...s, right: true }))}
            onTouchEnd={() => setThumbsHeld((s) => ({ ...s, right: false }))}
            className={`w-20 h-20 rounded-full border-2 transition-all duration-200 flex items-center justify-center text-xs font-medium tracking-wider uppercase font-label ${
              thumbsHeld.right
                ? "border-primary bg-primary-container/30 text-primary scale-95"
                : "border-line text-on-surface-variant/50 hover:border-primary/50"
            }`}
          >
            Partner B
          </button>
        </div>

        {bothHeld && (
          <div className="text-primary/60 text-sm animate-fade-in font-body">
            Connected — breathe together
          </div>
        )}

        {/* Skip button */}
        <button
          onClick={onSkip}
          className="mt-6 flex items-center gap-2 text-on-surface-variant/50 hover:text-on-surface-variant text-xs tracking-wider uppercase transition-colors duration-200 font-label"
        >
          <SkipForward className="w-3 h-3" />
          Skip for Demo
        </button>
      </div>
    </div>
  );
}
