import { useNavigate } from "react-router-dom";
import { Mic, Leaf } from "lucide-react";
import { InsightCard } from "@/components/InsightCard";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="pt-4 pb-2 px-6 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-primary" />
          <span className="font-headline text-lg font-bold italic tracking-tight text-primary">Sanctuary</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-muted-foreground font-headline font-bold text-sm">
          S
        </div>
      </header>

      {/* Center: Start Session */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 -mt-8">
        <h1 className="text-3xl font-headline font-extrabold tracking-tight mb-10 text-center leading-tight animate-fade-in">
          How is your heart <br />
          <span className="text-primary italic">today?</span>
        </h1>

        <div className="relative group cursor-pointer" onClick={() => navigate("/session")}>
          {/* Outer glow rings */}
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-3xl scale-150 animate-[pulse_3s_ease-in-out_infinite]" />
          <div className="absolute inset-0 rounded-full bg-primary/5 blur-2xl scale-125 animate-[pulse_3s_ease-in-out_infinite_0.5s]" />
          
          {/* Button */}
          <button
            className="relative w-36 h-36 rounded-full bg-gradient-to-br from-primary to-primary-dim text-primary-foreground flex flex-col items-center justify-center gap-1.5 shadow-2xl hover:scale-105 active:scale-95 transition-all duration-500 ease-sanctuary session-glow"
          >
            <Mic className="w-10 h-10 mb-1" />
            <span className="font-headline text-base font-bold tracking-tight">Start Session</span>
            <span className="text-primary-foreground/60 text-[10px] font-medium">15 min reflection</span>
          </button>
        </div>
      </main>

      {/* Bottom: Insights Carousel */}
      <section className="shrink-0 pb-24 pt-4">
        <div className="flex items-center justify-between px-6 mb-3">
          <h2 className="font-headline text-sm font-bold tracking-tight text-muted-foreground uppercase">Insights</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar px-6 snap-x">
          <InsightCard
            type="notification"
            title="Gratitude"
            body="Tom completed his daily gratitude reflection."
            action="Acknowledge"
          />
          <InsightCard
            type="question"
            title="Deep Question"
            body="What made you feel safe this week?"
          />
          <InsightCard
            type="reminder"
            title="Reminder"
            body="No-Screen Night tonight at 8 PM."
            progress={80}
          />
        </div>
      </section>

      {/* Bottom Nav */}
      <nav className="fixed bottom-6 left-0 right-0 z-50 flex justify-center">
        <div className="w-[90%] max-w-md rounded-full px-6 py-3 glass-nav shadow-[0_20px_40px_rgba(77,101,77,0.06)] flex justify-around items-center">
          {[
            { icon: "home", label: "Home", path: "/" },
            { icon: "map", label: "Journey", path: "/journey" },
            { icon: "user", label: "Profile", path: "/profile" },
          ].map(({ label, path }) => {
            const isActive = path === "/";
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`p-4 rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-primary-container text-on-primary-container scale-110 shadow-lg"
                    : "text-muted-foreground hover:bg-surface-container-high"
                }`}
              >
                {label === "Home" && <HomeIcon />}
                {label === "Journey" && <MapIcon />}
                {label === "Profile" && <UserIcon />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

// Inline icon components to avoid import clutter
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
