import { Shield, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SessionState } from "@/hooks/useSessionState";

interface CenterMediatorProps {
  sessionState: SessionState;
  selectedEmotion: string | null;
  onSelectEmotion: (emotion: string) => void;
  onAdvance: () => void;
}

const STATE_PROMPTS: Record<number, string> = {
  1: "Partner is speaking. Listen without judgment.",
  2: "Start with: \"What I heard you say is...\"",
  3: "Start with: \"You make sense because...\"",
  4: "Choose the emotion you sense:",
  5: "Roles reversing...",
};

const EMOTIONS = ["Angry", "Sad", "Scared", "Overwhelmed", "Lonely", "Hurt", "Anxious", "Unseen"];

export function CenterMediator({
  sessionState,
  selectedEmotion,
  onSelectEmotion,
  onAdvance,
}: CenterMediatorProps) {
  if (sessionState === 0) return null;

  const prompt = STATE_PROMPTS[sessionState] || "";
  const stateLabel =
    sessionState === 1
      ? "Sending"
      : sessionState === 2
      ? "Mirroring"
      : sessionState === 3
      ? "Validation"
      : sessionState === 4
      ? "Empathy"
      : "Role Reversal";

  return (
    <div className="relative z-20 flex flex-col items-center gap-3 py-4 px-6 bg-card/80 border-y border-border/50 backdrop-blur-sm">
      {/* AI Icon + State */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center" style={{ animation: "pulse-soft 3s infinite" }}>
          <Shield className="w-3 h-3 text-primary" />
        </div>
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary/70">
          {stateLabel} — State {sessionState}
        </span>
      </div>

      {/* Prompt */}
      <p className="text-sm text-foreground/80 font-light text-center max-w-md">
        {prompt}
      </p>

      {/* Emotion Word Bank (State 4 only) */}
      {sessionState === 4 && (
        <div className="flex flex-wrap justify-center gap-2 mt-1">
          {EMOTIONS.map((emotion) => (
            <button
              key={emotion}
              onClick={() => onSelectEmotion(emotion)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                selectedEmotion === emotion
                  ? "bg-primary/20 text-primary border-primary/40"
                  : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {emotion}
            </button>
          ))}
        </div>
      )}

      {/* Advance button */}
      <button
        onClick={onAdvance}
        className="flex items-center gap-1 mt-1 text-xs text-muted-foreground/50 hover:text-primary transition-colors tracking-wider uppercase"
      >
        Continue
        <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  );
}
