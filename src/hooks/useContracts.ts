import { useState, useCallback, useEffect, useRef } from "react";
import { fetchAllContracts } from "@/services/contractsApi";
import { useContractStore, type Contract } from "@/store/contractStore";
import { toast } from "sonner";

interface Filters {
  keyword: string;
  sector: string;
  minValue: number;
  maxValue: number | null;
  setAside: string;
  agency: string;
  contractType: string;
  daysBack: number;
  activeOnly: boolean;
  expiringSoon: boolean;
  location: string;
  [key: string]: unknown;
}

const DEFAULT_FILTERS: Filters = {
  keyword: "",
  sector: "all",
  minValue: 0,
  maxValue: null,
  setAside: "any",
  agency: "",
  contractType: "any",
  daysBack: 90,
  activeOnly: true,
  expiringSoon: false,
  location: "",
};

export function useContracts() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [results, setResults] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("roiScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { savedContracts, saveContract, unsaveContract } = useContractStore();

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== null && v !== "" && v !== false && v !== 0) params.set(k, String(v));
    });
    window.history.replaceState({}, "", `?${params.toString()}`);
  }, [filters]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.toString()) {
      const restored: Filters = { ...DEFAULT_FILTERS };
      params.forEach((value, key) => {
        if (key in DEFAULT_FILTERS) {
          if (value === "true") (restored as Record<string, unknown>)[key] = true;
          else if (value === "false") (restored as Record<string, unknown>)[key] = false;
          else if (!isNaN(Number(value)) && value !== "") (restored as Record<string, unknown>)[key] = Number(value);
          else (restored as Record<string, unknown>)[key] = value;
        }
      });
      setFilters(restored);
    }
  }, []);

  const fetchContracts = useCallback(async (overrideFilters: Filters | null = null) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    const activeFilters = overrideFilters || filters;

    try {
      let data = await fetchAllContracts(activeFilters);

      if (activeFilters.contractType !== "any") {
        data = data.filter((c) =>
          (c.contractType || "").toLowerCase().includes(activeFilters.contractType.toLowerCase()),
        );
      }

      if (activeFilters.activeOnly) {
        const now = new Date();
        data = data.filter((c) => !c.deadline || new Date(c.deadline) > now);
      }

      if (activeFilters.expiringSoon) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() + 14);
        data = data.filter((c) => c.deadline && new Date(c.deadline) <= cutoff);
      }

      if (activeTab !== "all") {
        const sourceMap: Record<string, string> = { sam: "SAM.gov", usaspending: "USASpending", apify: "Apify" };
        data = data.filter((c) => c.source === sourceMap[activeTab]);
      }

      data = sortContracts(data, sortBy, sortDir);

      setTotalCount(data.length);
      setResults(paginate(data, page, 25));
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError("Failed to load contracts. Showing demo data.");
        setResults(getMockData(activeFilters));
      }
    } finally {
      setLoading(false);
    }
  }, [filters, activeTab, sortBy, sortDir, page]);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  const updateFilter = useCallback((key: string, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const updateFilters = useCallback((updates: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  const handleSort = useCallback((column: string) => {
    setSortDir((prev) => (sortBy === column ? (prev === "desc" ? "asc" : "desc") : "desc"));
    setSortBy(column);
  }, [sortBy]);

  const isSaved = useCallback((id: string) => {
    return savedContracts.some((c) => c.id === id);
  }, [savedContracts]);

  const toggleSave = useCallback((contract: Contract) => {
    isSaved(contract.id) ? unsaveContract(contract.id) : saveContract(contract);
  }, [isSaved, saveContract, unsaveContract]);

  return {
    filters, results, loading, error, page, totalCount,
    activeTab, sortBy, sortDir, savedContracts,
    updateFilter, updateFilters, resetFilters,
    setPage, setActiveTab, handleSort,
    toggleSave, isSaved, refetch: fetchContracts,
  };
}

function sortContracts(data: Contract[], sortBy: string, sortDir: "asc" | "desc"): Contract[] {
  return [...data].sort((a, b) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let aVal: unknown = (a as any)[sortBy] ?? 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let bVal: unknown = (b as any)[sortBy] ?? 0;

    if (sortBy === "value") { aVal = parseFloat(String(aVal)) || 0; bVal = parseFloat(String(bVal)) || 0; }
    if (sortBy === "deadline") { aVal = new Date(String(aVal) || 0); bVal = new Date(String(bVal) || 0); }

    if ((aVal as number) < (bVal as number)) return sortDir === "desc" ? 1 : -1;
    if ((aVal as number) > (bVal as number)) return sortDir === "desc" ? -1 : 1;
    return 0;
  });
}

function paginate(data: Contract[], page: number, perPage: number): Contract[] {
  return data.slice(0, page * perPage);
}

function getMockData(filters: Filters): Contract[] {
  if (!filters.sector || filters.sector === "all") return MOCK_CONTRACTS;
  return MOCK_CONTRACTS.filter((c) => c.sector === filters.sector);
}

const MOCK_CONTRACTS: Contract[] = [
  { id: "m1", title: "Cybersecurity Assessment Services", agency: "Dept of Homeland Security", sector: "technology", value: 850000, deadline: "2026-04-15", naicsCode: "541519", setAside: "Small Business", roiScore: 88, source: "SAM.gov", url: "#", contractType: "FFP", location: "Washington DC", description: "Comprehensive cybersecurity assessment and penetration testing for DHS systems." },
  { id: "m2", title: "Electronic Health Records Modernization", agency: "Veterans Affairs", sector: "healthcare", value: 2100000, deadline: "2026-03-30", naicsCode: "621112", setAside: "Any", roiScore: 72, source: "SAM.gov", url: "#", contractType: "IDIQ", location: "National", description: "Modernization of EHR systems across VA facilities nationwide." },
  { id: "m3", title: "Federal Courthouse Renovation", agency: "General Services Admin", sector: "construction", value: 4500000, deadline: "2026-05-01", naicsCode: "236220", setAside: "HUBZone", roiScore: 65, source: "USASpending", url: "#", contractType: "FFP", location: "Atlanta GA", description: "Full renovation of federal courthouse including accessibility upgrades." },
  { id: "m4", title: "Management Consulting DEI Strategy", agency: "Office of Personnel Mgmt", sector: "consulting", value: 320000, deadline: "2026-03-20", naicsCode: "541611", setAside: "WOSB", roiScore: 79, source: "SAM.gov", url: "#", contractType: "T&M", location: "Washington DC", description: "Strategic consulting for DEI program development and implementation." },
  { id: "m5", title: "Bridge Structural Engineering Services", agency: "Dept of Transportation", sector: "engineering", value: 1750000, deadline: "2026-04-22", naicsCode: "541330", setAside: "Small Business", roiScore: 81, source: "SAM.gov", url: "#", contractType: "IDIQ", location: "Ohio", description: "Structural engineering assessment and design for aging bridge infrastructure." },
];
