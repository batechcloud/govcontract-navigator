import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Lock, Mail, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/usePageTitle";

const AdminLogin = () => {
  usePageTitle("Admin Sign In");
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const handleInvite = async () => {
    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-invite", {
        body: { email: inviteEmail, redirect_to: `${window.location.origin}/admin/login` },
      });
      if (error || data?.error) {
        toast.error("Invite failed", { description: data?.error || error?.message });
      } else {
        toast.success(data.message || "Invite sent");
        setInviteEmail("");
      }
    } catch (err: any) {
      toast.error("Invite failed", { description: err?.message });
    } finally {
      setInviting(false);
    }
  };

  // If already signed in AND admin, jump straight to console
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: session.user.id });
      if (isAdmin) navigate("/admin", { replace: true });
    })();
  }, [navigate]);

  const auditLogin = async (success: boolean, stage?: "password" | "allowlist", reason?: string) => {
    try {
      await supabase.functions.invoke("admin-audit-login", {
        body: { email, success, stage, reason },
      });
    } catch { /* never block sign-in on audit failure */ }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) {
        await auditLogin(false, "password", error?.message || "Invalid credentials");
        toast.error("Invalid credentials");
        setLoading(false);
        return;
      }

      // Sync the allowlist from ADMIN_EMAILS secret and check this user
      const { data: syncRes, error: syncErr } = await supabase.functions.invoke(
        "admin-sync-allowlist",
        { body: {} },
      );

      if (syncErr || !syncRes?.is_admin) {
        await auditLogin(false, "allowlist", syncErr?.message || "Not in ADMIN_EMAILS");
        await supabase.auth.signOut();
        toast.error("Access denied", {
          description: "This account is not authorized for admin access.",
        });
        setLoading(false);
        return;
      }

      await auditLogin(true);
      toast.success("Welcome, admin");
      navigate("/admin", { replace: true });
    } catch (err: any) {
      await auditLogin(false, "password", err?.message);
      toast.error("Sign-in failed", { description: err?.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-heading font-bold text-2xl text-foreground">
            Admin <span className="gradient-text-gold">Console</span>
          </span>
        </div>

        <Card variant="glass" className="glow-primary">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">Restricted Access</CardTitle>
            <CardDescription>
              Sign in with an authorized admin account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@company.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                {loading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <>
                    Enter Console
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border space-y-3">
              <p className="text-xs text-muted-foreground">
                No account yet? Send yourself an invite email — only addresses
                in the ADMIN_EMAILS allowlist are accepted.
              </p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="admin@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleInvite}
                  disabled={inviting || !inviteEmail}
                >
                  {inviting ? (
                    <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  ) : (
                    "Send invite"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
