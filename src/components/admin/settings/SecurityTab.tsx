import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

export function SecurityTab() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: events = [] } = useQuery({
    queryKey: ["admin-self-audit", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sync_audit_log")
        .select("id, action, created_at, details")
        .eq("actor_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(15);
      if (error) throw error;
      return data ?? [];
    },
  });

  const signOutAll = async () => {
    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) return toast.error(error.message);
    toast.success("Signed out of all devices");
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Card className="p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold">Sessions</h3>
          <p className="text-xs text-muted-foreground">
            Sign out everywhere if you suspect your account is compromised.
          </p>
        </div>
        <Button variant="destructive" onClick={signOutAll}>
          <LogOut className="w-4 h-4 mr-2" /> Sign out of all sessions
        </Button>
      </Card>

      <Card className="p-6">
        <h3 className="text-base font-semibold mb-3">Recent admin activity</h3>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity.</p>
        ) : (
          <div className="space-y-2">
            {events.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between text-sm py-2 border-b border-border/40 last:border-0">
                <span className="font-mono text-xs">{e.action}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
