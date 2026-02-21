import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Heart, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useTrackedContracts, useUntrackContract, useUpdateContractStatus, useUpdateContractNotes, TrackedContract } from "@/hooks/useTrackedContracts";
import { PipelineAnalytics } from "@/components/tracked/PipelineAnalytics";
import { KanbanBoard } from "@/components/tracked/KanbanBoard";
import { ListView } from "@/components/tracked/ListView";
import { OpportunityFilters } from "@/components/tracked/OpportunityFilters";
import { NotesModal } from "@/components/tracked/NotesModal";

const TrackedContracts = () => {
  const { data: contracts, isLoading } = useTrackedContracts();
  const untrackContract = useUntrackContract();
  const updateStatus = useUpdateContractStatus();
  const updateNotes = useUpdateContractNotes();
  const [selectedContract, setSelectedContract] = useState<TrackedContract | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("all");
  const [view, setView] = useState<"board" | "list">(() => {
    try { return (localStorage.getItem("opp-view") as "board" | "list") || "board"; } catch { return "board"; }
  });

  const handleViewChange = (v: "board" | "list") => {
    setView(v);
    try { localStorage.setItem("opp-view", v); } catch {}
  };

  const filtered = useMemo(() => {
    if (!contracts) return [];
    let result = contracts;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c => c.contract_title.toLowerCase().includes(q) || (c.contract_agency || "").toLowerCase().includes(q));
    }
    if (priority !== "all") {
      result = result.filter(c => c.priority === priority);
    }
    return result;
  }, [contracts, search, priority]);

  const handleStatusChange = (id: string, status: string) => {
    updateStatus.mutate({ id, status });
  };

  const handleDelete = (id: string) => {
    untrackContract.mutate(id);
  };

  const handleCardClick = (contract: TrackedContract) => {
    setSelectedContract(contract);
    setNotesOpen(true);
  };

  const handleSaveNotes = (id: string, notes: string) => {
    updateNotes.mutate({ id, notes }, { onSuccess: () => setNotesOpen(false) });
  };

  return (
    <DashboardLayout title="My Opportunities">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Filters */}
        <OpportunityFilters
          search={search}
          onSearchChange={setSearch}
          priority={priority}
          onPriorityChange={setPriority}
          view={view}
          onViewChange={handleViewChange}
          contracts={filtered}
        />

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="glass">
                <CardContent className="p-4">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : contracts && contracts.length === 0 ? (
          <Card className="glass">
            <CardContent className="p-12 text-center">
              <Heart className="w-14 h-14 mx-auto mb-4 text-muted-foreground opacity-40" />
              <h3 className="text-lg font-heading font-semibold text-foreground mb-2">No tracked opportunities yet</h3>
              <p className="text-muted-foreground text-sm mb-4">Search for contracts and save the ones that interest you.</p>
              <Button variant="default" asChild>
                <Link to="/dashboard/search">
                  <Search className="w-4 h-4 mr-2" />
                  Find Contracts
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Analytics */}
            <PipelineAnalytics contracts={contracts || []} />

            {/* Board or List */}
            {view === "board" ? (
              <KanbanBoard contracts={filtered} onStatusChange={handleStatusChange} onDelete={handleDelete} onCardClick={handleCardClick} />
            ) : (
              <ListView contracts={filtered} onStatusChange={handleStatusChange} onDelete={handleDelete} />
            )}

            {filtered.length === 0 && contracts && contracts.length > 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No opportunities match your filters.</p>
            )}
          </>
        )}
      </motion.div>

      <NotesModal
        contract={selectedContract}
        open={notesOpen}
        onOpenChange={setNotesOpen}
        onSave={handleSaveNotes}
        saving={updateNotes.isPending}
      />
    </DashboardLayout>
  );
};

export default TrackedContracts;
