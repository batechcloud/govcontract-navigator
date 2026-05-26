import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Loader2, UserPlus, Trash2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  useAdminTeam,
  useInviteTeamMember,
  useUpdateTeamRole,
  useRemoveTeamMember,
  AdminTeamMember,
} from "@/hooks/useAdminTeam";
import { ROLE_LABEL } from "@/hooks/useAdminRole";

const ROLES: AdminTeamMember["role"][] = ["admin", "workspace_admin", "subscription_manager"];

export function TeamTab() {
  const { data: team = [], isLoading } = useAdminTeam();
  const invite = useInviteTeamMember();
  const updateRole = useUpdateTeamRole();
  const remove = useRemoveTeamMember();

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminTeamMember["role"]>("subscription_manager");
  const [removing, setRemoving] = useState<AdminTeamMember | null>(null);

  const submitInvite = async () => {
    try {
      await invite.mutateAsync({ email: email.trim().toLowerCase(), role });
      toast.success("Team member added. They'll receive an invite if they're new.");
      setOpen(false);
      setEmail("");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border/60">
        <div>
          <h3 className="text-base font-semibold">Admin team</h3>
          <p className="text-xs text-muted-foreground">
            Manage who has access to the admin console and what they can do.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" /> Add member
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Last active</TableHead>
            <TableHead>Added</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                <Loader2 className="w-5 h-5 animate-spin inline" />
              </TableCell>
            </TableRow>
          )}
          {!isLoading && team.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No team members yet.
              </TableCell>
            </TableRow>
          )}
          {team.map((m) => (
            <TableRow key={`${m.user_id}-${m.role}`}>
              <TableCell>
                <div className="text-sm font-medium">
                  {[m.first_name, m.last_name].filter(Boolean).join(" ") || m.email || "—"}
                </div>
                <div className="text-xs text-muted-foreground">{m.email}</div>
              </TableCell>
              <TableCell>
                <Select
                  value={m.role}
                  onValueChange={async (v) => {
                    try {
                      await updateRole.mutateAsync({ user_id: m.user_id, role: v as AdminTeamMember["role"] });
                      toast.success("Role updated");
                    } catch (e) {
                      toast.error((e as Error).message);
                    }
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {m.last_active_at
                  ? formatDistanceToNow(new Date(m.last_active_at), { addSuffix: true })
                  : "—"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
              </TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="ghost" onClick={() => setRemoving(m)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add admin team member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="teammate@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                If they don't have an account yet, they'll receive an email invite.
              </p>
            </div>
            <div>
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as AdminTeamMember["role"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subscription_manager">
                    Subscription Manager — view & update customer subscriptions
                  </SelectItem>
                  <SelectItem value="workspace_admin">
                    Workspace Admin — impersonate customers & handle support
                  </SelectItem>
                  <SelectItem value="admin">Superadmin — full access</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitInvite} disabled={invite.isPending || !email}>
              {invite.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from admin team?</AlertDialogTitle>
            <AlertDialogDescription>
              {removing?.email} will lose all admin access. Their user account remains intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={async () => {
                try {
                  await remove.mutateAsync(removing!.user_id);
                  toast.success("Removed from team");
                  setRemoving(null);
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

// Small badge component for displaying current role elsewhere if needed.
export function RoleBadge({ role }: { role: AdminTeamMember["role"] }) {
  const cls =
    role === "admin"
      ? "bg-primary/15 text-primary border-primary/30"
      : role === "workspace_admin"
      ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
      : "bg-emerald-500/15 text-emerald-500 border-emerald-500/30";
  return <Badge className={cls}>{ROLE_LABEL[role]}</Badge>;
}
