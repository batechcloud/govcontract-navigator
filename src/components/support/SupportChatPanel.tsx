import { useEffect } from "react";
import { LifeBuoy, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  useMyWorkspaceSupportThread,
  useSupportMessages,
  useSendSupportMessage,
  useMarkSupportRead,
} from "@/hooks/useSupportChat";
import { SupportMessageList } from "./SupportMessageList";
import { SupportComposer } from "./SupportComposer";

export function SupportChatPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: thread, isLoading: tLoading } = useMyWorkspaceSupportThread(open);
  const { data: messages, isLoading: mLoading } = useSupportMessages(thread?.id, open);
  const send = useSendSupportMessage({
    threadId: thread?.id ?? "",
    workspaceId: thread?.workspace_id ?? "",
    sender: "workspace",
  });
  const markRead = useMarkSupportRead(thread?.id, "workspace");

  useEffect(() => {
    if (open && thread?.id && (thread.unread_for_workspace ?? 0) > 0) {
      markRead.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, thread?.id, thread?.unread_for_workspace]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="p-0 w-full sm:max-w-md flex flex-col">
        <SheetHeader className="px-4 py-3 border-b border-border space-y-1">
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-primary" />
            <SheetTitle className="font-heading">Support</SheetTitle>
            {thread?.status && (
              <Badge
                variant="outline"
                className="ml-auto text-[10px] uppercase tracking-wider"
              >
                {thread.status}
              </Badge>
            )}
          </div>
          <SheetDescription className="text-xs">
            Chat with our support team. Typical reply within 24 hours.
          </SheetDescription>
        </SheetHeader>

        {tLoading || !thread ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <SupportMessageList
              messages={messages ?? []}
              isLoading={mLoading}
              ownSenderType="workspace"
            />
            <SupportComposer
              onSend={(args) => send.mutateAsync(args)}
              placeholder="Describe what you need help with…"
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
