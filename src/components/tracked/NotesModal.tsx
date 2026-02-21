import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Building2, Clock, StickyNote } from "lucide-react";
import { TrackedContract } from "@/hooks/useTrackedContracts";
import { PIPELINE_STATUSES } from "./KanbanBoard";

interface Props {
  contract: TrackedContract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, notes: string) => void;
  saving?: boolean;
}

function getDaysLeft(deadline: string | null) {
  if (!deadline) return null;
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (days < 0) return { text: "Expired", cls: "text-destructive" };
  if (days <= 3) return { text: `${days}d left`, cls: "text-destructive" };
  if (days <= 7) return { text: `${days}d left`, cls: "text-accent" };
  return { text: `${days}d left`, cls: "text-success" };
}

export function NotesModal({ contract, open, onOpenChange, onSave, saving }: Props) {
  const [notes, setNotes] = useState(contract?.notes || "");

  // Sync when contract changes
  const [prevId, setPrevId] = useState<string | null>(null);
  if (contract && contract.id !== prevId) {
    setPrevId(contract.id);
    setNotes(contract.notes || "");
  }

  if (!contract) return null;

  const deadline = getDaysLeft(contract.response_deadline);
  const statusLabel = PIPELINE_STATUSES.find(s => s.value === contract.status)?.label || contract.status;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg glass border-border/50">
        <DialogHeader>
          <DialogTitle className="text-base font-heading leading-snug pr-6">{contract.contract_title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {contract.contract_agency && (
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {contract.contract_agency}
            </span>
          )}
          {deadline && (
            <span className={`flex items-center gap-1 font-medium ${deadline.cls}`}>
              <Clock className="w-3 h-3" />
              {deadline.text}
            </span>
          )}
          {contract.contract_value && <span className="text-accent">{contract.contract_value}</span>}
          <Badge variant="outline" className="text-[10px]">{statusLabel}</Badge>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <StickyNote className="w-3.5 h-3.5 text-muted-foreground" />
            Notes
          </label>
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add your bid strategy, key contacts, or any notes..."
            className="min-h-[140px] bg-muted/30 border-border/50 text-sm"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" disabled={saving} onClick={() => onSave(contract.id, notes)}>
            {saving ? "Saving..." : "Save Notes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
