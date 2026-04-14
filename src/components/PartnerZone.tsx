import { Mic, MicOff, AlertTriangle } from "lucide-react";

interface PartnerZoneProps {
  partner: "A" | "B";
  partnerName: string;
  role: "SENDER" | "RECEIVER";
  isActive: boolean;
  transcript: string;
  isSpeaking: boolean;
  speakingTimer: number;
  maxRecordingTime: number;
  micLocked: boolean;
  strikeFlash: null | 1 | 2 | 3;
  strikeCount: number;
  onStartSpeaking: () => void;
  onStopSpeaking: () => void;
  isLiveRecording?: boolean;
}

export function PartnerZone({
  partner,
  partnerName,
  role,
  isActive,
  transcript,
  isSpeaking,
  speakingTimer,
  maxRecordingTime,
  micLocked,
  strikeFlash,
  strikeCount,
  onStartSpeaking,
  onStopSpeaking,
  isLiveRecording = false,
}: PartnerZoneProps) {
  const warningThreshold = maxRecordingTime - 10;
  const isWarning = speakingTimer >= warningThreshold || strikeCount >= 2;

  const getStrikeFlashClass = () => {
    if (!strikeFlash || !isActive) return "";
    if (strikeFlash === 1) return "ring-4 ring-strike-1/40";
    if (strikeFlash === 2) return "ring-4 ring-strike-2/50";
    return "ring-4 ring-strike-3/60";
  };

  const getShakeClass = () => {
    return strikeFlash === 2 && isActive ? "animate-[shake_0.5s_ease-in-out]" : "";
  };

  const bgClass = isActive ? "bg-surface" : "bg-surface-container-low";

  return (
    <section
      className={`relative flex-1 flex flex-col items-center justify-center transition-all duration-700 ${bgClass} ${
        isActive ? "zone-active" : "zone-inactive"
      } ${getStrikeFlashClass()} ${getShakeClass()}`}
    >
      {/* Active tint */}
      {isActive && <div className="absolute inset-0 bg-primary/5 pointer-events-none" />}

      {/* Strike flash overlay */}
      {strikeFlash && isActive && (
        <div
          className={`absolute inset-0 z-10 pointer-events-none ${
            strikeFlash === 1 ? "bg-strike-1/10" : strikeFlash === 2 ? "bg-strike-2/15" : "bg-strike-3/20"
          }`}
          style={{ animation: "flash-strike 0.8s ease-out" }}
        />
      )}

      <div className="relative z-10 flex flex-col items-center gap-4">
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div
            className={`rounded-full flex items-center justify-center font-headline font-bold text-white ${
              isActive
                ? "w-20 h-20 bg-gradient-to-tr from-primary to-primary-container mic-glow text-2xl"
                : "w-16 h-16 bg-outline-variant/30 text-xl text-on-surface-variant"
            }`}
          >
            {partnerName[0]}
          </div>
          <div className="mt-3 text-center">
            <span className={`font-label text-[10px] uppercase tracking-[0.15em] font-bold ${
              isActive ? "text-primary" : "text-on-surface-variant"
            }`}>
              {role === "SENDER" ? "Speaking" : "Listening"}
            </span>
            <h2 className={`font-headline font-semibold ${isActive ? "text-xl" : "text-lg text-on-surface-variant"}`}>
              {partnerName}
            </h2>
          </div>
        </div>

        {/* Transcript preview */}
        {transcript && isActive && (
          <div className="max-w-xs text-center px-4">
            <p className="text-sm leading-relaxed text-on-surface-variant font-light line-clamp-2">
              {transcript}
              {isSpeaking && (
                <span className="inline-block w-0.5 h-4 bg-primary ml-1 align-text-bottom" style={{ animation: "pulse-soft 1s infinite" }} />
              )}
            </p>
          </div>
        )}

        {/* PTT Button */}
        <button
          onMouseDown={!micLocked && isActive ? onStartSpeaking : undefined}
          onMouseUp={!micLocked && isActive ? onStopSpeaking : undefined}
          onTouchStart={!micLocked && isActive ? onStartSpeaking : undefined}
          onTouchEnd={!micLocked && isActive ? onStopSpeaking : undefined}
          disabled={micLocked || !isActive}
          className={`flex flex-col items-center gap-2 transition-transform active:scale-95 ${
            micLocked || !isActive ? "cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          <div
            className={`rounded-full flex items-center justify-center transition-all ${
              micLocked || !isActive
                ? "w-14 h-14 bg-surface-container-highest text-on-surface-variant"
                : isSpeaking
                ? isWarning
                  ? "w-20 h-20 bg-destructive text-destructive-foreground shadow-lg"
                  : "w-20 h-20 bg-primary text-primary-foreground shadow-lg"
                : "w-16 h-16 bg-primary text-primary-foreground shadow-md hover:shadow-lg"
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
              <MicOff className="w-5 h-5" />
            ) : isWarning && isSpeaking ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <Mic className={`${isSpeaking ? "w-7 h-7" : "w-6 h-6"}`} />
            )}
          </div>
          <p className="font-label text-[11px] text-on-surface-variant/60">
            {micLocked || !isActive
              ? "Waiting for turn"
              : isSpeaking
              ? isWarning
                ? `${maxRecordingTime - speakingTimer}s left`
                : "Release to stop"
              : "Hold to speak"}
          </p>
        </button>

        {/* Audio visualization bars */}
        {isActive && isSpeaking && (
          <div className="flex justify-center gap-1 opacity-30">
            {[0, 0.2, 0.4, 0.6, 0.8].map((delay, i) => (
              <div
                key={i}
                className="w-1 bg-primary rounded-full"
                style={{
                  animation: `audio-bar 0.8s ease-in-out ${delay}s infinite`,
                  height: "8px",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
