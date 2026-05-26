import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const PING_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Writes profiles.last_active_at = now() on mount and every 5 minutes while
 * the tab is visible. Fire-and-forget; failures are swallowed.
 */
export function useTrackActivity() {
  const { user } = useAuth();
  const lastPingRef = useRef<number>(0);

  useEffect(() => {
    if (!user) return;

    const ping = async () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastPingRef.current < PING_INTERVAL_MS - 1000) return;
      lastPingRef.current = now;
      try {
        await supabase
          .from("profiles")
          .update({ last_active_at: new Date().toISOString() })
          .eq("id", user.id);
      } catch {
        /* swallow */
      }
    };

    ping();
    const interval = window.setInterval(ping, PING_INTERVAL_MS);
    const onVisible = () => ping();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user]);
}
