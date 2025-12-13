import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { FileText, Plus, Search, Filter, Clock, CheckCircle, Edit, Trash2 } from "lucide-react";
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-muted text-muted-foreground";
      case "in_progress": return "bg-amber-500/20 text-amber-400";
      case "review": return "bg-primary/20 text-primary";
      case "submitted": return "bg-emerald-500/20 text-emerald-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <DashboardLayout title="Proposals">
      <div className="space-y-6">
        {/* Header */}
        <motion.div 
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h2 className="text-2xl font-bold text-foreground">My Proposals</h2>
            <p className="text-muted-foreground">Manage and track your proposal submissions</p>
          </div>
          <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link to="/dashboard/proposals/generator">
              <Plus className="w-4 h-4 mr-2" />
              New Proposal
            </Link>
          </Button>
        </motion.div>

        {/* Search and Filter */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search proposals..." className="pl-10" />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </motion.div>

        {/* Proposals List */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading proposals...</div>
          ) : proposals && proposals.length > 0 ? (
            proposals.map((proposal) => (
              <div 
                key={proposal.id}
                className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6 hover:border-primary/50 transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-2">
                      <FileText className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-foreground">{proposal.opportunity_title}</h3>
                        <p className="text-sm text-muted-foreground">{proposal.agency || 'Agency not specified'}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 ml-8">
                      <Badge className={getStatusColor(proposal.status)}>
                        {proposal.status.replace('_', ' ')}
                      </Badge>
                      {proposal.match_score && (
                        <span className="text-sm text-muted-foreground">
                          Match: {proposal.match_score}%
                        </span>
                      )}
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Updated {new Date(proposal.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-8 lg:ml-0">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/dashboard/proposals/${proposal.id}`}>
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Proposals Yet</h3>
              <p className="text-muted-foreground mb-6">Create your first AI-powered proposal to get started</p>
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link to="/dashboard/proposals/generator">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Proposal
                </Link>
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
