import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import UmayLogo from "@/components/UmayLogo";
import { useToast } from "@/hooks/use-toast";
import { Heart, Users, Copy, Check, ArrowRight } from "lucide-react";

type Step = "name" | "choice" | "create" | "join";

const Onboarding = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>(
    profile?.display_name ? "choice" : "name"
  );
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [inviteCode, setInviteCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() })
      .eq("id", user.id);
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      await refreshProfile();
      setStep("choice");
    }
  };

  const handleCreateCouple = async () => {
    if (!user) return;
    setLoading(true);

    // Create couple with this user as partner_a
    const { data: couple, error: coupleErr } = await supabase
      .from("couples")
      .insert({ partner_a: user.id })
      .select("id")
      .single();

    if (coupleErr || !couple) {
      toast({ title: "Error", description: coupleErr?.message || "Failed to create couple", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Update profile with couple_id
    await supabase.from("profiles").update({ couple_id: couple.id }).eq("id", user.id);

    // Generate 6-char invite code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { error: inviteErr } = await supabase.from("couple_invites").insert({
      couple_id: couple.id,
      invited_by: user.id,
      invite_code: code,
    });

    setLoading(false);

    if (inviteErr) {
      toast({ title: "Error", description: inviteErr.message, variant: "destructive" });
      return;
    }

    setGeneratedCode(code);
    setStep("create");
  };

  const handleJoinCouple = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const trimmedCode = inviteCode.trim().toUpperCase();

    // Find pending invite
    const { data: invite, error: findErr } = await supabase
      .from("couple_invites")
      .select("id, couple_id, invited_by")
      .eq("invite_code", trimmedCode)
      .eq("status", "pending")
      .single();

    if (findErr || !invite) {
      toast({ title: "Invalid code", description: "This invite code is invalid or has already been used.", variant: "destructive" });
      setLoading(false);
      return;
    }

    if (invite.invited_by === user.id) {
      toast({ title: "Can't join", description: "You can't use your own invite code.", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Update couple with partner_b
    const { error: coupleErr } = await supabase
      .from("couples")
      .update({ partner_b: user.id })
      .eq("id", invite.couple_id);

    if (coupleErr) {
      toast({ title: "Error", description: coupleErr.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Update this user's profile
    await supabase.from("profiles").update({ couple_id: invite.couple_id }).eq("id", user.id);

    // Mark invite as accepted
    await supabase.from("couple_invites").update({ status: "accepted" as const }).eq("id", invite.id);

    await refreshProfile();
    setLoading(false);
    toast({ title: "You're connected!", description: "Welcome to your shared space." });
    navigate("/");
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDoneSharing = async () => {
    await refreshProfile();
    navigate("/");
  };

  return (
    <div className="h-[100dvh] bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-10">
          <UmayLogo className="w-8 h-8 text-primary" />
          <span className="font-headline text-2xl font-semibold italic tracking-tight text-primary">Umay</span>
        </div>

        {/* Step: Name */}
        {step === "name" && (
          <>
            <h1 className="font-headline text-2xl font-bold text-center mb-3">What should we call you?</h1>
            <p className="text-muted-foreground font-body text-sm text-center mb-8">
              This is how your partner will see you.
            </p>
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                autoFocus
                className="w-full px-5 py-3.5 rounded-2xl bg-surface-container text-on-surface font-body text-sm placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
              <button
                type="submit"
                disabled={loading || !displayName.trim()}
                className="w-full py-3.5 rounded-full bg-gradient-to-br from-primary to-primary-dim text-primary-foreground font-body font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </>
        )}

        {/* Step: Choice */}
        {step === "choice" && (
          <>
            <h1 className="font-headline text-2xl font-bold text-center mb-3">Connect with your partner</h1>
            <p className="text-muted-foreground font-body text-sm text-center mb-8">
              Umay works best as a shared space for two.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleCreateCouple}
                disabled={loading}
                className="w-full p-5 rounded-3xl bg-surface-container-low hover:bg-surface-container transition-colors text-left flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-body font-semibold text-on-surface text-sm">Create a couple</p>
                  <p className="font-body text-xs text-on-surface-variant mt-1">
                    Generate an invite code to share with your partner
                  </p>
                </div>
              </button>

              <button
                onClick={() => setStep("join")}
                disabled={loading}
                className="w-full p-5 rounded-3xl bg-surface-container-low hover:bg-surface-container transition-colors text-left flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="font-body font-semibold text-on-surface text-sm">Join your partner</p>
                  <p className="font-body text-xs text-on-surface-variant mt-1">
                    Enter the invite code your partner shared with you
                  </p>
                </div>
              </button>
            </div>
          </>
        )}

        {/* Step: Create — show code */}
        {step === "create" && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center mx-auto mb-6">
              <Heart className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-headline text-2xl font-bold mb-3">Share this code</h1>
            <p className="text-muted-foreground font-body text-sm mb-8">
              Send this code to your partner so they can join you on Umay.
            </p>

            <div className="bg-surface-container rounded-2xl p-6 mb-6">
              <p className="font-mono text-3xl font-bold tracking-[0.3em] text-on-surface">{generatedCode}</p>
            </div>

            <button
              onClick={copyCode}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-surface-container-high text-on-surface font-body font-medium text-sm hover:bg-surface-container-highest transition-colors mb-8"
            >
              {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy code"}
            </button>

            <button
              onClick={handleDoneSharing}
              className="w-full py-3.5 rounded-full bg-gradient-to-br from-primary to-primary-dim text-primary-foreground font-body font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Done — go to Umay
            </button>
          </div>
        )}

        {/* Step: Join — enter code */}
        {step === "join" && (
          <>
            <h1 className="font-headline text-2xl font-bold text-center mb-3">Enter invite code</h1>
            <p className="text-muted-foreground font-body text-sm text-center mb-8">
              Ask your partner for the 6-character code.
            </p>
            <form onSubmit={handleJoinCouple} className="space-y-4">
              <input
                type="text"
                placeholder="e.g. A3F7K2"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase().slice(0, 6))}
                required
                maxLength={6}
                autoFocus
                className="w-full px-5 py-3.5 rounded-2xl bg-surface-container text-on-surface font-body text-lg text-center font-mono tracking-[0.2em] placeholder:text-on-surface-variant/50 placeholder:font-body placeholder:text-sm placeholder:tracking-normal outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
              <button
                type="submit"
                disabled={loading || inviteCode.length < 6}
                className="w-full py-3.5 rounded-full bg-gradient-to-br from-primary to-primary-dim text-primary-foreground font-body font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "Joining…" : "Join couple"}
              </button>
            </form>
            <button
              onClick={() => setStep("choice")}
              className="mt-4 w-full text-center text-sm text-primary font-body hover:underline"
            >
              Back
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
