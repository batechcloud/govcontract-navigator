import type { SearchResult } from "@/hooks/useSearch";
import type { CompanyProfile } from "@/hooks/useProfile";

/**
 * Lightweight client-side heuristic score (0–100) based on
 * NAICS match, set-aside/certification match, and deadline buffer.
 * No API call required — runs instantly on every card.
 */
export function computeHeuristicScore(
  result: SearchResult,
  profile: CompanyProfile | null | undefined
): number {
  if (!profile) return -1; // no profile → can't score

  let score = 0;

  // --- NAICS match (0-40 pts) ---
  const profileNaics = profile.naics_codes?.filter(Boolean) || [];
  if (profileNaics.length > 0 && result.naicsCode) {
    const contractNaics = result.naicsCode.replace(/\D/g, "").slice(0, 6);
    // Exact match
    if (profileNaics.some(n => n.replace(/\D/g, "").slice(0, 6) === contractNaics)) {
      score += 40;
    }
    // 4-digit sector match
    else if (profileNaics.some(n => n.replace(/\D/g, "").slice(0, 4) === contractNaics.slice(0, 4))) {
      score += 20;
    }
    // 2-digit industry match
    else if (profileNaics.some(n => n.replace(/\D/g, "").slice(0, 2) === contractNaics.slice(0, 2))) {
      score += 8;
    }
  }

  // --- Set-aside / certification match (0-30 pts) ---
  const certs = profile.certifications?.map(c => c.toLowerCase()) || [];
  const setAside = (result.setAside || "").toLowerCase();

  if (setAside && setAside !== "none") {
    const certMap: Record<string, string[]> = {
      "small business": ["small business", "sb"],
      "8(a)": ["8(a)", "8a"],
      "wosb": ["wosb", "women-owned", "women owned"],
      "edwosb": ["edwosb", "women-owned", "women owned"],
      "hubzone": ["hubzone"],
      "sdvosb": ["sdvosb", "service-disabled", "veteran"],
      "vosb": ["vosb", "veteran"],
      "sdb": ["sdb", "small disadvantaged"],
    };

    const matchingTerms = certMap[setAside] || [setAside];
    const hasMatch = certs.some(c => matchingTerms.some(t => c.includes(t)));

    if (hasMatch) {
      score += 30;
    } else if (certs.length > 0) {
      // Has certs but not matching → slight penalty signal (give fewer points)
      score += 5;
    }
  } else {
    // Full & open — anyone can bid, moderate baseline
    score += 15;
  }

  // --- Deadline buffer (0-15 pts) ---
  if (result.deadline) {
    const daysLeft = Math.ceil(
      (new Date(result.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft > 21) score += 15;
    else if (daysLeft > 10) score += 8;
    else if (daysLeft > 3) score += 3;
    // ≤3 days or past → 0 pts
  }

  // --- PSC match (0-15 pts) ---
  const profilePsc = profile.psc_codes?.filter(Boolean) || [];
  // PSC codes aren't always on search results, but if we had them we'd match.
  // For now, give baseline if profile has PSCs (shows readiness)
  if (profilePsc.length > 0) {
    score += 5;
  }

  return Math.min(score, 100);
}

export function getScoreColor(score: number): {
  bg: string;
  text: string;
  label: string;
} {
  if (score >= 70) return { bg: "bg-success/20", text: "text-success", label: "Strong Fit" };
  if (score >= 40) return { bg: "bg-accent/20", text: "text-accent", label: "Possible Fit" };
  return { bg: "bg-destructive/20", text: "text-destructive", label: "Weak Fit" };
}
