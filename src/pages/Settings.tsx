import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { User, Bell, Shield, CreditCard, Camera, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Settings() {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  const initials = `${(firstName?.[0] || "").toUpperCase()}${(lastName?.[0] || "").toUpperCase()}` || "U";

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please choose an image under 2MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Append cache-buster
      const url = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setAvatarUrl(url);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Avatar updated!", description: "Your profile picture has been changed." });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
        })
        .eq("id", user.id);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Profile saved!", description: "Your information has been updated." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast({ title: "Too short", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Mismatch", description: "Passwords do not match.", variant: "destructive" });
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Password updated!", description: "Your password has been changed successfully." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <DashboardLayout title="Settings">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl font-bold text-foreground mb-6">Account Settings</h2>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="bg-card/50 border border-border/50">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Billing
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6 space-y-8">
                {/* Avatar Section */}
                <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
                  <div className="relative group">
                    <Avatar className="h-24 w-24 border-2 border-border">
                      <AvatarImage src={avatarUrl || ""} alt="Profile" />
                      <AvatarFallback className="bg-primary/20 text-primary text-2xl font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="absolute inset-0 rounded-full bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      {uploading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-foreground" />
                      ) : (
                        <Camera className="w-6 h-6 text-foreground" />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="font-semibold text-foreground text-lg">
                      {firstName || lastName ? `${firstName} ${lastName}`.trim() : "Your Name"}
                    </h3>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm text-primary hover:text-primary/80 mt-2 transition-colors"
                    >
                      {uploading ? "Uploading..." : "Change photo"}
                    </button>
                  </div>
                </div>

                {/* Name Fields */}
                <div>
                  <h3 className="font-semibold text-foreground mb-4">Personal Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" disabled value={user?.email || ""} />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                <Button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  {savingProfile ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                  ) : (
                    <><Check className="w-4 h-4 mr-2" /> Save Changes</>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6 space-y-6">
                <h3 className="font-semibold text-foreground">Notification Preferences</h3>

                <div className="space-y-4">
                  {[
                    { title: "New Opportunity Matches", desc: "Get notified when new contracts match your profile", defaultOn: true },
                    { title: "Deadline Reminders", desc: "Receive reminders before response deadlines", defaultOn: true },
                    { title: "Weekly Digest", desc: "Receive a weekly summary of opportunities", defaultOn: false },
                    { title: "Competitor Activity", desc: "Get alerts about tracked competitor wins", defaultOn: true },
                  ].map((item) => (
                    <div key={item.title} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch defaultChecked={item.defaultOn} />
                    </div>
                  ))}
                </div>

                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  Save Preferences
                </Button>
              </div>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6 space-y-6">
                <h3 className="font-semibold text-foreground">Change Password</h3>

                <div className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={changingPassword || !newPassword}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  {changingPassword ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...</>
                  ) : (
                    "Update Password"
                  )}
                </Button>

                <div className="border-t border-border/50 pt-6">
                  <h4 className="font-medium text-foreground mb-2">Account</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Sign out of your account on this device.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={signOut}
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing">
              <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6 space-y-6">
                <h3 className="font-semibold text-foreground">Subscription & Billing</h3>

                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground">Current Plan</span>
                    <span className="text-primary font-semibold">Starter</span>
                  </div>
                  <p className="text-sm text-muted-foreground">$49/month • Renews on Jan 13, 2025</p>
                </div>

                <div className="space-y-4">
                  <Button variant="outline" className="w-full">
                    Upgrade to Professional
                  </Button>
                  <Button variant="ghost" className="w-full text-muted-foreground">
                    View Billing History
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
