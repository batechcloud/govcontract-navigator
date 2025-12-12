import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Target } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { OpportunityCard } from "@/components/dashboard/OpportunityCard";
import { useTrackedContracts, useUntrackContract } from "@/hooks/useTrackedContracts";

const TrackedContracts = () => {
  const { data: contracts, isLoading } = useTrackedContracts();
  const untrackContract = useUntrackContract();

  const handleRemove = (contractId: string) => {
    untrackContract.mutate(contractId);
  };

  // Group contracts by status
  const groupedContracts = {
    watching: contracts?.filter(c => c.status === "watching") || [],
    qualifying: contracts?.filter(c => c.status === "qualifying") || [],
    proposal: contracts?.filter(c => c.status === "proposal") || [],
    submitted: contracts?.filter(c => c.status === "submitted") || [],
    won: contracts?.filter(c => c.status === "won") || [],
    lost: contracts?.filter(c => c.status === "lost") || [],
  };

  const statusLabels: Record<string, { label: string; color: string }> = {
    watching: { label: "Watching", color: "bg-blue-500" },
    qualifying: { label: "Qualifying", color: "bg-yellow-500" },
    proposal: { label: "Writing Proposal", color: "bg-purple-500" },
    submitted: { label: "Submitted", color: "bg-green-500" },
    won: { label: "Won", color: "bg-emerald-500" },
    lost: { label: "Lost", color: "bg-red-500" },
  };

  return (
    <DashboardLayout title="Tracked Contracts">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} variant="glass">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-48 mb-2" />
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : contracts?.length === 0 ? (
          <Card variant="glass">
            <CardContent className="p-12 text-center">
              <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-heading font-semibold text-foreground mb-2">
                No Tracked Contracts
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Start tracking contracts from the Search Hub to build your opportunity pipeline.
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedContracts).map(([status, statusContracts]) => {
            if (statusContracts.length === 0) return null;
            const { label, color } = statusLabels[status];
            
            return (
              <Card key={status} variant="glass">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${color}`} />
                    {label}
                    <span className="text-muted-foreground font-normal">({statusContracts.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {statusContracts.map((contract) => (
                    <OpportunityCard
                      key={contract.id}
                      contract={contract}
                      onRemove={handleRemove}
                      showRemove
                    />
                  ))}
                </CardContent>
              </Card>
            );
          })
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default TrackedContracts;
