// USASpending hooks — now read ONLY from the local `usaspending_awards`
// table populated by the nightly sync. No live api.usaspending.gov calls.
//
// Aggregations that the old UI got from dedicated endpoints (spending by
// agency, spending by geography, snapshot, trends, small-business
// breakdown) are computed client-side from a rolling 12-month award window.
// The shape returned by each hook matches the previous live version so the
// downstream components don't change.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getFiscalYearDates } from "@/lib/usaspending-utils";

type AwardRow = {
  award_id: string;
  recipient_name: string | null;
  recipient_uei: string | null;
  awarding_agency: string | null;
  awarding_sub_agency: string | null;
  naics_code: string | null;
  psc_code: string | null;
  award_type: string | null;
  award_amount: number | null;
  description: string | null;
  date_signed: string | null;
  period_of_performance_start: string | null;
  period_of_performance_end: string | null;
  place_of_performance_state: string | null;
  place_of_performance_city: string | null;
  set_aside: string | null;
};

// Set-aside detection is best-effort. The /search/spending_by_award/ endpoint
// does not return set-aside in basic field lists, so per-row classification
// from the raw blob is opportunistic. We use it only for the SB snapshot.
const SB_SET_ASIDE_PREFIXES = ["SBA", "8A", "WOSB", "EDWOSB", "HZC", "SDVOSBC", "VSA"];
function isSmallBusiness(r: AwardRow & { raw?: any }): boolean {
  const code: string | undefined = r?.set_aside ?? r?.raw?.type_set_aside ?? r?.raw?.set_aside;
  if (!code) return false;
  return SB_SET_ASIDE_PREFIXES.some((p) => code.toUpperCase().startsWith(p));
}

async function fetchWindow(startDate: string, endDate: string): Promise<AwardRow[]> {
  // PostgREST caps at 1000 rows per request — page through.
  const all: AwardRow[] = [];
  const PAGE = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("usaspending_awards")
      .select(
        "award_id,recipient_name,recipient_uei,awarding_agency,awarding_sub_agency,naics_code,psc_code,award_type,award_amount,description,date_signed,period_of_performance_start,period_of_performance_end,place_of_performance_state,place_of_performance_city,set_aside",
      )
      .gte("date_signed", startDate)
      .lte("date_signed", endDate)
      .order("award_amount", { ascending: false, nullsFirst: false })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    const rows = (data || []) as AwardRow[];
    all.push(...rows);
    if (rows.length < PAGE) break;
    from += PAGE;
    if (from > 10_000) break; // hard cap for UI aggregation
  }
  return all;
}


export function useSpendingSnapshot(fy: string, refreshKey: number) {
  return useQuery({
    queryKey: ["usa-snapshot-local", fy, refreshKey],
    queryFn: async () => {
      const dates = getFiscalYearDates(fy);
      const rows = await fetchWindow(dates.start_date, dates.end_date);
      const totalSpending = rows.reduce((s, r) => s + (r.award_amount || 0), 0);
      const agencies = new Set<string>();
      rows.forEach((r) => r.awarding_agency && agencies.add(r.awarding_agency));
      const sbCount = rows.filter(isSmallBusiness).length;
      return {
        totalSpending,
        totalBudget: 0, // budgetary_resources endpoint not synced — show 0
        totalContracts: rows.length,
        agencyCount: agencies.size,
        avgContractValue: rows.length > 0 ? totalSpending / rows.length : 0,
        sbPercent: rows.length > 0 ? (sbCount / rows.length) * 100 : 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useTopAgencies(fy: string, refreshKey: number) {
  return useQuery({
    queryKey: ["usa-agencies-local", fy, refreshKey],
    queryFn: async () => {
      const dates = getFiscalYearDates(fy);
      const rows = await fetchWindow(dates.start_date, dates.end_date);
      const grouped = new Map<string, number>();
      let total = 0;
      for (const r of rows) {
        const k = r.awarding_agency || "Unknown";
        const v = r.award_amount || 0;
        grouped.set(k, (grouped.get(k) || 0) + v);
        total += v;
      }
      return Array.from(grouped.entries())
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10)
        .map((x, i) => ({
          rank: i + 1,
          name: x.name,
          amount: x.amount,
          percentage: total > 0 ? (x.amount / total) * 100 : 0,
          id: x.name,
        }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSpendingByCategory(fy: string, refreshKey: number) {
  // Object-class breakdown isn't in the synced fields — use NAICS top-level
  // groupings instead so the chart still tells a useful story.
  return useQuery({
    queryKey: ["usa-categories-local", fy, refreshKey],
    queryFn: async () => {
      const dates = getFiscalYearDates(fy);
      const rows = await fetchWindow(dates.start_date, dates.end_date);
      const grouped = new Map<string, number>();
      let total = 0;
      for (const r of rows) {
        const k = r.naics_code ? r.naics_code.slice(0, 2) : "Other";
        const v = r.award_amount || 0;
        grouped.set(k, (grouped.get(k) || 0) + v);
        total += v;
      }
      return Array.from(grouped.entries())
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, amount]) => ({
          name: `NAICS ${name}`,
          amount,
          percentage: total > 0 ? (amount / total) * 100 : 0,
        }));
    },
    staleTime: 5 * 60 * 1000,
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
  const limit = 25;
  return useQuery({
    queryKey: ["usa-awards-local", filters, refreshKey],
    queryFn: async () => {
      let q = supabase
        .from("usaspending_awards")
        .select("*", { count: "exact" })
        .gte("date_signed", dates.start_date)
        .lte("date_signed", dates.end_date);
      if (filters.keyword) {
        q = q.or(
          `description.ilike.%${filters.keyword}%,recipient_name.ilike.%${filters.keyword}%`,
        );
      }
      if (filters.agency) q = q.ilike("awarding_agency", `%${filters.agency}%`);
      if (filters.minValue) q = q.gte("award_amount", filters.minValue);
      if (filters.naicsCode) q = q.eq("naics_code", filters.naicsCode);
      if (filters.state) q = q.eq("place_of_performance_state", filters.state);
      q = q.order("award_amount", { ascending: false, nullsFirst: false })
        .range((filters.page - 1) * limit, filters.page * limit - 1);
      const { data, error, count } = await q;
      if (error) throw new Error(error.message);
      // Reshape to the same field names the AwardExplorer table expects.
      const results = (data || []).map((r: any) => ({
        "Award ID": r.award_id,
        "Recipient Name": r.recipient_name,
        "Award Amount": r.award_amount,
        "Description": r.description,
        "awarding_agency_name": r.awarding_agency,
        "type_description": r.award_type,
        "naics_code": r.naics_code,
        "place_of_performance_city_name": r.place_of_performance_city,
        "place_of_performance_state_code": r.place_of_performance_state,
        "period_of_performance_start_date": r.period_of_performance_start,
        "period_of_performance_current_end_date": r.period_of_performance_end,
      }));
      return {
        results,
        page_metadata: { page: filters.page, total: count || 0, hasNext: (filters.page * limit) < (count || 0) },
      };
    },
    enabled: false,
    staleTime: 60 * 1000,
  });
}

export function useTopRecipients(fy: string, refreshKey: number) {
  return useQuery({
    queryKey: ["usa-recipients-local", fy, refreshKey],
    queryFn: async () => {
      const dates = getFiscalYearDates(fy);
      const rows = await fetchWindow(dates.start_date, dates.end_date);
      const grouped: Record<string, { name: string; total: number; count: number; awards: any[] }> = {};
      for (const r of rows) {
        const name = r.recipient_name || "Unknown";
        if (!grouped[name]) grouped[name] = { name, total: 0, count: 0, awards: [] };
        grouped[name].total += r.award_amount || 0;
        grouped[name].count += 1;
        grouped[name].awards.push({
          "Award ID": r.award_id,
          "Recipient Name": r.recipient_name,
          "Award Amount": r.award_amount,
          "naics_code": r.naics_code,
          "awarding_agency_name": r.awarding_agency,
        });
      }
      return Object.values(grouped)
        .sort((a, b) => b.total - a.total)
        .slice(0, 15)
        .map((r, i) => ({ ...r, rank: i + 1, avg: r.count > 0 ? r.total / r.count : 0 }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSpendingTrends(refreshKey: number) {
  return useQuery({
    queryKey: ["usa-trends-local", refreshKey],
    queryFn: async () => {
      const years = [2021, 2022, 2023, 2024, 2025];
      const results: { year: string; totalContracts: number; sbContracts: number }[] = [];
      for (const year of years) {
        const dates = getFiscalYearDates(`FY${year}`);
        try {
          const { count: total } = await supabase
            .from("usaspending_awards")
            .select("*", { count: "exact", head: true })
            .gte("date_signed", dates.start_date)
            .lte("date_signed", dates.end_date);
          // SB sub-count via in() on set_aside prefixes — best-effort.
          const { count: sb } = await supabase
            .from("usaspending_awards")
            .select("*", { count: "exact", head: true })
            .gte("date_signed", dates.start_date)
            .lte("date_signed", dates.end_date)
            .in("set_aside", ["SBA", "8A", "WOSB", "HZC", "SDVOSBC", "VSA", "EDWOSB"]);
          results.push({
            year: `FY${year}`,
            totalContracts: total || 0,
            sbContracts: sb || 0,
          });
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
  return useQuery({
    queryKey: ["usa-geo-local", fy, refreshKey],
    queryFn: async () => {
      const dates = getFiscalYearDates(fy);
      const rows = await fetchWindow(dates.start_date, dates.end_date);
      const grouped = new Map<string, { amount: number; count: number }>();
      for (const r of rows) {
        const k = r.place_of_performance_state;
        if (!k) continue;
        const cur = grouped.get(k) || { amount: 0, count: 0 };
        cur.amount += r.award_amount || 0;
        cur.count += 1;
        grouped.set(k, cur);
      }
      return Array.from(grouped.entries())
        .map(([code, v]) => ({ code, ...v }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 15)
        .map((s, i) => ({
          rank: i + 1,
          state: s.code,
          code: s.code,
          amount: s.amount,
          awardCount: s.count,
          population: 0,
        }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSmallBusinessData(fy: string, refreshKey: number) {
  return useQuery({
    queryKey: ["usa-sb-local", fy, refreshKey],
    queryFn: async () => {
      const dates = getFiscalYearDates(fy);
      const setAsideBuckets = [
        { codes: ["SBA"], label: "Small Business" },
        { codes: ["8A"], label: "8(a)" },
        { codes: ["WOSB", "EDWOSB"], label: "WOSB" },
        { codes: ["HZC"], label: "HUBZone" },
        { codes: ["SDVOSBC"], label: "SDVOSB" },
        { codes: ["VSA"], label: "VOSB" },
      ];
      const results = await Promise.all(
        setAsideBuckets.map(async (b) => {
          const { count } = await supabase
            .from("usaspending_awards")
            .select("*", { count: "exact", head: true })
            .gte("date_signed", dates.start_date)
            .lte("date_signed", dates.end_date)
            .in("set_aside", b.codes);
          return { label: b.label, count: count || 0 };
        }),
      );
      return results;
    },
    staleTime: 5 * 60 * 1000,
  });
}
