import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import UmayLogo from "@/components/UmayLogo";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  // Redirect once AuthContext confirms the user is authenticated.
  // This is the correct pattern: let onAuthStateChange update the context
  // first, then navigate — avoids ProtectedRoute seeing user=null on the
  // first render after signInWithPassword resolves.
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    }
    // Navigation is handled by the useEffect above once AuthContext updates.
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast({ title: "Google login failed", description: String(result.error), variant: "destructive" });
      setLoading(false);
    }
    // For OAuth redirect flows, the page navigates away automatically.
    // For popup flows, the useEffect above handles navigation.
  };

  return (
    <div className="h-[100dvh] bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-10">
          <UmayLogo className="w-8 h-8 text-primary" />
          <span className="font-headline text-2xl font-semibold italic tracking-tight text-primary">Umay</span>
        </div>

        <h1 className="font-headline text-2xl font-bold text-center mb-8">Welcome back</h1>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-full bg-surface-container-high text-on-surface font-body font-medium text-sm hover:bg-surface-container-highest transition-colors mb-6"
        >
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-line" />
          <span className="text-xs text-muted-foreground font-body">or</span>
          <div className="flex-1 h-px bg-line" />
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full px-5 py-3.5 rounded-2xl bg-surface-container text-on-surface font-body text-sm placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required
            className="w-full px-5 py-3.5 rounded-2xl bg-surface-container text-on-surface font-body text-sm placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-full bg-gradient-to-br from-primary to-primary-dim text-primary-foreground font-body font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <Link to="/forgot-password" className="text-sm text-primary font-body hover:underline block">Forgot password?</Link>
          <p className="text-sm text-muted-foreground font-body">
            Don't have an account? <Link to="/signup" className="text-primary hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
