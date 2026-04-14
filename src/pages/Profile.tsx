import { useNavigate } from "react-router-dom";
import { Heart, Clock, Shield, LogOut, Sparkles, User, Settings, ChevronRight } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useState } from "react";

const Profile = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [privacy, setPrivacy] = useState(true);

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="pt-6 px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-headline text-2xl font-bold tracking-tight">Me</h1>
          <button className="p-2 rounded-full bg-surface-container-high text-on-surface-variant">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-surface-container-low rounded-xl p-6 mb-4">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="font-headline text-xl font-bold">Sarah</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <Heart className="w-3.5 h-3.5 text-secondary fill-secondary" />
                <span className="text-on-surface-variant text-sm font-medium">Linked with Tom</span>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex gap-3">
            <div className="flex-1 bg-surface-container-lowest rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-primary font-headline">4</p>
              <p className="text-on-surface-variant text-xs mt-0.5">Sessions</p>
            </div>
            <div className="flex-1 bg-surface-container-lowest rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-tertiary font-headline">2<span className="text-sm font-medium ml-0.5">wk</span></p>
              <p className="text-on-surface-variant text-xs mt-0.5">Streak</p>
            </div>
            <div className="flex-1 bg-surface-container-lowest rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-secondary font-headline">87%</p>
              <p className="text-on-surface-variant text-xs mt-0.5">Harmony</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 mt-6 space-y-6">
        {/* AI Insight */}
        <div className="reflection-glass rounded-xl p-5">
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-on-surface mb-1">Reflection Insight</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                You and Tom have maintained a 2-week streak. Your evening reflections are building a stronger emotional safety net.
              </p>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <section>
          <h3 className="font-headline text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">Preferences</h3>
          <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_10px_30px_rgba(77,101,77,0.04)]">
            <ToggleRow
              label="Insight Notifications"
              description="AI-powered reflections from patterns"
              checked={notifications}
              onChange={setNotifications}
            />
            <ToggleRow
              label="Therapy Reminders"
              description="Daily emotional check-in nudges"
              checked={reminders}
              onChange={setReminders}
              border
            />
            <ToggleRow
              label="Data Privacy"
              description="End-to-end encryption for sessions"
              checked={privacy}
              onChange={setPrivacy}
              border
            />
          </div>
        </section>

        {/* Menu Items */}
        <section>
          <h3 className="font-headline text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">Account</h3>
          <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_10px_30px_rgba(77,101,77,0.04)]">
            <MenuItem icon={<Heart className="w-5 h-5" />} label="Relationship" />
            <MenuItem icon={<Clock className="w-5 h-5" />} label="Session History" border />
            <MenuItem icon={<Shield className="w-5 h-5" />} label="Privacy & Export" border />
          </div>
        </section>

        {/* Sign Out */}
        <button className="w-full flex items-center justify-center gap-2 py-3 text-error font-semibold text-sm rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </main>

      <BottomNav />
    </div>
  );
};

function ToggleRow({ label, description, checked, onChange, border }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  border?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between p-5 ${border ? "border-t border-outline-variant/10" : ""}`}>
      <div className="pr-4">
        <p className="font-semibold text-on-surface text-sm">{label}</p>
        <p className="text-on-surface-variant text-xs mt-0.5 leading-relaxed">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-7 rounded-full transition-colors duration-300 shrink-0 ${
          checked ? "bg-primary" : "bg-surface-container-highest"
        }`}
      >
        <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-sm ${
          checked ? "translate-x-5" : ""
        }`} />
      </button>
    </div>
  );
}

function MenuItem({ icon, label, border }: { icon: React.ReactNode; label: string; border?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-4 p-5 text-on-surface hover:bg-surface-container-low transition-colors ${border ? "border-t border-outline-variant/10" : ""}`}>
      <span className="text-on-surface-variant">{icon}</span>
      <span className="font-medium text-sm flex-1 text-left">{label}</span>
      <ChevronRight className="w-4 h-4 text-on-surface-variant" />
    </button>
  );
}

export default Profile;
