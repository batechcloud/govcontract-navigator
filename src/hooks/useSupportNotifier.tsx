import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useSupportUnreadCount, useAdminSupportUnread } from "@/hooks/useSupportChat";

// Tiny base64 "ping" (a short silent-ish sine). Keep small; browsers may block
// playback until the user has interacted with the page — we swallow rejections.
const CHIME_SRC =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

function playChime() {
  try {
    const a = new Audio(CHIME_SRC);
    a.volume = 0.4;
    void a.play().catch(() => {});
  } catch {
    /* noop */
  }
}

/** Mounted once in DashboardLayout. Watches workspace unread count and toasts on increase. */
export function useWorkspaceSupportNotifier(onOpenChat?: () => void) {
  const { data: unread = 0 } = useSupportUnreadCount();
  const prev = useRef<number | null>(null);

  useEffect(() => {
    if (prev.current === null) {
      prev.current = unread;
      return;
    }
    if (unread > prev.current) {
      playChime();
      toast.info("New reply from Support", {
        description: "Open the support chat to see the message.",
        action: onOpenChat
          ? { label: "Open", onClick: onOpenChat }
          : undefined,
      });
    }
    prev.current = unread;
  }, [unread, onOpenChat]);
}

/** Mounted once in AdminLayout. Watches admin unread count and toasts on increase. */
export function useAdminSupportNotifier() {
  const { data: unread = 0 } = useAdminSupportUnread();
  const prev = useRef<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (prev.current === null) {
      prev.current = unread;
      return;
    }
    if (unread > prev.current) {
      playChime();
      toast.info("New support message", {
        description: "A workspace just sent a message.",
        action: { label: "Open", onClick: () => navigate("/admin/support") },
      });
    }
    prev.current = unread;
  }, [unread, navigate]);
}
