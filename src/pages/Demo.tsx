import { useNavigate } from "react-router-dom";
import { Mic, Waves } from "lucide-react";
import UmayLogo from "@/components/UmayLogo";
import { useState } from "react";

const techniques = [
  {
    id: "imago_core_dialogue",
    name: "Imago Dialogue",
    description: "Structured mirroring, validation & empathy turns",
    icon: Mic,
  },
  {
    id: "open_mediation_enactment",
    name: "Guided Enactment",
    description: "Open conversation with AI process observation",
    icon: Waves,
  },
];

const Demo = () => {
  const navigate = useNavigate();
  const [selectedTechnique, setSelectedTechnique] = useState(techniques[0].id);
  const selected = techniques.find((t) => t.id === selectedTechnique)!;

  return (
    <div className="h-[100dvh] bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background accents */}
      <div className="fixed -bottom-[20%] -left-[10%] w-[50%] h-[50%] bg-tertiary-container/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed -top-[20%] -right-[10%] w-[50%] h-[50%] bg-primary-container/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-4">
          <UmayLogo className="w-8 h-8 text-primary" />
          <span className="font-headline text-2xl font-semibold italic tracking-tight text-primary">
            Umay
          </span>
        </div>

        {/* Badge */}
        <span className="inline-block px-3 py-1 rounded-full bg-tertiary/10 text-tertiary text-xs font-body font-semibold uppercase tracking-wider mb-8">
          Demo Mode
        </span>

        <h1 className="text-2xl font-headline font-bold tracking-tight mb-2 text-center">
          Experience a session
        </h1>
        <p className="text-sm font-body text-muted-foreground text-center mb-8 max-w-xs">
          Try Umay's therapy modalities with live speech recognition and AI process observation. No account needed.
        </p>

        {/* Technique picker */}
        <div className="w-full flex flex-col gap-3 mb-8">
          {techniques.map((t) => {
            const isSelected = selectedTechnique === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTechnique(t.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-200 text-left ${
                  isSelected
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                    : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                }`}
              >
                <t.icon className={`w-6 h-6 shrink-0 ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`} />
                <div>
                  <p className="font-body font-semibold text-sm">{t.name}</p>
                  <p className={`font-body text-xs mt-0.5 ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {t.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Start button */}
        <div className="relative group cursor-pointer w-full" onClick={() => navigate(`/demo/session?technique=${selectedTechnique}`)}>
          <div className="absolute inset-0 rounded-full bg-primary/8 blur-2xl scale-110 animate-[pulse_4s_ease-out_infinite]" />
          <button className="relative w-full py-4 rounded-full bg-gradient-to-br from-primary to-primary-dim text-primary-foreground font-body font-semibold text-base hover:opacity-90 active:scale-[0.98] transition-all duration-200 soft-shadow-lg flex items-center justify-center gap-3">
            <selected.icon className="w-5 h-5" />
            Start Demo Session
          </button>
        </div>

        {/* Back link */}
        <button
          onClick={() => navigate("/login")}
          className="mt-6 text-sm font-body text-muted-foreground hover:text-primary transition-colors"
        >
          Back to sign in
        </button>
      </div>
    </div>
  );
};

export default Demo;
