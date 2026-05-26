import { useRef, useState } from "react";
import { Paperclip, Send, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = /^(image\/.+|application\/pdf)$/;

export function SupportComposer({
  onSend,
  disabled,
  placeholder = "Type a message…",
}: {
  onSend: (args: { body: string; files: File[] }) => Promise<unknown>;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = (incoming: File[]) => {
    const ok: File[] = [];
    for (const f of incoming) {
      if (!ALLOWED.test(f.type)) {
        toast.warning(`${f.name}: only images and PDFs are allowed`);
        continue;
      }
      if (f.size > MAX_BYTES) {
        toast.warning(`${f.name} is larger than 10MB`);
        continue;
      }
      ok.push(f);
    }
    setFiles((cur) => [...cur, ...ok].slice(0, 5));
  };

  const submit = async () => {
    if (sending) return;
    if (!body.trim() && files.length === 0) return;
    setSending(true);
    try {
      await onSend({ body, files });
      setBody("");
      setFiles([]);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-t border-border p-3 space-y-2 bg-background/60">
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-xs px-2 py-1 rounded-md bg-secondary border border-border"
            >
              <span className="truncate max-w-[160px]">{f.name}</span>
              <button
                onClick={() => setFiles((cur) => cur.filter((_, idx) => idx !== i))}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={disabled || sending}
          onClick={() => fileRef.current?.click()}
          aria-label="Attach file"
        >
          <Paperclip className="w-4 h-4" />
        </Button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []));
            if (fileRef.current) fileRef.current.value = "";
          }}
        />
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          rows={1}
          disabled={disabled || sending}
          className={cn("min-h-[40px] max-h-32 resize-none flex-1")}
        />
        <Button
          type="button"
          size="icon"
          onClick={submit}
          disabled={disabled || sending || (!body.trim() && files.length === 0)}
          aria-label="Send"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
