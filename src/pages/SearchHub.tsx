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
  Search,
  FileText,
  Building2,
  Sparkles,
  Clock,
  DollarSign,
  MapPin,
  X,
  Bookmark,
  ExternalLink,
  Heart,
  RotateCcw,
  MessageSquare,
  RefreshCw,
  CheckCircle2,
  ArrowUp,
  ArrowUpDown,
  MoreHorizontal,
  History,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useTrackContract, useTrackedContracts } from "@/hooks/useTrackedContracts";
import { useSmartSearch, useSaveSearch, useSubawardSearch, SearchFilters, SearchResult, SubawardResult } from "@/hooks/useSearch";
import { useSearchRateLimit } from "@/hooks/useRateLimit";
import { toast } from "sonner";
import { SECTOR_NAICS, SECTOR_CONFIG } from "@/config/sectors";
import { useWinProbability, ContractScoreInput, ContractScoreResult } from "@/hooks/useWinProbability";
import { WinScoreModal } from "@/components/search/WinScoreModal";
import { useCompanyProfile } from "@/hooks/useProfile";
import { computeHeuristicScore, getScoreColor } from "@/lib/heuristic-score";
import { useCachedSearch, useSyncFromApi, useCacheCount, SortOption } from "@/hooks/useCachedContracts";
import { GuidedTour } from "@/components/search/GuidedTour";
import { useSavedSearches, SavedSearch } from "@/hooks/useSavedSearches";
import { SaveSearchModal } from "@/components/search/SaveSearchModal";
import { SavedSearchesList } from "@/components/search/SavedSearchesList";
import { FilterSection } from "@/components/search/FilterSection";

const quickFilterMap: Record<string, { set_aside?: string[]; opportunity_type?: string; subKeyword: string }> = {
  "Small Business": { set_aside: ["Small Business"], subKeyword: "small business" },
  "Veteran-Owned": { set_aside: ["SDVOSB", "VOSB"], subKeyword: "veteran" },
  "Woman-Owned": { set_aside: ["WOSB", "EDWOSB"], subKeyword: "woman" },
  "Minority-Owned": { set_aside: ["8(a)", "SDB"], subKeyword: "minority" },
  "HUBZone": { set_aside: ["HUBZone"], subKeyword: "hubzone" },
  "Federal": { opportunity_type: "Federal", subKeyword: "" },
};

const SearchHub = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [syncPage, setSyncPage] = useState(0);
  const [apiTotal, setApiTotal] = useState<number | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false); // kept for compat
  const [activeOnly, setActiveOnly] = useState(false);
  const [expiringSoon, setExpiringSoon] = useState(false);
  const [newThisWeek, setNewThisWeek] = useState(false);
  const [budgetKey, setBudgetKey] = useState("");
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

  // Cache-first search hooks
  const cachedSearch = useCachedSearch();
  const syncFromApi = useSyncFromApi();
  const { data: cacheCount } = useCacheCount();

  // Saved searches
  const savedSearches = useSavedSearches();
  const [savedSearchModalOpen, setSavedSearchModalOpen] = useState(false);
  const [savedSearchesOpen, setSavedSearchesOpen] = useState(false);

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
  const [advSetAside, setAdvSetAside] = useState<string[]>([]);
  const [advContractType, setAdvContractType] = useState("");

  const hasAdvancedFilters = !!(advNaics.length > 0 || advPsc.length > 0 || advMinValue || advMaxValue || advAgency || advDeadline || advState || advType || advSetAside.length > 0 || advContractType);

  const clearAdvancedFilters = () => {
    setAdvNaics([]);
    setAdvPsc([]);
    setAdvMinValue("");
    setAdvMaxValue("");
    setAdvAgency("");
    setAdvDeadline("");
    setAdvState("");
    setAdvType("");
    setAdvSetAside([]);
    setAdvContractType("");
    setActiveOnly(false);
    setExpiringSoon(false);
    setNewThisWeek(false);
    setBudgetKey("");
  };

  const clearSubFilters = () => {
    setSubPrimeContractor("");
    setSubMinAmount("");
    setSubMaxAmount("");
    setSubAgency("");
  };

  const clearAllFilters = () => {
    clearAdvancedFilters();
    clearSubFilters();
    setActiveFilters([]);
    setCurrentPage(0);
    cachedSearch.searchLocal({
      keywords: searchQuery.trim() ? searchQuery.trim().split(/\s+/) : [],
      naics_codes: [],
      psc_codes: [],
      set_aside: [],
      agencies: [],
      min_value: null,
      max_value: null,
      location: null,
      opportunity_type: null,
    } as any, 0, 25);
  };

  const totalActiveFilterCount =
    (activeOnly ? 1 : 0) +
    (expiringSoon ? 1 : 0) +
    (newThisWeek ? 1 : 0) +
    (advDeadline ? 1 : 0) +
    activeFilters.length +
    (budgetKey ? 1 : 0) +
    (advAgency ? 1 : 0) +
    (advState ? 1 : 0) +
    (advType ? 1 : 0) +
    (advContractType ? 1 : 0) +
    advSetAside.length +
    advNaics.length +
    advPsc.length +
    (hasSubFilters && activeTab === "subcontracts" ? 1 : 0);

  // Unified filter builder
  const buildCombinedFilters = (): SearchFilters & { deadline_before?: string; active_only?: boolean; expiring_soon?: boolean } => {
    const deadlineDays = advDeadline ? parseInt(advDeadline) : null;
    const deadlineDate = deadlineDays
      ? new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const quickSetAsides = activeFilters.flatMap(key => {
      const qf = quickFilterMap[key];
      return qf?.set_aside || [];
    });
    const mergedSetAsides = [...new Set([...quickSetAsides, ...advSetAside])];

    let quickOpportunityType: string | null = null;
    activeFilters.forEach(key => {
      const qf = quickFilterMap[key];
      if (qf?.opportunity_type) quickOpportunityType = qf.opportunity_type;
    });

    // Budget key -> min/max
    let minVal = advMinValue ? parseInt(advMinValue) : null;
    let maxVal = advMaxValue ? parseInt(advMaxValue) : null;
    if (budgetKey) {
      const [bMin, bMax] = budgetKey.split("|");
      if (bMin) minVal = parseInt(bMin);
      if (bMax) maxVal = parseInt(bMax);
    }

    return {
      keywords: searchQuery.trim() ? searchQuery.trim().split(/\s+/) : [],
      naics_codes: advNaics,
      psc_codes: advPsc,
      set_aside: mergedSetAsides,
      agencies: advAgency ? [advAgency] : [],
      min_value: minVal,
      max_value: maxVal,
      location: advState || null,
      opportunity_type: advType || quickOpportunityType || null,
      ...(deadlineDate ? { deadline_before: deadlineDate } : {}),
      active_only: activeOnly,
      expiring_soon: expiringSoon,
      new_this_week: newThisWeek,
    };
  };

  const handleApplyAdvancedFilters = async () => {
    setCurrentPage(0);
    await cachedSearch.searchLocal(buildCombinedFilters() as any, 0, 25);
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

  // Auto-load from local cache on mount when no sector/q param is present
  const initialLoadDone = useRef(false);
  useEffect(() => {
    if (initialLoadDone.current) return;
    const hasSector = searchParams.get("sector");
    const hasQ = searchParams.get("q");
    if (hasSector || hasQ) return; // handled by other effects
    initialLoadDone.current = true;

    // Search local cache first (no API call)
    cachedSearch.searchLocal({
      keywords: [],
      naics_codes: [],
      psc_codes: [],
      set_aside: [],
      agencies: [],
      min_value: null,
      max_value: null,
      location: null,
      opportunity_type: null,
    }, 0, 25);
  }, []);

  // Re-query cache when sort order changes
  const sortInitialized = useRef(false);
  useEffect(() => {
    if (!sortInitialized.current) {
      sortInitialized.current = true;
      return;
    }
    if (cachedSearch.results.length > 0) {
      const filters = buildCombinedFilters();
      const currentLimit = Math.max(cachedSearch.results.length, 25);
      cachedSearch.searchLocal(filters as any, 0, currentLimit);
    }
  }, [cachedSearch.currentSort]);

  const trackContract = useTrackContract();
  const { data: trackedContracts } = useTrackedContracts();
  const saveSearch = useSaveSearch();
  const trackedIds = new Set(trackedContracts?.map(c => c.contract_id) || []);

  const handleSearch = async (page = 0) => {
    try {
      setCurrentPage(page);
      if (activeTab === "subcontracts") {
        const combinedKeyword = buildSubawardKeyword(searchQuery, activeFilters);
        if (!combinedKeyword && !hasSubFilters) {
          toast.error("Please enter a search query or apply filters");
          return;
        }
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
      } else {
        // Always sync from SAM.gov API for fresh results
        const filters = buildCombinedFilters();
        setSyncPage(0);
        try {
          const syncResult = await syncFromApi.mutateAsync({ filters: filters as any, page: 0, limit: 25 });
          setApiTotal(syncResult.apiTotal);
        } catch {
          // Sync failed (rate limit, etc.) — fall back to cache
        }
        // Display results from cache
        await cachedSearch.searchLocal(filters as any, 0, 25);
      }
    } catch (error) {}
  };

  const handleLoadMoreFromApi = async () => {
    const nextSyncPage = syncPage + 1;
    setSyncPage(nextSyncPage);
    const filters = buildCombinedFilters();
    try {
      const syncResult = await syncFromApi.mutateAsync({ filters: filters as any, page: nextSyncPage, limit: 25 });
      setApiTotal(syncResult.apiTotal);
      // Re-query local cache with increased limit to show all accumulated results
      const newLimit = (nextSyncPage + 1) * 25;
      await cachedSearch.searchLocal(filters as any, 0, newLimit);
    } catch {
      // Sync failed — keep showing current results
    }
  };

  const handleSyncFromApi = async () => {
    const filters = buildCombinedFilters();
    setSyncPage(0);
    const syncResult = await syncFromApi.mutateAsync({ filters: filters as any, page: 0, limit: 25 });
    setApiTotal(syncResult.apiTotal);
    await cachedSearch.searchLocal(filters as any, 0, 25);
  };

  const handleLoadMoreSubawards = async () => {
    const nextPage = subawardPage + 1;
    const res = await subawardSearch.mutateAsync({
      keyword: buildSubawardKeyword(searchQuery, activeFilters),
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
      .map(key => quickFilterMap[key]?.subKeyword || "")
      .filter(Boolean);
    const parts = [query.trim(), ...filterTerms].filter(Boolean);
    return parts.join(" ");
  };

  const handleQuickFilter = async (filterLabel: string) => {
    let newActiveFilters: string[];
    if (activeFilters.includes(filterLabel)) {
      newActiveFilters = activeFilters.filter(f => f !== filterLabel);
    } else {
      newActiveFilters = [...activeFilters, filterLabel];
    }
    setActiveFilters(newActiveFilters);
    setCurrentPage(0);

    if (activeTab === "subcontracts") {
      const combinedKeyword = buildSubawardKeyword(searchQuery, newActiveFilters);
      if (!combinedKeyword && !hasSubFilters) {
        setSubawardResults([]);
        setSubawardTotal(0);
        return;
      }
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

    // Re-run search with updated filters (buildCombinedFilters uses activeFilters state, but we need newActiveFilters)
    const quickSetAsides = newActiveFilters.flatMap(key => {
      const qf = quickFilterMap[key];
      return qf?.set_aside || [];
    });
    const mergedSetAsides = [...new Set([...quickSetAsides, ...advSetAside])];
    let quickOpportunityType: string | null = null;
    newActiveFilters.forEach(key => {
      const qf = quickFilterMap[key];
      if (qf?.opportunity_type) quickOpportunityType = qf.opportunity_type;
    });

    const deadlineDaysVal = advDeadline ? parseInt(advDeadline) : null;
    const deadlineDate = deadlineDaysVal
      ? new Date(Date.now() + deadlineDaysVal * 24 * 60 * 60 * 1000).toISOString()
      : null;

    let minVal = advMinValue ? parseInt(advMinValue) : null;
    let maxVal = advMaxValue ? parseInt(advMaxValue) : null;
    if (budgetKey) {
      const [bMin, bMax] = budgetKey.split("|");
      if (bMin) minVal = parseInt(bMin);
      if (bMax) maxVal = parseInt(bMax);
    }

    const combinedFilters = {
      keywords: searchQuery.trim() ? searchQuery.trim().split(/\s+/) : [],
      naics_codes: advNaics,
      psc_codes: advPsc,
      set_aside: mergedSetAsides,
      agencies: advAgency ? [advAgency] : [],
      min_value: minVal,
      max_value: maxVal,
      location: advState || null,
      opportunity_type: advType || quickOpportunityType || null,
      ...(deadlineDate ? { deadline_before: deadlineDate } : {}),
      active_only: activeOnly,
      expiring_soon: expiringSoon,
    };

    await cachedSearch.searchLocal(combinedFilters as any, 0, 25);
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

  const handleSaveSearch = (name: string) => {
    const filters = buildCombinedFilters();
    savedSearches.saveSearch.mutate({
      name,
      query: searchQuery,
      filters,
      searchType: "federal",
    });
  };

  const handleLoadSavedSearch = async (search: SavedSearch) => {
    setSavedSearchesOpen(false);
    
    // Update last run timestamp
    savedSearches.updateLastRun.mutate(search.id);
    
    // Load the search query
    setSearchQuery(search.query);
    
    // Load the filters
    const filters = search.filters as any;
    if (filters.naics_codes) setAdvNaics(filters.naics_codes);
    if (filters.psc_codes) setAdvPsc(filters.psc_codes);
    if (filters.min_value) setAdvMinValue(filters.min_value.toString());
    if (filters.max_value) setAdvMaxValue(filters.max_value.toString());
    if (filters.agencies?.length > 0) setAdvAgency(filters.agencies[0]);
    if (filters.location) setAdvState(filters.location);
    if (filters.opportunity_type) setAdvType(filters.opportunity_type);
    if (filters.set_aside) setAdvSetAside(filters.set_aside);
    
    // Execute the search
    setCurrentPage(0);
    setSyncPage(0);
    setApiTotal(null);
    
    const syncResult = await syncFromApi.mutateAsync({ filters, page: 0, limit: 25 });
    setApiTotal(syncResult.apiTotal);
    await cachedSearch.searchLocal(filters as any, 0, 25);
    
    toast.success(`Loaded search: ${search.name}`);
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
        {cachedSearch.results.length > 0 && /^SAM-20\d\d-/.test(cachedSearch.results[0]?.id) && (
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
        <div data-tour="search-bar" className="flex flex-col sm:flex-row gap-3">
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
          <Button
            variant="hero"
            className="h-12"
            onClick={() => handleSearch(0)}
            disabled={cachedSearch.isSearching || syncFromApi.isPending}
          >
            <Search className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">
              {cachedSearch.isSearching || syncFromApi.isPending ? "Searching..." : "Search"}
            </span>
          </Button>
          <DropdownMenu open={savedSearchesOpen} onOpenChange={setSavedSearchesOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-12">
                <History className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Saved Searches</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[400px] p-4">
              <div className="mb-3">
                <h4 className="font-semibold text-sm mb-1">Saved Searches</h4>
                <p className="text-xs text-muted-foreground">
                  Quickly load your saved search criteria
                </p>
              </div>
              <SavedSearchesList onLoadSearch={handleLoadSavedSearch} />
            </DropdownMenuContent>
          </DropdownMenu>
          {searchQuery.trim() && (
            <Button variant="outline" className="h-12" onClick={() => setSavedSearchModalOpen(true)}>
              <Bookmark className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Save</span>
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

        {/* Inline Filter Section */}
        <FilterSection
          activeOnly={activeOnly}
          setActiveOnly={(v) => { setActiveOnly(v); setTimeout(() => handleApplyAdvancedFilters(), 0); }}
          expiringSoon={expiringSoon}
          setExpiringSoon={(v) => { setExpiringSoon(v); setTimeout(() => handleApplyAdvancedFilters(), 0); }}
          deadlineDays={advDeadline}
          setDeadlineDays={(v) => { setAdvDeadline(v); setTimeout(() => handleApplyAdvancedFilters(), 0); }}
          activeQuickFilters={activeFilters}
          onToggleQuickFilter={(label) => handleQuickFilter(label)}
          budgetKey={budgetKey}
          setBudgetKey={(v) => { setBudgetKey(v); setTimeout(() => handleApplyAdvancedFilters(), 0); }}
          advAgency={advAgency}
          setAdvAgency={setAdvAgency}
          advState={advState}
          setAdvState={setAdvState}
          advType={advType}
          setAdvType={setAdvType}
          advContractType={advContractType}
          setAdvContractType={setAdvContractType}
          advSetAside={advSetAside}
          setAdvSetAside={setAdvSetAside}
          advNaics={advNaics}
          setAdvNaics={setAdvNaics}
          advPsc={advPsc}
          setAdvPsc={setAdvPsc}
          activeTab={activeTab}
          subPrimeContractor={subPrimeContractor}
          setSubPrimeContractor={setSubPrimeContractor}
          subMinAmount={subMinAmount}
          setSubMinAmount={setSubMinAmount}
          subMaxAmount={subMaxAmount}
          setSubMaxAmount={setSubMaxAmount}
          subAgency={subAgency}
          setSubAgency={setSubAgency}
          onApplyAdvanced={handleApplyAdvancedFilters}
          onClearAll={clearAllFilters}
          totalActiveCount={totalActiveFilterCount}
          isSearching={cachedSearch.isSearching}
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={async (v) => {
          const newTab = v as "prime" | "subcontracts";
          setActiveTab(newTab);
          setCurrentPage(0);
          if (newTab === "prime") {
            const filters = buildCombinedFilters();
            await cachedSearch.searchLocal(filters as any, 0, 25);
          } else {
            const combinedKeyword = buildSubawardKeyword(searchQuery, activeFilters);
            if (combinedKeyword || hasSubFilters) {
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
            }
          }
        }} className="w-full">
          <div className="border-b border-border/50">
            <TabsList className="bg-transparent border-none p-0 h-auto gap-4">
              <TabsTrigger
                value="prime"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-2 text-sm"
              >
                <span className="flex flex-col items-start">
                  <span>Direct Contracts</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Bid directly with the government</span>
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="subcontracts"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-2 text-sm"
              >
                <span className="flex flex-col items-start">
                  <span>Team-Up Opportunities</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Work with a bigger company</span>
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Prime Contracts Tab */}
          <TabsContent value="prime">
            <div>
              <div className="flex items-center justify-between mb-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  {cachedSearch.results.length > 0 ? (
                    <>
                      Showing <span className="text-foreground font-semibold">{cachedSearch.results.length.toLocaleString()}</span> of{" "}
                      <span className="text-foreground font-semibold">{(apiTotal ?? cachedSearch.total).toLocaleString()}</span> results
                      {apiTotal !== null && apiTotal > cachedSearch.total && (
                        <span className="text-muted-foreground ml-1">(from SAM.gov)</span>
                      )}
                    </>
                  ) : cacheCount === 0 ? (
                    <span>No contracts found yet. Try searching above to get started!</span>
                  ) : (
                    "Search above to find government contracts"
                  )}
                </p>
                {cachedSearch.results.length > 0 && (
                  <Select
                    value={cachedSearch.currentSort}
                    onValueChange={(val) => cachedSearch.setCurrentSort(val as SortOption)}
                  >
                    <SelectTrigger className="w-[180px] h-8 text-xs bg-card border-border">
                      <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="match_score">Match Score</SelectItem>
                      <SelectItem value="deadline">Deadline (Soonest)</SelectItem>
                      <SelectItem value="value">Value (Highest)</SelectItem>
                      <SelectItem value="posted_date">Posted Date (Newest)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div ref={resultListRef} data-tour="result-list" className="space-y-3">
                {cachedSearch.isSearching ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} variant="glass">
                      <CardContent className="p-5">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-3" />
                        <Skeleton className="h-4 w-full" />
                      </CardContent>
                    </Card>
                  ))
                ) : cachedSearch.results.length > 0 ? (
                  cachedSearch.results.map((result, index) => {
                    const isTracked = trackedIds.has(result.id);
                    const match = getMatchLabel(result.matchScore);
                    const fetchedAt = (result as any).fetchedAt;
                    return (
                      <div key={result.id}>
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
                                  {(() => {
                                    const hScore = computeHeuristicScore(result, companyProfile);
                                    if (hScore >= 0) {
                                      const sc = getScoreColor(hScore);
                                      return (
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${sc.bg} ${sc.text} border border-current/20`}>
                                          {sc.label}
                                        </span>
                                      );
                                    }
                                    return null;
                                  })()}
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

                                {/* Actions: Save + overflow menu */}
                                <div data-tour="card-actions" className="flex items-center gap-2 pt-1">
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
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs"
                                    asChild
                                  >
                                    <Link
                                      to={`/dashboard/contract/${result.id}`}
                                      state={{ contractData: result }}
                                    >
                                      Learn More →
                                    </Link>
                                  </Button>

                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto">
                                        <MoreHorizontal className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-card border-border">
                                      <DropdownMenuItem onClick={() => handleStartBid(result)} className="gap-2 cursor-pointer">
                                        <FileText className="w-4 h-4 text-primary" />
                                        Start Bid
                                      </DropdownMenuItem>
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
                      <h3 className="font-heading font-semibold text-lg mb-2">
                        {cacheCount === 0 ? "Let's find contracts for you!" : "No matching contracts found"}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {cacheCount === 0
                          ? "Tell us what your business does and we'll search for government contracts that match."
                          : "Try different search terms or adjust your filters."}
                      </p>
                      {cacheCount === 0 && (
                        <Button
                          variant="hero"
                          onClick={handleSyncFromApi}
                          disabled={syncFromApi.isPending}
                        >
                          <Search className="w-4 h-4 mr-2" />
                          {syncFromApi.isPending ? "Finding contracts..." : "Find Contracts"}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {cachedSearch.results.length > 0 && (apiTotal !== null ? cachedSearch.results.length < apiTotal : cachedSearch.total > cachedSearch.results.length) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-2 mt-6"
                >
                  <Button
                    variant="outline"
                    onClick={handleLoadMoreFromApi}
                    disabled={cachedSearch.isSearching || syncFromApi.isPending}
                    className="gap-2"
                  >
                    <ArrowUp className="w-4 h-4 rotate-180" />
                    {syncFromApi.isPending ? "Loading..." : "Load More from SAM.gov"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {((apiTotal ?? cachedSearch.total) - cachedSearch.results.length).toLocaleString()} more results available on SAM.gov
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
                      Showing <span className="text-foreground font-semibold">{subawardResults.length.toLocaleString()}</span> team-up opportunities
                    </>
                  ) : (
                    "Search above to find team-up opportunities with bigger companies"
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
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
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
                      <h3 className="font-heading font-semibold text-lg mb-2">Find team-up opportunities</h3>
                      <p className="text-muted-foreground">
                        Search for opportunities to work with bigger companies on federal contracts.
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


      {/* Save Search Modal */}
      <SaveSearchModal
        open={savedSearchModalOpen}
        onOpenChange={setSavedSearchModalOpen}
        onSave={handleSaveSearch}
        isLoading={savedSearches.saveSearch.isPending}
      />

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
      <GuidedTour />
    </DashboardLayout>
  );
};

export default SearchHub;
