import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  RotateCcw,
  MessageSquare,
  RefreshCw,
  CheckCircle2,
  ArrowUp,
  MoreHorizontal,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useTrackContract, useTrackedContracts } from "@/hooks/useTrackedContracts";
import { useSmartSearch, useSaveSearch, useSubawardSearch, SearchFilters, SearchResult, SubawardResult } from "@/hooks/useSearch";
import { useSearchRateLimit } from "@/hooks/useRateLimit";
import { toast } from "sonner";
import { SECTOR_NAICS, SECTOR_CONFIG } from "@/config/sectors";
import { useWinProbability, ContractScoreInput, ContractScoreResult } from "@/hooks/useWinProbability";
import { NaicsCodeSelector } from "@/components/company/NaicsCodeSelector";
import { PscCodeSelector } from "@/components/company/PscCodeSelector";
import { WinScoreModal } from "@/components/search/WinScoreModal";
import { useCompanyProfile } from "@/hooks/useProfile";

const quickFilters = [
  { label: "Small Business", filter: { set_aside: ["Small Business"] }, subKeyword: "small business" },
  { label: "Veteran-Owned", filter: { set_aside: ["SDVOSB", "VOSB"] }, subKeyword: "veteran" },
  { label: "Woman-Owned", filter: { set_aside: ["WOSB", "EDWOSB"] }, subKeyword: "woman" },
  { label: "Minority-Owned", filter: { set_aside: ["8(a)", "SDB"] }, subKeyword: "minority" },
  { label: "HUBZone", filter: { set_aside: ["HUBZone"] }, subKeyword: "hubzone" },
  { label: "Federal", filter: { opportunity_type: "Federal" }, subKeyword: "" },
];

const SearchHub = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeSector, setActiveSector] = useState<string | null>(null);
  const sectorSearchDone = useRef(false);
  const [activeTab, setActiveTab] = useState<"prime" | "subcontracts">("prime");

  // Subaward search
  const subawardSearch = useSubawardSearch();
  const [subawardResults, setSubawardResults] = useState<SubawardResult[]>([]);
  const [subawardPage, setSubawardPage] = useState(1);
  const [subawardHasNext, setSubawardHasNext] = useState(false);
  const [subawardTotal, setSubawardTotal] = useState(0);

  // Subcontract-specific filters
  const [subPrimeContractor, setSubPrimeContractor] = useState("");
  const [subMinAmount, setSubMinAmount] = useState("");
  const [subMaxAmount, setSubMaxAmount] = useState("");
  const [subAgency, setSubAgency] = useState("");
  const hasSubFilters = !!(subPrimeContractor || subMinAmount || subMaxAmount || subAgency);

  // Win probability scoring
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [scoreTarget, setScoreTarget] = useState<{ title: string; input: ContractScoreInput } | null>(null);
  const winScore = useWinProbability();
  const { data: companyProfile } = useCompanyProfile();
  const profilePscCodes = companyProfile?.psc_codes?.filter(Boolean) || [];
  const { data: rateLimit } = useSearchRateLimit();

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

  const clearSubFilters = () => {
    setSubPrimeContractor("");
    setSubMinAmount("");
    setSubMaxAmount("");
    setSubAgency("");
  };

  const activeFilterCount = (hasAdvancedFilters ? 1 : 0) + (hasSubFilters && activeTab === "subcontracts" ? 1 : 0);

  // Unified filter builder
  const buildCombinedFilters = (): SearchFilters & { deadline_before?: string } => {
    const deadlineDays = advDeadline ? parseInt(advDeadline) : null;
    const deadlineDate = deadlineDays
      ? new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const quickSetAsides = activeFilters.flatMap(key => {
      const qf = quickFilters.find(f => f.label === key);
      return qf?.filter.set_aside || [];
    });

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
    setFiltersOpen(false);
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
    batchBoundaries,
    isParsing,
  } = useSmartSearch();

  const prevResultCount = useRef(0);
  const resultListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (results.length > prevResultCount.current && prevResultCount.current > 0) {
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

  // Auto-search when arriving with ?q= param
  const qSearchDone = useRef(false);
  useEffect(() => {
    const q = searchParams.get("q");
    if (!q || qSearchDone.current) return;
    qSearchDone.current = true;

    setSearchQuery(q);
    const filters = {
      keywords: q.split(/\s+/).filter(Boolean),
      naics_codes: [] as string[],
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
      if (activeTab === "subcontracts") {
        const combinedKeyword = buildSubawardKeyword(searchQuery, activeFilters);
        const res = await subawardSearch.mutateAsync({
          keyword: combinedKeyword,
          page: 1,
          limit: 25,
          prime_contractor: subPrimeContractor.trim() || undefined,
          min_amount: subMinAmount ? parseInt(subMinAmount) : undefined,
          max_amount: subMaxAmount ? parseInt(subMaxAmount) : undefined,
          agency: subAgency || undefined,
        });
        setSubawardResults(res.results);
        setSubawardPage(1);
        setSubawardHasNext(res.page_metadata?.hasNext ?? false);
        setSubawardTotal(res.page_metadata?.total ?? res.results.length);
      } else if (hasAdvancedFilters || activeFilters.length > 0) {
        await searchWithFilters(buildCombinedFilters() as any, page);
      } else {
        await search(searchQuery, page);
      }
    } catch (error) {}
  };

  const handleLoadMoreSubawards = async () => {
    const nextPage = subawardPage + 1;
    const res = await subawardSearch.mutateAsync({
      keyword: searchQuery.trim(),
      page: nextPage,
      limit: 25,
      prime_contractor: subPrimeContractor.trim() || undefined,
      min_amount: subMinAmount ? parseInt(subMinAmount) : undefined,
      max_amount: subMaxAmount ? parseInt(subMaxAmount) : undefined,
      agency: subAgency || undefined,
    });
    setSubawardResults(prev => [...prev, ...res.results]);
    setSubawardPage(nextPage);
    setSubawardHasNext(res.page_metadata?.hasNext ?? false);
  };

  const buildSubawardKeyword = (query: string, filters: string[]) => {
    const filterTerms = filters
      .map(key => quickFilters.find(f => f.label === key)?.subKeyword || "")
      .filter(Boolean);
    const parts = [query.trim(), ...filterTerms].filter(Boolean);
    return parts.join(" ");
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

    if (activeTab === "subcontracts") {
      const combinedKeyword = buildSubawardKeyword(searchQuery, newActiveFilters);
      if (!combinedKeyword) return;
      const res = await subawardSearch.mutateAsync({
        keyword: combinedKeyword,
        page: 1,
        limit: 25,
        prime_contractor: subPrimeContractor.trim() || undefined,
        min_amount: subMinAmount ? parseInt(subMinAmount) : undefined,
        max_amount: subMaxAmount ? parseInt(subMaxAmount) : undefined,
        agency: subAgency || undefined,
      });
      setSubawardResults(res.results);
      setSubawardPage(1);
      setSubawardHasNext(res.page_metadata?.hasNext ?? false);
      setSubawardTotal(res.page_metadata?.total ?? res.results.length);
      return;
    }

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
      resource_links: result.resourceLinks || null,
    });
  };

  const handleStartBid = (result: SearchResult) => {
    navigate(`/dashboard/proposals/generator?opportunityId=${result.id}&title=${encodeURIComponent(result.title)}&agency=${encodeURIComponent(result.agency)}`);
  };

  const handleAskAI = (result: SearchResult) => {
    const solicitation = result.solicitationNumber ? ` (Solicitation: ${result.solicitationNumber})` : "";
    const preload = encodeURIComponent(`I need help understanding this contract: "${result.title}"${solicitation} from ${result.agency}. Can you explain what they're looking for and whether it might be a good fit for a small business?`);
    navigate(`/dashboard/ai?q=${preload}`);
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
        className="space-y-4"
      >
        {/* Demo Mode Banner */}
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
            <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs" onClick={() => setActiveSector(null)}>
              <X className="w-3 h-3 mr-1" /> Clear
            </Button>
          </div>
        )}

        {/* Simple Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="What does your business do? (e.g., IT support, construction, healthcare)"
              className="pl-12 h-12 text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch(0)}
            />
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              {rateLimit && (
                <TooltipContent>
                  <p>{rateLimit.remaining} of {rateLimit.limit} searches left today</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          {parsedFilters && (
            <Button variant="outline" className="h-12" onClick={() => setSaveDialogOpen(true)}>
              <Bookmark className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Save Search</span>
            </Button>
          )}
        </div>

        {/* Parsed filters display */}
        <AnimatePresence>
          {parsedFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-muted-foreground">Searching for:</span>
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

        {/* Quick Filters Row */}
        <div className="flex flex-wrap items-center gap-2">
          {quickFilters.map((filter) => (
            <button
              key={filter.label}
              onClick={() => handleQuickFilter(filter)}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-all border ${
                activeFilters.includes(filter.label)
                  ? "bg-accent/20 border-accent/50 text-accent"
                  : "bg-secondary/50 border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {activeFilters.includes(filter.label) && <X className="w-3 h-3" />}
              {filter.label}
            </button>
          ))}

          <button
            onClick={() => setFiltersOpen(true)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all border ml-auto ${
              hasAdvancedFilters || (hasSubFilters && activeTab === "subcontracts")
                ? "bg-accent/20 border-accent/50 text-accent"
                : "bg-secondary/50 border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            <SlidersHorizontal className="w-3 h-3" />
            More Filters
            {(hasAdvancedFilters || (hasSubFilters && activeTab === "subcontracts")) && (
              <span className="bg-accent text-card rounded-full w-4 h-4 text-[10px] flex items-center justify-center font-bold">
                !
              </span>
            )}
          </button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "prime" | "subcontracts")} className="w-full">
          <div className="border-b border-border/50">
            <TabsList className="bg-transparent border-none p-0 h-auto gap-4">
              <TabsTrigger
                value="prime"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-2 text-sm"
              >
                Prime Contracts
              </TabsTrigger>
              <TabsTrigger
                value="subcontracts"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-2 text-sm"
              >
                Subcontracts
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Prime Contracts Tab */}
          <TabsContent value="prime">
            <div>
              <div className="flex items-center justify-between mb-4 mt-4">
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

              <div ref={resultListRef} className="space-y-3">
                {isSearching ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} variant="glass">
                      <CardContent className="p-5">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-3" />
                        <Skeleton className="h-4 w-full" />
                      </CardContent>
                    </Card>
                  ))
                ) : results.length > 0 ? (
                  results.map((result, index) => {
                    const isTracked = trackedIds.has(result.id);
                    const match = getMatchLabel(result.matchScore);
                    const batchIndex = batchBoundaries.indexOf(index);
                    const isBatchStart = batchIndex !== -1;
                    return (
                      <div key={result.id}>
                        {isBatchStart && (
                          <motion.div
                            initial={{ opacity: 0, scaleX: 0 }}
                            animate={{ opacity: 1, scaleX: 1 }}
                            transition={{ duration: 0.4 }}
                            className="flex items-center gap-3 my-4"
                          >
                            <div className="flex-1 h-px bg-primary/30" />
                            <span className="text-xs font-medium text-primary flex items-center gap-1.5 whitespace-nowrap">
                              <Sparkles className="w-3 h-3" />
                              More Results
                            </span>
                            <div className="flex-1 h-px bg-primary/30" />
                          </motion.div>
                        )}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                        >
                          <Card variant="glass-hover">
                            <CardContent className="p-4">
                              <div className="flex flex-col gap-2">
                                {/* Top row: match + set-aside */}
                                <div className="flex items-center gap-2">
                                  <Badge className={`${match.className} text-xs`}>{match.text}</Badge>
                                  {result.setAside && result.setAside !== "None" && (
                                    <Badge variant="glass" className="text-xs">{result.setAside}</Badge>
                                  )}
                                  {isTracked && (
                                    <Badge variant="success" className="gap-1 text-xs">
                                      <CheckCircle2 className="w-3 h-3" /> Saved
                                    </Badge>
                                  )}
                                </div>

                                {/* Title */}
                                <h3 className="font-heading font-semibold text-base text-foreground leading-snug">
                                  <Link
                                    to={`/dashboard/contract/${result.id}`}
                                    state={{ contractData: result }}
                                    className="hover:text-primary hover:underline transition-colors"
                                  >
                                    {result.title}
                                  </Link>
                                </h3>

                                {/* Details row */}
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Building2 className="w-3.5 h-3.5" />
                                    {result.agency}
                                  </span>
                                  <span className="flex items-center gap-1 text-accent">
                                    <DollarSign className="w-3.5 h-3.5" />
                                    {result.value}
                                  </span>
                                  {result.deadline && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5" />
                                      {getDaysLeft(result.deadline)}
                                    </span>
                                  )}
                                  {result.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3.5 h-3.5" />
                                      {result.location}
                                    </span>
                                  )}
                                </div>

                                {/* Actions: Save + Start Bid + overflow menu */}
                                <div className="flex items-center gap-2 pt-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleTrack(result)}
                                    disabled={isTracked || trackContract.isPending}
                                    className="h-8 text-xs"
                                  >
                                    {isTracked ? (
                                      <><Heart className="w-3.5 h-3.5 mr-1.5 fill-current" /> Saved</>
                                    ) : (
                                      <><Heart className="w-3.5 h-3.5 mr-1.5" /> Save</>
                                    )}
                                  </Button>
                                  <Button
                                    variant="hero"
                                    size="sm"
                                    onClick={() => handleStartBid(result)}
                                    className="h-8 text-xs"
                                  >
                                    <FileText className="w-3.5 h-3.5 mr-1.5" />
                                    Start Bid
                                  </Button>

                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-card border-border">
                                      <DropdownMenuItem onClick={() => handleAskAI(result)} className="gap-2 cursor-pointer">
                                        <MessageSquare className="w-4 h-4 text-accent" />
                                        Ask AI About This
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleScoreContract(result)}
                                        disabled={winScore.isPending}
                                        className="gap-2 cursor-pointer"
                                      >
                                        <Sparkles className="w-4 h-4 text-primary" />
                                        Score This Contract
                                      </DropdownMenuItem>
                                      {result.link && (
                                        <DropdownMenuItem
                                          onClick={() => window.open(result.link, '_blank')}
                                          className="gap-2 cursor-pointer"
                                        >
                                          <ExternalLink className="w-4 h-4" />
                                          View on SAM.gov
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      </div>
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

              {results.length > 0 && hasMore && !isSearching && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-2 mt-6"
                >
                  <Button
                    variant="outline"
                    onClick={loadNextBatch}
                    disabled={isLoadingBatch}
                    className="gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingBatch ? "animate-spin" : ""}`} />
                    {isLoadingBatch ? "Loading..." : "Load More"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {total - results.length > 0
                      ? `${(total - results.length).toLocaleString()} more available`
                      : "All loaded"}
                  </p>
                </motion.div>
              )}
            </div>
          </TabsContent>

          {/* Subcontracts Tab */}
          <TabsContent value="subcontracts">
            <div>
              <div className="flex items-center justify-between mb-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  {subawardResults.length > 0 ? (
                    <>
                      Showing <span className="text-foreground font-semibold">{subawardResults.length.toLocaleString()}</span> subcontracts
                    </>
                  ) : (
                    "Search above to find subcontracting opportunities"
                  )}
                </p>
              </div>

              <div className="space-y-3">
                {subawardSearch.isPending ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} variant="glass">
                      <CardContent className="p-5">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-3" />
                        <Skeleton className="h-4 w-full" />
                      </CardContent>
                    </Card>
                  ))
                ) : subawardResults.length > 0 ? (
                  subawardResults.map((sub, index) => (
                    <motion.div
                      key={sub.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                    >
                      <Card variant="glass-hover">
                        <CardContent className="p-4">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="glass" className="text-xs">Subcontract</Badge>
                                {sub.agency && <Badge variant="outline" className="text-xs">{sub.agency}</Badge>}
                                {trackedIds.has(sub.subaward_number || sub.id) && (
                                  <Badge variant="success" className="text-xs">Saved</Badge>
                                )}
                              </div>
                            </div>

                            <Link
                              to={`/dashboard/contract/${encodeURIComponent(sub.subaward_number || sub.id)}`}
                              state={{ contractData: {
                                id: sub.subaward_number || sub.id,
                                title: sub.description || `Subaward #${sub.subaward_number}`,
                                agency: sub.prime_recipient || "Unknown",
                                value: sub.amount ? `$${sub.amount.toLocaleString()}` : undefined,
                                postedDate: sub.action_date,
                                location: sub.place_of_performance,
                                description: sub.description,
                                link: sub.prime_award_id ? `https://www.usaspending.gov/award/${sub.prime_award_id}` : undefined,
                              }}}
                            >
                              <h3 className="font-heading font-semibold text-base text-foreground leading-snug hover:text-primary hover:underline transition-colors cursor-pointer">
                                {sub.description || `Subaward #${sub.subaward_number}`}
                              </h3>
                            </Link>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5" />
                                <span className="font-medium text-foreground">{sub.subawardee}</span>
                                <span className="mx-1">←</span>
                                <span>{sub.prime_recipient}</span>
                              </span>
                              <span className="flex items-center gap-1 text-accent">
                                <DollarSign className="w-3.5 h-3.5" />
                                {sub.amount ? `$${sub.amount.toLocaleString()}` : "N/A"}
                              </span>
                              {sub.action_date && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {new Date(sub.action_date).toLocaleDateString()}
                                </span>
                              )}
                              {sub.place_of_performance && sub.place_of_performance !== "N/A" && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5" />
                                  {sub.place_of_performance}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs"
                                disabled={trackedIds.has(sub.subaward_number || sub.id)}
                                onClick={() => {
                                  trackContract.mutate({
                                    contract_id: sub.subaward_number || sub.id,
                                    contract_title: sub.description || `Subaward #${sub.subaward_number}`,
                                    contract_agency: sub.prime_recipient || null,
                                    response_deadline: null,
                                    status: "watching",
                                    priority: "medium",
                                    notes: `Subawardee: ${sub.subawardee || "N/A"}`,
                                    match_score: null,
                                    posted_date: sub.action_date || null,
                                    contract_value: sub.amount ? String(sub.amount) : null,
                                    set_aside: null,
                                    naics_code: null,
                                    resource_links: sub.prime_award_id ? [`https://www.usaspending.gov/award/${sub.prime_award_id}`] : null,
                                  });
                                }}
                              >
                                {trackedIds.has(sub.subaward_number || sub.id) ? (
                                  <><Heart className="w-3.5 h-3.5 mr-1.5 fill-current" /> Saved</>
                                ) : (
                                  <><Heart className="w-3.5 h-3.5 mr-1.5" /> Save</>
                                )}
                              </Button>
                              <Button
                                variant="hero"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => {
                                  const desc = sub.description || `Subaward #${sub.subaward_number}`;
                                  const amountStr = sub.amount ? `$${sub.amount.toLocaleString()}` : "unknown amount";
                                  const preload = encodeURIComponent(`Tell me about this subcontract from ${sub.prime_recipient || "a prime contractor"} to ${sub.subawardee || "a subcontractor"} worth ${amountStr} for: "${desc}". How can I position my company for similar subcontracting opportunities?`);
                                  navigate(`/dashboard/ai?q=${preload}`);
                                }}
                              >
                                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                                Ask AI
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-card border-border">
                                  {sub.prime_award_id && (
                                    <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => window.open(`https://www.usaspending.gov/award/${sub.prime_award_id}`, '_blank')}>
                                      <ExternalLink className="w-4 h-4" />
                                      View on USASpending
                                    </DropdownMenuItem>
                                  )}
                                  {sub.prime_recipient && (
                                    <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => {
                                      setActiveTab("prime");
                                      setSearchQuery(sub.prime_recipient!);
                                      setTimeout(() => {
                                        search(sub.prime_recipient!, 0);
                                      }, 100);
                                    }}>
                                      <Search className="w-4 h-4" />
                                      Research Prime Contractor
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <Card variant="glass" className="text-center py-12">
                    <CardContent>
                      <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-heading font-semibold text-lg mb-2">Find subcontracting opportunities</h3>
                      <p className="text-muted-foreground">
                        Search for subcontracts awarded through federal prime contracts.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {subawardResults.length > 0 && subawardHasNext && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-2 mt-6"
                >
                  <Button
                    variant="outline"
                    onClick={handleLoadMoreSubawards}
                    disabled={subawardSearch.isPending}
                    className="gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${subawardSearch.isPending ? "animate-spin" : ""}`} />
                    {subawardSearch.isPending ? "Loading..." : "Load More"}
                  </Button>
                </motion.div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* More Filters Sheet */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-accent" />
              More Filters
            </SheetTitle>
            <SheetDescription>
              Narrow down your search with specific criteria.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            {/* Contract Value */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Contract Value</Label>
              <Select
                value={advMinValue || advMaxValue ? `${advMinValue}|${advMaxValue}` : "any"}
                onValueChange={(val) => {
                  if (val === "any") { setAdvMinValue(""); setAdvMaxValue(""); return; }
                  const [mn, mx] = val.split("|");
                  setAdvMinValue(mn || "");
                  setAdvMaxValue(mx || "");
                }}
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="Any value" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any value</SelectItem>
                  {valueRanges.map(r => (
                    <SelectItem key={r.label} value={`${r.min}|${r.max}`}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Agency */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Agency</Label>
              <Select value={advAgency || "any"} onValueChange={(val) => setAdvAgency(val === "any" ? "" : val)}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="Any agency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any agency</SelectItem>
                  {agencyOptions.map(a => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Opportunity Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Opportunity Type</Label>
              <Select value={advType || "any"} onValueChange={(val) => setAdvType(val === "any" ? "" : val)}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="Any type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any type</SelectItem>
                  {opportunityTypeOptions.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Deadline</Label>
              <Select value={advDeadline || "any"} onValueChange={(val) => setAdvDeadline(val === "any" ? "" : val)}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="Any deadline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any deadline</SelectItem>
                  {deadlineOptions.map(d => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Location</Label>
              <Select value={advState || "any"} onValueChange={(val) => setAdvState(val === "any" ? "" : val)}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="Any state" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="any">Any state</SelectItem>
                  {stateOptions.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Industry Codes (optional) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Industry Codes <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">NAICS Code</p>
                  <NaicsCodeSelector selected={advNaics} onChange={setAdvNaics} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">PSC Code</p>
                  <PscCodeSelector selected={advPsc} onChange={setAdvPsc} />
                </div>
              </div>
            </div>

            {/* Subcontract Options - only when Subcontracts tab is active */}
            {activeTab === "subcontracts" && (
              <div className="space-y-4 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Subcontract Options</Label>
                  {hasSubFilters && (
                    <Button variant="ghost" size="sm" onClick={clearSubFilters} className="text-xs h-7 gap-1 text-muted-foreground">
                      <RotateCcw className="w-3 h-3" /> Clear
                    </Button>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">Prime Contractor Name</p>
                    <Input
                      placeholder="e.g., Lockheed Martin"
                      value={subPrimeContractor}
                      onChange={(e) => setSubPrimeContractor(e.target.value)}
                      className="h-10 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">Min Amount</p>
                      <div className="relative">
                        <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="0"
                          value={subMinAmount}
                          onChange={(e) => setSubMinAmount(e.target.value)}
                          className="h-10 text-sm pl-7"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">Max Amount</p>
                      <div className="relative">
                        <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="No max"
                          value={subMaxAmount}
                          onChange={(e) => setSubMaxAmount(e.target.value)}
                          className="h-10 text-sm pl-7"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">Awarding Agency</p>
                    <Select value={subAgency || "any"} onValueChange={(val) => setSubAgency(val === "any" ? "" : val)}>
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue placeholder="Any agency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any agency</SelectItem>
                        {agencyOptions.map(a => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-4 border-t border-border/50">
              {(hasAdvancedFilters || hasSubFilters) && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { clearAdvancedFilters(); clearSubFilters(); }}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              )}
              <Button
                variant="hero"
                className="flex-1"
                onClick={handleApplyAdvancedFilters}
                disabled={isSearching}
              >
                <Search className="w-4 h-4 mr-2" />
                Search with Filters
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

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

      {/* Scroll to Top FAB */}
      <AnimatePresence>
        {batchBoundaries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              size="icon"
              className="rounded-full w-12 h-12 shadow-lg"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <ArrowUp className="w-5 h-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default SearchHub;
