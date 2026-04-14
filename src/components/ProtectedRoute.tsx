import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-[100dvh] bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Profile fetch is still in flight (user is set but profile hasn't resolved yet).
  // Show spinner instead of rendering children with null profile or bouncing to onboarding.
  if (!profile) {
    return (
      <div className="h-[100dvh] bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // If user has no couple yet, redirect to onboarding
  if (!profile.couple_id) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
