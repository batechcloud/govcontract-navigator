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
  ArrowUpRight,
  Save,
  X,
  Bookmark,
  ExternalLink,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useTrackContract, useTrackedContracts } from "@/hooks/useTrackedContracts";
import { useSmartSearch, useSaveSearch, SearchFilters, SearchResult } from "@/hooks/useSearch";
import { toast } from "sonner";

const quickFilters = [
  { label: "Federal", filter: { opportunity_type: "Federal" } },
  { label: "SDVOSB", filter: { set_aside: ["SDVOSB"] } },
  { label: "8(a)", filter: { set_aside: ["8(a)"] } },
  { label: "HUBZone", filter: { set_aside: ["HUBZone"] } },
  { label: "WOSB", filter: { set_aside: ["WOSB"] } },
  { label: "Small Business", filter: { set_aside: ["Small Business"] } },
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
    } catch (error) {
      // Error already handled in hook
    }
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
    
    // Build combined filters
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

  const handleGenerateProposal = (result: SearchResult) => {
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

  return (
    <DashboardLayout title="Search Hub">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* AI Search Bar */}
        <Card variant="glass" className="overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-accent/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                <span className="font-heading font-semibold text-foreground">AI-Powered Search</span>
              </div>
              {parsedFilters && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSaveDialogOpen(true)}
                >
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
                  placeholder="Try: 'IT contracts over $1M for small businesses in cybersecurity'"
                  className="pl-12 h-12 text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="h-12">
                  <SlidersHorizontal className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Filters</span>
                </Button>
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
                    {isParsing ? "Parsing..." : isSearching ? "Searching..." : "Search"}
                  </span>
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Ask in natural language. Our AI understands set-asides, NAICS codes, agencies, and more.
            </p>
            
            {/* Show parsed filters */}
            <AnimatePresence>
              {parsedFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-border/50"
                >
                  <p className="text-xs text-muted-foreground mb-2">AI extracted these filters:</p>
                  <div className="flex flex-wrap gap-2">
                    {parsedFilters.keywords.length > 0 && (
                      <Badge variant="glass">
                        Keywords: {parsedFilters.keywords.join(", ")}
                      </Badge>
                    )}
                    {parsedFilters.set_aside.length > 0 && (
                      <Badge variant="gold">
                        Set-aside: {parsedFilters.set_aside.join(", ")}
                      </Badge>
                    )}
                    {parsedFilters.naics_codes.length > 0 && (
                      <Badge variant="outline">
                        NAICS: {parsedFilters.naics_codes.join(", ")}
                      </Badge>
                    )}
                    {parsedFilters.agencies.length > 0 && (
                      <Badge variant="outline">
                        Agencies: {parsedFilters.agencies.join(", ")}
                      </Badge>
                    )}
                    {parsedFilters.min_value && (
                      <Badge variant="outline">
                        Min: ${(parsedFilters.min_value / 1000000).toFixed(1)}M
                      </Badge>
                    )}
                    {parsedFilters.max_value && (
                      <Badge variant="outline">
                        Max: ${(parsedFilters.max_value / 1000000).toFixed(1)}M
                      </Badge>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <Badge
              key={filter.label}
              variant={activeFilters.includes(filter.label) ? "gold" : "glass"}
              className="cursor-pointer hover:bg-primary/20 transition-colors"
              onClick={() => handleQuickFilter(filter)}
            >
              {activeFilters.includes(filter.label) && (
                <X className="w-3 h-3 mr-1" />
              )}
              {filter.label}
            </Badge>
          ))}
        </div>

        {/* Results */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {results.length > 0 ? (
                <>
                  Showing <span className="text-foreground font-semibold">{results.length}</span> of{" "}
                  <span className="text-foreground font-semibold">{total}</span> opportunities sorted by match score
                </>
              ) : (
                "Enter a search query to find government contracts"
              )}
            </p>
          </div>

          <div className="space-y-4">
            {isSearching ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} variant="glass">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <Skeleton className="w-14 h-14 rounded-xl shrink-0" />
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
                return (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card variant="glass-hover" className="cursor-pointer">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                          {/* Match Score */}
                          <div className="flex lg:flex-col items-center gap-3 lg:gap-1">
                            <div
                              className={`w-14 h-14 rounded-xl flex items-center justify-center text-lg font-heading font-bold ${
                                result.matchScore >= 90
                                  ? "bg-success/20 text-success"
                                  : result.matchScore >= 80
                                  ? "bg-primary/20 text-primary"
                                  : "bg-accent/20 text-accent"
                              }`}
                            >
                              {result.matchScore}%
                            </div>
                            <span className="text-xs text-muted-foreground">Match</span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <Badge variant="outline">{result.type}</Badge>
                              <Badge variant="gold">{result.setAside}</Badge>
                              {result.naicsCode && (
                                <Badge variant="glass">{result.naicsCode}</Badge>
                              )}
                            </div>
                            <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                              {result.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                              <Building2 className="w-4 h-4" />
                              {result.agency}
                            </p>
                            <div className="flex flex-wrap gap-4 text-sm">
                              <span className="flex items-center gap-1 text-accent">
                                <DollarSign className="w-4 h-4" />
                                {result.value}
                              </span>
                              {result.deadline && (
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="w-4 h-4" />
                                  Due: {new Date(result.deadline).toLocaleDateString()}
                                </span>
                              )}
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <MapPin className="w-4 h-4" />
                                {result.location}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex lg:flex-col gap-2">
                            <Button 
                              variant="hero" 
                              size="sm"
                              onClick={() => handleGenerateProposal(result)}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Generate Proposal
                            </Button>
                            <Button
                              variant={isTracked ? "outline" : "outline"}
                              size="sm"
                              onClick={() => handleTrack(result)}
                              disabled={isTracked || trackContract.isPending}
                            >
                              {isTracked ? (
                                <>
                                  <Target className="w-4 h-4 mr-2" />
                                  Tracked
                                </>
                              ) : (
                                <>
                                  <Star className="w-4 h-4 mr-2" />
                                  Track
                                </>
                              )}
                            </Button>
                            {result.link && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => window.open(result.link, '_blank')}
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                SAM.gov
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
                  <h3 className="font-heading font-semibold text-lg mb-2">No results yet</h3>
                  <p className="text-muted-foreground">
                    Enter a search query above to find government contracts that match your capabilities.
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
            <DialogTitle>Save Search</DialogTitle>
            <DialogDescription>
              Save this search to quickly run it again later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="searchName">Search Name</Label>
              <Input
                id="searchName"
                placeholder="e.g., IT Cybersecurity SDVOSB"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Query:</p>
              <p className="bg-muted/50 p-2 rounded">{searchQuery}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSearch} disabled={saveSearch.isPending}>
              <Save className="w-4 h-4 mr-2" />
              Save Search
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default SearchHub;
