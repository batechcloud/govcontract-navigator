import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { FileText, Plus, Search, Clock, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Proposals() {
  const { data: proposals, isLoading } = useQuery({
    queryKey: ['proposals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
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

        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : proposals && proposals.length > 0 ? (
            proposals.map((proposal) => {
              const status = getStatusLabel(proposal.status);
              return (
                <div 
                  key={proposal.id}
                  className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-5 hover:border-primary/50 transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{proposal.opportunity_title}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <Badge className={status.className}>{status.label}</Badge>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Updated {new Date(proposal.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/dashboard/proposals/${proposal.id}`}>
                          <Edit className="w-4 h-4 mr-1" /> Edit
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Proposals Yet</h3>
              <p className="text-muted-foreground mb-6">Find a contract and let AI help you write your first bid</p>
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link to="/dashboard/proposals/generator">
                  <Plus className="w-4 h-4 mr-2" />
                  Start New Bid
                </Link>
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
