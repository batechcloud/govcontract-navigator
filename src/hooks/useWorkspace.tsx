import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type WorkspaceMember = {
  id: string;
  user_id: string;
  workspace_id: string;
  role: "owner" | "member";
  created_at: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

export function useWorkspace() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["workspace", user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      // Find caller's workspace via their membership row.
      const { data: myMembership, error: meErr } = await supabase
        .from("workspace_members")
        .select("workspace_id, role")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (meErr) throw meErr;
      if (!myMembership) return { workspace: null, members: [] as WorkspaceMember[], myRole: null };

      const [{ data: workspace }, { data: memberRows }] = await Promise.all([
        supabase.from("workspaces").select("*").eq("id", myMembership.workspace_id).maybeSingle(),
        supabase
          .from("workspace_members")
          .select("id, user_id, workspace_id, role, created_at")
          .eq("workspace_id", myMembership.workspace_id),
      ]);

      const ids = (memberRows ?? []).map((m) => m.user_id);
      const { data: profiles } = ids.length
        ? await supabase.from("profiles").select("id, first_name, last_name, avatar_url").in("id", ids)
        : { data: [] as any[] };

      // emails aren't directly readable from client; we surface the caller's own email
      // and rely on first/last name for others.
      const members: WorkspaceMember[] = (memberRows ?? []).map((m) => {
        const p = (profiles ?? []).find((x: any) => x.id === m.user_id);
        return {
          ...m,
          email: m.user_id === user!.id ? user!.email ?? null : null,
          first_name: p?.first_name ?? null,
          last_name: p?.last_name ?? null,
          avatar_url: p?.avatar_url ?? null,
        };
      });

      return {
        workspace,
        members,
        myRole: myMembership.role as "owner" | "member",
      };
    },
  });
}
