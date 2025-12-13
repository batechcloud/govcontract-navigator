import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { User, Bell, Shield, CreditCard, Moon, Sun, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

export default function Settings() {
  const { signOut } = useAuth();
  const { data: profile } = useProfile();

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

            <TabsContent value="profile">
              <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6 space-y-6">
                <h3 className="font-semibold text-foreground">Personal Information</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" defaultValue={profile?.first_name || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue={profile?.last_name || ""} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" disabled placeholder="your@email.com" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  Save Changes
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="notifications">
              <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6 space-y-6">
                <h3 className="font-semibold text-foreground">Notification Preferences</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">New Opportunity Matches</p>
                      <p className="text-sm text-muted-foreground">Get notified when new contracts match your profile</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Deadline Reminders</p>
                      <p className="text-sm text-muted-foreground">Receive reminders before response deadlines</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Weekly Digest</p>
                      <p className="text-sm text-muted-foreground">Receive a weekly summary of opportunities</p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Competitor Activity</p>
                      <p className="text-sm text-muted-foreground">Get alerts about tracked competitor wins</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  Save Preferences
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="security">
              <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6 space-y-6">
                <h3 className="font-semibold text-foreground">Security Settings</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                </div>

                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  Update Password
                </Button>

                <div className="border-t border-border/50 pt-6">
                  <h4 className="font-medium text-foreground mb-4">Danger Zone</h4>
                  <Button 
                    variant="destructive" 
                    onClick={signOut}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </TabsContent>

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
