import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Heart, Clock, Building2, Trash2, Search, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useTrackedContracts, useUntrackContract, useUpdateContractStatus } from "@/hooks/useTrackedContracts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

type TabKey = "saved" | "in_progress" | "completed";

const tabs: { key: TabKey; label: string }[] = [
  { key: "saved", label: "Saved" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

const STATUS_OPTIONS = [
  { value: "watching", label: "Saved", tab: "saved" as TabKey },
  { value: "qualifying", label: "Qualifying", tab: "in_progress" as TabKey },
  { value: "proposal", label: "Writing Proposal", tab: "in_progress" as TabKey },
  { value: "submitted", label: "Submitted", tab: "in_progress" as TabKey },
  { value: "won", label: "Won", tab: "completed" as TabKey },
  { value: "lost", label: "Lost", tab: "completed" as TabKey },
];

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "won": return "default";
    case "lost": return "destructive";
    case "submitted": return "secondary";
    default: return "outline";
  }
};

const TrackedContracts = () => {
  const { data: contracts, isLoading } = useTrackedContracts();
  const untrackContract = useUntrackContract();
  const updateStatus = useUpdateContractStatus();
  const [activeTab, setActiveTab] = useState<TabKey>("saved");

  const grouped = {
    saved: contracts?.filter(c => c.status === "watching") || [],
    in_progress: contracts?.filter(c => ["qualifying", "proposal", "submitted"].includes(c.status || "")) || [],
    completed: contracts?.filter(c => ["won", "lost"].includes(c.status || "")) || [],
  };

  const currentContracts = grouped[activeTab];

  const getDaysLeft = (deadline: string | null) => {
    if (!deadline) return null;
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { text: "Expired", className: "text-destructive" };
    if (days <= 3) return { text: `${days}d left`, className: "text-destructive" };
    if (days <= 7) return { text: `${days}d left`, className: "text-accent" };
    return { text: `${days}d left`, className: "text-success" };
  };

  const getStatusLabel = (status: string) => STATUS_OPTIONS.find(s => s.value === status)?.label || status;

  return (
    <DashboardLayout title="My Opportunities">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Tabs */}
        <div className="flex gap-2 border-b border-border pb-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.key
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              <span className="ml-2 text-xs opacity-70">({grouped[tab.key].length})</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} variant="glass">
                <CardContent className="p-4">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : currentContracts.length === 0 ? (
          <Card variant="glass">
            <CardContent className="p-12 text-center">
              <Heart className="w-14 h-14 mx-auto mb-4 text-muted-foreground opacity-40" />
              <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
                {activeTab === "saved" && "No saved contracts yet"}
                {activeTab === "in_progress" && "Nothing in progress"}
                {activeTab === "completed" && "No completed bids yet"}
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                {activeTab === "saved" && "Search for contracts and save the ones that interest you."}
                {activeTab === "in_progress" && "Move saved contracts to 'in progress' when you start working on them."}
                {activeTab === "completed" && "Completed bids will appear here."}
              </p>
              {activeTab === "saved" && (
                <Button variant="hero" asChild>
                  <Link to="/dashboard/search">
                    <Search className="w-4 h-4 mr-2" />
                    Find Contracts
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {currentContracts.map(contract => {
              const deadline = getDaysLeft(contract.response_deadline);
              return (
                <Card key={contract.id} variant="glass-hover">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-heading font-semibold text-foreground mb-1 truncate">
                          {contract.contract_title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          {contract.contract_agency && (
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5" />
                              {contract.contract_agency}
                            </span>
                          )}
                          {deadline && (
                            <span className={`flex items-center gap-1 font-medium ${deadline.className}`}>
                              <Clock className="w-3.5 h-3.5" />
                              {deadline.text}
                            </span>
                          )}
                          {contract.contract_value && (
                            <span className="text-accent">{contract.contract_value}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="text-xs gap-1">
                              <Badge variant={getStatusBadgeVariant(contract.status)} className="text-[10px] px-1.5">
                                {getStatusLabel(contract.status)}
                              </Badge>
                              <ChevronDown className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {STATUS_OPTIONS.map(opt => (
                              <DropdownMenuItem
                                key={opt.value}
                                onClick={() => updateStatus.mutate({ id: contract.id, status: opt.value })}
                                disabled={contract.status === opt.value}
                                className={contract.status === opt.value ? "font-semibold" : ""}
                              >
                                {opt.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => untrackContract.mutate(contract.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default TrackedContracts;
