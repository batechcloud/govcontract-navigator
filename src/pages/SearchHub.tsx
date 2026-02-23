import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Search,
  FileText,
  Building2,
  Sparkles,
  Clock,
  DollarSign,
  MapPin,
  Save,
  X,
  Bookmark,
  ExternalLink,
  Heart,
  SlidersHorizontal,
  ChevronDown,
  RotateCcw,
  MessageSquare,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useTrackContract, useTrackedContracts } from "@/hooks/useTrackedContracts";
import { useSmartSearch, useSaveSearch, SearchFilters, SearchResult } from "@/hooks/useSearch";
import { toast } from "sonner";
import { SECTOR_NAICS, SECTOR_CONFIG } from "@/config/sectors";
import { useWinProbability, ContractScoreInput, ContractScoreResult } from "@/hooks/useWinProbability";
import { NaicsCodeSelector } from "@/components/company/NaicsCodeSelector";
import { PscCodeSelector } from "@/components/company/PscCodeSelector";
import { WinScoreModal } from "@/components/search/WinScoreModal";
import { useCompanyProfile } from "@/hooks/useProfile";



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
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [activeSector, setActiveSector] = useState<string | null>(null);
  const sectorSearchDone = useRef(false);

  // Win probability scoring
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [scoreTarget, setScoreTarget] = useState<{ title: string; input: ContractScoreInput } | null>(null);
  const winScore = useWinProbability();
  const { data: companyProfile } = useCompanyProfile();
  const profilePscCodes = companyProfile?.psc_codes?.filter(Boolean) || [];

  const handleScoreContract = (result: SearchResult) => {
    const input: ContractScoreInput = {
      title: result.title,
      agency: result.agency,
      value: result.value,
      setAside: result.setAside,
      naicsCode: result.naicsCode,
      deadline: result.deadline,
      type: result.type,
      description: result.description,
    };
    setScoreTarget({ title: result.title, input });
    setScoreModalOpen(true);
    winScore.mutate(input);
  };

  // Advanced filters
  const [advNaics, setAdvNaics] = useState<string[]>([]);
  const [advPsc, setAdvPsc] = useState<string[]>([]);
  const [advMinValue, setAdvMinValue] = useState("");
  const [advMaxValue, setAdvMaxValue] = useState("");
  const [advAgency, setAdvAgency] = useState("");
  const [advDeadline, setAdvDeadline] = useState("");
  const [advState, setAdvState] = useState("");
  const [advType, setAdvType] = useState("");

  const hasAdvancedFilters = !!(advNaics.length > 0 || advPsc.length > 0 || advMinValue || advMaxValue || advAgency || advDeadline || advState || advType);



  const agencyOptions = [
    "Department of Defense",
    "Department of Homeland Security",
    "Department of Veterans Affairs",
    "General Services Administration",
    "Department of Health and Human Services",
    "Department of Transportation",
    "Department of Energy",
    "Department of Justice",
    "NASA",
    "Department of State",
  ];

  const valueRanges = [
    { min: "", max: "25000", label: "Under $25K" },
    { min: "25000", max: "100000", label: "$25K – $100K" },
    { min: "100000", max: "500000", label: "$100K – $500K" },
    { min: "500000", max: "1000000", label: "$500K – $1M" },
    { min: "1000000", max: "5000000", label: "$1M – $5M" },
    { min: "5000000", max: "25000000", label: "$5M – $25M" },
    { min: "25000000", max: "", label: "Over $25M" },
  ];

  const deadlineOptions = [
    { value: "7", label: "Due within 7 days" },
    { value: "14", label: "Due within 14 days" },
    { value: "30", label: "Due within 30 days" },
    { value: "60", label: "Due within 60 days" },
    { value: "90", label: "Due within 90 days" },
  ];

  const stateOptions = [
    "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
    "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
    "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
    "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
    "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
    "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
    "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
    "Wisconsin","Wyoming","District of Columbia",
  ];

  const opportunityTypeOptions = [
    { value: "Solicitation", label: "Solicitation" },
    { value: "Presolicitation", label: "Presolicitation" },
    { value: "Sources Sought", label: "Sources Sought" },
    { value: "Combined Synopsis/Solicitation", label: "Combined Synopsis/Solicitation" },
    { value: "Award Notice", label: "Award Notice" },
    { value: "Special Notice", label: "Special Notice" },
    { value: "Intent to Bundle", label: "Intent to Bundle" },
  ];

  const clearAdvancedFilters = () => {
    setAdvNaics([]);
    setAdvPsc([]);
    setAdvMinValue("");
    setAdvMaxValue("");
    setAdvAgency("");
    setAdvDeadline("");
    setAdvState("");
    setAdvType("");
  };

  // Unified filter builder — merges search bar keywords, quick filters, and advanced filters
  const buildCombinedFilters = (): SearchFilters & { deadline_before?: string } => {
    const deadlineDays = advDeadline ? parseInt(advDeadline) : null;
    const deadlineDate = deadlineDays
      ? new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Collect set-aside values from active quick filters
    const quickSetAsides = activeFilters.flatMap(key => {
      const qf = quickFilters.find(f => f.label === key);
      return qf?.filter.set_aside || [];
    });

    // Collect opportunity type from quick filters (last one wins)
    let quickOpportunityType: string | null = null;
    activeFilters.forEach(key => {
      const qf = quickFilters.find(f => f.label === key);
      if (qf?.filter.opportunity_type) quickOpportunityType = qf.filter.opportunity_type;
    });

    return {
      keywords: searchQuery.trim() ? searchQuery.trim().split(/\s+/) : [],
      naics_codes: advNaics,
      psc_codes: advPsc,
      set_aside: quickSetAsides,
      agencies: advAgency ? [advAgency] : [],
      min_value: advMinValue ? parseInt(advMinValue) : null,
      max_value: advMaxValue ? parseInt(advMaxValue) : null,
      location: advState || null,
      opportunity_type: advType || quickOpportunityType || null,
      ...(deadlineDate ? { deadline_before: deadlineDate } : {}),
    };
  };

  const handleApplyAdvancedFilters = async () => {
    setCurrentPage(0);
    await searchWithFilters(buildCombinedFilters() as any, 0);
  };

  const {
    search,
    searchWithFilters,
    loadNextBatch,
    isSearching,
    isLoadingBatch,
    results,
    parsedFilters,
    total,
    hasMore,
    isParsing,
  } = useSmartSearch();

  // Track previous result count for scroll-to-new behavior
  const prevResultCount = useRef(0);
  const resultListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (results.length > prevResultCount.current && prevResultCount.current > 0) {
      // Scroll to the first new result after batch load
      const newItemIndex = prevResultCount.current;
      setTimeout(() => {
        const items = resultListRef.current?.children;
        if (items && items[newItemIndex]) {
          items[newItemIndex].scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
    prevResultCount.current = results.length;
  }, [results.length]);

  // Auto-search when arriving from sector browse
  useEffect(() => {
    const sectorKey = searchParams.get("sector");
    if (!sectorKey || sectorSearchDone.current) return;
    sectorSearchDone.current = true;

    const config = SECTOR_CONFIG[sectorKey];
    const naicsCodes = SECTOR_NAICS[sectorKey] || [];

    if (config) {
      setActiveSector(sectorKey);
      setSearchQuery(`${config.label} contracts`);

      const filters = {
        keywords: [],
        naics_codes: naicsCodes,
        psc_codes: [] as string[],
        set_aside: [] as string[],
        agencies: [] as string[],
        min_value: null,
        max_value: null,
        location: null,
        opportunity_type: null,
      };

      searchWithFilters(filters, 0);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  const trackContract = useTrackContract();
  const { data: trackedContracts } = useTrackedContracts();
  const saveSearch = useSaveSearch();

  const trackedIds = new Set(trackedContracts?.map(c => c.contract_id) || []);

  const handleSearch = async (page = 0) => {
    if (!searchQuery.trim() && !hasAdvancedFilters && activeFilters.length === 0) {
      toast.error("Please enter a search query or apply filters");
      return;
    }
    try {
      setCurrentPage(page);
      // If advanced or quick filters are active, use combined filters instead of AI parse
      if (hasAdvancedFilters || activeFilters.length > 0) {
        await searchWithFilters(buildCombinedFilters() as any, page);
      } else {
        await search(searchQuery, page);
      }
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
    setCurrentPage(0);

    // Use buildCombinedFilters but with the new activeFilters (state hasn't updated yet)
    // We need to temporarily compute what buildCombinedFilters would return with newActiveFilters
    const quickSetAsides = newActiveFilters.flatMap(key => {
      const qf = quickFilters.find(f => f.label === key);
      return qf?.filter.set_aside || [];
    });
    let quickOpportunityType: string | null = null;
    newActiveFilters.forEach(key => {
      const qf = quickFilters.find(f => f.label === key);
      if (qf?.filter.opportunity_type) quickOpportunityType = qf.filter.opportunity_type;
    });

    const deadlineDays = advDeadline ? parseInt(advDeadline) : null;
    const deadlineDate = deadlineDays
      ? new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const combinedFilters: SearchFilters & { deadline_before?: string } = {
      keywords: searchQuery.trim() ? searchQuery.trim().split(/\s+/) : [],
      naics_codes: advNaics,
      psc_codes: advPsc,
      set_aside: quickSetAsides,
      agencies: advAgency ? [advAgency] : [],
      min_value: advMinValue ? parseInt(advMinValue) : null,
      max_value: advMaxValue ? parseInt(advMaxValue) : null,
      location: advState || null,
      opportunity_type: advType || quickOpportunityType || null,
      ...(deadlineDate ? { deadline_before: deadlineDate } : {}),
    };

    if (newActiveFilters.length > 0 || searchQuery.trim() || hasAdvancedFilters) {
      await searchWithFilters(combinedFilters as any, 0);
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

  const handleAskAI = (result: SearchResult) => {
    const solicitation = result.solicitationNumber ? ` (Solicitation: ${result.solicitationNumber})` : "";
    const preload = encodeURIComponent(`I need help understanding this contract: "${result.title}"${solicitation} from ${result.agency}. Can you explain what they're looking for and whether it might be a good fit for a small business?`);
    navigate(`/dashboard/ai/chat?q=${preload}`);
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
    saveSearch.mutate({ name: searchName, query: searchQuery, filters: parsedFilters });
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
        {/* Demo Mode Banner — only shown when no SAM API key (mock data has SAM-20XX- prefix) */}
        {results.length > 0 && /^SAM-20\d\d-/.test(results[0]?.id) && (
          <div className="bg-accent/10 border border-accent/30 rounded-lg px-4 py-2 flex items-center gap-2 text-sm">
            <span className="font-semibold text-accent">Demo Mode:</span>
            <span className="text-muted-foreground">Showing sample contracts. Add a SAM.gov API key to search live opportunities.</span>
          </div>
        )}

        {/* Active Sector Banner */}
        {activeSector && SECTOR_CONFIG[activeSector] && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-2 flex items-center gap-2 text-sm">
            <span className="text-lg">{SECTOR_CONFIG[activeSector].icon}</span>
            <span className="text-foreground font-medium">
              Showing results for <span className="text-primary">{SECTOR_CONFIG[activeSector].label}</span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-7 text-xs"
              onClick={() => setActiveSector(null)}
            >
              <X className="w-3 h-3 mr-1" /> Clear
            </Button>
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
                  onKeyDown={(e) => e.key === "Enter" && handleSearch(0)}
                />
              </div>
              <Button
                variant="hero"
                className="h-12"
                onClick={() => handleSearch(0)}
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
                      <Badge variant="glass">{parsedFilters.keywords.join(", ")}</Badge>
                    )}
                    {parsedFilters.set_aside.length > 0 && (
                      <Badge variant="gold">{parsedFilters.set_aside.join(", ")}</Badge>
                    )}
                    {parsedFilters.agencies.length > 0 && (
                      <Badge variant="outline">{parsedFilters.agencies.join(", ")}</Badge>
                    )}
                    {parsedFilters.min_value && (
                      <Badge variant="outline">From ${(parsedFilters.min_value / 1000000).toFixed(1)}M</Badge>
                    )}
                    {parsedFilters.psc_codes && parsedFilters.psc_codes.length > 0 && (
                      <Badge variant="glass">PSC: {parsedFilters.psc_codes.join(", ")}</Badge>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Quick Filters + Advanced toggle row */}
        <div className="flex flex-wrap items-center gap-2">
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAdvancedOpen(o => !o)}
            className={`ml-auto gap-2 ${hasAdvancedFilters ? "border-accent text-accent" : ""}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Advanced Filters
            {hasAdvancedFilters && (
              <Badge className="bg-accent text-card text-[10px] px-1.5 py-0 h-4">ON</Badge>
            )}
            <ChevronDown className={`w-3 h-3 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
          </Button>
        </div>

        {/* Advanced Filter Panel */}
        <AnimatePresence>
          {advancedOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <Card variant="glass" className="border-border/70">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading font-semibold text-sm text-foreground flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-accent" />
                      Advanced Filters
                    </h3>
                    {hasAdvancedFilters && (
                      <Button variant="ghost" size="sm" onClick={clearAdvancedFilters} className="text-muted-foreground hover:text-foreground gap-1 text-xs h-7">
                        <RotateCcw className="w-3 h-3" />
                        Clear all
                      </Button>
                    )}
                    </div>

                    {/* PSC Code */}
                    <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                      <Label className="text-xs text-muted-foreground">PSC Code</Label>
                      <PscCodeSelector selected={advPsc} onChange={setAdvPsc} />
                    </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* NAICS Code */}
                    <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                      <Label className="text-xs text-muted-foreground">NAICS Code</Label>
                      <NaicsCodeSelector selected={advNaics} onChange={setAdvNaics} />
                    </div>

                    {/* Contract Value Range */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Contract Value</Label>
                      <Select
                        value={advMinValue || advMaxValue ? `${advMinValue}|${advMaxValue}` : "any"}
                        onValueChange={(val) => {
                          if (val === "any") { setAdvMinValue(""); setAdvMaxValue(""); return; }
                          const [mn, mx] = val.split("|");
                          setAdvMinValue(mn || "");
                          setAdvMaxValue(mx || "");
                        }}
                      >
                        <SelectTrigger className="h-9 text-sm bg-card border-border">
                          <SelectValue placeholder="Any value" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border z-50">
                          <SelectItem value="any">Any value</SelectItem>
                          {valueRanges.map(r => (
                            <SelectItem key={r.label} value={`${r.min}|${r.max}`}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Agency */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Agency</Label>
                      <Select value={advAgency || "any"} onValueChange={(val) => setAdvAgency(val === "any" ? "" : val)}>
                        <SelectTrigger className="h-9 text-sm bg-card border-border">
                          <SelectValue placeholder="Any agency" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border z-50">
                          <SelectItem value="any">Any agency</SelectItem>
                          {agencyOptions.map(a => (
                            <SelectItem key={a} value={a}>{a}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Opportunity Type */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Opportunity Type</Label>
                      <Select value={advType || "any"} onValueChange={(val) => setAdvType(val === "any" ? "" : val)}>
                        <SelectTrigger className="h-9 text-sm bg-card border-border">
                          <SelectValue placeholder="Any type" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border z-50">
                          <SelectItem value="any">Any type</SelectItem>
                          {opportunityTypeOptions.map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Response Deadline */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Deadline</Label>
                      <Select value={advDeadline || "any"} onValueChange={(val) => setAdvDeadline(val === "any" ? "" : val)}>
                        <SelectTrigger className="h-9 text-sm bg-card border-border">
                          <SelectValue placeholder="Any deadline" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border z-50">
                          <SelectItem value="any">Any deadline</SelectItem>
                          {deadlineOptions.map(d => (
                            <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Location / State */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Location</Label>
                      <Select value={advState || "any"} onValueChange={(val) => setAdvState(val === "any" ? "" : val)}>
                        <SelectTrigger className="h-9 text-sm bg-card border-border">
                          <SelectValue placeholder="Any state" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border z-50 max-h-60">
                          <SelectItem value="any">Any state</SelectItem>
                          {stateOptions.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end mt-4 pt-4 border-t border-border/50">
                    <Button variant="hero" size="sm" onClick={handleApplyAdvancedFilters} disabled={isSearching} className="gap-2">
                      <Search className="w-4 h-4" />
                      Apply Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {results.length > 0 ? (
                <>
                  Showing <span className="text-foreground font-semibold">{results.length.toLocaleString()}</span> of{" "}
                  <span className="text-foreground font-semibold">{total.toLocaleString()}</span> contracts
                </>
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
                          {/* Badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={match.className}>{match.text}</Badge>
                            <Badge variant="outline">{result.type}</Badge>
                            {result.setAside && result.setAside !== "None" && (
                              <Badge variant="glass">{result.setAside}</Badge>
                            )}
                            {isTracked && (
                              <Badge variant="success" className="gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Already Tracked
                              </Badge>
                            )}
                          </div>

                          {/* Title & Agency */}
                          <h3 className="font-heading font-semibold text-lg text-foreground">
                            <Link
                              to={`/dashboard/contract/${result.id}`}
                              state={{ contractData: result }}
                              className="hover:text-primary hover:underline transition-colors"
                            >
                              {result.title}
                            </Link>
                          </h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            {result.agency}
                          </p>

                          {/* Details */}
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAskAI(result)}
                              className="gap-2 border-accent/40 text-accent hover:bg-accent/10 hover:border-accent hover:text-accent"
                            >
                              <MessageSquare className="w-4 h-4" />
                              Ask AI
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleScoreContract(result)}
                              disabled={winScore.isPending}
                              className="gap-2 border-purple-400/40 text-purple-400 hover:bg-purple-400/10 hover:border-purple-400 hover:text-purple-400"
                            >
                              <Sparkles className="w-4 h-4" />
                              Score This
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

          {/* Load New Batch */}
          {results.length > 0 && hasMore && !isSearching && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3 mt-8"
            >
              <Button
                variant="outline"
                size="lg"
                onClick={loadNextBatch}
                disabled={isLoadingBatch}
                className="gap-2"
              >
                {isLoadingBatch ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {isLoadingBatch ? "Loading..." : "Load New Batch"}
              </Button>
              <p className="text-xs text-muted-foreground">
                {total - results.length > 0
                  ? `${(total - results.length).toLocaleString()} more opportunities available`
                  : "All opportunities loaded"}
              </p>
            </motion.div>
          )}
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
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSearch} disabled={saveSearch.isPending}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Win Score Modal */}
      <WinScoreModal
        open={scoreModalOpen}
        onOpenChange={setScoreModalOpen}
        contractTitle={scoreTarget?.title || ""}
        result={winScore.data as ContractScoreResult || null}
        isLoading={winScore.isPending}
      />
    </DashboardLayout>
  );
};

export default SearchHub;
