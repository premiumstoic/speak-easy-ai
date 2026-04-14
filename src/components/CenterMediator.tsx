import { Sparkles, ChevronRight } from "lucide-react";
import type { UIConfig } from "@/types/therapyConfig";

interface CenterMediatorProps {
  stateKey: string;
  stateType: string;
  activeRole?: string;
  uiConfig?: UIConfig;
  selectedEmotion: string | null;
  onSelectEmotion: (emotion: string) => void;
  onAdvance: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  SENDER: "Sending",
  RECEIVER: "Listening",
};

export function CenterMediator({
  stateKey,
  stateType,
  activeRole,
  uiConfig,
  selectedEmotion,
  onSelectEmotion,
  onAdvance,
}: CenterMediatorProps) {
  // Don't show during grounding
  if (stateType === "breathing_exercise") return null;

  const prompt = uiConfig?.prompt_overlay ?? "";
  const stateLabel = activeRole
    ? ROLE_LABELS[activeRole] ?? activeRole
    : stateType === "role_reversal"
    ? "Role Reversal"
    : "";

  return (
    <div className="relative z-50 h-0 flex items-center justify-center">
      <div className="bg-surface-container-lowest px-8 py-5 rounded-xl max-w-lg mx-6 text-center soft-shadow-lg border border-line/30">
        {/* Prompt text */}
        <p className="text-foreground font-headline text-base leading-relaxed font-medium italic">
          "{prompt}"
        </p>

        {/* AI label */}
        <div className="mt-2 flex items-center justify-center gap-2">
          <Sparkles className="w-3 h-3 text-secondary" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-secondary font-body">
            {stateLabel} — AI Reflection Guide
          </span>
        </div>

        {/* Emotion Word Bank */}
        {uiConfig?.emotion_bank_visible && uiConfig.emotion_words && (
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            {uiConfig.emotion_words.map((emotion) => (
              <button
                key={emotion}
                onClick={() => onSelectEmotion(emotion)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 font-body ${
                  selectedEmotion === emotion
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
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
          className="flex items-center gap-1 mt-2 mx-auto text-[11px] text-muted-foreground hover:text-foreground transition-colors duration-200 tracking-wider uppercase font-label"
        >
          Continue
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
