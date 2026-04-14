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
  liveLines?: string[];
  liveInterim?: string;
  audioLevel?: number;
  isTranscribing?: boolean;
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
  liveLines = [],
  liveInterim = "",
  audioLevel = 0,
  isTranscribing = false,
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

        {/* Live transcription ticker — shown while recording or transcribing */}
        {isActive && (isLiveRecording || isTranscribing) && (
          <div className="max-w-xs w-full px-4">
            <div className="rounded-xl bg-surface-container/70 backdrop-blur-sm px-3 py-2 max-h-20 overflow-y-auto flex flex-col gap-0.5">
              {liveLines.slice(-3).map((line, i) => (
                <p key={i} className="text-xs leading-snug text-on-surface-variant/70 font-light">{line}</p>
              ))}
              {liveInterim && (
                <p className="text-xs leading-snug text-on-surface-variant font-light">
                  {liveInterim}
                  <span className="inline-block w-0.5 h-3 bg-primary ml-0.5 align-text-bottom" style={{ animation: "pulse-soft 1s infinite" }} />
                </p>
              )}
              {isTranscribing && !liveInterim && (
                <p className="text-xs text-on-surface-variant/40 italic">Transcribing…</p>
              )}
              {isLiveRecording && !isTranscribing && !liveLines.length && !liveInterim && (
                <p className="text-xs text-on-surface-variant/40 italic">Listening…</p>
              )}
            </div>
          </div>
        )}

        {/* Final transcript — shown after recording stops */}
        {isActive && !isLiveRecording && transcript && (
          <div className="max-w-xs text-center px-4">
            <p className="text-sm leading-relaxed text-on-surface-variant font-light line-clamp-3">
              {transcript}
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
          } ${isLiveRecording && isActive ? "relative" : ""}`}
        >
          {/* Live recording pulse ring */}
          {isLiveRecording && isActive && (
            <div className="absolute inset-0 -m-2 rounded-full border-2 border-primary animate-ping opacity-30 pointer-events-none" />
          )}
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

        {/* Mic level visualizer */}
        {isActive && isLiveRecording && (
          <div className="flex justify-center items-end gap-1">
            {[0.5, 0.8, 1.0, 0.8, 0.5].map((scale, i) => {
              const height = Math.max(3, audioLevel * 32 * scale);
              return (
                <div
                  key={i}
                  className="w-1 rounded-full bg-primary transition-all duration-75"
                  style={{ height: `${height}px` }}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
