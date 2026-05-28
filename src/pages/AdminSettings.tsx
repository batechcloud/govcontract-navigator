import { Settings as SettingsIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminRole } from "@/hooks/useAdminRole";
import { ProfileTab } from "@/components/admin/settings/ProfileTab";
import { AccountTab } from "@/components/admin/settings/AccountTab";
import { SecurityTab } from "@/components/admin/settings/SecurityTab";
import { TeamTab } from "@/components/admin/settings/TeamTab";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function AdminSettings() {
  usePageTitle("Admin Settings");
  const { data: role } = useAdminRole();
  const isSuper = role === "admin";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground flex items-center gap-2">
          <SettingsIcon className="w-7 h-7 text-primary" /> Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your admin profile, account credentials, and team.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          {isSuper && <TabsTrigger value="team">Team</TabsTrigger>}
        </TabsList>
        <TabsContent value="profile" className="mt-6"><ProfileTab /></TabsContent>
        <TabsContent value="account" className="mt-6"><AccountTab /></TabsContent>
        <TabsContent value="security" className="mt-6"><SecurityTab /></TabsContent>
        {isSuper && (
          <TabsContent value="team" className="mt-6"><TeamTab /></TabsContent>
        )}
      </Tabs>
    </div>
  );
}
