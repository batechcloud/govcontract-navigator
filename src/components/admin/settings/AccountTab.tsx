import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AccountTab() {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email ?? "");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const changeEmail = async () => {
    if (!email || email === user?.email) return;
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email });
    setSavingEmail(false);
    if (error) return toast.error(error.message);
    toast.success("Confirmation email sent to the new address. Click the link to confirm.");
  };

  const changePassword = async () => {
    if (pw.length < 8) return toast.error("Password must be at least 8 characters");
    if (pw !== pw2) return toast.error("Passwords do not match");
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setSavingPw(false);
    if (error) return toast.error(error.message);
    setPw("");
    setPw2("");
    toast.success("Password updated");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card className="p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold">Email address</h3>
          <p className="text-xs text-muted-foreground">
            Changing your email requires confirmation from the new address.
          </p>
        </div>
        <div>
          <Label>Email</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        </div>
        <Button onClick={changeEmail} disabled={savingEmail || email === user?.email}>
          {savingEmail && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Update email
        </Button>
      </Card>

      <Card className="p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold">Password</h3>
          <p className="text-xs text-muted-foreground">
            Choose a strong password — at least 8 characters.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>New password</Label>
            <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
          </div>
          <div>
            <Label>Confirm new password</Label>
            <Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </div>
        </div>
        <Button onClick={changePassword} disabled={savingPw || !pw}>
          {savingPw && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Update password
        </Button>
      </Card>
    </div>
  );
}
