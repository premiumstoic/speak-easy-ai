import { Map, Heart, Sun, Anchor, Sparkles, ArrowRight } from "lucide-react";
import UmayLogo from "@/components/UmayLogo";
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
    cardBg: "bg-surface-container-lowest soft-shadow",
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
      { icon: Sparkles, label: "Pattern: Avoidance", bg: "bg-surface-container-high text-on-surface-variant" },
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
      { icon: Anchor, label: "You felt: Hopeful", bg: "bg-surface-container-high text-on-surface-variant" },
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
          <UmayLogo className="w-6 h-6 text-primary" />
          <span className="font-headline text-lg font-semibold italic tracking-tight text-primary">Umay</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-muted-foreground font-body font-semibold text-sm">
          S
        </div>
      </header>

      <main className="max-w-screen-md mx-auto px-6 mt-12">
        {/* Hero */}
        <section className="mb-16 ml-4 md:ml-12" style={{ animation: "float-in 0.4s ease-out" }}>
          <h1 className="font-headline text-5xl md:text-6xl font-bold tracking-tight text-primary mb-4 leading-tight">
            Your Shared <br />
            <span className="text-tertiary italic">Journey</span>
          </h1>
          <p className="text-on-surface-variant text-lg max-w-md leading-relaxed font-body">
            Tracing the path of your connection. Each node represents a moment of growth and intentional reflection.
          </p>
        </section>

        {/* Cards */}
        <div className="space-y-6">
          {timelineItems.map((item, i) => (
            <div key={i} className="group" style={{ animation: `float-in 0.4s ease-out ${0.1 + i * 0.1}s both` }}>
              <div className={`${item.cardBg} rounded-xl p-6 border border-line/40`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full ${item.iconBg} flex items-center justify-center shrink-0`}>
                    <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-headline text-lg font-semibold truncate">{item.title}</h2>
                    <time className="text-xs font-medium text-on-surface-variant font-body">{item.date}</time>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] font-semibold tracking-widest uppercase ${item.badgeBg} px-2.5 py-1 rounded-full shrink-0 font-body`}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-on-surface-variant text-sm leading-relaxed mb-4 font-body">{item.description}</p>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag, j) => (
                    <span key={j} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full ${tag.bg} text-sm font-medium font-body`}>
                      <tag.icon className="w-3.5 h-3.5" />
                      {tag.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* AI Insight */}
          <div style={{ animation: "float-in 0.4s ease-out 0.5s both" }}>
            <div className="reflection-glass rounded-xl p-8 relative overflow-hidden border border-line/30">
              <div className="absolute -right-4 -top-4 opacity-10">
                <Sparkles className="w-24 h-24" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-secondary" />
                <h3 className="font-headline text-secondary font-semibold tracking-tight">Reflection Insight</h3>
              </div>
              <p className="text-on-surface-variant italic text-lg leading-relaxed font-headline">
                "Your sessions show a 30% increase in 'Active Listening' tags over the last month. You are nurturing a deeper connection."
              </p>
            </div>
          </div>
        </div>

        {/* End prompt */}
        <div className="mt-12 text-center py-12 border-t border-line/30">
          <UmayLogo className="w-8 h-8 text-tertiary mx-auto mb-4" />
          <h3 className="font-headline text-xl font-semibold">Continue the growth</h3>
          <p className="text-on-surface-variant mt-2 mb-8 font-body">Your next milestone is scheduled for Friday.</p>
          <button className="bg-primary text-primary-foreground rounded-full px-8 py-4 font-semibold soft-shadow-lg hover:opacity-90 transition-all duration-200 flex items-center gap-2 mx-auto font-body">
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
