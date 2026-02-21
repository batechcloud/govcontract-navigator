export function formatDollars(amount: number): string {
  if (amount >= 1_000_000_000_000) return `$${(amount / 1_000_000_000_000).toFixed(1)}T`;
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

export function getFiscalYearDates(fy: string) {
  const year = parseInt(fy.replace("FY", ""));
  return {
    start_date: `${year - 1}-10-01`,
    end_date: `${year}-09-30`,
  };
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function abbreviateNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

export const FISCAL_YEARS = ["FY2025", "FY2024", "FY2023", "FY2022"];

export const USA_SPENDING_BASE = "https://api.usaspending.gov/api/v2";

export const SET_ASIDE_TYPES = [
  { code: "SBA", label: "Small Business" },
  { code: "8A", label: "8(a)" },
  { code: "WOSB", label: "WOSB" },
  { code: "HZC", label: "HUBZone" },
  { code: "SDVOSBC", label: "SDVOSB" },
  { code: "VSA", label: "VOSB" },
];

export const CHART_COLORS = [
  "hsl(228, 61%, 55%)",
  "hsl(51, 100%, 50%)",
  "hsl(145, 63%, 49%)",
  "hsl(200, 80%, 55%)",
  "hsl(280, 60%, 55%)",
  "hsl(20, 80%, 55%)",
  "hsl(340, 70%, 55%)",
  "hsl(170, 60%, 45%)",
  "hsl(60, 70%, 50%)",
  "hsl(310, 50%, 50%)",
];
