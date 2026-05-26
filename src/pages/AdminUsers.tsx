import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Users, Search, Loader2, ShieldOff, ShieldCheck, UserCog } from "lucide-react";
import { startImpersonation } from "@/lib/impersonation";

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
import { useAdminUsers, AdminUserRow } from "@/hooks/useAdminUsers";
import { useSetUserActive } from "@/hooks/useAdminWorkspaces";

type StatusFilter = "all" | "active" | "suspended";

function nameOf(u: AdminUserRow) {
  return [u.first_name, u.last_name].filter(Boolean).join(" ").trim() || u.email || "—";
}

export default function AdminUsers() {
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: rows = [], isLoading } = useAdminUsers();
  const setActive = useSetUserActive();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [confirm, setConfirm] = useState<AdminUserRow | null>(null);
  const [reason, setReason] = useState("");

  const filtered = useMemo(() => {
    let r = rows;
    if (filter === "active") r = r.filter((x) => !x.is_suspended);
    if (filter === "suspended") r = r.filter((x) => x.is_suspended);
    const needle = q.trim().toLowerCase();
    if (needle) {
      r = r.filter(
        (x) =>
          x.email?.toLowerCase().includes(needle) ||
          x.workspace_name?.toLowerCase().includes(needle) ||
          nameOf(x).toLowerCase().includes(needle),
      );
    }
    return r;
  }, [rows, q, filter]);

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  const handleToggle = async () => {
    if (!confirm) return;
    try {
      await setActive.mutateAsync({
        user_id: confirm.user_id,
        active: confirm.is_suspended,
        reason: reason.trim() || undefined,
      });
      toast.success(confirm.is_suspended ? "User reactivated" : "User suspended");
      setConfirm(null);
      setReason("");
    } catch (e) {
      toast.error((e as Error).message || "Failed");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground flex items-center gap-2">
          <Users className="w-7 h-7 text-primary" /> Users
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Every authenticated user across all workspaces. Suspending blocks future sign-ins immediately.
        </p>
      </div>

      <Card className="p-4 flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by email, name or workspace…"
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
              <TableHead>User</TableHead>
              <TableHead>Workspace</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Signup</TableHead>
              <TableHead>Last active</TableHead>
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
                  No users match.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((u) => (
              <TableRow key={u.user_id}>
                <TableCell>
                  <div className="text-sm font-medium">{nameOf(u)}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </TableCell>
                <TableCell className="text-sm">{u.workspace_name ?? "—"}</TableCell>
                <TableCell>
                  {u.role ? (
                    <Badge variant="outline" className="capitalize">
                      {u.role}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{u.plan_name}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {u.last_active_at
                    ? formatDistanceToNow(new Date(u.last_active_at), { addSuffix: true })
                    : "—"}
                </TableCell>
                <TableCell>
                  {u.is_suspended ? (
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
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          toast.message(`Switching to ${u.email ?? u.user_id}…`);
                          await startImpersonation(u.user_id);
                        } catch (e) {
                          toast.error((e as Error).message || "Impersonation failed");
                        }
                      }}
                    >
                      <UserCog className="w-4 h-4 mr-1" /> Impersonate
                    </Button>
                    {u.is_suspended ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10"
                        onClick={() => {
                          setConfirm(u);
                          setReason("");
                        }}
                      >
                        <ShieldCheck className="w-4 h-4 mr-1" /> Reactivate
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setConfirm(u);
                          setReason("");
                        }}
                      >
                        <ShieldOff className="w-4 h-4 mr-1" /> Suspend
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.is_suspended ? "Reactivate this user?" : "Suspend this user?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.is_suspended
                ? `${nameOf(confirm)} will be able to sign in again.`
                : `${confirm ? nameOf(confirm) : ""} will be signed out immediately and blocked from signing in.`}
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
    </div>
  );
}
