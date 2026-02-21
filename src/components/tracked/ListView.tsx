import { TrackedContract } from "@/hooks/useTrackedContracts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, ChevronDown, Clock } from "lucide-react";
import { PIPELINE_STATUSES } from "./KanbanBoard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  contracts: TrackedContract[];
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

const statusBadgeVariant = (s: string) => {
  if (s === "won") return "default" as const;
  if (s === "lost") return "destructive" as const;
  if (s === "submitted") return "secondary" as const;
  return "outline" as const;
};

function getDaysLeft(deadline: string | null) {
  if (!deadline) return null;
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (days < 0) return { text: "Expired", cls: "text-destructive" };
  if (days <= 3) return { text: `${days}d`, cls: "text-destructive" };
  if (days <= 7) return { text: `${days}d`, cls: "text-accent" };
  return { text: `${days}d`, cls: "text-success" };
}

export function ListView({ contracts, onStatusChange, onDelete }: Props) {
  if (contracts.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-lg border border-border/50">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50 bg-muted/30">
            <th className="text-left p-3 text-xs font-medium text-muted-foreground">Title</th>
            <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Agency</th>
            <th className="text-left p-3 text-xs font-medium text-muted-foreground">Deadline</th>
            <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Value</th>
            <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
            <th className="p-3 w-10" />
          </tr>
        </thead>
        <tbody>
          {contracts.map(c => {
            const dl = getDaysLeft(c.response_deadline);
            const label = PIPELINE_STATUSES.find(s => s.value === c.status)?.label || c.status;
            return (
              <tr key={c.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                <td className="p-3 font-medium text-foreground max-w-[200px] truncate">{c.contract_title}</td>
                <td className="p-3 text-muted-foreground text-xs hidden md:table-cell max-w-[150px] truncate">{c.contract_agency || "—"}</td>
                <td className="p-3">
                  {dl ? (
                    <span className={`text-xs font-medium flex items-center gap-1 ${dl.cls}`}>
                      <Clock className="w-3 h-3" />
                      {dl.text}
                    </span>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </td>
                <td className="p-3 text-xs text-accent hidden sm:table-cell">{c.contract_value || "—"}</td>
                <td className="p-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs gap-1 h-7">
                        <Badge variant={statusBadgeVariant(c.status)} className="text-[10px] px-1.5">
                          {label}
                        </Badge>
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {PIPELINE_STATUSES.map(opt => (
                        <DropdownMenuItem
                          key={opt.value}
                          onClick={() => onStatusChange(c.id, opt.value)}
                          disabled={c.status === opt.value}
                          className={c.status === opt.value ? "font-semibold" : ""}
                        >
                          {opt.emoji} {opt.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
                <td className="p-3">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(c.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
