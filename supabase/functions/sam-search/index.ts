import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SAM.gov API base URL
const SAM_API_BASE = "https://api.sam.gov/opportunities/v2/search";

interface SearchFilters {
  keywords: string[];
  naics_codes: string[];
  set_aside: string[];
  agencies: string[];
  min_value: number | null;
  max_value: number | null;
  location: string | null;
  opportunity_type: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filters, page = 0, limit = 10 } = await req.json();
    
    const SAM_API_KEY = Deno.env.get("SAM_API_KEY");
    
    // If no SAM API key, return mock data for development
    if (!SAM_API_KEY) {
      console.log("No SAM_API_KEY configured, returning mock data");
      return new Response(
        JSON.stringify(getMockResults(filters, page, limit)),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Searching SAM.gov with filters:", JSON.stringify(filters));

    // Build SAM.gov API query parameters
    const params = new URLSearchParams();
    params.append("api_key", SAM_API_KEY);
    params.append("limit", limit.toString());
    params.append("offset", (page * limit).toString());
    
    // Add keyword search
    if (filters.keywords && filters.keywords.length > 0) {
      params.append("q", filters.keywords.join(" "));
    }
    
    // Add NAICS codes
    if (filters.naics_codes && filters.naics_codes.length > 0) {
      params.append("naics", filters.naics_codes.join(","));
    }
    
    // Add set-aside types
    if (filters.set_aside && filters.set_aside.length > 0) {
      const setAsideMapping: Record<string, string> = {
        "SDVOSB": "SDVOSBC",
        "8(a)": "SBA",
        "HUBZone": "HZC",
        "WOSB": "WOSB",
        "Small Business": "SBP"
      };
      const codes = filters.set_aside.map((s: string) => setAsideMapping[s] || s).join(",");
      params.append("setaside", codes);
    }
    
    // Add location/state
    if (filters.location) {
      params.append("postedFrom", filters.location);
    }

    // Only search for active opportunities
    params.append("postedFrom", getDateMonthsAgo(6));
    params.append("postedTo", new Date().toISOString().split('T')[0]);

    const response = await fetch(`${SAM_API_BASE}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("SAM.gov API error:", response.status, errorText);
      // Return mock data on API error
      return new Response(
        JSON.stringify(getMockResults(filters, page, limit)),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log("SAM.gov response count:", data.opportunitiesData?.length || 0);

    // Transform SAM.gov response to our format
    const results = transformSamResults(data.opportunitiesData || [], filters);

    return new Response(
      JSON.stringify({
        results,
        total: data.totalRecords || results.length,
        page,
        limit
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error searching SAM.gov:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getDateMonthsAgo(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date.toISOString().split('T')[0];
}

function transformSamResults(opportunities: any[], filters: SearchFilters) {
  return opportunities.map((opp: any) => ({
    id: opp.noticeId || opp.opportunityId || `SAM-${Date.now()}-${Math.random()}`,
    title: opp.title || "Untitled Opportunity",
    agency: opp.department || opp.agency || "Unknown Agency",
    type: opp.type || "Federal",
    setAside: opp.typeOfSetAside || "Full & Open",
    value: formatValue(opp.award?.amount),
    deadline: opp.responseDeadLine || opp.archiveDate,
    postedDate: opp.postedDate,
    location: opp.placeOfPerformance?.city?.name || opp.placeOfPerformance?.state?.name || "Various",
    naicsCode: opp.naics?.[0]?.code || "",
    matchScore: calculateMatchScore(opp, filters),
    description: opp.description || opp.synopsis || "",
    solicitationNumber: opp.solicitationNumber || "",
    link: opp.uiLink || `https://sam.gov/opp/${opp.noticeId}`
  }));
}

function formatValue(amount: number | null | undefined): string {
  if (!amount) return "TBD";
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount}`;
}

function calculateMatchScore(opp: any, filters: SearchFilters): number {
  let score = 70; // Base score
  
  // Boost for NAICS match
  if (filters.naics_codes && filters.naics_codes.length > 0) {
    const oppNaics = opp.naics?.map((n: any) => n.code) || [];
    if (filters.naics_codes.some(code => oppNaics.includes(code))) {
      score += 15;
    }
  }
  
  // Boost for set-aside match
  if (filters.set_aside && filters.set_aside.length > 0) {
    if (filters.set_aside.some(s => opp.typeOfSetAside?.includes(s))) {
      score += 10;
    }
  }
  
  // Boost for keyword match in title
  if (filters.keywords && filters.keywords.length > 0) {
    const title = (opp.title || "").toLowerCase();
    const matchingKeywords = filters.keywords.filter(k => title.includes(k.toLowerCase()));
    score += Math.min(matchingKeywords.length * 3, 15);
  }
  
  return Math.min(score, 99);
}

function getMockResults(filters: SearchFilters, page: number, limit: number) {
  // Generate mock results based on filters
  const mockData = [
    {
      id: "SAM-2024-001",
      title: "IT Infrastructure Modernization Support",
      agency: "Department of Defense",
      type: "Federal",
      setAside: "SDVOSB",
      value: "$4,200,000",
      deadline: "2026-01-15",
      postedDate: "2024-12-10",
      location: "Washington, DC",
      naicsCode: "541512",
      matchScore: 96,
      description: "IT infrastructure modernization and support services for DOD systems.",
      solicitationNumber: "W91CRB-24-R-0001",
      link: "https://sam.gov/opp/sample1"
    },
    {
      id: "SAM-2024-002",
      title: "Cybersecurity Risk Assessment Services",
      agency: "Department of Homeland Security",
      type: "Federal",
      setAside: "8(a)",
      value: "$1,800,000",
      deadline: "2026-01-22",
      postedDate: "2024-12-08",
      location: "Arlington, VA",
      naicsCode: "541519",
      matchScore: 92,
      description: "Comprehensive cybersecurity risk assessment and monitoring services.",
      solicitationNumber: "70CMSD24R00000001",
      link: "https://sam.gov/opp/sample2"
    },
    {
      id: "SAM-2024-003",
      title: "Cloud Migration and Management",
      agency: "General Services Administration",
      type: "Federal",
      setAside: "Small Business",
      value: "$2,500,000",
      deadline: "2026-02-01",
      postedDate: "2024-12-05",
      location: "Remote",
      naicsCode: "541511",
      matchScore: 88,
      description: "Cloud infrastructure migration, management, and optimization services.",
      solicitationNumber: "47QFCA24R0001",
      link: "https://sam.gov/opp/sample3"
    },
    {
      id: "SAM-2024-004",
      title: "Data Analytics Platform Development",
      agency: "Department of Veterans Affairs",
      type: "Federal",
      setAside: "WOSB",
      value: "$3,100,000",
      deadline: "2026-02-10",
      postedDate: "2024-12-03",
      location: "Multiple Locations",
      naicsCode: "541512",
      matchScore: 85,
      description: "Development and implementation of advanced data analytics platform.",
      solicitationNumber: "36C10B24R0001",
      link: "https://sam.gov/opp/sample4"
    },
    {
      id: "SAM-2024-005",
      title: "Network Security Operations Center",
      agency: "Department of Energy",
      type: "Federal",
      setAside: "HUBZone",
      value: "$5,700,000",
      deadline: "2026-02-28",
      postedDate: "2024-12-01",
      location: "Oak Ridge, TN",
      naicsCode: "541519",
      matchScore: 82,
      description: "24/7 network security operations center management and support.",
      solicitationNumber: "89243024RNE000001",
      link: "https://sam.gov/opp/sample5"
    },
    {
      id: "SAM-2024-006",
      title: "Enterprise Software Development Services",
      agency: "Department of the Treasury",
      type: "Federal",
      setAside: "Full & Open",
      value: "$8,500,000",
      deadline: "2026-03-15",
      postedDate: "2024-11-28",
      location: "Washington, DC",
      naicsCode: "541511",
      matchScore: 79,
      description: "Enterprise-level software development and integration services.",
      solicitationNumber: "TIRDO-24-R-00001",
      link: "https://sam.gov/opp/sample6"
    },
    {
      id: "SAM-2024-007",
      title: "Healthcare IT Consulting",
      agency: "Department of Health and Human Services",
      type: "Federal",
      setAside: "8(a)",
      value: "$2,200,000",
      deadline: "2026-03-01",
      postedDate: "2024-11-25",
      location: "Bethesda, MD",
      naicsCode: "541512",
      matchScore: 76,
      description: "Healthcare information technology consulting and implementation.",
      solicitationNumber: "75F40124R00001",
      link: "https://sam.gov/opp/sample7"
    },
    {
      id: "SAM-2024-008",
      title: "AI and Machine Learning Solutions",
      agency: "National Aeronautics and Space Administration",
      type: "Federal",
      setAside: "Small Business",
      value: "$4,800,000",
      deadline: "2026-03-20",
      postedDate: "2024-11-20",
      location: "Houston, TX",
      naicsCode: "541715",
      matchScore: 73,
      description: "AI and machine learning development for space exploration programs.",
      solicitationNumber: "80NSSC24R0001",
      link: "https://sam.gov/opp/sample8"
    }
  ];

  // Filter results based on provided filters
  let filteredResults = [...mockData];
  
  if (filters.keywords && filters.keywords.length > 0) {
    filteredResults = filteredResults.filter(r => 
      filters.keywords.some((k: string) => 
        r.title.toLowerCase().includes(k.toLowerCase()) ||
        r.description.toLowerCase().includes(k.toLowerCase())
      )
    );
  }
  
  if (filters.set_aside && filters.set_aside.length > 0) {
    filteredResults = filteredResults.filter(r =>
      filters.set_aside.some((s: string) => r.setAside.includes(s))
    );
  }
  
  if (filters.naics_codes && filters.naics_codes.length > 0) {
    filteredResults = filteredResults.filter(r =>
      filters.naics_codes.includes(r.naicsCode)
    );
  }

  // If no filters matched, return all mock data
  if (filteredResults.length === 0) {
    filteredResults = mockData;
  }

  // Paginate
  const start = page * limit;
  const paginatedResults = filteredResults.slice(start, start + limit);

  return {
    results: paginatedResults,
    total: filteredResults.length,
    page,
    limit
  };
}
