import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Search,
  FileText,
  Building2,
  Sparkles,
  SlidersHorizontal,
  Clock,
  DollarSign,
  MapPin,
  Star,
  Target,
  Save,
  X,
  Bookmark,
  ExternalLink,
  Heart,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useTrackContract, useTrackedContracts } from "@/hooks/useTrackedContracts";
import { useSmartSearch, useSaveSearch, SearchFilters, SearchResult } from "@/hooks/useSearch";
import { toast } from "sonner";

const quickFilters = [
  { label: "Small Business", filter: { set_aside: ["Small Business"] } },
  { label: "Veteran-Owned", filter: { set_aside: ["SDVOSB", "VOSB"] } },
  { label: "Woman-Owned", filter: { set_aside: ["WOSB", "EDWOSB"] } },
  { label: "Minority-Owned", filter: { set_aside: ["8(a)", "SDB"] } },
  { label: "HUBZone", filter: { set_aside: ["HUBZone"] } },
  { label: "Federal", filter: { opportunity_type: "Federal" } },
];

const SearchHub = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  
  const { 
    search, 
    searchWithFilters,
    isSearching, 
    results, 
    parsedFilters, 
    total,
    isParsing 
  } = useSmartSearch();
  
  const trackContract = useTrackContract();
  const { data: trackedContracts } = useTrackedContracts();
  const saveSearch = useSaveSearch();

  const trackedIds = new Set(trackedContracts?.map(c => c.contract_id) || []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }
    try {
      await search(searchQuery);
    } catch (error) {}
  };

  const handleQuickFilter = async (filter: typeof quickFilters[0]) => {
    const filterKey = filter.label;
    let newActiveFilters: string[];
    
    if (activeFilters.includes(filterKey)) {
      newActiveFilters = activeFilters.filter(f => f !== filterKey);
    } else {
      newActiveFilters = [...activeFilters, filterKey];
    }
    
    setActiveFilters(newActiveFilters);
    
    const combinedFilters: SearchFilters = {
      keywords: searchQuery ? searchQuery.split(' ').filter(w => w.length > 2) : [],
      naics_codes: [],
      set_aside: [],
      agencies: [],
      min_value: null,
      max_value: null,
      location: null,
      opportunity_type: null
    };
    
    newActiveFilters.forEach(key => {
      const qf = quickFilters.find(f => f.label === key);
      if (qf?.filter.set_aside) {
        combinedFilters.set_aside.push(...qf.filter.set_aside);
      }
      if (qf?.filter.opportunity_type) {
        combinedFilters.opportunity_type = qf.filter.opportunity_type;
      }
    });
    
    if (newActiveFilters.length > 0 || searchQuery) {
      await searchWithFilters(combinedFilters);
    }
  };

  const handleTrack = (result: SearchResult) => {
    trackContract.mutate({
      contract_id: result.id,
      contract_title: result.title,
      contract_agency: result.agency,
      response_deadline: result.deadline,
      status: "watching",
      priority: "medium",
      notes: null,
      match_score: result.matchScore,
      posted_date: result.postedDate,
      contract_value: result.value,
      set_aside: result.setAside,
      naics_code: result.naicsCode,
    });
  };

  const handleStartBid = (result: SearchResult) => {
    navigate(`/dashboard/proposals/generator?opportunityId=${result.id}&title=${encodeURIComponent(result.title)}&agency=${encodeURIComponent(result.agency)}`);
  };

  const handleSaveSearch = () => {
    if (!searchName.trim()) {
      toast.error("Please enter a name for your search");
      return;
    }
    if (!parsedFilters) {
      toast.error("Please perform a search first");
      return;
    }
    saveSearch.mutate({
      name: searchName,
      query: searchQuery,
      filters: parsedFilters
    });
    setSaveDialogOpen(false);
    setSearchName("");
  };

  const getMatchLabel = (score: number) => {
    if (score >= 90) return { text: "Great Match", className: "bg-success/20 text-success" };
    if (score >= 75) return { text: "Good Match", className: "bg-primary/20 text-primary" };
    return { text: "Possible Match", className: "bg-accent/20 text-accent" };
  };

  const getDaysLeft = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return "Expired";
    if (days === 0) return "Due today";
    if (days === 1) return "1 day left";
    return `${days} days left`;
  };

  return (
    <DashboardLayout title="Find Contracts">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Demo Mode Banner */}
        {results.length > 0 && (
          <div className="bg-accent/10 border border-accent/30 rounded-lg px-4 py-2 flex items-center gap-2 text-sm text-accent">
            <span className="font-semibold">Demo Mode:</span>
            <span className="text-muted-foreground">Showing sample contracts. Connect a SAM.gov API key to search live opportunities.</span>
          </div>
        )}
        {/* Search Bar */}
        <Card variant="glass" className="overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-accent/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                <span className="font-heading font-semibold text-foreground">Search in Plain English</span>
              </div>
              {parsedFilters && (
                <Button variant="ghost" size="sm" onClick={() => setSaveDialogOpen(true)}>
                  <Bookmark className="w-4 h-4 mr-2" />
                  Save Search
                </Button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Try: 'IT support contracts for small businesses' or 'construction projects in Texas'"
                  className="pl-12 h-12 text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button 
                variant="hero" 
                className="h-12" 
                onClick={handleSearch}
                disabled={isSearching}
              >
                {isParsing ? (
                  <Sparkles className="w-4 h-4 sm:mr-2 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 sm:mr-2" />
                )}
                <span className="hidden sm:inline">
                  {isParsing ? "Understanding..." : isSearching ? "Searching..." : "Search"}
                </span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Just type what you're looking for — our AI will find the best matches for you.
            </p>
            
            {/* Parsed filters display */}
            <AnimatePresence>
              {parsedFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-border/50"
                >
                  <p className="text-xs text-muted-foreground mb-2">We're searching for:</p>
                  <div className="flex flex-wrap gap-2">
                    {parsedFilters.keywords.length > 0 && (
                      <Badge variant="glass">
                        {parsedFilters.keywords.join(", ")}
                      </Badge>
                    )}
                    {parsedFilters.set_aside.length > 0 && (
                      <Badge variant="gold">
                        {parsedFilters.set_aside.join(", ")}
                      </Badge>
                    )}
                    {parsedFilters.agencies.length > 0 && (
                      <Badge variant="outline">
                        {parsedFilters.agencies.join(", ")}
                      </Badge>
                    )}
                    {parsedFilters.min_value && (
                      <Badge variant="outline">
                        From ${(parsedFilters.min_value / 1000000).toFixed(1)}M
                      </Badge>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Quick Filters - plain language */}
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <Badge
              key={filter.label}
              variant={activeFilters.includes(filter.label) ? "gold" : "glass"}
              className="cursor-pointer hover:bg-primary/20 transition-colors px-3 py-1.5"
              onClick={() => handleQuickFilter(filter)}
            >
              {activeFilters.includes(filter.label) && <X className="w-3 h-3 mr-1" />}
              {filter.label}
            </Badge>
          ))}
        </div>

        {/* Results */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {results.length > 0 ? (
                <>Found <span className="text-foreground font-semibold">{total}</span> contracts</>
              ) : (
                "Search above to find government contracts"
              )}
            </p>
          </div>

          <div className="space-y-4">
            {isSearching ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} variant="glass">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <Skeleton className="w-20 h-8 rounded-lg shrink-0" />
                      <div className="flex-1">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-3" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : results.length > 0 ? (
              results.map((result, index) => {
                const isTracked = trackedIds.has(result.id);
                const match = getMatchLabel(result.matchScore);
                return (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card variant="glass-hover">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col gap-3">
                          {/* Top row: badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={match.className}>{match.text}</Badge>
                            <Badge variant="outline">{result.type}</Badge>
                            {result.setAside && result.setAside !== "None" && (
                              <Badge variant="glass">{result.setAside}</Badge>
                            )}
                          </div>

                          {/* Title & Agency */}
                          <h3 className="font-heading font-semibold text-lg text-foreground">
                            {result.title}
                          </h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            {result.agency}
                          </p>

                          {/* Details row */}
                          <div className="flex flex-wrap gap-4 text-sm">
                            <span className="flex items-center gap-1 text-accent">
                              <DollarSign className="w-4 h-4" />
                              {result.value}
                            </span>
                            {result.deadline && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                {getDaysLeft(result.deadline)}
                              </span>
                            )}
                            {result.location && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <MapPin className="w-4 h-4" />
                                {result.location}
                              </span>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2 pt-1">
                            <Button variant="hero" size="sm" onClick={() => handleStartBid(result)}>
                              <FileText className="w-4 h-4 mr-2" />
                              Start Bid
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTrack(result)}
                              disabled={isTracked || trackContract.isPending}
                            >
                              {isTracked ? (
                                <><Heart className="w-4 h-4 mr-2 fill-current" /> Saved</>
                              ) : (
                                <><Heart className="w-4 h-4 mr-2" /> Save</>
                              )}
                            </Button>
                            {result.link && (
                              <Button variant="ghost" size="sm" onClick={() => window.open(result.link, '_blank')}>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View on SAM.gov
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            ) : (
              <Card variant="glass" className="text-center py-12">
                <CardContent>
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-heading font-semibold text-lg mb-2">Ready to find contracts</h3>
                  <p className="text-muted-foreground">
                    Type what your business does and we'll find matching government opportunities.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </motion.div>

      {/* Save Search Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save This Search</DialogTitle>
            <DialogDescription>
              Give it a name so you can quickly run it again later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="searchName">Name</Label>
              <Input
                id="searchName"
                placeholder="e.g., IT contracts for my business"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSearch} disabled={saveSearch.isPending}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default SearchHub;
