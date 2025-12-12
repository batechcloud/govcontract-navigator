import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Trophy,
  XCircle,
  Clock,
  MinusCircle,
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  Loader2,
  BarChart3,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useWinLossRecords, useAddWinLossRecord, useDeleteWinLossRecord, WinLossRecord } from "@/hooks/useCompetitorIntelligence";
import { format } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const OUTCOME_CONFIG = {
  won: { label: "Won", icon: Trophy, color: "text-success", bg: "bg-success/20" },
  lost: { label: "Lost", icon: XCircle, color: "text-destructive", bg: "bg-destructive/20" },
  pending: { label: "Pending", icon: Clock, color: "text-accent", bg: "bg-accent/20" },
  no_bid: { label: "No Bid", icon: MinusCircle, color: "text-muted-foreground", bg: "bg-muted" },
};

const WinLossAnalysis = () => {
  const { data: records, isLoading } = useWinLossRecords();
  const addRecord = useAddWinLossRecord();
  const deleteRecord = useDeleteWinLossRecord();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRecord, setNewRecord] = useState<Partial<WinLossRecord>>({
    outcome: "pending",
  });

  // Calculate stats
  const stats = records?.reduce(
    (acc, r) => {
      acc[r.outcome]++;
      if (r.outcome === "won") acc.wonValue += r.award_amount || 0;
      if (r.outcome === "lost") acc.lostValue += r.award_amount || 0;
      return acc;
    },
    { won: 0, lost: 0, pending: 0, no_bid: 0, wonValue: 0, lostValue: 0 }
  ) || { won: 0, lost: 0, pending: 0, no_bid: 0, wonValue: 0, lostValue: 0 };

  const winRate = stats.won + stats.lost > 0 
    ? ((stats.won / (stats.won + stats.lost)) * 100).toFixed(0) 
    : "0";

  const pieData = [
    { name: "Won", value: stats.won, color: "#2ECC71" },
    { name: "Lost", value: stats.lost, color: "#EF4444" },
    { name: "Pending", value: stats.pending, color: "#FFD700" },
    { name: "No Bid", value: stats.no_bid, color: "#6B7280" },
  ].filter(d => d.value > 0);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  };

  const handleSubmit = () => {
    if (!newRecord.opportunity_title || !newRecord.outcome) return;
    
    addRecord.mutate(newRecord, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setNewRecord({ outcome: "pending" });
      },
    });
  };

  return (
    <DashboardLayout title="Win/Loss Analysis">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Card variant="glass">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
              <p className="text-2xl font-heading font-bold text-success">
                {isLoading ? <Skeleton className="h-8 w-12" /> : `${winRate}%`}
              </p>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Won</p>
              <p className="text-2xl font-heading font-bold text-success">
                {isLoading ? <Skeleton className="h-8 w-8" /> : stats.won}
              </p>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Lost</p>
              <p className="text-2xl font-heading font-bold text-destructive">
                {isLoading ? <Skeleton className="h-8 w-8" /> : stats.lost}
              </p>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Won Value</p>
              <p className="text-2xl font-heading font-bold text-accent">
                {isLoading ? <Skeleton className="h-8 w-16" /> : formatCurrency(stats.wonValue)}
              </p>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Pending</p>
              <p className="text-2xl font-heading font-bold text-foreground">
                {isLoading ? <Skeleton className="h-8 w-8" /> : stats.pending}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chart */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Outcome Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No data yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Records List */}
          <Card variant="glass" className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Bid Records</CardTitle>
                <CardDescription>Track your wins, losses, and lessons learned.</CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="hero" size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Record
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Win/Loss Record</DialogTitle>
                    <DialogDescription>
                      Record a bid outcome to track your performance over time.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Opportunity Title *</Label>
                      <Input
                        id="title"
                        value={newRecord.opportunity_title || ""}
                        onChange={(e) => setNewRecord({ ...newRecord, opportunity_title: e.target.value })}
                        placeholder="Contract title or solicitation number"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Outcome *</Label>
                        <Select
                          value={newRecord.outcome}
                          onValueChange={(v) => setNewRecord({ ...newRecord, outcome: v as WinLossRecord["outcome"] })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="won">Won</SelectItem>
                            <SelectItem value="lost">Lost</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="no_bid">No Bid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="agency">Agency</Label>
                        <Input
                          id="agency"
                          value={newRecord.agency || ""}
                          onChange={(e) => setNewRecord({ ...newRecord, agency: e.target.value })}
                          placeholder="Awarding agency"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bid_amount">Bid Amount</Label>
                        <Input
                          id="bid_amount"
                          type="number"
                          value={newRecord.bid_amount || ""}
                          onChange={(e) => setNewRecord({ ...newRecord, bid_amount: parseFloat(e.target.value) || undefined })}
                          placeholder="$0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="award_amount">Award Amount</Label>
                        <Input
                          id="award_amount"
                          type="number"
                          value={newRecord.award_amount || ""}
                          onChange={(e) => setNewRecord({ ...newRecord, award_amount: parseFloat(e.target.value) || undefined })}
                          placeholder="$0"
                        />
                      </div>
                    </div>
                    {newRecord.outcome === "lost" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="winner">Winner Name</Label>
                          <Input
                            id="winner"
                            value={newRecord.winner_name || ""}
                            onChange={(e) => setNewRecord({ ...newRecord, winner_name: e.target.value })}
                            placeholder="Who won the contract?"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="loss_reason">Reason for Loss</Label>
                          <Textarea
                            id="loss_reason"
                            value={newRecord.loss_reason || ""}
                            onChange={(e) => setNewRecord({ ...newRecord, loss_reason: e.target.value })}
                            placeholder="What went wrong?"
                          />
                        </div>
                      </>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="lessons">Lessons Learned</Label>
                      <Textarea
                        id="lessons"
                        value={newRecord.lessons_learned || ""}
                        onChange={(e) => setNewRecord({ ...newRecord, lessons_learned: e.target.value })}
                        placeholder="What can you improve next time?"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      variant="hero" 
                      onClick={handleSubmit}
                      disabled={!newRecord.opportunity_title || addRecord.isPending}
                    >
                      {addRecord.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Save Record"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : !records?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>No records yet. Add your first bid outcome.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {records.map((record) => {
                    const config = OUTCOME_CONFIG[record.outcome];
                    const Icon = config.icon;
                    
                    return (
                      <div
                        key={record.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50"
                      >
                        <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                          <Icon className={`w-4 h-4 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-sm text-foreground line-clamp-1">
                                {record.opportunity_title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {record.agency || "Unknown Agency"}
                                {record.decision_date && ` • ${format(new Date(record.decision_date), "MMM d, yyyy")}`}
                              </p>
                            </div>
                            <Badge variant="outline" className={config.color}>
                              {config.label}
                            </Badge>
                          </div>
                          {record.award_amount && (
                            <p className="text-sm text-accent font-semibold mt-1">
                              {formatCurrency(record.award_amount)}
                            </p>
                          )}
                          {record.winner_name && record.outcome === "lost" && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Winner: {record.winner_name}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default WinLossAnalysis;
