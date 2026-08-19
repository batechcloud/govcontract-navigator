import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Building2,
  Calendar,
  CreditCard,
  Loader2,
  Mail,
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserCog,
  Users,
  Activity,
  FileText,
  Bookmark,
  ListChecks,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { startImpersonation } from "@/lib/impersonation";
import {
  useAdminWorkspaceMembers,
  useSetUserActive,
  AdminWorkspaceRow,
} from "@/hooks/useAdminWorkspaces";
import {
  useAdminWorkspaceDetail,
  useAdminSetMemberRole,
  useAdminRemoveMember,
} from "@/hooks/useAdminWorkspaceDetail";

type Props = {
  row: AdminWorkspaceRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function fullName(first: string | null, last: string | null, email: string | null) {
  const n = [first, last].filter(Boolean).join(" ").trim();
  return n || email || "—";
}

function formatMoney(cents: number | null | undefined) {
  if (cents == null) return "—";
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo`;
}

export default function WorkspaceDetailDrawer({ row, open, onOpenChange }: Props) {
  const workspaceId = row?.workspace_id ?? null;
  const { data: detail, isLoading } = useAdminWorkspaceDetail(workspaceId);
  const { data: members = [] } = useAdminWorkspaceMembers(workspaceId);
  const setActive = useSetUserActive();
  const setRole = useAdminSetMemberRole();
  const removeMember = useAdminRemoveMember();

  const handleImpersonate = async (userId: string, email: string | null) => {
    try {
      toast.message(`Switching to ${email ?? userId}…`);
      await startImpersonation(userId);
    } catch (e) {
      toast.error((e as Error).message || "Impersonation failed");
    }
  };

  const handleToggleActive = async (
    userId: string,
    isSuspended: boolean,
    label: string,
  ) => {
    try {
      await setActive.mutateAsync({ user_id: userId, active: isSuspended });
      toast.success(isSuspended ? `${label} reactivated` : `${label} suspended`);
    } catch (e) {
      toast.error((e as Error).message || "Failed");
    }
  };

  const handleRoleChange = async (userId: string, role: "viewer" | "editor") => {
    if (!workspaceId) return;
    try {
      await setRole.mutateAsync({ workspace_id: workspaceId, user_id: userId, role });
      toast.success("Role updated");
    } catch (e) {
      toast.error((e as Error).message || "Failed");
    }
  };

  const handleRemove = async (userId: string, label: string) => {
    if (!workspaceId) return;
    if (!confirm(`Remove ${label} from this workspace?`)) return;
    try {
      await removeMember.mutateAsync({ workspace_id: workspaceId, user_id: userId });
      toast.success("Member removed");
    } catch (e) {
      toast.error((e as Error).message || "Failed");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        {!row ? null : (
          <>
            <SheetHeader className="space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                <SheetTitle className="text-xl">{row.workspace_name}</SheetTitle>
                {row.is_suspended ? (
                  <Badge className="bg-destructive/15 text-destructive border-destructive/30">
                    Suspended
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30">
                    Active
                  </Badge>
                )}
              </div>
              <SheetDescription>
                Full account information and member management for this workspace.
              </SheetDescription>
            </SheetHeader>

            {isLoading || !detail ? (
              <div className="py-16 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6 mt-6">
                {/* Owner card */}
                <Card className="p-4 space-y-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Workspace owner
                  </div>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="font-semibold">
                        {fullName(detail.owner.first_name, detail.owner.last_name, detail.owner.email)}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {detail.owner.email ?? "—"}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleImpersonate(detail.owner.id, detail.owner.email)}
                      >
                        <UserCog className="w-4 h-4 mr-1" /> Impersonate
                      </Button>
                      {detail.owner.is_suspended ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10"
                          onClick={() => handleToggleActive(detail.owner.id, true, "Owner")}
                        >
                          <ShieldCheck className="w-4 h-4 mr-1" /> Reactivate
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleToggleActive(detail.owner.id, false, "Owner")}
                        >
                          <ShieldOff className="w-4 h-4 mr-1" /> Suspend
                        </Button>
                      )}
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <Info
                      icon={<Calendar className="w-3.5 h-3.5" />}
                      label="Signed up"
                      value={format(new Date(detail.owner.signed_up_at), "MMM d, yyyy")}
                      sub={formatDistanceToNow(new Date(detail.owner.signed_up_at), { addSuffix: true })}
                    />
                    <Info
                      icon={<Activity className="w-3.5 h-3.5" />}
                      label="Last active"
                      value={
                        detail.owner.last_active_at
                          ? formatDistanceToNow(new Date(detail.owner.last_active_at), { addSuffix: true })
                          : "Never"
                      }
                    />
                    <Info
                      icon={<Building2 className="w-3.5 h-3.5" />}
                      label="Workspace created"
                      value={format(new Date(detail.workspace.created_at), "MMM d, yyyy")}
                    />
                    <Info
                      icon={<CreditCard className="w-3.5 h-3.5" />}
                      label="Plan"
                      value={detail.subscription?.plan_name ?? "Starter"}
                      sub={
                        detail.subscription
                          ? `${detail.subscription.status} · ${formatMoney(detail.subscription.monthly_price)}`
                          : "No active subscription"
                      }
                    />
                  </div>
                </Card>

                {/* Usage snapshot */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Stat icon={<Users className="w-4 h-4" />} label="Members" value={detail.counts.members} />
                  <Stat icon={<Bookmark className="w-4 h-4" />} label="Tracked" value={detail.counts.tracked_contracts} />
                  <Stat icon={<ListChecks className="w-4 h-4" />} label="Saved searches" value={detail.counts.saved_searches} />
                  <Stat icon={<FileText className="w-4 h-4" />} label="Proposals" value={detail.counts.proposals} />
                </div>

                {/* Members */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      Members ({members.length})
                    </div>
                    {detail.role_breakdown && (
                      <div className="flex gap-1.5">
                        {Object.entries(detail.role_breakdown).map(([role, count]) => (
                          <Badge key={role} variant="outline" className="capitalize text-xs">
                            {role}: {count}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    {members.map((m) => {
                      const isOwner = m.role === "owner";
                      const label = fullName(m.first_name, m.last_name, m.email);
                      const currentRole: "viewer" | "editor" =
                        m.role === "viewer" ? "viewer" : "editor";
                      return (
                        <div
                          key={m.user_id}
                          className="flex items-center justify-between gap-2 py-2 px-2 rounded hover:bg-muted/40"
                        >
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">{label}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {m.email}
                              {m.last_active_at && (
                                <> · active {formatDistanceToNow(new Date(m.last_active_at), { addSuffix: true })}</>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {m.is_suspended && (
                              <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-xs">
                                Suspended
                              </Badge>
                            )}
                            {isOwner ? (
                              <Badge variant="outline" className="capitalize text-xs">
                                owner
                              </Badge>
                            ) : (
                              <Select
                                value={currentRole}
                                onValueChange={(v) =>
                                  handleRoleChange(m.user_id, v as "viewer" | "editor")
                                }
                              >
                                <SelectTrigger className="h-7 w-[100px] text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="viewer">Viewer</SelectItem>
                                  <SelectItem value="editor">Editor</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              aria-label="Impersonate user"
                              title="Impersonate"
                              onClick={() => handleImpersonate(m.user_id, m.email)}
                            >
                              <UserCog className="w-3.5 h-3.5" />
                            </Button>
                            {!isOwner && (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  aria-label={m.is_suspended ? "Reactivate user" : "Suspend user"}
                                  title={m.is_suspended ? "Reactivate" : "Suspend"}
                                  onClick={() => handleToggleActive(m.user_id, m.is_suspended, label)}
                                >
                                  {m.is_suspended ? (
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <ShieldOff className="w-3.5 h-3.5 text-destructive" />
                                  )}
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  aria-label="Remove from workspace"
                                  title="Remove from workspace"
                                  onClick={() => handleRemove(m.user_id, label)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* Recent activity */}
                {detail.recent_activity.length > 0 && (
                  <Card className="p-4">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
                      Recent activity
                    </div>
                    <div className="space-y-2">
                      {detail.recent_activity.map((a) => (
                        <div key={a.id} className="text-sm flex justify-between gap-3">
                          <span className="font-mono text-xs">{a.action}</span>
                          <span className="text-muted-foreground text-xs whitespace-nowrap">
                            {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Info({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        {icon} {label}
      </div>
      <div className="font-medium">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon} {label}
      </div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </Card>
  );
}
