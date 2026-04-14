import { useEffect, useState, useCallback } from "react";
import { Wind, SkipForward } from "lucide-react";

interface GroundingOverlayProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function GroundingOverlay({ onComplete, onSkip }: GroundingOverlayProps) {
  const [timer, setTimer] = useState(60);
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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      {/* Subtle gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-primary/5" />

      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Timer */}
        <div className="text-muted-foreground text-sm font-medium tracking-widest uppercase">
          Grounding Phase
        </div>
        <div className="text-6xl font-extralight text-foreground tabular-nums">
          {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}
        </div>

        {/* Breathing Circle */}
        <div className="relative flex items-center justify-center w-56 h-56">
          {/* Outer ring */}
          <div
            className="absolute inset-0 rounded-full border border-primary/20"
            style={{ animation: "breathe-ring 8s ease-in-out infinite" }}
          />
          {/* Main circle */}
          <div
            className="w-40 h-40 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center"
            style={{ animation: "breathe 8s ease-in-out infinite" }}
          >
            <Wind className="w-10 h-10 text-primary/60" />
          </div>
        </div>

        {/* Breathing instruction */}
        <div className="text-lg font-light text-primary/80 tracking-wide animate-fade-in">
          {phase === "inhale" ? "Breathe in..." : "Breathe out..."}
        </div>

        {/* Dual thumb zone */}
        <div className="flex gap-8 mt-4">
          <button
            onMouseDown={() => setThumbsHeld((s) => ({ ...s, left: true }))}
            onMouseUp={() => setThumbsHeld((s) => ({ ...s, left: false }))}
            onTouchStart={() => setThumbsHeld((s) => ({ ...s, left: true }))}
            onTouchEnd={() => setThumbsHeld((s) => ({ ...s, left: false }))}
            className={`w-20 h-20 rounded-full border-2 transition-all duration-300 flex items-center justify-center text-xs font-medium tracking-wider uppercase ${
              thumbsHeld.left
                ? "border-primary bg-primary/20 text-primary scale-95"
                : "border-muted-foreground/30 text-muted-foreground/50 hover:border-primary/50"
            }`}
          >
            Partner A
          </button>
          <button
            onMouseDown={() => setThumbsHeld((s) => ({ ...s, right: true }))}
            onMouseUp={() => setThumbsHeld((s) => ({ ...s, right: false }))}
            onTouchStart={() => setThumbsHeld((s) => ({ ...s, right: true }))}
            onTouchEnd={() => setThumbsHeld((s) => ({ ...s, right: false }))}
            className={`w-20 h-20 rounded-full border-2 transition-all duration-300 flex items-center justify-center text-xs font-medium tracking-wider uppercase ${
              thumbsHeld.right
                ? "border-primary bg-primary/20 text-primary scale-95"
                : "border-muted-foreground/30 text-muted-foreground/50 hover:border-primary/50"
            }`}
          >
            Partner B
          </button>
        </div>

        {bothHeld && (
          <div className="text-primary/70 text-sm animate-fade-in">
            Connected — breathe together
          </div>
        )}

        {/* Skip button */}
        <button
          onClick={onSkip}
          className="mt-6 flex items-center gap-2 text-muted-foreground/50 hover:text-muted-foreground text-xs tracking-wider uppercase transition-colors"
        >
          <SkipForward className="w-3 h-3" />
          Skip for Demo
        </button>
      </div>
    </div>
  );
}
