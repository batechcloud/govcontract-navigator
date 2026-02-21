import { useQuery } from "@tanstack/react-query";
import { USA_SPENDING_BASE, getFiscalYearDates } from "@/lib/usaspending-utils";

async function postAPI(endpoint: string, body: object) {
  const res = await fetch(`${USA_SPENDING_BASE}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function getAPI(endpoint: string) {
  const res = await fetch(`${USA_SPENDING_BASE}/${endpoint}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function useSpendingSnapshot(fy: string, refreshKey: number) {
  const year = parseInt(fy.replace("FY", ""));
  return useQuery({
    queryKey: ["usa-snapshot", fy, refreshKey],
    queryFn: async () => {
      const dates = getFiscalYearDates(fy);

      const [budgetRes, agencyRes, sbCountRes, allCountRes] = await Promise.all([
        getAPI(`references/total_budgetary_resources/?fiscal_year=${year}`),
        postAPI("spending/", {
          type: "agency",
          filters: { fy: String(year), quarter: "4" },
        }),
        postAPI("search/spending_by_award_count/", {
          filters: {
            award_type_codes: ["A", "B", "C", "D"],
            time_period: [{ start_date: dates.start_date, end_date: dates.end_date }],
            set_aside_type_codes: ["SBA", "8A", "WOSB", "HZC", "SDVOSBC", "VSA"],
          },
        }).catch(() => null),
        postAPI("search/spending_by_award_count/", {
          filters: {
            award_type_codes: ["A", "B", "C", "D"],
            time_period: [{ start_date: dates.start_date, end_date: dates.end_date }],
          },
        }).catch(() => null),
      ]);

      const totalBudget = budgetRes?.results?.[0]?.total_budgetary_resources || 0;
      const totalSpending = agencyRes?.total || 0;
      const agencyCount = agencyRes?.results?.filter((r: any) => r.name && r.name !== "Unreported Data")?.length || 0;

      // Extract contract counts from award_count endpoint
      let totalContracts = 0;
      let sbContracts = 0;
      if (allCountRes?.results) {
        totalContracts = Object.values(allCountRes.results as Record<string, number>).reduce((sum: number, v) => sum + (v as number), 0);
      }
      if (sbCountRes?.results) {
        sbContracts = Object.values(sbCountRes.results as Record<string, number>).reduce((sum: number, v) => sum + (v as number), 0);
      }

      const sbPercent = totalContracts > 0 ? (sbContracts / totalContracts) * 100 : 0;

      return {
        totalSpending,
        totalBudget,
        totalContracts,
        agencyCount,
        avgContractValue: totalContracts > 0 ? totalSpending / totalContracts : 0,
        sbPercent,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useTopAgencies(fy: string, refreshKey: number) {
  const year = parseInt(fy.replace("FY", ""));
  return useQuery({
    queryKey: ["usa-agencies", fy, refreshKey],
    queryFn: () =>
      postAPI("spending/", {
        type: "agency",
        filters: { fy: String(year), quarter: "4" },
      }),
    staleTime: 5 * 60 * 1000,
    select: (data) => {
      const results = data?.results || [];
      const total = data?.total || 1;
      return results
        .filter((item: any) => item.name && item.name !== "Unreported Data")
        .slice(0, 10)
        .map((item: any, i: number) => ({
          rank: i + 1,
          name: item.name || "Unknown",
          amount: item.amount || 0,
          percentage: total > 0 ? ((item.amount || 0) / total) * 100 : 0,
          id: item.id,
        }));
    },
  });
}

export function useSpendingByCategory(fy: string, refreshKey: number) {
  const year = parseInt(fy.replace("FY", ""));
  return useQuery({
    queryKey: ["usa-categories", fy, refreshKey],
    queryFn: () =>
      postAPI("spending/", {
        type: "object_class",
        filters: { fy: String(year), quarter: "4" },
      }),
    staleTime: 5 * 60 * 1000,
    select: (data) => {
      const results = data?.results || [];
      const total = data?.total || 1;
      return results
        .filter((item: any) => item.name && item.name !== "Unreported Data" && (item.amount || 0) > 0)
        .slice(0, 10)
        .map((item: any) => ({
          name: item.name || "Other",
          amount: item.amount || 0,
          percentage: total > 0 ? ((item.amount || 0) / total) * 100 : 0,
        }));
    },
  });
}

export interface AwardSearchFilters {
  keyword: string;
  agency?: string;
  awardType: string;
  minValue?: number;
  naicsCode?: string;
  state?: string;
  fy: string;
  page: number;
}

export function useAwardSearch(filters: AwardSearchFilters, refreshKey: number) {
  const dates = getFiscalYearDates(filters.fy);
  const awardTypeCodes =
    filters.awardType === "contracts" ? ["A", "B", "C", "D"] :
    filters.awardType === "grants" ? ["02", "03", "04", "05"] :
    filters.awardType === "loans" ? ["07", "08"] :
    ["A", "B", "C", "D"];

  return useQuery({
    queryKey: ["usa-awards", filters, refreshKey],
    queryFn: () => {
      const body: any = {
        filters: {
          award_type_codes: awardTypeCodes,
          time_period: [{ start_date: dates.start_date, end_date: dates.end_date }],
        },
        fields: [
          "Award ID", "Recipient Name", "Award Amount", "Description",
          "awarding_agency_name", "period_of_performance_start_date",
          "period_of_performance_current_end_date", "naics_code",
          "type_description", "place_of_performance_city_name",
          "place_of_performance_state_code",
        ],
        sort: "Award Amount",
        order: "desc",
        limit: 25,
        page: filters.page,
      };
      if (filters.keyword) body.filters.keywords = [filters.keyword];
      if (filters.minValue) body.filters.award_amounts = [{ lower_bound: filters.minValue }];
      if (filters.naicsCode) body.filters.naics_codes = [{ naics_code: filters.naicsCode }];
      if (filters.state) {
        body.filters.place_of_performance_locations = [{ state: filters.state }];
      }
      return postAPI("search/spending_by_award/", body);
    },
    enabled: false,
    staleTime: 60 * 1000,
  });
}

export function useTopRecipients(fy: string, refreshKey: number) {
  const dates = getFiscalYearDates(fy);
  return useQuery({
    queryKey: ["usa-recipients", fy, refreshKey],
    queryFn: () =>
      postAPI("search/spending_by_award/", {
        filters: {
          award_type_codes: ["A", "B", "C", "D"],
          time_period: [{ start_date: dates.start_date, end_date: dates.end_date }],
        },
        fields: ["Award ID", "Recipient Name", "Award Amount", "naics_code", "awarding_agency_name"],
        sort: "Award Amount",
        order: "desc",
        limit: 50,
        page: 1,
      }),
    staleTime: 5 * 60 * 1000,
    select: (data) => {
      const results = data?.results || [];
      const grouped: Record<string, { name: string; total: number; count: number; awards: any[] }> = {};
      results.forEach((r: any) => {
        const name = r["Recipient Name"] || "Unknown";
        if (!grouped[name]) grouped[name] = { name, total: 0, count: 0, awards: [] };
        grouped[name].total += r["Award Amount"] || 0;
        grouped[name].count += 1;
        grouped[name].awards.push(r);
      });
      return Object.values(grouped)
        .sort((a, b) => b.total - a.total)
        .slice(0, 15)
        .map((r, i) => ({ ...r, rank: i + 1, avg: r.total / r.count }));
    },
  });
}

export function useSpendingTrends(refreshKey: number) {
  return useQuery({
    queryKey: ["usa-trends", refreshKey],
    queryFn: async () => {
      const years = [2021, 2022, 2023, 2024, 2025];
      const results: { year: string; totalContracts: number; sbContracts: number }[] = [];

      // Fetch sequentially with small delays to avoid rate limiting
      for (const year of years) {
        const dates = getFiscalYearDates(`FY${year}`);
        try {
          const allCount = await postAPI("search/spending_by_award_count/", {
            filters: {
              award_type_codes: ["A", "B", "C", "D"],
              time_period: [{ start_date: dates.start_date, end_date: dates.end_date }],
            },
          });
          // Small delay to avoid rate limiting
          await new Promise((r) => setTimeout(r, 150));
          const sbCount = await postAPI("search/spending_by_award_count/", {
            filters: {
              award_type_codes: ["A", "B", "C", "D"],
              time_period: [{ start_date: dates.start_date, end_date: dates.end_date }],
              set_aside_type_codes: ["SBA", "8A", "WOSB", "HZC", "SDVOSBC", "VSA"],
            },
          });
          await new Promise((r) => setTimeout(r, 150));

          const totalContracts = allCount?.results
            ? Object.values(allCount.results as Record<string, number>).reduce((sum: number, v) => sum + (v as number), 0)
            : 0;
          const sbContracts = sbCount?.results
            ? Object.values(sbCount.results as Record<string, number>).reduce((sum: number, v) => sum + (v as number), 0)
            : 0;
          results.push({ year: `FY${year}`, totalContracts, sbContracts });
        } catch {
          results.push({ year: `FY${year}`, totalContracts: 0, sbContracts: 0 });
        }
      }
      return results;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useGeographicSpending(fy: string, refreshKey: number) {
  const dates = getFiscalYearDates(fy);
  return useQuery({
    queryKey: ["usa-geo", fy, refreshKey],
    queryFn: () =>
      postAPI("search/spending_by_geography/", {
        scope: "place_of_performance",
        geo_layer: "state",
        filters: {
          time_period: [{ start_date: dates.start_date, end_date: dates.end_date }],
          award_type_codes: ["A", "B", "C", "D"],
        },
      }),
    staleTime: 5 * 60 * 1000,
    select: (data) => {
      const results = data?.results || [];
      return results
        .filter((s: any) => s.shape_code && s.aggregated_amount)
        .sort((a: any, b: any) => (b.aggregated_amount || 0) - (a.aggregated_amount || 0))
        .slice(0, 15)
        .map((s: any, i: number) => ({
          rank: i + 1,
          state: s.display_name || s.shape_code,
          code: s.shape_code,
          amount: s.aggregated_amount || 0,
          awardCount: s.per_capita || 0,
          population: s.population || 0,
        }));
    },
  });
}

export function useSmallBusinessData(fy: string, refreshKey: number) {
  const dates = getFiscalYearDates(fy);
  return useQuery({
    queryKey: ["usa-sb", fy, refreshKey],
    queryFn: async () => {
      const setAsideTypes = [
        { code: ["SBA"], label: "Small Business" },
        { code: ["8A"], label: "8(a)" },
        { code: ["WOSB"], label: "WOSB" },
        { code: ["HZC"], label: "HUBZone" },
        { code: ["SDVOSBC"], label: "SDVOSB" },
        { code: ["VSA"], label: "VOSB" },
      ];
      const results = await Promise.all(
        setAsideTypes.map(async (sa) => {
          try {
            const res = await postAPI("search/spending_by_award_count/", {
              filters: {
                award_type_codes: ["A", "B", "C", "D"],
                time_period: [{ start_date: dates.start_date, end_date: dates.end_date }],
                set_aside_type_codes: sa.code,
              },
            });
            const count = res?.results
              ? Object.values(res.results as Record<string, number>).reduce((sum: number, v) => sum + (v as number), 0)
              : 0;
            return { label: sa.label, count };
          } catch {
            return { label: sa.label, count: 0 };
          }
        })
      );
      return results;
    },
    staleTime: 5 * 60 * 1000,
  });
}
