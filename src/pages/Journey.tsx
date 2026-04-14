import { useRef, useState, useEffect, useCallback } from "react";
import { Map, Heart, Sun, Anchor, Sparkles, ArrowUp } from "lucide-react";
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
    description:
      "Practiced the three steps of Mirroring, Validation, and Empathy to address communication gaps regarding household responsibilities.",
    tags: [
      { icon: Heart, label: "You felt: Heard", bg: "bg-primary-container/40 text-on-primary-container" },
      { icon: Sparkles, label: "Insight: Patience", bg: "bg-secondary-container/40 text-on-secondary-container" },
    ],
    insight:
      "Your sessions show a 30% increase in 'Active Listening' tags over the last month. You are nurturing a deeper connection.",
  },
  {
    icon: Sun,
    iconBg: "bg-tertiary-container",
    iconColor: "text-on-tertiary-container",
    badge: "Milestone",
    badgeBg: "bg-primary-container/30 text-on-primary-container",
    title: "The Vulnerability Wall",
    date: "Oct 17, 04:00 PM",
    description:
      "A deep dive into past attachment styles. Both partners identified core fears and shared them without judgment.",
    tags: [
      { icon: Sun, label: "You felt: Safe", bg: "bg-tertiary-container/30 text-on-tertiary-container" },
      { icon: Sparkles, label: "Pattern: Avoidance", bg: "bg-surface-container-high text-on-surface-variant" },
    ],
    insight: null,
  },
  {
    icon: Anchor,
    iconBg: "bg-primary-dim",
    iconColor: "text-primary-container",
    badge: null,
    badgeBg: "",
    title: "Initial Assessment",
    date: "Oct 10, 02:00 PM",
    description:
      "The starting point. Identifying goals for the next 12 weeks and establishing the ground rules for healthy conflict resolution.",
    tags: [
      { icon: Anchor, label: "You felt: Hopeful", bg: "bg-surface-container-high text-on-surface-variant" },
    ],
    insight: null,
  },
];

const Journey = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Track which card is centered
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const viewportH = container.clientHeight;
    const centerY = scrollTop + viewportH / 2;

    // Find the card whose center is closest to the viewport center
    const cards = container.querySelectorAll<HTMLDivElement>("[data-card-index]");
    let closest = 0;
    let minDist = Infinity;
    cards.forEach((card) => {
      const idx = Number(card.dataset.cardIndex);
      const cardCenter = card.offsetTop + card.offsetHeight / 2;
      const dist = Math.abs(cardCenter - centerY);
      if (dist < minDist) {
        minDist = dist;
        closest = idx;
      }
    });

    setActiveIndex(closest);
    // Show "scroll to latest" button when NOT on the first card (latest session)
    setShowScrollTop(closest !== 0);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollToLatest = () => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Snap-scroll container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto snap-y snap-mandatory"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {timelineItems.map((item, i) => (
          <div
            key={i}
            data-card-index={i}
            className="snap-start h-screen w-full flex flex-col"
            style={{ scrollSnapAlign: "start" }}
          >
            {/* Full-screen card content */}
            <div className="flex-1 flex flex-col justify-center px-6 pb-24 pt-14 max-w-lg mx-auto w-full">
              {/* Session number indicator */}
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-full ${item.iconBg} flex items-center justify-center`}>
                  <item.icon className={`w-6 h-6 ${item.iconColor}`} />
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-semibold tracking-widest uppercase ${item.badgeBg} px-3 py-1.5 rounded-full font-body`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Title & date */}
              <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2 leading-tight">
                {item.title}
              </h1>
              <time className="text-sm font-medium text-on-surface-variant font-body mb-8">
                {item.date}
              </time>

              {/* Description */}
              <p className="text-on-surface-variant text-base leading-relaxed font-body mb-8">
                {item.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-8">
                {item.tags.map((tag, j) => (
                  <span
                    key={j}
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full ${tag.bg} text-sm font-medium font-body`}
                  >
                    <tag.icon className="w-3.5 h-3.5" />
                    {tag.label}
                  </span>
                ))}
              </div>

              {/* AI Insight (only on cards that have one) */}
              {item.insight && (
                <div className="bg-surface-container-low rounded-2xl p-6 border border-line/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-secondary" />
                    <span className="text-xs font-semibold text-secondary font-body uppercase tracking-wider">
                      Reflection
                    </span>
                  </div>
                  <p className="text-on-surface-variant italic text-sm leading-relaxed font-headline">
                    "{item.insight}"
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
        {timelineItems.map((_, i) => (
          <div
            key={i}
            className={`w-1.5 rounded-full transition-all duration-200 ${
              i === activeIndex ? "h-6 bg-primary" : "h-1.5 bg-on-surface-variant/30"
            }`}
          />
        ))}
      </div>

      {/* Scroll to latest button */}
      <div
        className={`absolute right-4 bottom-24 z-20 transition-all duration-200 ${
          showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <button
          onClick={scrollToLatest}
          className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center soft-shadow-lg"
          aria-label="Scroll to latest session"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Journey;
