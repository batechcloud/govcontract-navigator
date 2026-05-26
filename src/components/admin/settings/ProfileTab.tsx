import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function ProfileTab() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const [first, setFirst] = useState(profile?.first_name ?? "");
  const [last, setLast] = useState(profile?.last_name ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const initials = `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || user?.email?.[0]?.toUpperCase() || "A";

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ first_name: first.trim() || null, last_name: last.trim() || null })
      .eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    qc.invalidateQueries({ queryKey: ["profile"] });
  };

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) return toast.error("Max 2MB");
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      setUploading(false);
      return toast.error(error.message);
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: pub.publicUrl }).eq("id", user.id);
    setUploading(false);
    toast.success("Avatar updated");
    qc.invalidateQueries({ queryKey: ["profile"] });
  };

  return (
    <Card className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Avatar className="w-20 h-20 border border-border/60">
          <AvatarImage src={profile?.avatar_url ?? undefined} />
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <Label htmlFor="avatar" className="cursor-pointer">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border/60 text-sm hover:bg-muted">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Change avatar
            </div>
            <input id="avatar" type="file" accept="image/*" className="hidden" onChange={onAvatar} />
          </Label>
          <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>First name</Label>
          <Input value={first} onChange={(e) => setFirst(e.target.value)} />
        </div>
        <div>
          <Label>Last name</Label>
          <Input value={last} onChange={(e) => setLast(e.target.value)} />
        </div>
      </div>

      <div>
        <Label>Email</Label>
        <Input value={user?.email ?? ""} disabled />
        <p className="text-xs text-muted-foreground mt-1">Change your email from the Account tab.</p>
      </div>

      <Button onClick={save} disabled={saving}>
        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Save changes
      </Button>
    </Card>
  );
}
