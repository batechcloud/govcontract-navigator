import { FileText, Clock, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrackedContract } from "@/hooks/useTrackedContracts";
import { format, formatDistanceToNow, isPast } from "date-fns";

interface OpportunityCardProps {
  contract: TrackedContract;
  onRemove?: (contractId: string) => void;
  showRemove?: boolean;
}

export const OpportunityCard = ({ contract, onRemove, showRemove }: OpportunityCardProps) => {
  const deadline = contract.response_deadline 
    ? new Date(contract.response_deadline) 
    : null;
  
  const isOverdue = deadline ? isPast(deadline) : false;
  const deadlineText = deadline 
    ? format(deadline, "MMM d, yyyy")
    : "No deadline";
  
  const timeRemaining = deadline && !isOverdue
    ? formatDistanceToNow(deadline, { addSuffix: true })
    : null;

  const priorityColors: Record<string, string> = {
    high: "bg-red-500/20 text-red-400 border-red-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    low: "bg-green-500/20 text-green-400 border-green-500/30",
  };

  return (
    <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
      <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
        <FileText className="w-6 h-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-heading font-semibold text-foreground mb-1 truncate">
          {contract.contract_title}
        </h4>
        <p className="text-sm text-muted-foreground mb-2">
          {contract.contract_agency || "Unknown Agency"}
        </p>
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {contract.contract_value && (
            <span className="text-accent font-semibold">{contract.contract_value}</span>
          )}
          <span className={`flex items-center gap-1 ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
            <Clock className="w-3 h-3" />
            {deadlineText}
            {timeRemaining && <span className="text-muted-foreground">({timeRemaining})</span>}
          </span>
          {contract.set_aside && (
            <Badge variant="outline" className="text-xs">
              {contract.set_aside}
            </Badge>
          )}
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        {contract.match_score && (
          <Badge variant="success">{contract.match_score}% Match</Badge>
        )}
        <Badge className={priorityColors[contract.priority] || priorityColors.medium}>
          <Star className="w-3 h-3 mr-1" />
          {contract.priority}
        </Badge>
        {showRemove && onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(contract.contract_id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
