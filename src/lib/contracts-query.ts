/**
 * Shared filter-building primitives for the `contracts` table.
 *
 * Two hooks compose searches against this table — `useSearchContracts` (in
 * useSearch.tsx, the AI-NL path) and `useCachedSearch` (in useCachedContracts.ts,
 * the structured-filter path). They used to maintain identical-but-separate
 * copies of the set-aside family map, sanitization, NAICS prefix logic, etc.,
 * which drifted multiple times. Both hooks now build their queries through
 * `applyContractFilters` so there's one source of truth.
 */

import type { PostgrestFilterBuilder } from "@supabase/postgrest-js";

/**
 * Raw SAM.gov set-aside codes that fall into each family. Picking the family
 * label as a filter matches every variant in the data — both the canonical
 * label and raw codes that the sync's RAW_TO_LABEL map missed (e.g. 8AN, HZS).
 */
const SET_ASIDE_FAMILY: Record<string, string[]> = {
  "Small Business": [
    "Small Business", "SBP", "SBA",
    "8(a)", "8A", "8AN", "8AS",
    "SDVOSB", "SDVOSBC", "SDVOSBS",
    "VOSB", "VOSBC", "VOSBS",
    "WOSB", "WOSBSS",
    "EDWOSB", "EDWOSBSS",
    "HUBZone", "HZC", "HZS",
    "ISBEE", "IEE",
  ],
  "8(a)": ["8(a)", "8A", "8AN", "8AS"],
  "SDVOSB": ["SDVOSB", "SDVOSBC", "SDVOSBS"],
  "VOSB": ["VOSB", "VOSBC", "VOSBS"],
  "WOSB": ["WOSB", "WOSBSS"],
  "EDWOSB": ["EDWOSB", "EDWOSBSS"],
  "HUBZone": ["HUBZone", "HZC", "HZS"],
};

/**
 * Strip characters that would break a PostgREST `.or()` filter (commas split
 * clauses, parens/quotes have semantic meaning) or act as ILIKE wildcards
 * the user didn't intend (% _).
 */
export function sanitizeFilterValue(s: string): string {
  return s.replace(/[,()*%_\\"]/g, " ").replace(/\s+/g, " ").trim();
}

export function expandSetAsideFilter(labels: string[]): string[] {
  const expanded = new Set<string>();
  for (const label of labels) {
    expanded.add(label);
    (SET_ASIDE_FAMILY[label] || []).forEach((c) => expanded.add(c));
  }
  return Array.from(expanded);
}

export interface ContractQueryFilters {
  keywords?: string[];
  naics_codes?: string[];
  psc_codes?: string[];
  set_aside?: string[];
  agencies?: string[];
  min_value?: number | null;
  max_value?: number | null;
  location?: string | null;
  opportunity_type?: string | null;
  /** ISO date string — only contracts with deadline strictly before this. */
  deadline_before?: string | null;
}

/**
 * Apply the standard contract filters to a PostgrestFilterBuilder query.
 * Returns the same builder (chained) so callers can append paging/order.
 *
 * Key behaviors:
 * - Keywords are AND-grouped (each keyword its own OR over title/description/agency).
 * - NAICS codes shorter than 6 digits use LIKE prefix matching (sector tiles).
 * - Set-aside labels expand to the full family (8(a) → 8(a), 8A, 8AN, 8AS, …).
 * - Agency matches both `agency` (office) and `parent_agency` (department).
 * - All free-text values are sanitized against PostgREST + ILIKE special chars.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyContractFilters(query: any, filters: ContractQueryFilters): any {
  if (filters.keywords?.length) {
    for (const raw of filters.keywords) {
      const kw = sanitizeFilterValue(raw);
      if (kw.length < 2) continue;
      query = query.or(
        `title.ilike.%${kw}%,description.ilike.%${kw}%,agency.ilike.%${kw}%`,
      );
    }
  }

  if (filters.naics_codes?.length) {
    const conditions: string[] = [];
    for (const code of filters.naics_codes) {
      const clean = code.replace(/[^\d]/g, "");
      if (!clean) continue;
      if (clean.length >= 6) {
        conditions.push(`naics_code.eq.${clean}`);
      } else {
        conditions.push(`naics_code.like.${clean}*`);
      }
    }
    if (conditions.length) query = query.or(conditions.join(","));
  }

  if (filters.psc_codes?.length) {
    query = query.in("psc_code", filters.psc_codes);
  }

  if (filters.set_aside?.length) {
    query = query.in("set_aside", expandSetAsideFilter(filters.set_aside));
  }

  if (filters.agencies?.length) {
    const conditions: string[] = [];
    for (const raw of filters.agencies) {
      const a = sanitizeFilterValue(raw);
      if (a.length < 2) continue;
      conditions.push(`agency.ilike.%${a}%`);
      conditions.push(`parent_agency.ilike.%${a}%`);
    }
    if (conditions.length) query = query.or(conditions.join(","));
  }

  if (filters.min_value) query = query.gte("value", filters.min_value);
  if (filters.max_value) query = query.lte("value", filters.max_value);

  if (filters.location) {
    query = query.ilike("location", `%${sanitizeFilterValue(filters.location)}%`);
  }

  if (filters.opportunity_type) {
    query = query.ilike(
      "contract_type",
      `%${sanitizeFilterValue(filters.opportunity_type)}%`,
    );
  }

  return query;
}

// Avoid an unused-import error in build tooling that may strip type-only imports
export type { PostgrestFilterBuilder };
