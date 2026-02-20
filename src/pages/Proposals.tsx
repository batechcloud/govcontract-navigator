import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { FileText, Plus, Clock, Edit, Trash2, Loader2, Filter, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Proposals() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date_desc");

  const { data: proposals, isLoading } = useQuery({
    queryKey: ["proposals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proposals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteProposal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("proposals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast({ title: "Proposal deleted", description: "The proposal has been removed." });
      setDeletingId(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setDeletingId(null);
    },
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft": return { label: "Draft", className: "bg-muted text-muted-foreground" };
      case "in_progress": return { label: "Writing", className: "bg-amber-500/20 text-amber-400" };
      case "review": return { label: "Reviewing", className: "bg-primary/20 text-primary" };
      case "submitted": return { label: "Submitted", className: "bg-success/20 text-success" };
    default: return { label: status, className: "bg-muted text-muted-foreground" };
    }
  };

  const filteredAndSorted = useMemo(() => {
    if (!proposals) return [];
    let list = [...proposals];

    if (statusFilter !== "all") {
      list = list.filter((p) => p.status === statusFilter);
    }

    switch (sortBy) {
      case "date_asc":
        list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "date_desc":
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "score_desc":
        list.sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0));
        break;
      case "title_asc":
        list.sort((a, b) => a.opportunity_title.localeCompare(b.opportunity_title));
        break;
    }

    return list;
  }, [proposals, statusFilter, sortBy]);

  return (
    <DashboardLayout title="My Proposals">
      <div className="space-y-6">
        <motion.div
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h2 className="text-2xl font-bold text-foreground">My Proposals</h2>
            <p className="text-muted-foreground">Your bids and proposals in one place</p>
          </div>
          <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link to="/dashboard/proposals/generator">
              <Plus className="w-4 h-4 mr-2" />
              Start New Bid
            </Link>
          </Button>
        </motion.div>

        {/* Filter & Sort Controls */}
        <motion.div
          className="flex flex-wrap items-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-9 text-sm bg-card/50 border-border/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="in_progress">Writing</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px] h-9 text-sm bg-card/50 border-border/50">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Newest First</SelectItem>
                <SelectItem value="date_asc">Oldest First</SelectItem>
                <SelectItem value="score_desc">Highest Match</SelectItem>
                <SelectItem value="title_asc">Title A–Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {proposals && (
            <span className="text-sm text-muted-foreground ml-auto">
              {filteredAndSorted.length} of {proposals.length} proposals
            </span>
          )}
        </motion.div>

        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} variant="glass">
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex-1">
                      <Skeleton className="h-5 w-3/4 mb-3" />
                      <div className="flex gap-3">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-9 w-20" />
                      <Skeleton className="h-9 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredAndSorted.length > 0 ? (
            filteredAndSorted.map((proposal) => {
              const status = getStatusLabel(proposal.status);
              return (
                <Card key={proposal.id} variant="glass-hover">
                  <CardContent className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{proposal.opportunity_title}</h3>
                        {proposal.agency && (
                          <p className="text-sm text-muted-foreground truncate">{proposal.agency}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                          <Badge className={status.className}>{status.label}</Badge>
                          {proposal.match_score && (
                            <Badge className="bg-success/20 text-success">{proposal.match_score}% match</Badge>
                          )}
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Created {new Date(proposal.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/dashboard/proposals/${proposal.id}`}>
                            <Edit className="w-4 h-4 mr-1" /> Edit
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeletingId(proposal.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card variant="glass" className="text-center py-16">
              <CardContent>
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Proposals Yet</h3>
                <p className="text-muted-foreground mb-6">Find a contract and let AI help you write your first bid</p>
                <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Link to="/dashboard/proposals/generator">
                    <Plus className="w-4 h-4 mr-2" />
                    Start New Bid
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Proposal?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this proposal. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => deletingId && deleteProposal.mutate(deletingId)}
              disabled={deleteProposal.isPending}
            >
              {deleteProposal.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
