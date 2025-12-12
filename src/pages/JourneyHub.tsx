import { useState } from "react";
import { motion } from "framer-motion";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Clock,
  DollarSign,
  GripVertical,
  Building2,
  Target,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useTrackedContracts, useUpdateContractStatus, TrackedContract } from "@/hooks/useTrackedContracts";
import { format, formatDistanceToNow, isPast } from "date-fns";

const PIPELINE_STAGES = [
  { id: "watching", label: "Watching", color: "bg-blue-500", borderColor: "border-blue-500/30" },
  { id: "qualifying", label: "Qualifying", color: "bg-yellow-500", borderColor: "border-yellow-500/30" },
  { id: "proposal", label: "Writing Proposal", color: "bg-purple-500", borderColor: "border-purple-500/30" },
  { id: "submitted", label: "Submitted", color: "bg-green-500", borderColor: "border-green-500/30" },
  { id: "won", label: "Won", color: "bg-emerald-500", borderColor: "border-emerald-500/30" },
  { id: "lost", label: "Lost", color: "bg-red-500", borderColor: "border-red-500/30" },
];

interface KanbanCardProps {
  contract: TrackedContract;
  index: number;
  isMoving: boolean;
}

const KanbanCard = ({ contract, index, isMoving }: KanbanCardProps) => {
  const deadline = contract.response_deadline ? new Date(contract.response_deadline) : null;
  const isOverdue = deadline ? isPast(deadline) : false;
  const deadlineText = deadline ? format(deadline, "MMM d") : "No deadline";
  const timeRemaining = deadline && !isOverdue ? formatDistanceToNow(deadline, { addSuffix: false }) : null;

  return (
    <Draggable draggableId={contract.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`group transition-shadow ${snapshot.isDragging ? "shadow-2xl" : ""}`}
        >
          <Card 
            variant="glass-hover" 
            className={`cursor-grab active:cursor-grabbing ${
              snapshot.isDragging ? "ring-2 ring-primary/50 rotate-2" : ""
            } ${isMoving ? "opacity-50" : ""}`}
          >
            <CardContent className="p-3">
              <div className="flex items-start gap-2 mb-2">
                <div {...provided.dragHandleProps} className="shrink-0 mt-0.5">
                  <GripVertical className="w-4 h-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-heading font-medium text-sm text-foreground line-clamp-2 mb-1">
                    {contract.contract_title}
                  </h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                    <Building2 className="w-3 h-3 shrink-0" />
                    {contract.contract_agency || "Unknown Agency"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 mb-2">
                {contract.contract_value && (
                  <span className="text-xs text-accent font-semibold flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {contract.contract_value}
                  </span>
                )}
                <span className={`text-xs flex items-center gap-1 ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
                  <Clock className="w-3 h-3" />
                  {deadlineText}
                  {timeRemaining && <span className="hidden sm:inline">({timeRemaining})</span>}
                </span>
              </div>

              {contract.match_score && (
                <Badge variant="success" className="text-xs">
                  {contract.match_score}% Match
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
};

interface KanbanColumnProps {
  stage: typeof PIPELINE_STAGES[0];
  contracts: TrackedContract[];
  movingContractId: string | null;
}

const KanbanColumn = ({ stage, contracts, movingContractId }: KanbanColumnProps) => {
  return (
    <div className="flex flex-col min-w-[280px] w-[280px] shrink-0">
      <div className={`flex items-center gap-2 p-3 rounded-t-lg border-t-2 ${stage.borderColor} bg-secondary/30`}>
        <div className={`w-3 h-3 rounded-full ${stage.color}`} />
        <h3 className="font-heading font-semibold text-sm text-foreground">{stage.label}</h3>
        <Badge variant="secondary" className="ml-auto text-xs">
          {contracts.length}
        </Badge>
      </div>
      <Droppable droppableId={stage.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 rounded-b-lg p-2 space-y-2 min-h-[400px] max-h-[calc(100vh-280px)] overflow-y-auto transition-colors ${
              snapshot.isDraggingOver 
                ? "bg-primary/10 ring-2 ring-primary/30 ring-inset" 
                : "bg-secondary/10"
            }`}
          >
            {contracts.length === 0 && !snapshot.isDraggingOver ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Target className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs text-center">Drop contracts here</p>
              </div>
            ) : (
              contracts.map((contract, index) => (
                <KanbanCard
                  key={contract.id}
                  contract={contract}
                  index={index}
                  isMoving={movingContractId === contract.id}
                />
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

const JourneyHub = () => {
  const { data: contracts, isLoading } = useTrackedContracts();
  const updateStatus = useUpdateContractStatus();
  const [movingContractId, setMovingContractId] = useState<string | null>(null);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Dropped outside a valid droppable
    if (!destination) return;

    // Dropped in the same place
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    // Update the contract status
    const newStatus = destination.droppableId;
    setMovingContractId(draggableId);
    
    updateStatus.mutate(
      { id: draggableId, status: newStatus },
      {
        onSettled: () => setMovingContractId(null),
      }
    );
  };

  // Group contracts by status
  const contractsByStage = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage.id] = contracts?.filter(c => c.status === stage.id) || [];
    return acc;
  }, {} as Record<string, TrackedContract[]>);

  // Calculate pipeline stats
  const totalValue = contracts?.reduce((sum, c) => {
    const value = c.contract_value?.replace(/[^0-9.]/g, "") || "0";
    return sum + parseFloat(value);
  }, 0) || 0;

  const activeCount = contracts?.filter(c => !["won", "lost"].includes(c.status)).length || 0;

  return (
    <DashboardLayout title="Journey Hub">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Header Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card variant="glass">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Contracts</p>
              <p className="text-2xl font-heading font-bold text-foreground">
                {isLoading ? <Skeleton className="h-8 w-12" /> : contracts?.length || 0}
              </p>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Active Pipeline</p>
              <p className="text-2xl font-heading font-bold text-foreground">
                {isLoading ? <Skeleton className="h-8 w-12" /> : activeCount}
              </p>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Pipeline Value</p>
              <p className="text-2xl font-heading font-bold text-accent">
                {isLoading ? <Skeleton className="h-8 w-20" /> : `$${(totalValue / 1000000).toFixed(1)}M`}
              </p>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Won Contracts</p>
              <p className="text-2xl font-heading font-bold text-success">
                {isLoading ? <Skeleton className="h-8 w-12" /> : contractsByStage.won?.length || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board */}
        <Card variant="glass" className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Pipeline Board
              <span className="text-xs font-normal text-muted-foreground ml-2">
                Drag cards to move between stages
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {isLoading ? (
              <div className="flex gap-4 overflow-x-auto pb-4">
                {PIPELINE_STAGES.slice(0, 4).map((stage) => (
                  <div key={stage.id} className="min-w-[280px] w-[280px] shrink-0">
                    <Skeleton className="h-12 rounded-t-lg mb-2" />
                    <div className="space-y-2">
                      <Skeleton className="h-32 rounded-lg" />
                      <Skeleton className="h-32 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : contracts?.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-heading font-semibold text-foreground mb-2">
                  No Contracts in Pipeline
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-4">
                  Start tracking contracts from the Search Hub to build your opportunity pipeline.
                </p>
                <Button variant="hero" asChild>
                  <a href="/dashboard/search">Find Contracts</a>
                </Button>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
                  {PIPELINE_STAGES.map((stage) => (
                    <KanbanColumn
                      key={stage.id}
                      stage={stage}
                      contracts={contractsByStage[stage.id]}
                      movingContractId={movingContractId}
                    />
                  ))}
                </div>
              </DragDropContext>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default JourneyHub;
