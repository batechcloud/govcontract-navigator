import { useState, useMemo } from "react";
import { TrackedContract } from "@/hooks/useTrackedContracts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, ChevronDown, Clock, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
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

type SortKey = "deadline" | "value" | "added";
type SortDir = "asc" | "desc";

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

function parseValue(v: string | null): number {
  if (!v) return 0;
  const n = parseFloat(v.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
  return dir === "asc" ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />;
}

export function ListView({ contracts, onStatusChange, onDelete }: Props) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = useMemo(() => {
    if (!sortKey) return contracts;
    return [...contracts].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "deadline") {
        const ta = a.response_deadline ? new Date(a.response_deadline).getTime() : Infinity;
        const tb = b.response_deadline ? new Date(b.response_deadline).getTime() : Infinity;
        cmp = ta - tb;
      } else if (sortKey === "value") {
        cmp = parseValue(a.contract_value) - parseValue(b.contract_value);
      } else {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [contracts, sortKey, sortDir]);

  if (contracts.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-lg border border-border/50">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50 bg-muted/30">
            <th className="text-left p-3 text-xs font-medium text-muted-foreground">Title</th>
            <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Agency</th>
            <th
              className="text-left p-3 text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
              onClick={() => toggleSort("deadline")}
            >
              <span className="flex items-center gap-1">Deadline <SortIcon active={sortKey === "deadline"} dir={sortDir} /></span>
            </th>
            <th
              className="text-left p-3 text-xs font-medium text-muted-foreground hidden sm:table-cell cursor-pointer select-none hover:text-foreground transition-colors"
              onClick={() => toggleSort("value")}
            >
              <span className="flex items-center gap-1">Value <SortIcon active={sortKey === "value"} dir={sortDir} /></span>
            </th>
            <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
            <th
              className="p-3 text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors text-left"
              onClick={() => toggleSort("added")}
            >
              <span className="flex items-center gap-1">Added <SortIcon active={sortKey === "added"} dir={sortDir} /></span>
            </th>
            <th className="p-3 w-10" />
          </tr>
        </thead>
        <tbody>
          {sorted.map(c => {
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
                <td className="p-3 text-xs text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
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
