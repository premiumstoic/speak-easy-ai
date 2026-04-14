import { Bell, Brain, Calendar } from "lucide-react";

interface InsightCardProps {
  type: "notification" | "question" | "reminder";
  title: string;
  body: string;
  action?: string;
  progress?: number;
}

const typeConfig = {
  notification: { icon: Bell, label: "Notification", bgClass: "bg-surface-container-low" },
  question: { icon: Brain, label: "Deep Question", bgClass: "reflection-glass" },
  reminder: { icon: Calendar, label: "Reminder", bgClass: "bg-tertiary-container/20" },
};

export function InsightCard({ type, title, body, action, progress }: InsightCardProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className={`snap-center shrink-0 w-[300px] ${config.bgClass} rounded-xl p-7 flex flex-col justify-between gap-4`}>
      <div>
        <div className="flex items-center gap-2 mb-5">
          <Icon className={`w-4 h-4 ${type === "question" ? "text-on-secondary-container" : type === "reminder" ? "text-tertiary" : "text-primary"}`} />
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            {config.label}
          </span>
        </div>
        <p className="text-base font-medium leading-relaxed">{body}</p>
      </div>

      {progress !== undefined && (
        <div className="bg-white/40 p-3 rounded-lg">
          <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground mb-1.5">
            <span>PREPARATION</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-tertiary/10 rounded-full overflow-hidden">
            <div className="h-full bg-tertiary rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {action && (
        <button className="w-full py-3.5 bg-surface-container-lowest text-foreground font-semibold rounded-full hover:bg-white transition-colors text-sm">
          {action}
        </button>
      )}
    </div>
  );
}
