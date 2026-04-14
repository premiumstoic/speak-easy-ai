import { useNavigate } from "react-router-dom";
import { Mic, TrendingUp, Leaf } from "lucide-react";
import { InsightCard } from "@/components/InsightCard";
import { BottomNav } from "@/components/BottomNav";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 pt-4 bg-background/30 backdrop-blur-md">
        <div className="flex justify-between items-center w-full px-8 max-w-screen-xl mx-auto">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-primary" />
            <span className="font-headline text-lg font-bold italic tracking-tight text-primary">Sanctuary</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-muted-foreground font-headline font-bold text-sm">
            S
          </div>
        </div>
      </header>

      <main className="pt-24 px-6 max-w-screen-xl mx-auto">
        {/* Hero */}
        <section className="mt-12 text-center" style={{ animation: "float-in 0.8s cubic-bezier(0.2,0.8,0.2,1)" }}>
          <div className="mb-6 text-muted-foreground font-medium tracking-wide text-sm uppercase">
            Welcome back, Sarah & Tom
          </div>
          <h1 className="text-5xl md:text-7xl font-headline font-extrabold tracking-tight mb-12 max-w-3xl mx-auto leading-[1.1]">
            How is your heart <br />
            <span className="text-primary italic">today?</span>
          </h1>

          <div className="relative group cursor-pointer inline-block">
            <div className="absolute inset-0 bg-primary opacity-10 blur-3xl rounded-full group-hover:opacity-20 transition-opacity duration-700" />
            <button
              onClick={() => navigate("/session")}
              className="relative bg-gradient-to-br from-primary to-primary-dim text-primary-foreground px-12 py-8 rounded-full flex flex-col items-center gap-2 shadow-xl hover:scale-[1.02] transition-all duration-500 ease-sanctuary active:scale-95"
            >
              <Mic className="w-9 h-9 mb-1" />
              <span className="font-headline text-xl font-bold tracking-tight">Start Session</span>
              <span className="text-primary-foreground/70 text-xs font-medium">15 min reflection</span>
            </button>
          </div>
        </section>

        {/* Insights Feed */}
        <section className="mt-24" style={{ animation: "float-in 1s cubic-bezier(0.2,0.8,0.2,1) 0.2s both" }}>
          <div className="flex items-end justify-between mb-8 px-2">
            <div>
              <h2 className="font-headline text-2xl font-bold tracking-tight mb-1">Insights Feed</h2>
              <p className="text-on-surface-variant text-sm">Gentle nudges for your connection</p>
            </div>
            <button className="text-primary font-semibold text-sm hover:underline">View History</button>
          </div>
          <div className="flex gap-5 overflow-x-auto no-scrollbar pb-8 -mx-6 px-6 snap-x">
            <InsightCard
              type="notification"
              title="Gratitude"
              body="Tom completed his daily gratitude reflection. He mentioned your support during dinner."
              action="Acknowledge"
            />
            <InsightCard
              type="question"
              title="Deep Question"
              body="What is one thing your partner did this week that made you feel safe?"
            />
            <InsightCard
              type="reminder"
              title="Reminder"
              body='Your "No-Screen Night" is scheduled for tonight at 8:00 PM.'
              progress={80}
            />
          </div>
        </section>

        {/* Relationship Pulse + Today's Focus */}
        <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8" style={{ animation: "float-in 1s cubic-bezier(0.2,0.8,0.2,1) 0.4s both" }}>
          {/* Relationship Pulse */}
          <div className="bg-surface-container-low rounded-xl p-10 flex flex-col md:flex-row items-center gap-8">
            <div className="w-28 h-28 shrink-0 rounded-full bg-primary-container flex items-center justify-center">
              <TrendingUp className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h3 className="font-headline text-2xl font-bold mb-2">Relationship Pulse</h3>
              <p className="text-on-surface-variant leading-relaxed mb-4">
                Your emotional harmony is trending upward this week. You both are communicating 15% more effectively.
              </p>
              <div className="inline-flex items-center gap-2 py-2 px-4 bg-primary-container text-on-primary-container rounded-full text-sm font-bold">
                <TrendingUp className="w-4 h-4" />
                Excellent
              </div>
            </div>
          </div>

          {/* Today's Focus */}
          <div className="bg-surface-container-lowest rounded-xl p-10">
            <h3 className="font-headline text-xl font-bold mb-6">Today's Focus</h3>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full border-2 border-primary mt-1 flex items-center justify-center">
                  <div className="w-3 h-3 bg-primary rounded-full" />
                </div>
                <div>
                  <div className="font-bold">Active Listening Exercise</div>
                  <div className="text-sm text-on-surface-variant">Repeat what you heard before responding</div>
                </div>
              </li>
              <li className="flex items-start gap-4 opacity-50">
                <div className="w-6 h-6 rounded-full border-2 border-outline-variant mt-1" />
                <div>
                  <div className="font-bold">Express Gratitude</div>
                  <div className="text-sm text-on-surface-variant">Tell Tom one thing you appreciate</div>
                </div>
              </li>
            </ul>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default Home;
