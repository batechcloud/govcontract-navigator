import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { LifeBuoy, Loader2, Search } from "lucide-react";
import { Navigate } from "react-router-dom";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import {
  useAdminSupportThreads,
  useSupportMessages,
  useSendSupportMessage,
  useMarkSupportRead,
  useSetThreadStatus,
  SupportThread,
} from "@/hooks/useSupportChat";
import { SupportMessageList } from "@/components/support/SupportMessageList";
import { SupportComposer } from "@/components/support/SupportComposer";
import { usePageTitle } from "@/hooks/usePageTitle";

type Filter = "all" | "open" | "pending" | "resolved";
type Row = SupportThread & { workspace_name: string };

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  resolved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

export default function AdminSupport() {
  usePageTitle("Admin Support");
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: threads = [], isLoading } = useAdminSupportThreads(filter);

  const filtered = useMemo(() => {
    if (!q.trim()) return threads;
    const needle = q.toLowerCase();
    return threads.filter(
      (t) =>
        t.workspace_name.toLowerCase().includes(needle) ||
        (t.last_message_preview ?? "").toLowerCase().includes(needle),
    );
  }, [threads, q]);

  useEffect(() => {
    if (!selectedId && filtered[0]) setSelectedId(filtered[0].id);
  }, [filtered, selectedId]);

  const selected: Row | undefined = filtered.find((t) => t.id === selectedId) ??
    threads.find((t) => t.id === selectedId);

  if (adminLoading) {
    return (
      <>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }
  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <LifeBuoy className="w-6 h-6 text-primary" />
          <div>
            <h1 className="font-heading text-2xl font-bold">Support Inbox</h1>
            <p className="text-sm text-muted-foreground">
              Reply to workspace support requests. Target reply window: 24 hours.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 min-h-[70vh]">
          {/* Thread list */}
          <Card className="flex flex-col overflow-hidden">
            <div className="p-3 border-b border-border space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search workspaces…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
              <div className="flex gap-1">
                {(["all", "open", "pending", "resolved"] as Filter[]).map((f) => (
                  <Button
                    key={f}
                    size="sm"
                    variant={filter === f ? "default" : "ghost"}
                    className="h-7 text-xs capitalize flex-1"
                    onClick={() => setFilter(f)}
                  >
                    {f}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-6 flex justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : filtered.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground text-center">No threads</p>
              ) : (
                <ul>
                  {filtered.map((t) => (
                    <li key={t.id}>
                      <button
                        onClick={() => setSelectedId(t.id)}
                        className={cn(
                          "w-full text-left px-3 py-3 border-b border-border/60 hover:bg-secondary/40 transition",
                          selectedId === t.id && "bg-secondary/60",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-medium text-sm truncate">{t.workspace_name}</span>
                          {t.unread_for_admin > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                              {t.unread_for_admin}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {t.last_message_preview ?? "No messages yet"}
                        </p>
                        <div className="flex items-center justify-between mt-1.5">
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] uppercase", STATUS_COLORS[t.status])}
                          >
                            {t.status}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {t.last_message_at
                              ? formatDistanceToNow(new Date(t.last_message_at), { addSuffix: true })
                              : ""}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          {/* Conversation */}
          <Card className="flex flex-col overflow-hidden">
            {selected ? (
              <ConversationPane row={selected} />
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                Select a thread to view the conversation
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function ConversationPane({ row }: { row: Row }) {
  const { data: messages = [], isLoading } = useSupportMessages(row.id, true);
  const send = useSendSupportMessage({
    threadId: row.id,
    workspaceId: row.workspace_id,
    sender: "admin",
  });
  const markRead = useMarkSupportRead(row.id, "admin");
  const setStatus = useSetThreadStatus();

  useEffect(() => {
    if (row.unread_for_admin > 0) markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row.id]);

  return (
    <>
      <div className="px-4 py-3 border-b border-border flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="font-heading font-semibold truncate">{row.workspace_name}</h2>
          <p className="text-xs text-muted-foreground">{row.subject}</p>
        </div>
        <Select
          value={row.status}
          onValueChange={(v) =>
            setStatus.mutate({ threadId: row.id, status: v as SupportThread["status"] })
          }
        >
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <SupportMessageList
        messages={messages}
        isLoading={isLoading}
        ownSenderType="admin"
      />
      <SupportComposer
        onSend={(args) => send.mutateAsync(args)}
        placeholder="Write a reply to the workspace…"
      />
    </>
  );
}
