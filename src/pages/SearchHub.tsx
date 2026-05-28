import { useState, useEffect, useRef, useMemo } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
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
import { ResultsPagination } from "@/components/search/ResultsPagination";
import { usePageTitle } from "@/hooks/usePageTitle";

const quickFilterMap: Record<string, { set_aside?: string[]; opportunity_type?: string; subKeyword: string }> = {
  usePageTitle("Search Contracts");
  "Small Business": { set_aside: ["Small Business"], subKeyword: "small business" },
  "Veteran-Owned": { set_aside: ["SDVOSB", "VOSB"], subKeyword: "veteran" },
  "Woman-Owned": { set_aside: ["WOSB", "EDWOSB"], subKeyword: "woman" },
  // "8(a)" is SAM.gov's minority/disadvantaged business set-aside. Old map
  // also listed "SDB" which isn't an actual SAM code, so the filter matched
  // only the 8(a) family anyway.
  "Minority-Owned": { set_aside: ["8(a)"], subKeyword: "minority" },
  "HUBZone": { set_aside: ["HUBZone"], subKeyword: "hubzone" },
  // Removed: "Federal" — every contract in this DB is federal so the chip
  // was a no-op label, and the old opportunity_type="Federal" filter never
  // matched the contract_type column values (Solicitation, etc).
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
  // Default ON: hides expired contracts from the default view. Sort-by-deadline
  // (the default sort) puts EARLIEST dates first — including expired ones —
  // so without this filter the top of the page is dominated by closed
  // opportunities the user can't bid on. They can remove the chip to see
  // expired (e.g. for market research on who won).
  const [activeOnly, setActiveOnly] = useState(true);
  const [expiringSoon, setExpiringSoon] = useState(false);
  const [newThisWeek, setNewThisWeek] = useState(false);
  const [budgetKey, setBudgetKey] = useState("");
  const [activeSector, setActiveSector] = useState<string | null>(null);
  // Default-on industry filter: when the user's profile has NAICS codes, the
  // search auto-restricts to contracts whose naics_code overlaps that list.
  // Without this, "deadline soonest" surfaces a flood of unrelated DLA
  // hardware contracts that match the user's set-aside cert but not their
  // industry. The toggle is visible as a removable chip in the active-filters
  // row, so users can clear it to browse outside their industry.
  const [matchMyProfile, setMatchMyProfile] = useState(true);
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
    setMatchMyProfile(false);
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
  const buildCombinedFilters = (): SearchFilters & { deadline_before?: string; active_only?: boolean; expiring_soon?: boolean; new_this_week?: boolean } => {
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

    // Merge profile NAICS into the query when the user has the "Match my
    // industry" toggle on AND hasn't manually overridden with advanced NAICS.
    // Manual selection always wins (the user is explicitly looking elsewhere).
    const profileNaics = (matchMyProfile && advNaics.length === 0)
      ? (companyProfile?.naics_codes?.filter(Boolean) ?? [])
      : [];
    const effectiveNaics = advNaics.length > 0 ? advNaics : profileNaics;

    return {
      keywords: searchQuery.trim() ? [searchQuery.trim()] : [],
      naics_codes: effectiveNaics,
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

  // Build a list of currently-active filters as removable chips. This is the
  // single source-of-truth view of "what's filtering my results" — used both
  // for the canonical chip row above the filter panel and for the smart
  // empty-state ("try removing one of these"). Each chip carries its own
  // remove handler that resets the relevant state and re-runs the search.
  type ActiveChip = { key: string; label: string; onRemove: () => void };
  const removeAndReapply = (mutate: () => void) => {
    mutate();
    setTimeout(() => handleApplyAdvancedFilters(), 0);
  };
  const getActiveFilterChips = (): ActiveChip[] => {
    const chips: ActiveChip[] = [];

    // Show the "match my industry" chip when the toggle is on AND the profile
    // has NAICS to apply AND the user hasn't overridden with manual NAICS.
    const profileNaicsCount = companyProfile?.naics_codes?.filter(Boolean).length ?? 0;
    if (matchMyProfile && profileNaicsCount > 0 && advNaics.length === 0) {
      chips.push({
        key: "match_profile",
        label: `My industry (${profileNaicsCount} NAICS)`,
        onRemove: () => removeAndReapply(() => setMatchMyProfile(false)),
      });
    }

    if (searchQuery.trim()) {
      chips.push({
        key: "keywords",
        label: `Keywords: ${searchQuery.trim()}`,
        onRemove: () => removeAndReapply(() => setSearchQuery("")),
      });
    }
    if (activeSector && SECTOR_CONFIG[activeSector]) {
      chips.push({
        key: "sector",
        label: `Sector: ${SECTOR_CONFIG[activeSector].label}`,
        onRemove: () => setActiveSector(null),
      });
    }
    for (const qf of activeFilters) {
      chips.push({
        key: `qf-${qf}`,
        label: qf,
        onRemove: () => handleQuickFilter(qf),
      });
    }
    if (activeOnly) {
      chips.push({ key: "active_only", label: "Active only", onRemove: () => removeAndReapply(() => setActiveOnly(false)) });
    }
    if (expiringSoon) {
      chips.push({ key: "expiring_soon", label: "Expiring soon", onRemove: () => removeAndReapply(() => setExpiringSoon(false)) });
    }
    if (newThisWeek) {
      chips.push({ key: "new_this_week", label: "New this week", onRemove: () => removeAndReapply(() => setNewThisWeek(false)) });
    }
    if (budgetKey) {
      const [bMin, bMax] = budgetKey.split("|");
      const fmt = (n: string) => n ? `$${(parseInt(n) / 1000).toLocaleString()}k` : "any";
      chips.push({
        key: "budget",
        label: `Budget: ${fmt(bMin)} – ${fmt(bMax)}`,
        onRemove: () => removeAndReapply(() => setBudgetKey("")),
      });
    }
    if (advAgency) {
      chips.push({ key: "agency", label: `Agency: ${advAgency}`, onRemove: () => removeAndReapply(() => setAdvAgency("")) });
    }
    if (advState) {
      chips.push({ key: "state", label: `Location: ${advState}`, onRemove: () => removeAndReapply(() => setAdvState("")) });
    }
    if (advType) {
      chips.push({ key: "type", label: `Type: ${advType}`, onRemove: () => removeAndReapply(() => setAdvType("")) });
    }
    if (advContractType) {
      chips.push({ key: "contract_type", label: `Contract: ${advContractType}`, onRemove: () => removeAndReapply(() => setAdvContractType("")) });
    }
    for (const sa of advSetAside) {
      chips.push({
        key: `sa-${sa}`,
        label: `Set-aside: ${sa}`,
        onRemove: () => removeAndReapply(() => setAdvSetAside(prev => prev.filter(x => x !== sa))),
      });
    }
    for (const naics of advNaics) {
      chips.push({
        key: `naics-${naics}`,
        label: `NAICS ${naics}`,
        onRemove: () => removeAndReapply(() => setAdvNaics(prev => prev.filter(x => x !== naics))),
      });
    }
    for (const psc of advPsc) {
      chips.push({
        key: `psc-${psc}`,
        label: `PSC ${psc}`,
        onRemove: () => removeAndReapply(() => setAdvPsc(prev => prev.filter(x => x !== psc))),
      });
    }
    if (advMinValue || advMaxValue) {
      const fmt = (n: string) => n ? `$${(parseInt(n) / 1000).toLocaleString()}k` : "any";
      chips.push({
        key: "value",
        label: `Value: ${fmt(advMinValue)} – ${fmt(advMaxValue)}`,
        onRemove: () => removeAndReapply(() => { setAdvMinValue(""); setAdvMaxValue(""); }),
      });
    }
    if (advDeadline) {
      chips.push({
        key: "deadline",
        label: `Deadline ≤ ${advDeadline}d`,
        onRemove: () => removeAndReapply(() => setAdvDeadline("")),
      });
    }
    return chips;
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

  const resultListRef = useRef<HTMLDivElement>(null);
  // Caller sets this to the previous length right before triggering a
  // load-more so the auto-scroll only fires for intentional appends.
  // Filter changes / new searches replace results entirely and should NOT
  // jump the viewport — that was the "jumpy scroll" bug.
  const scrollToIndexAfterAppend = useRef<number | null>(null);
  useEffect(() => {
    const targetIndex = scrollToIndexAfterAppend.current;
    if (targetIndex !== null && results.length > targetIndex) {
      scrollToIndexAfterAppend.current = null;
      setTimeout(() => {
        const items = resultListRef.current?.children;
        if (items && items[targetIndex]) {
          items[targetIndex].scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
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

  // Auto-load from local cache on mount when no sector/q param is present.
  // Wait until companyProfile has resolved (undefined → null | row) so the
  // "match my industry" filter can apply on the first page load instead of
  // showing unfiltered results until the user re-searches.
  const initialLoadDone = useRef(false);
  useEffect(() => {
    if (initialLoadDone.current) return;
    if (companyProfile === undefined) return; // wait for profile query to settle
    const hasSector = searchParams.get("sector");
    const hasQ = searchParams.get("q");
    if (hasSector || hasQ) return; // handled by other effects
    initialLoadDone.current = true;

    cachedSearch.searchLocal(buildCombinedFilters() as any, 0, 25);
  }, [companyProfile, searchParams]);

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
      // Reset pagination + the SAM-side total. Without these, "Showing N of X"
      // keeps the apiTotal from before the sort, and "Load more from SAM.gov"
      // would page from a stale offset.
      setCurrentPage(0);
      setSyncPage(0);
      setApiTotal(null);
      cachedSearch.searchLocal(filters as any, 0, currentLimit);
    }
  }, [cachedSearch.currentSort]);

  const trackContract = useTrackContract();
  const { data: trackedContracts } = useTrackedContracts();
  const saveSearch = useSaveSearch();
  const trackedIds = new Set(trackedContracts?.map(c => c.contract_id) || []);

  // Client-side re-sort by fit tier when the profile is populated. Server
  // returned the page in the user's chosen order (e.g. deadline asc); this
  // re-sort puts Great Fit ahead of Good Fit ahead of Low Fit. Ties (same
  // score) preserve the server order — so the chosen sort acts as a
  // tiebreaker within each fit tier.
  const displayResults = useMemo(() => {
    const canScore = !!companyProfile && (
      (companyProfile.naics_codes?.filter(Boolean).length ?? 0) > 0
      || (companyProfile.certifications?.filter(Boolean).length ?? 0) > 0
      || (companyProfile.psc_codes?.filter(Boolean).length ?? 0) > 0
    );
    if (!canScore) return cachedSearch.results;
    return [...cachedSearch.results]
      .map((r, i) => ({ r, i, score: computeHeuristicScore(r, companyProfile) }))
      .sort((a, b) => (b.score - a.score) || (a.i - b.i))
      .map(({ r }) => r);
  }, [cachedSearch.results, companyProfile]);

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
        // Search the local contracts table. We used to also call syncFromApi
        // here, which fired the admin sam-sync-incremental function on every
        // user click — but that function doesn't accept filters (it's a
        // generic "what's new since last sync" pull), it ignores the user's
        // query entirely, and the returned count was mislabeled as a
        // "SAM.gov total" in the UI. Cron already keeps the DB fresh; the
        // user search just reads from the DB.
        const filters = buildCombinedFilters();
        setSyncPage(0);
        setApiTotal(null);
        await cachedSearch.searchLocal(filters as any, 0, 25);
      }
    } catch (error) {}
  };

  // Jump to an absolute page (0-indexed). Resets the legacy syncPage counter
  // (no longer accumulates results) and scrolls the result list to the top.
  const handleGoToPage = async (page: number) => {
    setCurrentPage(page);
    setSyncPage(0);
    const filters = buildCombinedFilters();
    await cachedSearch.searchLocal(filters as any, page, 25);
    if (resultListRef.current) {
      resultListRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSyncFromApi = async () => {
    const filters = buildCombinedFilters();
    setSyncPage(0);
    const syncResult = await syncFromApi.mutateAsync();
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

    // Rebuild filters with the *new* activeFilters list. Mirrors
    // buildCombinedFilters but accepts the override so we don't have to
    // wait for state to flush. Critically, this preserves profile-NAICS
    // merging ("Match my industry") which the old inline build dropped.
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

    const profileNaics = (matchMyProfile && advNaics.length === 0)
      ? (companyProfile?.naics_codes?.filter(Boolean) ?? [])
      : [];
    const effectiveNaics = advNaics.length > 0 ? advNaics : profileNaics;

    const combinedFilters = {
      keywords: searchQuery.trim() ? [searchQuery.trim()] : [],
      naics_codes: effectiveNaics,
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

    // Reset toggle / quick-filter state so the loaded search starts clean —
    // otherwise lingering pills from a previous search stay lit and silently
    // narrow the result set in ways the user didn't intend.
    setActiveFilters([]);
    setActiveOnly(false);
    setExpiringSoon(false);
    setNewThisWeek(false);
    setBudgetKey("");
    setActiveSector(null);

    // Load the filters
    const filters = search.filters as any;
    setAdvNaics(filters.naics_codes ?? []);
    setAdvPsc(filters.psc_codes ?? []);
    setAdvMinValue(filters.min_value ? filters.min_value.toString() : "");
    setAdvMaxValue(filters.max_value ? filters.max_value.toString() : "");
    setAdvAgency(filters.agencies?.[0] ?? "");
    setAdvState(filters.location ?? "");
    setAdvType(filters.opportunity_type ?? "");
    setAdvSetAside(filters.set_aside ?? []);

    // Execute the search against the local contracts table. We no longer
    // call syncFromApi here — it was firing the admin sync function on
    // every saved-search load (burning a rate-limit slot) and its return
    // value was mislabeled as a "SAM.gov total" when it was really just the
    // count of newly-ingested rows.
    setCurrentPage(0);
    setSyncPage(0);
    setApiTotal(null);
    await cachedSearch.searchLocal(filters as any, 0, 25);

    toast.success(`Loaded search: ${search.name}`);
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
      <PageContainer variant="full" className="space-y-4">
        {/* Demo Mode Banner — real SAM solicitations also have IDs starting
            with "SAM-20xx-", so the old regex caught actual data. Detect the
            sentinel-prefixed seed IDs only ("SAM-DEMO-…" / "SAM-SEED-…"). */}
        {cachedSearch.results.length > 0 && /^SAM-(DEMO|SEED)-/i.test(cachedSearch.results[0]?.id) && (
          <div className="bg-accent/10 border border-accent/30 rounded-lg px-4 py-2 flex items-center gap-2 text-sm">
            <span className="font-semibold text-accent">Demo Mode:</span>
            <span className="text-muted-foreground">Showing sample contracts. Add a SAM.gov API key to search live opportunities.</span>
          </div>
        )}

        {/* Empty-profile prompt. Without NAICS/certs/PSC, the heuristic score
            can't differentiate contracts — everything would otherwise show
            "Low Fit". Surface the cause and link to the company profile. */}
        {companyProfile
          && (companyProfile.naics_codes?.filter(Boolean).length ?? 0) === 0
          && (companyProfile.certifications?.filter(Boolean).length ?? 0) === 0
          && (companyProfile.psc_codes?.filter(Boolean).length ?? 0) === 0 && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-3 flex items-center gap-3 text-sm">
            <Sparkles className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-foreground">Set up your profile to see fit scores</p>
              <p className="text-xs text-muted-foreground">Add your NAICS codes and certifications and we'll rank contracts by how well they match what you do.</p>
            </div>
            <Button variant="hero" size="sm" asChild>
              <Link to="/dashboard/company">Complete profile</Link>
            </Button>
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
            disabled={cachedSearch.isSearching}
          >
            <Search className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">
              {cachedSearch.isSearching ? "Searching..." : "Search"}
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

        {/* Canonical active-filters row. Shows EVERY currently-applied filter
            with an X to remove just that one — replaces both the old
            parsedFilters "Searching for:" chips (which only appeared after a
            smart-search) and the implicit-state confusion of having filters
            applied across multiple panels with no single readout. */}
        {(() => {
          const chips = getActiveFilterChips();
          if (chips.length === 0) return null;
          return (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex flex-wrap gap-2 items-center"
            >
              <span className="text-xs text-muted-foreground">Active filters:</span>
              {chips.map(chip => (
                <Badge key={chip.key} variant="glass" className="gap-1 pr-1 pl-2 py-1">
                  <span className="text-xs">{chip.label}</span>
                  <button
                    type="button"
                    onClick={chip.onRemove}
                    className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5 inline-flex"
                    aria-label={`Remove ${chip.label}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              {chips.length > 1 && (
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={clearAllFilters}>
                  Clear all
                </Button>
              )}
            </motion.div>
          );
        })()}

        {/* Inline Filter Section */}
        <FilterSection
          activeOnly={activeOnly}
          setActiveOnly={(v) => { setActiveOnly(v); setTimeout(() => handleApplyAdvancedFilters(), 0); }}
          expiringSoon={expiringSoon}
          setExpiringSoon={(v) => { setExpiringSoon(v); setTimeout(() => handleApplyAdvancedFilters(), 0); }}
          newThisWeek={newThisWeek}
          setNewThisWeek={(v) => { setNewThisWeek(v); setTimeout(() => handleApplyAdvancedFilters(), 0); }}
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
                      <span className="text-foreground font-semibold">{cachedSearch.total.toLocaleString()}</span> matching contracts
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
                ) : displayResults.length > 0 ? (
                  displayResults.map((result, index) => {
                    const isTracked = trackedIds.has(result.id);
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
                                {/* Top row: fit + set-aside.
                                    Show the personalized fit badge only when
                                    we can actually score (profile populated).
                                    With no profile, the old "Possible Match"
                                    fallback was just a re-render of the static
                                    matchScore=70 the sync writes — a label
                                    that pretended to be personalized but
                                    wasn't. Better to show nothing than to
                                    fake an assessment. The empty-profile
                                    banner above the results tells the user
                                    how to enable real scoring. */}
                                <div className="flex items-center gap-2">
                                  {(() => {
                                    const hScore = computeHeuristicScore(result, companyProfile);
                                    if (hScore < 0) return null;
                                    const sc = getScoreColor(hScore);
                                    return (
                                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${sc.bg} ${sc.text} border border-current/20`}>
                                        {sc.label}
                                      </span>
                                    );
                                  })()}
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
                      {(() => {
                        const chips = getActiveFilterChips();
                        // No data yet → bootstrap message + Find Contracts button
                        if (cacheCount === 0) {
                          return (
                            <>
                              <p className="text-muted-foreground mb-4">
                                Tell us what your business does and we'll search for government contracts that match.
                              </p>
                              <Button
                                variant="hero"
                                onClick={handleSyncFromApi}
                                disabled={syncFromApi.isPending}
                              >
                                <Search className="w-4 h-4 mr-2" />
                                {syncFromApi.isPending ? "Finding contracts..." : "Find Contracts"}
                              </Button>
                            </>
                          );
                        }
                        // Filters active → suggest removing them, one-tap
                        if (chips.length > 0) {
                          return (
                            <>
                              <p className="text-muted-foreground mb-4">
                                Your filters might be too narrow. Try removing one:
                              </p>
                              <div className="flex flex-wrap gap-2 justify-center mb-4">
                                {chips.slice(0, 6).map(chip => (
                                  <Badge key={chip.key} variant="outline" className="gap-1 pr-1 pl-2 py-1 cursor-pointer hover:bg-accent/20" onClick={chip.onRemove}>
                                    <span className="text-xs">Remove "{chip.label}"</span>
                                    <X className="w-3 h-3 ml-1" />
                                  </Badge>
                                ))}
                              </div>
                              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                                Clear all filters
                              </Button>
                            </>
                          );
                        }
                        // No filters, just no keyword matches
                        return (
                          <p className="text-muted-foreground">
                            Try different search terms.
                          </p>
                        );
                      })()}
                    </CardContent>
                  </Card>
                )}
              </div>

              {cachedSearch.results.length > 0 && cachedSearch.total > 25 && (
                <ResultsPagination
                  page={currentPage}
                  pageSize={25}
                  total={cachedSearch.total}
                  onChange={handleGoToPage}
                  disabled={cachedSearch.isSearching}
                />
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
      </PageContainer>


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
