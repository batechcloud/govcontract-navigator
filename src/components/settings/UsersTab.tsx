import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, UserPlus, Trash2, Crown, Copy, RefreshCw, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";

function randomPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%^&*?-_";
  const all = upper + lower + digits + symbols;
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  let pw = pick(upper) + pick(lower) + pick(digits) + pick(symbols);
  for (let i = 0; i < 12; i++) pw += pick(all);
  return pw
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

export function UsersTab() {
  const { user } = useAuth();
  const { data, isLoading } = useWorkspace();
  const queryClient = useQueryClient();

  const isOwner = data?.myRole === "owner";
  const members = data?.members ?? [];

  const [inviteOpen, setInviteOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setTempPassword("");
    setCreatedPassword(null);
  };

  const handleInvite = async () => {
    setSubmitting(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("workspace-invite-user", {
        body: {
          email: email.trim(),
          first_name: firstName.trim() || undefined,
          last_name: lastName.trim() || undefined,
          temp_password: tempPassword,
        },
      });
      if (error) throw error;
      if ((res as any)?.error) throw new Error((res as any).error);
      setCreatedPassword(tempPassword);
      toast.success("User created. Share the temporary password securely.");
      queryClient.invalidateQueries({ queryKey: ["workspace"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (userId: string) => {
    setRemovingId(userId);
    try {
      const { data: res, error } = await supabase.functions.invoke("workspace-remove-user", {
        body: { user_id: userId },
      });
      if (error) throw error;
      if ((res as any)?.error) throw new Error((res as any).error);
      toast.success("User removed");
      queryClient.invalidateQueries({ queryKey: ["workspace"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to remove user");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Workspace Users
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {isOwner
              ? "Invite teammates to share tracked contracts, proposals, saved searches, and your company profile."
              : "You are a member of this workspace. Only the owner can invite or remove users."}
          </p>
        </div>

        {isOwner && (
          <Dialog
            open={inviteOpen}
            onOpenChange={(o) => {
              setInviteOpen(o);
              if (!o) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              {createdPassword ? (
                <>
                  <DialogHeader>
                    <DialogTitle>User created</DialogTitle>
                    <DialogDescription>
                      Share this temporary password with the new user via a secure channel. They should change
                      it after first login.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Label>Email</Label>
                    <Input value={email} readOnly />
                    <Label>Temporary password</Label>
                    <div className="flex gap-2">
                      <Input value={createdPassword} readOnly className="font-mono" />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(createdPassword);
                          toast.success("Password copied");
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => {
                        setInviteOpen(false);
                        resetForm();
                      }}
                    >
                      Done
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle>Invite a new user</DialogTitle>
                    <DialogDescription>
                      Create an account with a temporary password. The user can sign in immediately.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="fn">First name</Label>
                        <Input id="fn" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="ln">Last name</Label>
                        <Input id="ln" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="em">Email</Label>
                      <Input
                        id="em"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="teammate@company.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pw">Temporary password</Label>
                      <div className="flex gap-2">
                        <Input
                          id="pw"
                          value={tempPassword}
                          onChange={(e) => setTempPassword(e.target.value)}
                          placeholder="Min 12 chars, mixed case, digit, symbol"
                          className="font-mono"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setTempPassword(randomPassword())}
                          title="Generate"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        At least 12 characters with upper, lower, digit, and symbol.
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setInviteOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleInvite}
                      disabled={submitting || !email || !tempPassword}
                      className="bg-accent hover:bg-accent/90 text-accent-foreground"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...
                        </>
                      ) : (
                        "Create user"
                      )}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="border border-border/30 rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-3 bg-muted/10 border-b border-border/30 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <span>User</span>
          <span>Role</span>
          <span className="w-20 text-right">Actions</span>
        </div>

        {isLoading ? (
          <div className="px-4 py-10 text-center">
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : members.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">No users yet</div>
        ) : (
          members.map((m) => {
            const name = [m.first_name, m.last_name].filter(Boolean).join(" ") || m.email || "Unnamed user";
            const initials =
              ((m.first_name?.[0] || "") + (m.last_name?.[0] || "")).toUpperCase() ||
              (m.email?.[0] || "U").toUpperCase();
            const isSelf = m.user_id === user?.id;
            return (
              <div
                key={m.id}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-3 border-b border-border/20 last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={m.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {name} {isSelf && <span className="text-muted-foreground">(you)</span>}
                    </p>
                    {m.email && <p className="text-xs text-muted-foreground truncate">{m.email}</p>}
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full border flex items-center gap-1 ${
                    m.role === "owner"
                      ? "bg-accent/20 text-accent border-accent/30"
                      : "bg-muted/30 text-muted-foreground border-border/40"
                  }`}
                >
                  {m.role === "owner" && <Crown className="w-3 h-3" />}
                  {m.role}
                </span>
                <div className="w-20 flex justify-end">
                  {isOwner && !isSelf && m.role !== "owner" ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={removingId === m.user_id}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          {removingId === m.user_id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove this user?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This permanently deletes the user account and all of their personal data (chat
                            history, documents, etc.). Shared workspace data is preserved. This cannot be
                            undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemove(m.user_id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remove user
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <span className="text-xs text-muted-foreground/50">—</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
