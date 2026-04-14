import { Sparkles, ChevronRight } from "lucide-react";
import type { SessionState } from "@/hooks/useSessionState";

interface CenterMediatorProps {
  sessionState: SessionState;
  selectedEmotion: string | null;
  onSelectEmotion: (emotion: string) => void;
  onAdvance: () => void;
}

const STATE_PROMPTS: Record<number, string> = {
  1: "Share what's on your heart. Your partner is listening with intention.",
  2: 'Start with: "What I heard you say is..."',
  3: 'Start with: "You make sense because..."',
  4: "Choose the emotion you sense in your partner:",
  5: "Roles reversing... Take a breath.",
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
    <div className="relative z-50 h-0 flex items-center justify-center">
      <div className="reflection-glass px-8 py-5 rounded-xl max-w-lg mx-6 text-center shadow-2xl border border-white/20">
        {/* Prompt text */}
        <p className="text-on-secondary-container font-headline text-base leading-relaxed font-medium">
          "{prompt}"
        </p>

        {/* AI label */}
        <div className="mt-2 flex items-center justify-center gap-2">
          <Sparkles className="w-3 h-3 text-secondary" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-secondary">
            {stateLabel} — AI Reflection Guide
          </span>
        </div>

        {/* Emotion Word Bank (State 4) */}
        {sessionState === 4 && (
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            {EMOTIONS.map((emotion) => (
              <button
                key={emotion}
                onClick={() => onSelectEmotion(emotion)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedEmotion === emotion
                    ? "bg-primary text-primary-foreground"
                    : "bg-white/30 text-on-secondary-container hover:bg-white/50"
                }`}
              >
                {emotion}
              </button>
            ))}
          </div>
        )}

        {/* Advance */}
        <button
          onClick={onAdvance}
          className="flex items-center gap-1 mt-2 mx-auto text-[11px] text-secondary/60 hover:text-secondary transition-colors tracking-wider uppercase font-label"
        >
          Continue
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
