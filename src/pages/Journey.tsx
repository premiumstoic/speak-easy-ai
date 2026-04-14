import { Map, Heart, Sun, Anchor, Sparkles, ArrowRight, Leaf } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

const timelineItems = [
  {
    icon: Map,
    iconBg: "bg-primary-container",
    iconColor: "text-primary",
    badge: "Recent Session",
    badgeBg: "bg-tertiary-container/20 text-on-tertiary-container",
    title: "Imago Dialogue",
    date: "Oct 24, 10:30 AM",
    description: "Practiced the three steps of Mirroring, Validation, and Empathy to address communication gaps regarding household responsibilities.",
    tags: [
      { icon: Heart, label: "You felt: Heard", bg: "bg-primary-container/40 text-on-primary-container" },
      { icon: Sparkles, label: "Insight: Patience", bg: "bg-secondary-container/40 text-on-secondary-container" },
    ],
    cardBg: "bg-surface-container-lowest shadow-[0_20px_40px_rgba(77,101,77,0.06)]",
  },
  {
    icon: Sun,
    iconBg: "bg-tertiary-container",
    iconColor: "text-on-tertiary-container",
    badge: "Milestone",
    badgeBg: "bg-primary-container/30 text-on-primary-container",
    title: "The Vulnerability Wall",
    date: "Oct 17, 04:00 PM",
    description: "A deep dive into past attachment styles. Both partners identified core fears and shared them without judgment.",
    tags: [
      { icon: Sun, label: "You felt: Safe", bg: "bg-tertiary-container/30 text-on-tertiary-container" },
      { icon: Sparkles, label: "Pattern: Avoidance", bg: "bg-surface-container-highest text-on-surface-variant" },
    ],
    cardBg: "bg-surface-container-low",
  },
  {
    icon: Anchor,
    iconBg: "bg-primary-dim",
    iconColor: "text-primary-container",
    badge: null,
    badgeBg: "",
    title: "Initial Assessment",
    date: "Oct 10, 02:00 PM",
    description: "The starting point. Identifying goals for the next 12 weeks and establishing the ground rules for healthy conflict resolution.",
    tags: [
      { icon: Anchor, label: "You felt: Hopeful", bg: "bg-surface-container-highest text-on-surface-variant" },
    ],
    cardBg: "bg-surface-container-low opacity-80",
  },
];

const Journey = () => {
  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="flex justify-between items-center w-full px-8 max-w-screen-xl mx-auto pt-4 bg-transparent">
        <div className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-primary" />
          <span className="font-headline text-lg font-bold italic tracking-tight text-primary">Sanctuary</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-muted-foreground font-headline font-bold text-sm">
          S
        </div>
      </header>

      <main className="max-w-screen-md mx-auto px-6 mt-12">
        {/* Hero */}
        <section className="mb-16 ml-4 md:ml-12" style={{ animation: "float-in 0.8s cubic-bezier(0.2,0.8,0.2,1)" }}>
          <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-primary mb-4 leading-tight">
            Your Shared <br />
            <span className="text-tertiary">Journey</span>
          </h1>
          <p className="text-on-surface-variant text-lg max-w-md leading-relaxed">
            Tracing the path of your connection. Each node represents a moment of growth and intentional reflection.
          </p>
        </section>

        {/* Timeline */}
        <div className="relative">
          {/* Continuous line */}
          <div
            className="absolute left-6 md:left-8 top-0 bottom-0 w-0.5 opacity-30"
            style={{ background: "linear-gradient(to bottom, hsl(var(--primary-container)) 0%, hsl(var(--tertiary-container)) 50%, hsl(var(--primary-container)) 100%)" }}
          />

          {timelineItems.map((item, i) => (
            <div key={i} className="relative flex gap-8 md:gap-12 mb-20 group" style={{ animation: `float-in 0.6s cubic-bezier(0.2,0.8,0.2,1) ${0.2 + i * 0.15}s both` }}>
              {/* Node */}
              <div className="relative z-10">
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full ${item.iconBg} flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-110`}>
                  <item.icon className={`w-6 h-6 md:w-7 md:h-7 ${item.iconColor}`} />
                </div>
              </div>

              {/* Card */}
              <div className="flex-1 pt-2">
                <div className={`${item.cardBg} rounded-xl p-8`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      {item.badge && (
                        <span className={`text-[10px] font-bold tracking-widest uppercase ${item.badgeBg} px-3 py-1 rounded-full`}>
                          {item.badge}
                        </span>
                      )}
                      <h2 className="font-headline text-2xl font-bold mt-3">{item.title}</h2>
                    </div>
                    <time className="text-sm font-medium text-on-surface-variant">{item.date}</time>
                  </div>
                  <p className="text-on-surface-variant leading-relaxed mb-6">{item.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag, j) => (
                      <span key={j} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full ${tag.bg} text-sm font-medium`}>
                        <tag.icon className="w-3.5 h-3.5" />
                        {tag.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* AI Insight */}
          <div className="relative mb-20 ml-6 md:ml-28" style={{ animation: "float-in 0.6s cubic-bezier(0.2,0.8,0.2,1) 0.8s both" }}>
            <div className="reflection-glass rounded-xl p-8 shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-10">
                <Sparkles className="w-24 h-24" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-secondary" />
                <h3 className="font-headline text-secondary font-bold tracking-tight">Reflection Insight</h3>
              </div>
              <p className="text-on-secondary-container italic text-lg leading-relaxed">
                "Your sessions show a 30% increase in 'Active Listening' tags over the last month. You are building a sanctuary of mutual understanding."
              </p>
            </div>
          </div>
        </div>

        {/* End prompt */}
        <div className="mt-12 text-center py-12 border-t border-dashed border-outline-variant/20">
          <Leaf className="w-8 h-8 text-tertiary mx-auto mb-4" />
          <h3 className="font-headline text-xl font-bold">Continue the growth</h3>
          <p className="text-on-surface-variant mt-2 mb-8">Your next milestone is scheduled for Friday.</p>
          <button className="bg-primary text-primary-foreground rounded-full px-8 py-4 font-semibold shadow-lg hover:opacity-90 transition-all flex items-center gap-2 mx-auto">
            Prepare for next session
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Journey;
