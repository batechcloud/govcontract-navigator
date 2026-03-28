import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, LayoutGrid, List } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrackedContract } from "@/hooks/useTrackedContracts";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  priority: string;
  onPriorityChange: (v: string) => void;
  view: "board" | "list";
  onViewChange: (v: "board" | "list") => void;
  contracts: TrackedContract[];
}

function sanitizeCell(val: unknown): string {
  const str = String(val ?? "");
  const escaped = str.replace(/"/g, '""');
  if (/^[=+\-@\t\r]/.test(escaped)) return `"'${escaped}"`;
  return `"${escaped}"`;
}

function exportCSV(contracts: TrackedContract[]) {
  const headers = ["Title", "Agency", "Status", "Priority", "Value", "Deadline", "Notes"];
  const rows = contracts.map(c => [
    c.contract_title, c.contract_agency || "", c.status, c.priority || "", c.contract_value || "",
    c.response_deadline || "", c.notes || "",
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => sanitizeCell(v)).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "opportunities.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function OpportunityFilters({ search, onSearchChange, priority, onPriorityChange, view, onViewChange, contracts }: Props) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by title or agency..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-9 bg-muted/30 border-border/50"
        />
      </div>
      <Select value={priority} onValueChange={onPriorityChange}>
        <SelectTrigger className="w-[130px] bg-muted/30 border-border/50">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex items-center gap-1 border border-border/50 rounded-lg p-0.5">
        <Button variant={view === "board" ? "secondary" : "ghost"} size="sm" className="h-8 px-2.5" onClick={() => onViewChange("board")}>
          <LayoutGrid className="w-4 h-4" />
        </Button>
        <Button variant={view === "list" ? "secondary" : "ghost"} size="sm" className="h-8 px-2.5" onClick={() => onViewChange("list")}>
          <List className="w-4 h-4" />
        </Button>
      </div>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportCSV(contracts)}>
        <Download className="w-4 h-4" />
        CSV
      </Button>
    </div>
  );
}
