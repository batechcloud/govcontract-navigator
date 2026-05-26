import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Building2,
  Search,
  Loader2,
  ShieldOff,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Activity,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import {
  useAdminWorkspaces,
  useAdminWorkspaceMembers,
  useSetUserActive,
  AdminWorkspaceRow,
} from "@/hooks/useAdminWorkspaces";

type StatusFilter = "all" | "active" | "suspended";

function ownerLabel(r: AdminWorkspaceRow) {
  const name = [r.owner_first_name, r.owner_last_name].filter(Boolean).join(" ").trim();
  return name || r.owner_email || "—";
}

export default function AdminWorkspaces() {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: rows = [], isLoading } = useAdminWorkspaces();
  const setActive = useSetUserActive();

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<AdminWorkspaceRow | null>(null);
  const [reason, setReason] = useState("");

  const filtered = useMemo(() => {
    let r = rows;
    if (filter === "active") r = r.filter((x) => !x.is_suspended);
    if (filter === "suspended") r = r.filter((x) => x.is_suspended);
    const needle = q.trim().toLowerCase();
    if (needle) {
      r = r.filter(
        (x) =>
          x.workspace_name?.toLowerCase().includes(needle) ||
          x.owner_email?.toLowerCase().includes(needle) ||
          ownerLabel(x).toLowerCase().includes(needle),
      );
    }
    return r;
  }, [rows, q, filter]);

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  const handleToggle = async () => {
    if (!confirm) return;
    try {
      await setActive.mutateAsync({
        user_id: confirm.owner_id,
        active: confirm.is_suspended, // if currently suspended, activate
        reason: reason.trim() || undefined,
      });
      toast.success(
        confirm.is_suspended ? "Account reactivated" : "Account suspended",
      );
      setConfirm(null);
      setReason("");
    } catch (e) {
      toast.error((e as Error).message || "Failed");
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-7 h-7 text-primary" /> Workspaces
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage all workspace owners and their accounts. Suspending an owner immediately signs
              them out and blocks future sign-ins.
            </p>
          </div>
        </div>

        <Card className="p-4 flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search workspace, owner name or email…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({rows.length})</SelectItem>
              <SelectItem value="active">
                Active ({rows.filter((r) => !r.is_suspended).length})
              </SelectItem>
              <SelectItem value="suspended">
                Suspended ({rows.filter((r) => r.is_suspended).length})
              </SelectItem>
            </SelectContent>
          </Select>
        </Card>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Workspace</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-center">Members</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    <Loader2 className="w-5 h-5 animate-spin inline" />
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    No workspaces match.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((r) => (
                <WorkspaceRow
                  key={r.workspace_id}
                  row={r}
                  expanded={expanded === r.workspace_id}
                  onToggleExpand={() =>
                    setExpanded(expanded === r.workspace_id ? null : r.workspace_id)
                  }
                  onActionClick={() => {
                    setConfirm(r);
                    setReason("");
                  }}
                />
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.is_suspended ? "Reactivate this account?" : "Suspend this account?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.is_suspended
                ? `The owner of "${confirm?.workspace_name}" will be able to sign in again.`
                : `The owner of "${confirm?.workspace_name}" will be signed out immediately and blocked from signing in.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Reason (optional, logged for audit)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggle}
              className={
                confirm?.is_suspended
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-destructive hover:bg-destructive/90"
              }
            >
              {setActive.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : confirm?.is_suspended ? (
                "Reactivate"
              ) : (
                "Suspend"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function WorkspaceRow({
  row,
  expanded,
  onToggleExpand,
  onActionClick,
}: {
  row: AdminWorkspaceRow;
  expanded: boolean;
  onToggleExpand: () => void;
  onActionClick: () => void;
}) {
  const { data: members = [], isLoading } = useAdminWorkspaceMembers(expanded ? row.workspace_id : null);

  return (
    <>
      <TableRow>
        <TableCell>
          <Button variant="ghost" size="sm" onClick={onToggleExpand}>
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </TableCell>
        <TableCell className="font-medium">{row.workspace_name}</TableCell>
        <TableCell>
          <div className="text-sm">{ownerLabel(row)}</div>
          <div className="text-xs text-muted-foreground">{row.owner_email}</div>
        </TableCell>
        <TableCell>
          <Badge variant="outline">{row.plan_name}</Badge>
        </TableCell>
        <TableCell className="text-center">{row.member_count}</TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(row.workspace_created_at), { addSuffix: true })}
        </TableCell>
        <TableCell>
          {row.is_suspended ? (
            <Badge className="bg-destructive/15 text-destructive border-destructive/30">
              Suspended
            </Badge>
          ) : (
            <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30">
              Active
            </Badge>
          )}
        </TableCell>
        <TableCell className="text-right">
          {row.is_suspended ? (
            <Button
              size="sm"
              variant="outline"
              className="border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10"
              onClick={onActionClick}
            >
              <ShieldCheck className="w-4 h-4 mr-1" /> Reactivate
            </Button>
          ) : (
            <Button size="sm" variant="destructive" onClick={onActionClick}>
              <ShieldOff className="w-4 h-4 mr-1" /> Suspend
            </Button>
          )}
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell colSpan={8} className="bg-muted/30">
            <div className="p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                Members
              </div>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <div className="space-y-1">
                  {members.map((m) => (
                    <div
                      key={m.user_id}
                      className="flex items-center justify-between text-sm py-1.5 px-2 rounded hover:bg-background/50"
                    >
                      <div>
                        <span className="font-medium">
                          {[m.first_name, m.last_name].filter(Boolean).join(" ") || m.email || "—"}
                        </span>
                        <span className="text-muted-foreground ml-2">{m.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {m.is_suspended && (
                          <Badge className="bg-destructive/15 text-destructive border-destructive/30">
                            Suspended
                          </Badge>
                        )}
                        <Badge variant="outline" className="capitalize">
                          {m.role}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
