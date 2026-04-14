import { useNavigate } from "react-router-dom";
import { Mic, Waves, Zap } from "lucide-react";
import { InsightCard } from "@/components/InsightCard";
import UmayLogo from "@/components/UmayLogo";
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

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

const Home = () => {
  const navigate = useNavigate();
  const [selectedTechnique, setSelectedTechnique] = useState(techniques[0].id);
  const [simulating, setSimulating] = useState(false);

  const selected = techniques.find((t) => t.id === selectedTechnique)!;

  const DEMO_TURNS = [
    { speaker: "Partner A", text: "I feel like when I come home and the house is messy, it makes me feel like my effort doesn't matter.", tripwire: null },
    { speaker: "Partner B", text: "Well maybe if you actually helped more on weekends instead of playing video games, I wouldn't be so exhausted.", tripwire: null },
    { speaker: "Partner A", text: "That's not fair. I do help. You just never notice what I do.", tripwire: null },
    { speaker: "Partner B", text: "I notice. I notice that every Saturday you disappear into the garage for three hours.", tripwire: null },
    { speaker: "Partner A", text: "I need that time. I feel like I can't breathe sometimes. Everything feels like pressure.", tripwire: "the_missed_drop" },
    { speaker: "Partner B", text: "Oh, so now I'm the one suffocating you? That's rich.", tripwire: null },
    { speaker: "Partner A", text: "That's not what I said. You always twist my words.", tripwire: "the_loop" },
    { speaker: "Partner B", text: "...", tripwire: "the_stonewall" },
    { speaker: "System", text: "I am noticing that things have gone quiet. Sometimes when emotion gets too intense, our systems shut down to protect us. Let us slow the pace down.", tripwire: "the_stonewall" },
    { speaker: "Partner A", text: "I just want us to be a team again. I miss feeling like we're on the same side.", tripwire: "the_missed_drop" },
  ];

  const simulateInserts = useCallback(async () => {
    setSimulating(true);
    const sessionId = `demo_${Date.now()}`;
    let count = 0;

    for (const turn of DEMO_TURNS) {
      const ai_analysis: Record<string, unknown> = {
        turn_number: count + 1,
        confidence_score: turn.tripwire ? 0.85 + Math.random() * 0.12 : Math.random() * 0.4,
        detected_tripwire: turn.tripwire,
        action_decision: turn.tripwire ? "interrupt" : "null",
        chain_of_thought_scratchpad: turn.tripwire
          ? `[ANALYSIS] Evaluating 20-turn context window... Semantic markers detected for "${turn.tripwire}". Cosine similarity: ${(0.7 + Math.random() * 0.25).toFixed(2)}. Affective trajectory: negative valence sustained. Confidence: ${(0.85 + Math.random() * 0.12).toFixed(2)} >= 0.85 threshold. ACTION: interrupt.`
          : `[ANALYSIS] Turn ${count + 1} by ${turn.speaker}. No tripwire markers exceed threshold. Confidence: ${(Math.random() * 0.4).toFixed(2)}. ACTION: null. Maintaining silence.`,
      };

      await supabase.from("therapy_logs").insert([{
        session_id: sessionId,
        speaker: turn.speaker,
        raw_transcript: turn.text,
        ai_analysis: ai_analysis as unknown as Json,
      }]);
      count++;

      // Stagger inserts by 1.5s so the Observer Dashboard gets a nice stream
      if (count < DEMO_TURNS.length) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    setSimulating(false);
    toast.success(`Simulated ${count} turns`, { description: `Session: ${sessionId}` });
  }, []);

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="pt-4 pb-2 px-6 flex items-center shrink-0">
        <div className="flex items-center gap-2">
          <UmayLogo className="w-6 h-6 text-primary" />
          <span className="font-headline text-lg font-semibold italic tracking-tight text-primary">Umay</span>
        </div>
      </header>

      {/* Center: Start Session */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 -mt-4">
        <h1 className="text-3xl font-headline font-bold tracking-tight mb-6 text-center leading-snug animate-fade-in">
          How is your heart <br />
          <span className="text-primary italic">today?</span>
        </h1>

        {/* Technique Picker */}
        <div className="flex gap-2 mb-8">
          {techniques.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTechnique(t.id)}
              className={`px-4 py-2 rounded-full text-sm font-body font-medium transition-all duration-200 ${
                selectedTechnique === t.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-container text-muted-foreground hover:bg-surface-container-high"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>

        <div className="relative group cursor-pointer" onClick={() => navigate(`/session?technique=${selectedTechnique}`)}>
          {/* Soft glow */}
          <div className="absolute inset-0 rounded-full bg-primary/8 blur-2xl scale-125 animate-[pulse_4s_ease-out_infinite]" />

          {/* Button */}
          <button
            className="relative w-44 h-44 rounded-full bg-gradient-to-br from-primary to-primary-dim text-primary-foreground flex flex-col items-center justify-center gap-2 soft-shadow-lg hover:scale-[1.03] active:scale-95 transition-all duration-200 ease-out session-glow"
          >
            <selected.icon className="w-12 h-12 mb-1" />
            <span className="font-body text-lg font-semibold tracking-tight">Start Session</span>
            <span className="text-primary-foreground/60 text-xs font-medium">{selected.description.split(",")[0]}</span>
          </button>
        </div>
      </main>

      {/* Bottom: Insights Carousel */}
      <section className="shrink-0 pb-24 pt-4">
        <div className="flex items-center justify-between px-6 mb-3">
          <h2 className="font-body text-sm font-semibold tracking-wide text-muted-foreground uppercase">Insights</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar px-6 snap-x">
          <InsightCard type="notification" title="Gratitude" body="Tom completed his daily gratitude reflection." action="Acknowledge" />
          <InsightCard type="question" title="Deep Question" body="What made you feel safe this week?" />
          <InsightCard type="reminder" title="Reminder" body="No-Screen Night tonight at 8 PM." progress={80} />
        </div>
      </section>

      {/* Bottom Nav */}
      <nav className="fixed bottom-6 left-0 right-0 z-50 flex justify-center">
        <div className="w-[90%] max-w-md rounded-full px-6 py-3 glass-nav soft-shadow flex justify-around items-center">
          {[
            { icon: "map", label: "Journey", path: "/journey" },
            { icon: "home", label: "Home", path: "/" },
            { icon: "user", label: "Me", path: "/profile" },
          ].map(({ label, path }) => {
            const isActive = path === "/";
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`p-4 rounded-full transition-all duration-200 ${
                  isActive
                    ? "bg-primary-container text-on-primary-container scale-110"
                    : "text-muted-foreground hover:bg-surface-container-high"
                }`}
              >
                {label === "Home" && <HomeIcon />}
                {label === "Journey" && <MapIcon />}
                {label === "Me" && <UserIcon />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
);
const MapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg>
);
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

export default Home;
