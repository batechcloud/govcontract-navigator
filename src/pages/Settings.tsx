import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { User, Bell, Shield, CreditCard, Camera, Loader2, Check, Crown, ExternalLink, Download, FileText, Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function Settings() {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: subscription } = useSubscription();
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
  const [savingNotifs, setSavingNotifs] = useState(false);

  // Notification preferences state
  const notifPrefs = (profile?.notification_preferences as Record<string, unknown>) || {};
  const [notifOpportunities, setNotifOpportunities] = useState<boolean>(() => notifPrefs.opportunities !== false);
  const [notifDeadlines, setNotifDeadlines] = useState<boolean>(() => notifPrefs.deadlines !== false);
  const [notifDigest, setNotifDigest] = useState<boolean>(() => notifPrefs.digest === true);
  const [notifCompetitors, setNotifCompetitors] = useState<boolean>(() => notifPrefs.competitors !== false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setAvatarUrl(profile.avatar_url);
      const prefs = (profile.notification_preferences as Record<string, unknown>) || {};
      setNotifOpportunities(prefs.opportunities !== false);
      setNotifDeadlines(prefs.deadlines !== false);
      setNotifDigest(prefs.digest === true);
      setNotifCompetitors(prefs.competitors !== false);
    }
  }, [profile]);

  const initials = `${(firstName?.[0] || "").toUpperCase()}${(lastName?.[0] || "").toUpperCase()}` || "U";

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File too large", { description: "Please choose an image under 2MB." });
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

      const url = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setAvatarUrl(url);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Avatar updated!", { description: "Your profile picture has been changed." });
    } catch (error: any) {
      toast.error("Upload failed", { description: error.message });
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
      toast.success("Profile saved!", { description: "Your information has been updated." });
    } catch (error: any) {
      toast.error("Error", { description: error.message });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast.error("Too short", { description: "Password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mismatch", { description: "Passwords do not match." });
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated!", { description: "Your password has been changed successfully." });
    } catch (error: any) {
      toast.error("Error", { description: error.message });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!user) return;
    setSavingNotifs(true);
    try {
      // Merge into existing preferences rather than overwrite — Onboarding
      // writes a different shape (email_frequency, quiet_hours_*) into this
      // same JSON column, and a plain UPDATE would clobber it.
      const { data: cur } = await supabase
        .from("profiles")
        .select("notification_preferences")
        .eq("id", user.id)
        .maybeSingle();
      const merged = {
        ...(cur?.notification_preferences as Record<string, unknown> | null ?? {}),
        opportunities: notifOpportunities,
        deadlines: notifDeadlines,
        digest: notifDigest,
        competitors: notifCompetitors,
      };
      const { error } = await supabase
        .from("profiles")
        .update({ notification_preferences: merged })
        .eq("id", user.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Preferences saved!", { description: "Your notification settings have been updated." });
    } catch (error: any) {
      toast.error("Error", { description: error.message });
    } finally {
      setSavingNotifs(false);
    }
  };


  return (
    <DashboardLayout title="Settings">
      <PageContainer variant="default" animate={false}>
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
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">New Opportunity Matches</p>
                      <p className="text-sm text-muted-foreground">Get notified when new contracts match your profile</p>
                    </div>
                    <Switch checked={notifOpportunities} onCheckedChange={setNotifOpportunities} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Deadline Reminders</p>
                      <p className="text-sm text-muted-foreground">Receive reminders before response deadlines</p>
                    </div>
                    <Switch checked={notifDeadlines} onCheckedChange={setNotifDeadlines} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Weekly Digest</p>
                      <p className="text-sm text-muted-foreground">Receive a weekly summary of opportunities</p>
                    </div>
                    <Switch checked={notifDigest} onCheckedChange={setNotifDigest} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Competitor Activity</p>
                      <p className="text-sm text-muted-foreground">Get alerts about tracked competitor wins</p>
                    </div>
                    <Switch checked={notifCompetitors} onCheckedChange={setNotifCompetitors} />
                  </div>
                </div>

                <Button
                  onClick={handleSaveNotifications}
                  disabled={savingNotifs}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  {savingNotifs ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                  ) : (
                    <><Check className="w-4 h-4 mr-2" /> Save Preferences</>
                  )}
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
                  <Button variant="destructive" onClick={signOut}>
                    Sign Out
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing">
              <div className="space-y-6">
                {/* Account Status Card */}
                <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Crown className="w-5 h-5 text-accent" />
                      Account Status
                    </h3>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-success/20 text-success border border-success/30">
                      Active
                    </span>
                  </div>
                </div>

                {/* Payment Method Card */}
                <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary" />
                      Payment Method
                    </h3>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-muted/20 border border-border/30 rounded-lg">
                    <div className="w-12 h-8 bg-gradient-to-br from-primary/30 to-primary/10 rounded flex items-center justify-center border border-primary/20">
                      <CreditCard className="w-5 h-3.5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">No payment method on file</p>
                      <p className="text-xs text-muted-foreground/70">Add a payment method to subscribe to a paid plan</p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => toast.info("Stripe integration required", { description: "Payment method management will be available once Stripe is connected." })}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Update Payment Method
                  </Button>
                </div>

                {/* Billing History / Invoices */}
                <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Billing History
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toast.info("Stripe integration required", { description: "Full billing portal will be available once Stripe is connected." })}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Manage Billing
                    </Button>
                  </div>

                  {/* Invoice Table */}
                  <div className="border border-border/30 rounded-lg overflow-hidden">
                    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-3 bg-muted/10 border-b border-border/30 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <span>Date</span>
                      <span>Amount</span>
                      <span>Status</span>
                      <span>Invoice</span>
                    </div>

                    {/* Empty state */}
                    <div className="px-4 py-10 text-center">
                      <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No invoices yet</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Your payment history will appear here once you subscribe to a paid plan
                      </p>
                    </div>
                  </div>
                </div>

                {/* Billing Support */}
                <div className="bg-muted/10 border border-border/30 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Need help with billing?</p>
                    <p className="text-xs text-muted-foreground">Contact our support team for any billing questions</p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a href="mailto:support@gcnavigator.com">
                      Contact Support
                    </a>
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </PageContainer>
    </DashboardLayout>
  );
}
