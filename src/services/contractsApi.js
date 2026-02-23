import { supabase } from "@/integrations/supabase/client";
import { SECTOR_NAICS } from "@/config/sectors";

/**
 * Maps useContracts hook filters → SearchFilters format (same as useSearch.tsx),
 * calls sam-search edge function, and normalises results into the contract shape
 * expected by the rest of the app.
 */
async function fetchFromSamGov(filters, signal) {
  // Convert legacy filter format to unified SearchFilters format
  const samFilters = {
    keywords: filters.keyword ? filters.keyword.trim().split(/\s+/) : [],
    naics_codes: filters.sector && filters.sector !== "all" && SECTOR_NAICS[filters.sector]
      ? SECTOR_NAICS[filters.sector]
      : [],
    psc_codes: [],
    set_aside: filters.setAside && filters.setAside !== "any" ? [filters.setAside] : [],
    agencies: filters.agency ? [filters.agency] : [],
    min_value: filters.minValue || null,
    max_value: filters.maxValue || null,
    location: filters.location || null,
    opportunity_type: null,
  };

  const { data, error } = await supabase.functions.invoke("sam-search", {
    body: { filters: samFilters, page: 0, limit: 50 },
  });

  if (error) {
    console.warn("sam-search call failed:", error);
    return [];
  }

  const results = data?.results || [];

  // Normalise SAM results into the contract shape used by useContracts
  return results.map((r) => ({
    id: r.id || `sam-${Math.random().toString(36).slice(2)}`,
    title: r.title || "Untitled Opportunity",
    agency: r.agency || "Federal Agency",
    sector: guessSector(r.naicsCode),
    value: parseValue(r.value),
    deadline: r.deadline || null,
    naicsCode: r.naicsCode || "",
    setAside: r.setAside || "Any",
    roiScore: r.matchScore || 70,
    source: "SAM.gov",
    url: r.link || "https://sam.gov",
    contractType: r.type || "FFP",
    location: r.location || "National",
    description: r.description || "",
    resourceLinks: r.resourceLinks || [],
  }));
}

/**
 * Calls usaspending-search edge function for recent awards
 * and normalises them into the same contract shape.
 */
async function fetchFromUSASpending(filters, signal) {
  const keyword = filters.keyword || "government services";

  const { data, error } = await supabase.functions.invoke("usaspending-search", {
    body: {
      action: "search_awards",
      params: { recipient_name: keyword, page: 1, limit: 50 },
    },
  });

  if (error) {
    console.warn("usaspending-search call failed:", error);
    return [];
  }

  const results = data?.results || [];

  return results.map((r) => ({
    id: r["Award ID"] || `usa-${Math.random().toString(36).slice(2)}`,
    title: r["Description"] || r["Award ID"] || "USASpending Award",
    agency: r["Awarding Agency"] || "Federal Agency",
    sector: guessSector(r["NAICS Code"]),
    value: typeof r["Award Amount"] === "number" ? r["Award Amount"] : parseValue(String(r["Award Amount"] || "0")),
    deadline: null,
    naicsCode: r["NAICS Code"] || "",
    setAside: "Any",
    roiScore: 65,
    source: "USASpending",
    url: `https://www.usaspending.gov/award/${r["Award ID"]}`,
    contractType: "Award",
    location: [r["Place of Performance City"], r["Place of Performance State Code"]].filter(Boolean).join(", ") || "National",
    description: r["Description"] || "",
    resourceLinks: [],
  }));
}

/**
 * Main entry point — called by useContracts hook.
 * Fetches from both SAM.gov and USASpending in parallel,
 * merges the results, and returns them.
 */
export async function fetchAllContracts(filters = {}) {
  const [samResults, usaResults] = await Promise.allSettled([
    fetchFromSamGov(filters),
    fetchFromUSASpending(filters),
  ]);

  const sam = samResults.status === "fulfilled" ? samResults.value : [];
  const usa = usaResults.status === "fulfilled" ? usaResults.value : [];

  const combined = [...sam, ...usa];

  // Deduplicate by id
  const seen = new Set();
  return combined.filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
}

// ─── helpers ────────────────────────────────────────────────

/** Parse a formatted value string like "$4.2M" or "$850K" into a number */
function parseValue(str) {
  if (typeof str === "number") return str;
  if (!str || str === "TBD") return 0;
  const clean = str.replace(/[^0-9.MKBmkb]/g, "");
  const num = parseFloat(clean) || 0;
  if (/[Mm]/.test(str)) return num * 1_000_000;
  if (/[Kk]/.test(str)) return num * 1_000;
  if (/[Bb]/.test(str)) return num * 1_000_000_000;
  return num;
}

/** Best-effort NAICS → sector mapping */
const NAICS_SECTOR_MAP = {
  "54": "technology",
  "5415": "technology",
  "5412": "consulting",
  "5413": "engineering",
  "5411": "legal",
  "5416": "consulting",
  "5417": "research",
  "5418": "marketing",
  "5419": "consulting",
  "5182": "data_analytics",
  "5191": "data_analytics",
  "6211": "healthcare",
  "6212": "healthcare",
  "6221": "healthcare",
  "6231": "healthcare",
  "6213": "hr_staffing",
  "2361": "construction",
  "2362": "construction",
  "2211": "energy",
  "3364": "defense",
  "3341": "manufacturing",
  "3342": "manufacturing",
  "5611": "admin",
  "5613": "hr_staffing",
  "5616": "security",
  "5617": "facilities",
  "5629": "environment",
  "6111": "education",
  "6241": "social",
  "4911": "logistics",
  "5171": "telecom",
  "5311": "facilities",
  "1111": "agriculture",
  "5221": "finance",
  "5241": "finance",
};

function guessSector(naics) {
  if (!naics) return "technology";
  const four = naics.substring(0, 4);
  const two = naics.substring(0, 2);
  return NAICS_SECTOR_MAP[four] || NAICS_SECTOR_MAP[two] || "technology";
}
