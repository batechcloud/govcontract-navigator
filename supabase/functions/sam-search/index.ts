import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// SAM.gov API base URL
const SAM_API_BASE = "https://api.sam.gov/opportunities/v2/search";

interface SearchFilters {
  keywords: string[];
  naics_codes: string[];
  psc_codes: string[];
  set_aside: string[];
  agencies: string[];
  min_value: number | null;
  max_value: number | null;
  location: string | null;
  opportunity_type: string | null;
}

const STATE_ABBREVIATIONS: Record<string, string> = {
  "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR",
  "California": "CA", "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE",
  "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID",
  "Illinois": "IL", "Indiana": "IN", "Iowa": "IA", "Kansas": "KS",
  "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
  "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS",
  "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
  "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK",
  "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT",
  "Vermont": "VT", "Virginia": "VA", "Washington": "WA", "West Virginia": "WV",
  "Wisconsin": "WI", "Wyoming": "WY", "District of Columbia": "DC",
};

// Agency name abbreviation mapping for flexible matching
const AGENCY_ABBREVIATIONS: Record<string, string[]> = {
  "department of defense": ["dept of defense", "dod"],
  "department of homeland security": ["dept of homeland security", "dhs"],
  "department of veterans affairs": ["dept of veterans affairs", "va"],
  "department of health and human services": ["dept of health and human services", "hhs"],
  "department of energy": ["dept of energy", "doe"],
  "department of education": ["dept of education", "ed"],
  "department of justice": ["dept of justice", "doj"],
  "department of labor": ["dept of labor", "dol"],
  "department of state": ["dept of state", "dos"],
  "department of the interior": ["dept of the interior", "doi"],
  "department of the treasury": ["dept of the treasury", "treasury"],
  "department of transportation": ["dept of transportation", "dot"],
  "department of agriculture": ["dept of agriculture", "usda"],
  "department of commerce": ["dept of commerce", "doc"],
  "department of housing and urban development": ["dept of housing and urban development", "hud"],
  "department of the navy": ["dept of the navy", "navy"],
  "department of the army": ["dept of the army", "army"],
  "department of the air force": ["dept of the air force", "air force"],
  "general services administration": ["gsa"],
  "national aeronautics and space administration": ["nasa"],
  "environmental protection agency": ["epa"],
  "small business administration": ["sba"],
  "social security administration": ["ssa"],
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // JWT verification — reject unauthenticated requests
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { mode, filters, page = 0, limit = 10 } = body;
    
    const SAM_API_KEY = Deno.env.get("SAM_API_KEY");

    // Per-user rate limiting — only when a real SAM.gov API call will be made
    if (SAM_API_KEY && mode !== "detail") {
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const DAILY_LIMIT = 50;
      const { data: rateData, error: rateError } = await serviceClient
        .rpc('check_and_increment_rate_limit', {
          _user_id: user.id,
          _api_name: 'sam_search',
          _daily_limit: DAILY_LIMIT,
        });

      if (rateError) {
        console.error('Rate limit check failed:', rateError);
        // Fail open — allow the request if rate limiting breaks
      } else if (rateData?.[0] && !rateData[0].allowed) {
        return new Response(JSON.stringify({
          error: 'Rate limit exceeded',
          message: `You've reached your daily limit of ${DAILY_LIMIT} searches. Your limit resets at midnight UTC.`,
          current_count: rateData[0].current_count,
          daily_limit: DAILY_LIMIT,
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // --- Detail mode: fetch a single opportunity by noticeId ---
    if (mode === "detail" && body.noticeId) {
      if (!SAM_API_KEY) {
        return new Response(
          JSON.stringify({ error: "SAM API key not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const detailParams = new URLSearchParams();
      detailParams.append("api_key", SAM_API_KEY);
      detailParams.append("noticeId", body.noticeId);
      detailParams.append("limit", "1");
      // SAM.gov requires date range even for noticeId lookups
      detailParams.append("postedFrom", getDateMonthsAgo(24));
      detailParams.append("postedTo", getTodayFormatted());

      const detailUrl = `${SAM_API_BASE}?${detailParams.toString()}`;
      console.log("Fetching SAM.gov detail for noticeId:", body.noticeId);

      const detailResp = await fetch(detailUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!detailResp.ok) {
        console.error("SAM.gov detail error:", detailResp.status);
        return new Response(
          JSON.stringify({ error: "SAM.gov API error", resourceLinks: [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const detailData = await detailResp.json();
      const opps = detailData.opportunitiesData || detailData.data || [];
      const opp = opps[0];

      return new Response(
        JSON.stringify({
          resourceLinks: opp?.resourceLinks || [],
          description: opp?.description || opp?.synopsis || null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Search mode (default) ---
    
    // If no SAM API key, return mock data for development
    if (!SAM_API_KEY) {
      console.log("No SAM_API_KEY configured, returning mock data");
      return new Response(
        JSON.stringify({
          ...getMockResults(filters, page, limit),
          warning: "SAM.gov API key not configured. Showing sample data. Add your API key in Settings to see live opportunities.",
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Searching SAM.gov with filters:", JSON.stringify(filters));

    // Build SAM.gov API query parameters
    // Post-filtering is only needed for agency and value range (not natively supported by SAM.gov)
    const needsPostFilter = !!(filters.min_value || filters.max_value ||
      (filters.agencies && filters.agencies.length > 0));
    const fetchLimit = needsPostFilter ? Math.max(limit * 10, 200) : limit;
    const params = new URLSearchParams();
    params.append("api_key", SAM_API_KEY);
    params.append("limit", fetchLimit.toString());
    // When post-filtering, always fetch from offset 0 so we can paginate filtered results correctly
    params.append("offset", needsPostFilter ? "0" : (page * limit).toString());
    
    // Add keyword search
    if (filters.keywords && filters.keywords.length > 0) {
      params.append("q", filters.keywords.join(" "));
    }
    
    // Add NAICS codes — SAM.gov v2 uses "ncode" parameter
    if (filters.naics_codes && filters.naics_codes.length > 0) {
      params.append("ncode", filters.naics_codes.join(","));
    }

    // Add PSC/classification codes — SAM.gov v2 uses "ccode" parameter natively
    if (filters.psc_codes && filters.psc_codes.length > 0) {
      params.append("ccode", filters.psc_codes.join(","));
      console.log("Using native PSC filter (ccode):", filters.psc_codes.join(", "));
    }
    
    // Add set-aside types — SAM.gov v2 uses "typeOfSetAside" parameter
    if (filters.set_aside && filters.set_aside.length > 0) {
      const setAsideMapping: Record<string, string> = {
        "SDVOSB": "SDVOSBC",
        "8(a)": "SBA",
        "HUBZone": "HZC",
        "WOSB": "WOSB",
        "EDWOSB": "EDWOSB",
        "VOSB": "VOSBC",
        "SDB": "SBP",
        "Small Business": "SBP"
      };
      const codes = filters.set_aside.map((s: string) => setAsideMapping[s] || s).join(",");
      params.append("typeOfSetAside", codes);
    }
    
    // Add location/state (place of performance state)
    if (filters.location) {
      const stateCode = STATE_ABBREVIATIONS[filters.location] || filters.location;
      params.append("state", stateCode);
      console.log("Filtering by state:", filters.location, "→", stateCode);
    }

    // Add opportunity type (notice type) filter — SAM.gov v2 uses "ptype" parameter
    if (filters.opportunity_type) {
      const ptypeMapping: Record<string, string> = {
        "Solicitation": "o",
        "Presolicitation": "p",
        "Sources Sought": "s",
        "Combined Synopsis/Solicitation": "k",
        "Award Notice": "a",
        "Special Notice": "i",
        "Intent to Bundle": "r",
      };
      const ptype = ptypeMapping[filters.opportunity_type];
      if (ptype) {
        params.append("ptype", ptype);
        console.log("Filtering by notice type:", filters.opportunity_type, "→", ptype);
      }
    }

    // Agency filter — post-filter on fullParentPathName instead of polluting keyword query
    const agencyFilter = filters.agencies && filters.agencies.length > 0 ? filters.agencies : null;
    if (agencyFilter) {
      console.log("Will post-filter by agencies:", agencyFilter.join(", "));
    }

    // Add response deadline filter
    if (filters.deadline_before) {
      const deadlineDate = new Date(filters.deadline_before);
      params.append("rdlfrom", getTodayFormatted());
      params.append("rdlto", formatSamDate(deadlineDate));
    }

    // Only search for active opportunities (posted in last 6 months)
    // SAM.gov requires MM/dd/yyyy date format
    params.append("postedFrom", getDateMonthsAgo(6));
    params.append("postedTo", getTodayFormatted());
    params.append("active", "true");

    const fullUrl = `${SAM_API_BASE}?${params.toString()}`;
    console.log("Calling SAM.gov URL:", fullUrl.replace(SAM_API_KEY, "REDACTED"));

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    const responseText = await response.text();
    console.log("SAM.gov HTTP status:", response.status);
    console.log("SAM.gov response preview:", responseText.substring(0, 500));

    if (!response.ok) {
      console.error("SAM.gov API error:", response.status, responseText);
      return new Response(
        JSON.stringify({
          ...getMockResults(filters, page, limit),
          warning: "SAM.gov API returned an error. Showing cached sample data instead.",
          api_status: response.status,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse SAM.gov response as JSON:", responseText.substring(0, 300));
      return new Response(
        JSON.stringify({
          ...getMockResults(filters, page, limit),
          warning: "SAM.gov returned an invalid response. Showing cached sample data instead.",
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SAM.gov v2 API returns opportunitiesData array
    // Log keys to understand the actual response structure
    console.log("SAM.gov response top-level keys:", Object.keys(data).join(", "));
    const opportunities = data.opportunitiesData || data.data || data.results || data.items || [];
    console.log("SAM.gov opportunities found:", opportunities.length);
    console.log("SAM.gov totalRecords:", data.totalRecords);

    const results = transformSamResults(opportunities, filters);

    // Post-filter by agency on fullParentPathName (with abbreviation-aware matching)
    let filteredResults = results;
    if (agencyFilter) {
      filteredResults = filteredResults.filter((r: any) => {
        const agencyPath = (r._rawAgencyPath || "").toLowerCase();
        return agencyFilter.some((a: string) => {
          const searchTerm = a.toLowerCase();
          // Direct match
          if (agencyPath.includes(searchTerm)) return true;
          // Check abbreviation variants
          const variants = AGENCY_ABBREVIATIONS[searchTerm];
          if (variants) {
            return variants.some(v => agencyPath.includes(v));
          }
          // Reverse: check if any abbreviation key matches and the path contains a variant
          for (const [key, vals] of Object.entries(AGENCY_ABBREVIATIONS)) {
            if (vals.includes(searchTerm) || key === searchTerm) {
              if (agencyPath.includes(key) || vals.some(v => agencyPath.includes(v))) return true;
            }
          }
          return false;
        });
      });
      console.log(`Agency post-filter: ${filteredResults.length} results after agency filter`);
    }

    // Post-filter by location if SAM.gov API didn't filter precisely
    if (filters.location) {
      const stateCode = STATE_ABBREVIATIONS[filters.location] || filters.location;
      const stateName = filters.location.toLowerCase();
      filteredResults = filteredResults.filter((r: any) => {
        const loc = (r.location || "").toLowerCase();
        if (loc === "various" || loc === "") return false;
        return loc.includes(stateName) || loc.includes(stateCode.toLowerCase()) || loc.includes(`, ${stateCode.toLowerCase()}`);
      });
      console.log(`Location post-filter: ${filteredResults.length} results for ${filters.location}`);
    }

    // Post-filter by value range (SAM.gov API doesn't support this natively)
    if (filters.min_value || filters.max_value) {
      filteredResults = filteredResults.filter((r: any) => {
        const amount = parseFloat(r.value.replace(/[$,KMB]/g, ''));
        if (isNaN(amount) || r.value === 'TBD' || r.value === 'N/A') return false;
        let rawAmount = amount;
        if (r.value.includes('K')) rawAmount = amount * 1000;
        if (r.value.includes('M')) rawAmount = amount * 1000000;
        if (r.value.includes('B')) rawAmount = amount * 1000000000;
        if (filters.min_value && rawAmount < filters.min_value) return false;
        if (filters.max_value && rawAmount > filters.max_value) return false;
        return true;
      });
    }

    // Paginate post-filtered results correctly
    const totalFiltered = needsPostFilter ? filteredResults.length : (data.totalRecords || opportunities.length);
    const startIdx = needsPostFilter ? page * limit : 0;
    const pagedResults = needsPostFilter ? filteredResults.slice(startIdx, startIdx + limit) : filteredResults;

    // Strip internal fields before sending to client
    const cleanResults = pagedResults.map(({ _rawPsc, _rawAgencyPath, ...rest }: any) => rest);

    return new Response(
      JSON.stringify({
        results: cleanResults,
        total: totalFiltered,
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

function formatSamDate(date: Date): string {
  // SAM.gov expects MM/dd/yyyy format
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function getDateMonthsAgo(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return formatSamDate(date);
}

function getTodayFormatted(): string {
  return formatSamDate(new Date());
}

function extractAgency(opp: any): string {
  // SAM.gov v2 API stores agency in various fields
  if (opp.fullParentPathName) return opp.fullParentPathName.split(".").pop()?.trim() || opp.fullParentPathName;
  if (opp.organizationHierarchy && opp.organizationHierarchy.length > 0) {
    return opp.organizationHierarchy[opp.organizationHierarchy.length - 1]?.name || opp.organizationHierarchy[0]?.name;
  }
  if (opp.department) return opp.department;
  if (opp.subtierName) return opp.subtierName;
  if (opp.officeName) return opp.officeName;
  return "Federal Agency";
}

function transformSamResults(opportunities: any[], filters: SearchFilters) {
  return opportunities.map((opp: any) => {
    // Description may be a URL to fetch separately — use synopsis or type-based fallback
    const rawDesc = opp.description || opp.synopsis || "";
    const isUrl = rawDesc.startsWith("http");
    const description = isUrl ? `${opp.type || "Federal"} opportunity — ${opp.solicitationNumber || "view on SAM.gov for details"}` : rawDesc;

    return {
      id: opp.noticeId || opp.opportunityId || `SAM-${Date.now()}-${Math.random()}`,
      title: opp.title || "Untitled Opportunity",
      agency: extractAgency(opp),
      type: opp.type || "Solicitation",
      setAside: opp.typeOfSetAside && opp.typeOfSetAside !== "NONE" ? opp.typeOfSetAside : "Full & Open",
      value: formatValue(opp.award?.amount || opp.baseAndAllOptionsValue),
      deadline: opp.responseDeadLine || opp.archiveDate || opp.date,
      postedDate: opp.postedDate,
      location: opp.placeOfPerformance?.city?.name
        ? `${opp.placeOfPerformance.city.name}, ${opp.placeOfPerformance?.state?.code || ""}`
        : opp.placeOfPerformance?.state?.name || "Various",
      naicsCode: opp.naics?.[0]?.code || opp.naicsCode || "",
      matchScore: calculateMatchScore(opp, filters),
      description,
      solicitationNumber: opp.solicitationNumber || "",
      link: opp.uiLink || (opp.noticeId ? `https://sam.gov/opp/${opp.noticeId}/view` : "https://sam.gov"),
      resourceLinks: opp.resourceLinks || [],
      // Internal fields for post-filtering (stripped before sending to client)
      _rawPsc: opp.psc?.map((p: any) => p.code) || (opp.classificationCode ? [opp.classificationCode] : []),
      _rawAgencyPath: opp.fullParentPathName || "",
    };
  });
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
      link: "https://sam.gov/opp/sample1",
      resourceLinks: ["https://sam.gov/api/prod/opps/v3/opportunities/resources/files/sample-sow-it-modernization.pdf", "https://sam.gov/api/prod/opps/v3/opportunities/resources/files/amendment-001.pdf"]
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
      link: "https://sam.gov/opp/sample2",
      resourceLinks: ["https://sam.gov/api/prod/opps/v3/opportunities/resources/files/rfp-cybersecurity-assessment.pdf"]
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
      link: "https://sam.gov/opp/sample3",
      resourceLinks: ["https://sam.gov/api/prod/opps/v3/opportunities/resources/files/cloud-migration-sow.pdf", "https://sam.gov/api/prod/opps/v3/opportunities/resources/files/pricing-template.xlsx", "https://sam.gov/api/prod/opps/v3/opportunities/resources/files/qa-responses.pdf"]
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
