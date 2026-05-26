import { useEffect, useState } from "react";
import { ShieldAlert, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { endImpersonation, getImpersonation } from "@/lib/impersonation";

export function ImpersonationBanner() {
  const [state, setState] = useState(() => getImpersonation());
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const i = setInterval(() => setState(getImpersonation()), 1000);
    return () => clearInterval(i);
  }, []);

  if (!state) return null;

  const handleExit = async () => {
    setExiting(true);
    try {
      await endImpersonation();
    } finally {
      setExiting(false);
    }
  };

  return (
    <div className="sticky top-0 z-[60] w-full bg-amber-500 text-amber-950 border-b border-amber-700 shadow">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span className="truncate">
            Impersonating <strong>{state.targetName || state.targetEmail}</strong>
            <span className="opacity-75"> ({state.targetEmail})</span> — actions are real and logged.
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleExit}
          disabled={exiting}
          className="bg-amber-950 text-amber-50 border-amber-950 hover:bg-amber-900 hover:text-amber-50"
        >
          {exiting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogOut className="w-4 h-4 mr-1" /> Exit</>}
        </Button>
      </div>
    </div>
  );
}
