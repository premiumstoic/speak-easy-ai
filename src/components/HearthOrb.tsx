import { Mic, MicOff } from "lucide-react";

interface HearthOrbProps {
  orbState: "pulsing_listening" | "expanded_speaking_amber";
  isSpeaking: boolean;
  micLocked: boolean;
  onStartSpeaking: () => void;
  onStopSpeaking: () => void;
  transcript: string;
}

export const HearthOrb = ({
  orbState,
  isSpeaking,
  micLocked,
  onStartSpeaking,
  onStopSpeaking,
  transcript,
}: HearthOrbProps) => {
  const isAmber = orbState === "expanded_speaking_amber";
  const isListening = orbState === "pulsing_listening";

  const handleMicToggle = () => {
    if (micLocked) return;
    if (isSpeaking) {
      onStopSpeaking();
    } else {
      onStartSpeaking();
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
      {/* Ambient glow */}
      <div
        className={`absolute rounded-full blur-[80px] transition-all duration-1000 ${
          isAmber
            ? "w-[60vw] h-[60vw] bg-tertiary/15"
            : "w-[50vw] h-[50vw] bg-primary/10"
        } ${isListening && !isSpeaking ? "animate-[pulse_4s_ease-in-out_infinite]" : ""}`}
      />

      {/* Orb */}
      <button
        onClick={handleMicToggle}
        disabled={micLocked}
        className={`relative z-10 rounded-full flex items-center justify-center transition-all duration-500 ease-out ${
          isAmber
            ? "w-48 h-48 bg-gradient-to-br from-tertiary to-tertiary-container soft-shadow-lg"
            : isSpeaking
            ? "w-44 h-44 bg-gradient-to-br from-primary to-primary-dim soft-shadow-lg scale-105"
            : "w-40 h-40 bg-gradient-to-br from-primary to-primary-dim soft-shadow"
        } ${micLocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:scale-[1.03] active:scale-95"}`}
      >
        {/* Inner pulse ring when speaking */}
        {isSpeaking && (
          <div className="absolute inset-0 rounded-full border-2 border-primary-foreground/30 animate-ping" />
        )}

        {micLocked ? (
          <MicOff className="w-12 h-12 text-primary-foreground/60" />
        ) : (
          <Mic className={`w-12 h-12 text-primary-foreground ${isSpeaking ? "animate-pulse" : ""}`} />
        )}
      </button>

      {/* Status label */}
      <p className="mt-6 text-sm font-body text-muted-foreground text-center">
        {micLocked
          ? "Mic paused — AI speaking"
          : isSpeaking
          ? "Listening…"
          : "Tap orb to speak freely"}
      </p>

      {/* Transcript area */}
      {transcript && (
        <div className="mt-6 max-w-md w-full max-h-32 overflow-y-auto rounded-2xl bg-surface-container/60 backdrop-blur-sm p-4">
          <p className="text-sm font-body text-foreground/80 leading-relaxed">{transcript}</p>
        </div>
      )}
    </div>
  );
};
