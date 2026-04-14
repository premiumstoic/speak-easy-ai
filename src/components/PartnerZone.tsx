import { useRef, useCallback } from "react";
import { Mic, Lock, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { SessionState } from "@/hooks/useSessionState";

interface PartnerZoneProps {
  partner: "A" | "B";
  role: "SENDER" | "RECEIVER";
  isActive: boolean;
  transcript: string;
  isSpeaking: boolean;
  speakingTimer: number;
  micLocked: boolean;
  strikeFlash: null | 1 | 2 | 3;
  strikeCount: number;
  sessionState: SessionState;
  onStartSpeaking: () => void;
  onStopSpeaking: () => void;
}

export function PartnerZone({
  partner,
  role,
  isActive,
  transcript,
  isSpeaking,
  speakingTimer,
  micLocked,
  strikeFlash,
  strikeCount,
  sessionState,
  onStartSpeaking,
  onStopSpeaking,
}: PartnerZoneProps) {
  const timerProgress = (speakingTimer / 45) * 100;
  const isWarning = speakingTimer >= 35 || strikeCount >= 2;

  const getStrikeFlashClass = () => {
    if (!strikeFlash || !isActive) return "";
    if (strikeFlash === 1) return "ring-4 ring-strike-1/40";
    if (strikeFlash === 2) return "ring-4 ring-strike-2/50";
    return "ring-4 ring-strike-3/60";
  };

  const getShakeClass = () => {
    return strikeFlash === 2 && isActive ? "animate-[shake_0.5s_ease-in-out]" : "";
  };

  return (
    <div
      className={`relative flex-1 flex flex-col p-4 transition-all duration-500 ${
        isActive ? "zone-active" : "zone-inactive"
      } ${getStrikeFlashClass()} ${getShakeClass()}`}
    >
      {/* Strike flash overlay */}
      {strikeFlash && isActive && (
        <div
          className={`absolute inset-0 z-10 pointer-events-none rounded-lg ${
            strikeFlash === 1
              ? "bg-strike-1/10"
              : strikeFlash === 2
              ? "bg-strike-2/15"
              : "bg-strike-3/20"
          }`}
          style={{ animation: "flash-strike 0.8s ease-out" }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold tracking-widest text-muted-foreground/60 uppercase">
            Partner {partner}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${
              role === "SENDER"
                ? "bg-primary/15 text-primary border border-primary/20"
                : "bg-secondary text-muted-foreground border border-border"
            }`}
          >
            {role}
          </span>
        </div>

        {/* Strike indicators */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i < strikeCount
                  ? i === 0
                    ? "bg-strike-1"
                    : i === 1
                    ? "bg-strike-2"
                    : "bg-strike-3"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Transcript area */}
      <div className="flex-1 bg-card/50 rounded-lg border border-border/50 p-4 mb-3 overflow-y-auto min-h-[80px]">
        {transcript ? (
          <p className="text-sm leading-relaxed text-foreground/90 font-light">
            {transcript}
            {isSpeaking && (
              <span className="inline-block w-0.5 h-4 bg-primary ml-1 align-text-bottom" style={{ animation: "pulse-soft 1s infinite" }} />
            )}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground/40 italic">
            {role === "SENDER" ? "Hold the mic to speak..." : "Listening..."}
          </p>
        )}
      </div>

      {/* Timer bar (only when speaking) */}
      {isActive && isSpeaking && (
        <div className="mb-3">
          <div className="flex justify-between text-[10px] text-muted-foreground/50 mb-1">
            <span>{speakingTimer}s</span>
            <span>45s max</span>
          </div>
          <Progress
            value={timerProgress}
            className={`h-1 ${isWarning ? "[&>div]:bg-destructive" : "[&>div]:bg-primary"}`}
          />
        </div>
      )}

      {/* PTT Button */}
      <button
        onMouseDown={!micLocked && isActive ? onStartSpeaking : undefined}
        onMouseUp={!micLocked && isActive ? onStopSpeaking : undefined}
        onTouchStart={!micLocked && isActive ? onStartSpeaking : undefined}
        onTouchEnd={!micLocked && isActive ? onStopSpeaking : undefined}
        disabled={micLocked || !isActive}
        className={`w-full py-4 rounded-xl border-2 flex items-center justify-center gap-3 font-medium text-sm tracking-wide uppercase transition-all select-none ${
          micLocked || !isActive
            ? "border-muted bg-muted/30 text-muted-foreground/40 cursor-not-allowed"
            : isSpeaking
            ? isWarning
              ? "border-destructive bg-destructive/10 text-destructive"
              : "border-primary bg-primary/10 text-primary glow-ptt"
            : "border-primary/40 bg-primary/5 text-primary hover:border-primary hover:bg-primary/10"
        }`}
        style={
          isSpeaking && !isWarning
            ? { animation: "ptt-pulse 2s ease-in-out infinite" }
            : isSpeaking && isWarning
            ? { animation: "ptt-warning-pulse 0.5s ease-in-out infinite" }
            : undefined
        }
      >
        {micLocked || !isActive ? (
          <>
            <Lock className="w-5 h-5" />
            <span>Mic Locked</span>
          </>
        ) : isSpeaking ? (
          <>
            {isWarning ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
            <span>{isWarning ? "Time Running Out" : "Speaking..."}</span>
          </>
        ) : (
          <>
            <Mic className="w-5 h-5" />
            <span>Hold to Speak</span>
          </>
        )}
      </button>
    </div>
  );
}
