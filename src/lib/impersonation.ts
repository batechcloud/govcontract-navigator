import { supabase } from "@/integrations/supabase/client";

const KEY = "gcn.impersonation";

export interface ImpersonationState {
  adminAccessToken: string;
  adminRefreshToken: string;
  adminUserId: string;
  adminEmail: string | null;
  targetUserId: string;
  targetEmail: string;
  targetName: string | null;
  startedAt: number;
}

export function getImpersonation(): ImpersonationState | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ImpersonationState) : null;
  } catch {
    return null;
  }
}

export function isImpersonating(): boolean {
  return !!getImpersonation();
}

export async function startImpersonation(targetUserId: string): Promise<void> {
  const { data: sessRes } = await supabase.auth.getSession();
  const adminSession = sessRes.session;
  if (!adminSession) throw new Error("Not signed in");

  const { data, error } = await supabase.functions.invoke("admin-impersonate", {
    body: { target_user_id: targetUserId },
  });
  if (error) throw new Error(error.message || "Impersonation failed");
  if (!data?.access_token || !data?.refresh_token) {
    throw new Error("Invalid impersonation response");
  }

  const state: ImpersonationState = {
    adminAccessToken: adminSession.access_token,
    adminRefreshToken: adminSession.refresh_token,
    adminUserId: adminSession.user.id,
    adminEmail: adminSession.user.email ?? null,
    targetUserId: data.target.id,
    targetEmail: data.target.email,
    targetName:
      [data.target.first_name, data.target.last_name].filter(Boolean).join(" ") || null,
    startedAt: Date.now(),
  };
  sessionStorage.setItem(KEY, JSON.stringify(state));

  const { error: setErr } = await supabase.auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });
  if (setErr) {
    sessionStorage.removeItem(KEY);
    throw setErr;
  }
  window.location.assign("/dashboard");
}

export async function endImpersonation(): Promise<void> {
  const state = getImpersonation();
  if (!state) return;

  try {
    await supabase.functions.invoke("admin-impersonate-end", {
      body: { original_admin_id: state.adminUserId },
    });
  } catch {
    // best effort
  }

  await supabase.auth.setSession({
    access_token: state.adminAccessToken,
    refresh_token: state.adminRefreshToken,
  });
  sessionStorage.removeItem(KEY);
  window.location.assign("/admin/workspaces");
}
