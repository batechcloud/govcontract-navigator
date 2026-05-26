import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase as supabaseTyped } from "@/integrations/supabase/client";
// Types not yet regenerated for support_* tables / RPC. Use loose typing.
const supabase = supabaseTyped as any;
import { useAuth } from "./useAuth";

export type SupportThread = {
  id: string;
  workspace_id: string;
  subject: string;
  status: "open" | "pending" | "resolved";
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_for_workspace: number;
  unread_for_admin: number;
  created_at: string;
  updated_at: string;
};

export type SupportAttachment = {
  path: string;
  name: string;
  mime: string;
  size: number;
};

export type SupportMessage = {
  id: string;
  thread_id: string;
  sender_id: string | null;
  sender_type: "workspace" | "admin" | "system";
  body: string;
  attachments: SupportAttachment[];
  created_at: string;
};

const BUCKET = "support-attachments";

/** Workspace-side: ensure-and-fetch the workspace's support thread. */
export function useMyWorkspaceSupportThread(enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["support-thread", user?.id],
    enabled: !!user && enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const { data: tid, error } = await supabase.rpc("get_or_create_support_thread");
      if (error) throw error;
      const { data: thread, error: tErr } = await supabase
        .from("support_threads")
        .select("*")
        .eq("id", tid as string)
        .maybeSingle();
      if (tErr) throw tErr;
      return thread as SupportThread | null;
    },
  });
}

/** Lightweight unread badge for sidebar. Polls every 30s. */
export function useSupportUnreadCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["support-unread", user?.id],
    enabled: !!user,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data } = await supabase
        .from("support_threads")
        .select("unread_for_workspace")
        .maybeSingle();
      return (data as any)?.unread_for_workspace ?? 0;
    },
  });
}

export function useSupportMessages(threadId: string | null | undefined, polling = true) {
  return useQuery({
    queryKey: ["support-messages", threadId],
    enabled: !!threadId,
    refetchInterval: polling ? 30_000 : false,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("thread_id", threadId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as SupportMessage[];
    },
  });
}

export function useSendSupportMessage(opts: {
  threadId: string;
  workspaceId: string;
  sender: "workspace" | "admin";
}) {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ body, files }: { body: string; files: File[] }) => {
      if (!user) throw new Error("Not signed in");
      const trimmed = body.trim();
      if (!trimmed && files.length === 0) throw new Error("Empty message");

      const attachments: SupportAttachment[] = [];
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) throw new Error(`${file.name} exceeds 10MB`);
        const safe = file.name.replace(/[^\w.\-]+/g, "_");
        const path = `workspace/${opts.workspaceId}/${opts.threadId}/${Date.now()}-${safe}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        attachments.push({ path, name: file.name, mime: file.type, size: file.size });
      }

      const { error } = await supabase.from("support_messages").insert({
        thread_id: opts.threadId,
        sender_id: user.id,
        sender_type: opts.sender,
        body: trimmed,
        attachments: attachments as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support-messages", opts.threadId] });
      qc.invalidateQueries({ queryKey: ["support-thread"] });
      qc.invalidateQueries({ queryKey: ["admin-support-threads"] });
    },
  });
}

export function useMarkSupportRead(threadId: string | null | undefined, side: "workspace" | "admin") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!threadId) return;
      const patch =
        side === "workspace" ? { unread_for_workspace: 0 } : { unread_for_admin: 0 };
      await supabase.from("support_threads").update(patch).eq("id", threadId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support-unread"] });
      qc.invalidateQueries({ queryKey: ["support-thread"] });
      qc.invalidateQueries({ queryKey: ["admin-support-threads"] });
    },
  });
}

/** Get a short-lived signed URL for a private attachment. */
export async function signedAttachmentUrl(path: string) {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 10);
  return data?.signedUrl ?? null;
}

/** Admin-side: list all threads with workspace name. */
export function useAdminSupportThreads(filter: "all" | "open" | "pending" | "resolved" = "all") {
  return useQuery({
    queryKey: ["admin-support-threads", filter],
    refetchInterval: 30_000,
    queryFn: async () => {
      let q = supabase
        .from("support_threads")
        .select("*")
        .order("last_message_at", { ascending: false, nullsFirst: false });
      if (filter !== "all") q = q.eq("status", filter);
      const { data: threads, error } = await q;
      if (error) throw error;

      const ids = (threads ?? []).map((t) => t.workspace_id);
      const { data: workspaces } = ids.length
        ? await supabase.from("workspaces").select("id, name, owner_id").in("id", ids)
        : { data: [] as any[] };

      return (threads ?? []).map((t) => ({
        ...(t as SupportThread),
        workspace_name:
          (workspaces ?? []).find((w: any) => w.id === t.workspace_id)?.name ?? "Workspace",
      }));
    },
  });
}

export function useAdminSupportUnread() {
  return useQuery({
    queryKey: ["admin-support-unread"],
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data } = await supabase.from("support_threads").select("unread_for_admin");
      return (data ?? []).reduce((sum, r: any) => sum + (r.unread_for_admin ?? 0), 0);
    },
  });
}

export function useSetThreadStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ threadId, status }: { threadId: string; status: SupportThread["status"] }) => {
      const { error } = await supabase
        .from("support_threads")
        .update({ status })
        .eq("id", threadId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-support-threads"] }),
  });
}
