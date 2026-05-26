import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ShieldAlert } from "lucide-react";

export const SuspendedScreen = () => {
  const { signOut } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full bg-card/50 backdrop-blur-xl border border-destructive/30 rounded-xl p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-destructive/15 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold font-heading text-foreground">Account Suspended</h1>
        <p className="text-muted-foreground text-sm">
          Your account has been suspended. Please contact support if you believe this is a mistake.
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <Button asChild variant="outline">
            <a href="mailto:support@gcnavigator.com">Contact Support</a>
          </Button>
          <Button variant="ghost" onClick={() => signOut()}>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};
