import { useNavigate, useLocation } from "react-router-dom";
import { Map, Mic, User } from "lucide-react";

const navItems = [
  { icon: Map, label: "Journey", path: "/journey" },
  { icon: User, label: "Profile", path: "/profile" },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-6 left-0 right-0 z-50 flex justify-center">
      <div className="w-[90%] max-w-md rounded-full px-6 py-3 glass-nav shadow-[0_20px_40px_rgba(77,101,77,0.06)] flex justify-around items-center">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path || (path === "/journey" && location.pathname === "/");
          return (
            <button
              key={path}
              onClick={() => navigate(path === "/journey" ? "/" : path)}
              className={`p-4 rounded-full transition-all duration-300 ${
                isActive
                  ? "bg-primary-container text-on-primary-container scale-110 shadow-lg"
                  : "text-muted-foreground hover:bg-surface-container-high"
              }`}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
