import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { FileText, ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SupportMessage, signedAttachmentUrl } from "@/hooks/useSupportChat";

function AttachmentChip({ a }: { a: SupportMessage["attachments"][number] }) {
  const [url, setUrl] = useState<string | null>(null);
  const isImg = a.mime.startsWith("image/");

  useEffect(() => {
    let cancel = false;
    signedAttachmentUrl(a.path).then((u) => !cancel && setUrl(u));
    return () => { cancel = true; };
  }, [a.path]);

  if (isImg && url) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block max-w-xs">
        <img src={url} alt={a.name} className="rounded-md border border-border" />
      </a>
    );
  }
  return (
    <a
      href={url ?? "#"}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-secondary/60 border border-border text-xs hover:bg-secondary transition"
    >
      {isImg ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
      <span className="truncate max-w-[180px]">{a.name}</span>
    </a>
  );
}

export function SupportMessageList({
  messages,
  isLoading,
  ownSenderType,
}: {
  messages: SupportMessage[];
  isLoading: boolean;
  ownSenderType: "workspace" | "admin";
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (!messages.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12 text-muted-foreground">
        <p className="text-sm font-medium text-foreground mb-1">Start the conversation</p>
        <p className="text-xs max-w-xs">
          Our support team usually replies within 24 hours. Share screenshots, PDFs, or details
          about what you need help with.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      {messages.map((m) => {
        const isOwn = m.sender_type === ownSenderType;
        const isSystem = m.sender_type === "system";
        if (isSystem) {
          return (
            <div key={m.id} className="text-center text-xs text-muted-foreground py-2">
              {m.body}
            </div>
          );
        }
        return (
          <div key={m.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[80%] space-y-1.5")}>
              <div
                className={cn(
                  "rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words border",
                  isOwn
                    ? "bg-primary text-primary-foreground border-primary/40 rounded-br-sm"
                    : "bg-secondary/60 text-foreground border-border rounded-bl-sm",
                )}
              >
                {!isOwn && (
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">
                    {m.sender_type === "admin" ? "Support" : "Workspace"}
                  </div>
                )}
                {m.body || (m.attachments.length > 0 ? "" : "—")}
                {m.attachments.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {m.attachments.map((a) => (
                      <AttachmentChip key={a.path} a={a} />
                    ))}
                  </div>
                )}
              </div>
              <div
                className={cn(
                  "text-[10px] text-muted-foreground",
                  isOwn ? "text-right" : "text-left",
                )}
              >
                {format(new Date(m.created_at), "MMM d, h:mm a")}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
