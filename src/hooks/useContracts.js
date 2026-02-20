import { useState, useCallback, useEffect, useRef } from "react";
import { fetchAllContracts } from "../services/contractsApi";
import { useContractStore } from "../store/contractStore";

const DEFAULT_FILTERS = {
  keyword:      "",
  sector:       "all",
  minValue:     0,
  maxValue:     null,
  setAside:     "any",
  agency:       "",
  contractType: "any",
  daysBack:     90,
  activeOnly:   true,
  expiringSoon: false,
  location:     "",
};

export function useContracts() {
  const [filters, setFilters]       = useState(DEFAULT_FILTERS);
  const [results, setResults]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [page, setPage]             = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [activeTab, setActiveTab]   = useState("all");
  const [sortBy, setSortBy]         = useState("roiScore");
  const [sortDir, setSortDir]       = useState("desc");

  const { savedContracts, saveContract, unsaveContract } = useContractStore();

  const abortRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== null && v !== "" && v !== false && v !== 0) params.set(k, v);
    });
    window.history.replaceState({}, "", `?${params.toString()}`);
  }, [filters]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.toString()) {
      const restored = { ...DEFAULT_FILTERS };
      params.forEach((value, key) => {
        if (key in DEFAULT_FILTERS) {
          if (value === "true")       restored[key] = true;
          else if (value === "false") restored[key] = false;
          else if (!isNaN(value) && value !== "") restored[key] = Number(value);
          else restored[key] = value;
        }
      });
      setFilters(restored);
    }
  }, []);

  const fetchContracts = useCallback(async (overrideFilters = null) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    const activeFilters = overrideFilters || filters;

    try {
      let data = await fetchAllContracts(activeFilters);

      if (activeFilters.setAside !== "any") {
        data = data.filter(c =>
          (c.setAside || "").toLowerCase().includes(activeFilters.setAside.toLowerCase())
        );
      }

      if (activeFilters.contractType !== "any") {
        data = data.filter(c =>
          (c.contractType || "").toLowerCase().includes(activeFilters.contractType.toLowerCase())
        );
      }

      if (activeFilters.agency) {
        data = data.filter(c =>
          (c.agency || "").toLowerCase().includes(activeFilters.agency.toLowerCase())
        );
      }

      if (activeFilters.location) {
        data = data.filter(c =>
          (c.location || "").toLowerCase().includes(activeFilters.location.toLowerCase())
        );
      }

      if (activeFilters.activeOnly) {
        const now = new Date();
        data = data.filter(c => !c.deadline || new Date(c.deadline) > now);
      }

      if (activeFilters.expiringSoon) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() + 14);
        data = data.filter(c => c.deadline && new Date(c.deadline) <= cutoff);
      }

      if (activeTab !== "all") {
        const sourceMap = { sam: "SAM.gov", usaspending: "USASpending", apify: "Apify" };
        data = data.filter(c => c.source === sourceMap[activeTab]);
      }

      data = sortContracts(data, sortBy, sortDir);

      setTotalCount(data.length);
      setResults(paginate(data, page, 25));

    } catch (err) {
      if (err.name !== "AbortError") {
        setError("Failed to load contracts. Showing demo data.");
        setResults(getMockData(activeFilters));
      }
    } finally {
      setLoading(false);
    }
  }, [filters, activeTab, sortBy, sortDir, page]);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const updateFilters = useCallback((updates) => {
    setFilters(prev => ({ ...prev, ...updates }));
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  const handleSort = useCallback((column) => {
    setSortDir(prev => sortBy === column ? (prev === "desc" ? "asc" : "desc") : "desc");
    setSortBy(column);
  }, [sortBy]);

  const isSaved = useCallback((id) => {
    return savedContracts.some(c => c.id === id);
  }, [savedContracts]);

  const toggleSave = useCallback((contract) => {
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

function sortContracts(data, sortBy, sortDir) {
  return [...data].sort((a, b) => {
    let aVal = a[sortBy] ?? 0;
    let bVal = b[sortBy] ?? 0;

    if (sortBy === "value")    { aVal = parseFloat(aVal) || 0; bVal = parseFloat(bVal) || 0; }
    if (sortBy === "deadline") { aVal = new Date(aVal || 0);   bVal = new Date(bVal || 0); }

    if (aVal < bVal) return sortDir === "desc" ? 1  : -1;
    if (aVal > bVal) return sortDir === "desc" ? -1 : 1;
    return 0;
  });
}

function paginate(data, page, perPage) {
  return data.slice(0, page * perPage);
}

function getMockData(filters) {
  const all = MOCK_CONTRACTS;
  if (!filters.sector || filters.sector === "all") return all;
  return all.filter(c => c.sector === filters.sector);
}

const MOCK_CONTRACTS = [
  { id: "m1",  title: "Cybersecurity Assessment Services",        agency: "Dept of Homeland Security",  sector: "technology",    value: 850000,  deadline: "2026-04-15", naicsCode: "541519", setAside: "Small Business", roiScore: 88, source: "SAM.gov",     url: "#", contractType: "FFP",  location: "Washington DC", description: "Comprehensive cybersecurity assessment and penetration testing for DHS systems." },
  { id: "m2",  title: "Electronic Health Records Modernization",  agency: "Veterans Affairs",            sector: "healthcare",    value: 2100000, deadline: "2026-03-30", naicsCode: "621112", setAside: "Any",           roiScore: 72, source: "SAM.gov",     url: "#", contractType: "IDIQ", location: "National",      description: "Modernization of EHR systems across VA facilities nationwide." },
  { id: "m3",  title: "Federal Courthouse Renovation",            agency: "General Services Admin",     sector: "construction",  value: 4500000, deadline: "2026-05-01", naicsCode: "236220", setAside: "HUBZone",       roiScore: 65, source: "USASpending", url: "#", contractType: "FFP",  location: "Atlanta GA",    description: "Full renovation of federal courthouse including accessibility upgrades." },
  { id: "m4",  title: "Management Consulting DEI Strategy",       agency: "Office of Personnel Mgmt",   sector: "consulting",    value: 320000,  deadline: "2026-03-20", naicsCode: "541611", setAside: "WOSB",          roiScore: 79, source: "SAM.gov",     url: "#", contractType: "T&M",  location: "Washington DC", description: "Strategic consulting for DEI program development and implementation." },
  { id: "m5",  title: "Bridge Structural Engineering Services",   agency: "Dept of Transportation",     sector: "engineering",   value: 1750000, deadline: "2026-04-22", naicsCode: "541330", setAside: "Small Business", roiScore: 81, source: "SAM.gov",     url: "#", contractType: "IDIQ", location: "Ohio",          description: "Structural engineering assessment and design for aging bridge infrastructure." },
  { id: "m6",  title: "STEM Curriculum Development Program",      agency: "Dept of Education",          sector: "education",     value: 490000,  deadline: "2026-03-25", naicsCode: "611430", setAside: "8(a)",          roiScore: 76, source: "Apify",       url: "#", contractType: "Grant",location: "National",      description: "Development of K-12 STEM curriculum aligned with national standards." },
  { id: "m7",  title: "Last-Mile Logistics Rural Delivery",       agency: "USPS / GSA",                 sector: "logistics",     value: 980000,  deadline: "2026-04-10", naicsCode: "492110", setAside: "Small Business", roiScore: 70, source: "USASpending", url: "#", contractType: "BPA",  location: "Rural Midwest", description: "Last-mile delivery solutions for rural postal service routes." },
  { id: "m8",  title: "Solar Panel Installation Federal Campus",  agency: "Dept of Energy",             sector: "energy",        value: 3200000, deadline: "2026-05-15", naicsCode: "221114", setAside: "Any",           roiScore: 68, source: "SAM.gov",     url: "#", contractType: "FFP",  location: "Nevada",        description: "Installation of solar panels across federal campus buildings." },
  { id: "m9",  title: "Tactical Communications Equipment",        agency: "Dept of Defense",            sector: "defense",       value: 6700000, deadline: "2026-06-01", naicsCode: "334220", setAside: "SDVOSB",        roiScore: 74, source: "SAM.gov",     url: "#", contractType: "FFP",  location: "Virginia",      description: "Procurement of next-generation tactical communication systems." },
  { id: "m10", title: "PPE Manufacturing and Supply Contract",    agency: "HHS / FEMA",                 sector: "manufacturing", value: 1100000, deadline: "2026-03-28", naicsCode: "339113", setAside: "Small Business", roiScore: 83, source: "USASpending", url: "#", contractType: "IDIQ", location: "National",      description: "Domestic manufacturing and supply of personal protective equipment." },
  { id: "m11", title: "Hazardous Waste Cleanup Services",         agency: "EPA",                        sector: "environment",   value: 2800000, deadline: "2026-04-30", naicsCode: "562211", setAside: "8(a)",          roiScore: 67, source: "SAM.gov",     url: "#", contractType: "Cost Plus", location: "Maryland",    description: "Remediation of hazardous waste sites in the mid-Atlantic region." },
  { id: "m12", title: "Federal Audit and Compliance Services",    agency: "Treasury / OMB",             sector: "finance",       value: 560000,  deadline: "2026-03-22", naicsCode: "541211", setAside: "WOSB",          roiScore: 85, source: "Apify",       url: "#", contractType: "T&M",  location: "Washington DC", description: "Independent financial audit and regulatory compliance review." },
  { id: "m13", title: "Legal Research and Regulatory Analysis",   agency: "Dept of Justice",            sector: "legal",         value: 275000,  deadline: "2026-04-05", naicsCode: "541110", setAside: "Small Business", roiScore: 78, source: "SAM.gov",     url: "#", contractType: "FFP",  location: "Washington DC", description: "Legal research support and regulatory analysis for DOJ litigation." },
  { id: "m14", title: "Public Affairs and Digital Media Campaign", agency: "CDC",                       sector: "marketing",     value: 430000,  deadline: "2026-03-18", naicsCode: "541810", setAside: "Any",           roiScore: 71, source: "USASpending", url: "#", contractType: "FFP",  location: "Atlanta GA",    description: "Public health awareness digital media campaign development." },
  { id: "m15", title: "Agricultural Research Grant Soil Health",  agency: "USDA",                       sector: "agriculture",   value: 680000,  deadline: "2026-05-10", naicsCode: "111998", setAside: "Small Business", roiScore: 64, source: "SAM.gov",     url: "#", contractType: "Grant",location: "Iowa",          description: "Research grant for soil health monitoring and regenerative farming practices." },
  { id: "m16", title: "Federal Facility Security Guards",         agency: "GSA / DHS",                  sector: "security",      value: 1900000, deadline: "2026-04-18", naicsCode: "561612", setAside: "SDVOSB",        roiScore: 77, source: "SAM.gov",     url: "#", contractType: "IDIQ", location: "National",      description: "Armed and unarmed security personnel for federal facilities." },
  { id: "m17", title: "5G Network Infrastructure Deployment",     agency: "FCC / DoD",                  sector: "telecom",       value: 5100000, deadline: "2026-05-20", naicsCode: "517312", setAside: "Any",           roiScore: 69, source: "Apify",       url: "#", contractType: "FFP",  location: "National",      description: "5G infrastructure deployment across military and federal campuses." },
  { id: "m18", title: "HR Transformation and Workforce Planning", agency: "Office of Personnel Mgmt",   sector: "hr_staffing",   value: 390000,  deadline: "2026-03-31", naicsCode: "561311", setAside: "WOSB",          roiScore: 82, source: "SAM.gov",     url: "#", contractType: "T&M",  location: "Washington DC", description: "Strategic HR transformation and workforce planning consulting." },
  { id: "m19", title: "AI and Machine Learning Research",         agency: "DARPA / NSF",                sector: "research",      value: 3800000, deadline: "2026-06-15", naicsCode: "541715", setAside: "Small Business", roiScore: 91, source: "SAM.gov",     url: "#", contractType: "Cost Plus", location: "National",    description: "Advanced AI and ML research for national security applications." },
  { id: "m20", title: "Federal Office Building Maintenance",      agency: "GSA",                        sector: "facilities",    value: 720000,  deadline: "2026-04-08", naicsCode: "531110", setAside: "HUBZone",       roiScore: 66, source: "USASpending", url: "#", contractType: "IDIQ", location: "National",      description: "Comprehensive maintenance and janitorial services for federal office buildings." },
  { id: "m21", title: "Community Mental Health Program",          agency: "SAMHSA",                     sector: "social",        value: 510000,  deadline: "2026-03-26", naicsCode: "624190", setAside: "8(a)",          roiScore: 73, source: "SAM.gov",     url: "#", contractType: "Grant",location: "Chicago IL",    description: "Community-based mental health support and substance abuse prevention." },
  { id: "m22", title: "Big Data Analytics Platform IRS",         agency: "IRS / Treasury",              sector: "data_analytics",value: 2400000, deadline: "2026-05-05", naicsCode: "541511", setAside: "Small Business", roiScore: 87, source: "SAM.gov",     url: "#", contractType: "IDIQ", location: "Washington DC", description: "Development of big data analytics platform for tax compliance monitoring." },
  { id: "m23", title: "Clinical Lab Testing Services NIH",        agency: "NIH",                        sector: "scientific",    value: 1300000, deadline: "2026-04-25", naicsCode: "621511", setAside: "Any",           roiScore: 75, source: "USASpending", url: "#", contractType: "FFP",  location: "Maryland",      description: "Clinical laboratory testing and sample analysis services for NIH research." },
  { id: "m24", title: "Cloud Migration Legacy Systems",           agency: "SSA",                        sector: "technology",    value: 4200000, deadline: "2026-05-28", naicsCode: "541512", setAside: "Small Business", roiScore: 89, source: "SAM.gov",     url: "#", contractType: "T&M",  location: "Baltimore MD",  description: "Cloud migration of legacy mainframe systems to modern AWS/Azure infrastructure." },
  { id: "m25", title: "Telehealth Platform Development",          agency: "HHS",                        sector: "healthcare",    value: 1650000, deadline: "2026-04-12", naicsCode: "621399", setAside: "WOSB",          roiScore: 86, source: "Apify",       url: "#", contractType: "FFP",  location: "National",      description: "Development of telehealth platform to expand rural healthcare access." },
];
