import { Draggable } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Building2, Trash2 } from "lucide-react";
import { TrackedContract } from "@/hooks/useTrackedContracts";

const priorityColors: Record<string, string> = {
  high: "bg-destructive/20 text-destructive border-destructive/30",
  medium: "bg-accent/20 text-accent border-accent/30",
  low: "bg-muted text-muted-foreground border-border",
};

function getDaysLeft(deadline: string | null) {
  if (!deadline) return null;
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (days < 0) return { text: "Expired", cls: "text-destructive" };
  if (days <= 3) return { text: `${days}d left`, cls: "text-destructive" };
  if (days <= 7) return { text: `${days}d left`, cls: "text-accent" };
  return { text: `${days}d left`, cls: "text-success" };
}

interface Props {
  contract: TrackedContract;
  index: number;
  onDelete: (id: string) => void;
}

export function KanbanCard({ contract, index, onDelete }: Props) {
  const deadline = getDaysLeft(contract.response_deadline);

  return (
    <Draggable draggableId={contract.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`mb-2 ${snapshot.isDragging ? "opacity-80" : ""}`}
        >
          <Card className={`glass border-border/40 transition-shadow ${snapshot.isDragging ? "shadow-lg ring-1 ring-primary/40" : ""}`}>
            <CardContent className="p-3 space-y-2">
              <p className="text-sm font-heading font-semibold text-foreground leading-snug line-clamp-2">
                {contract.contract_title}
              </p>
              {contract.contract_agency && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                  <Building2 className="w-3 h-3 shrink-0" />
                  {contract.contract_agency}
                </p>
              )}
              <div className="flex items-center justify-between gap-1 flex-wrap">
                {deadline && (
                  <span className={`text-[11px] font-medium flex items-center gap-1 ${deadline.cls}`}>
                    <Clock className="w-3 h-3" />
                    {deadline.text}
                  </span>
                )}
                {contract.contract_value && (
                  <span className="text-[11px] text-accent font-medium">{contract.contract_value}</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                {contract.priority && (
                  <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${priorityColors[contract.priority] || ""}`}>
                    {contract.priority}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); onDelete(contract.id); }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
}
