import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import UmayLogo from "@/components/UmayLogo";
import { useToast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="h-[100dvh] bg-background flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <UmayLogo className="w-10 h-10 text-primary mx-auto mb-6" />
          <h1 className="font-headline text-2xl font-bold mb-4">Check your email</h1>
          <p className="text-muted-foreground font-body text-sm mb-8">
            We sent a password reset link to <strong className="text-foreground">{email}</strong>.
          </p>
          <Link to="/login" className="text-sm text-primary font-body hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-10">
          <UmayLogo className="w-8 h-8 text-primary" />
          <span className="font-headline text-2xl font-semibold italic tracking-tight text-primary">Umay</span>
        </div>

        <h1 className="font-headline text-2xl font-bold text-center mb-3">Reset password</h1>
        <p className="text-muted-foreground font-body text-sm text-center mb-8">
          Enter your email and we'll send a reset link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-5 py-3.5 rounded-2xl bg-surface-container text-on-surface font-body text-sm placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-gradient-to-br from-primary to-primary-dim text-primary-foreground font-body font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground font-body">
          <Link to="/login" className="text-primary hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
