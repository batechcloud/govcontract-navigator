import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { TrackedContract } from "@/hooks/useTrackedContracts";
import { KanbanCard } from "./KanbanCard";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export const PIPELINE_STATUSES = [
  { value: "watching", label: "Saved", emoji: "📌" },
  { value: "qualifying", label: "Qualifying", emoji: "🔍" },
  { value: "proposal", label: "Writing Proposal", emoji: "✍️" },
  { value: "submitted", label: "Submitted", emoji: "📤" },
  { value: "won", label: "Won", emoji: "🏆" },
  { value: "lost", label: "Lost", emoji: "❌" },
];

interface Props {
  contracts: TrackedContract[];
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onCardClick: (contract: TrackedContract) => void;
}

export function KanbanBoard({ contracts, onStatusChange, onDelete, onCardClick }: Props) {
  const columns: Record<string, TrackedContract[]> = {};
  PIPELINE_STATUSES.forEach(s => (columns[s.value] = []));
  contracts.forEach(c => {
    const key = c.status || "watching";
    if (columns[key]) columns[key].push(c);
    else columns["watching"].push(c);
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId;
    const contractId = result.draggableId;
    const contract = contracts.find(c => c.id === contractId);
    if (contract && contract.status !== newStatus) {
      onStatusChange(contractId, newStatus);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-4 min-w-[900px]">
          {PIPELINE_STATUSES.map(status => (
            <div key={status.value} className="flex-1 min-w-[160px]">
              <div className="flex items-center gap-1.5 mb-3 px-1">
                <span className="text-sm">{status.emoji}</span>
                <h3 className="text-xs font-heading font-semibold text-foreground">{status.label}</h3>
                <span className="text-[10px] text-muted-foreground ml-auto bg-muted rounded-full px-1.5 py-0.5">
                  {columns[status.value].length}
                </span>
              </div>
              <Droppable droppableId={status.value}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[120px] rounded-lg p-2 transition-colors ${
                      snapshot.isDraggingOver ? "bg-primary/10 border border-primary/30" : "bg-muted/20 border border-transparent"
                    }`}
                  >
                    {columns[status.value].map((contract, index) => (
                      <KanbanCard
                        key={contract.id}
                        contract={contract}
                        index={index}
                        onDelete={onDelete}
                        onCardClick={onCardClick}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </DragDropContext>
  );
}
