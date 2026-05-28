import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { format } from "date-fns";
import { CreditCard, Search, Loader2, DollarSign } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAdminSubscriptions } from "@/hooks/useAdminSubscriptions";
import { usePageTitle } from "@/hooks/usePageTitle";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  trialing: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  past_due: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
  canceled: "bg-destructive/15 text-destructive border-destructive/30",
  inactive: "bg-muted text-muted-foreground border-border",
};

function fmtCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format((cents ?? 0) / 100);
}

export default function AdminSubscriptions() {
  usePageTitle("Admin Subscriptions");
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: rows = [], isLoading } = useAdminSubscriptions();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");

  const filtered = useMemo(() => {
    let r = rows;
    if (status !== "all") r = r.filter((x) => x.status === status);
    const needle = q.trim().toLowerCase();
    if (needle) {
      r = r.filter(
        (x) =>
          x.email?.toLowerCase().includes(needle) ||
          x.plan_name?.toLowerCase().includes(needle),
      );
    }
    return r;
  }, [rows, q, status]);

  const mrr = rows
    .filter((r) => r.status === "active")
    .reduce((sum, r) => sum + (r.monthly_price ?? 0), 0);
  const active = rows.filter((r) => r.status === "active").length;
  const churned = rows.filter((r) => ["cancelled", "canceled", "inactive"].includes(r.status))
    .length;

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground flex items-center gap-2">
          <CreditCard className="w-7 h-7 text-primary" /> Subscriptions
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          All paid plans across the platform. Read-only view; billing changes happen via Stripe.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniCard label="MRR (est.)" value={fmtCents(mrr)} icon={<DollarSign className="w-4 h-4" />} tone="primary" />
        <MiniCard label="Active" value={active.toString()} />
        <MiniCard label="Churned / inactive" value={churned.toString()} tone={churned ? "warn" : "default"} />
        <MiniCard label="Total" value={rows.length.toString()} />
      </div>

      <Card className="p-4 flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by email or plan…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trialing">Trialing</SelectItem>
            <SelectItem value="past_due">Past due</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Monthly</TableHead>
              <TableHead>Period start</TableHead>
              <TableHead>Period end</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin inline" />
                </TableCell>
              </TableRow>
            )}
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  No subscriptions match.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((s) => (
              <TableRow key={s.subscription_id}>
                <TableCell className="text-sm">{s.email ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{s.plan_name}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={STATUS_COLORS[s.status] ?? "bg-muted text-muted-foreground"}>
                    {s.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {fmtCents(s.monthly_price)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {s.current_period_start ? format(new Date(s.current_period_start), "MMM d, yyyy") : "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {s.current_period_end ? format(new Date(s.current_period_end), "MMM d, yyyy") : "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {format(new Date(s.created_at), "MMM d, yyyy")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function MiniCard({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  tone?: "default" | "primary" | "warn";
}) {
  const cls =
    tone === "primary"
      ? "text-primary"
      : tone === "warn"
      ? "text-amber-400"
      : "text-foreground";
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={`mt-2 text-2xl font-heading font-bold ${cls}`}>{value}</div>
    </Card>
  );
}
