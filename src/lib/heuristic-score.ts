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

  const profileNaics = profile.naics_codes?.filter(Boolean) || [];
  const profileCerts = profile.certifications?.filter(Boolean) || [];
  const profilePsc = profile.psc_codes?.filter(Boolean) || [];

  // An empty profile (signed up but never filled in NAICS/certs/PSC) can't
  // produce a meaningful score — every contract scored ~0-30 which got
  // labeled "Low Fit" in the UI, falsely implying poor compatibility when
  // the truth is "we don't know what you do yet". Return -1 so the UI
  // suppresses the fit badge and prompts the user to complete their profile.
  if (profileNaics.length === 0 && profileCerts.length === 0 && profilePsc.length === 0) {
    return -1;
  }

  let score = 0;

  // --- NAICS match (0-50 pts) — PRIMARY relevance signal ---
  // Without industry overlap, "Small Business + decent deadline" alone used
  // to push hardware/construction contracts to "Good Fit" for an IT company.
  // NAICS now dominates the score so an unrelated industry caps out as Low Fit.
  if (profileNaics.length > 0 && result.naicsCode) {
    const contractNaics = result.naicsCode.replace(/\D/g, "").slice(0, 6);
    if (profileNaics.some(n => n.replace(/\D/g, "").slice(0, 6) === contractNaics)) {
      score += 50; // exact 6-digit match
    } else if (profileNaics.some(n => n.replace(/\D/g, "").slice(0, 4) === contractNaics.slice(0, 4))) {
      score += 25; // 4-digit industry group
    } else if (profileNaics.some(n => n.replace(/\D/g, "").slice(0, 3) === contractNaics.slice(0, 3))) {
      score += 10; // 3-digit subsector (closer than 2-digit)
    }
    // 2-digit "industry" was too lax (e.g. 33 covers everything from furniture
    // to electronics) — dropped intentionally.
  }

  // --- PSC match (0-25 pts) — SECONDARY relevance signal ---
  if (profilePsc.length > 0 && result.pscCode) {
    const contractPsc = result.pscCode.trim();
    if (profilePsc.some(p => p.trim() === contractPsc)) {
      score += 25; // exact PSC
    } else if (profilePsc.some(p => p.trim().charAt(0) === contractPsc.charAt(0))) {
      // First-char prefix — same major PSC category (D = ADP services,
      // R = professional services, Y = construction, etc.)
      score += 12;
    }
    // No "baseline" for having PSCs but no match — that was just padding
    // every score by 3 pts regardless of relevance.
  }

  // --- Set-aside / certification match (0-15 pts) — TIEBREAKER ---
  // Reduced from 0-30. Set-aside eligibility matters but should NOT alone
  // override industry mismatch (which is what was happening before).
  const certsLower = profileCerts.map(c => c.toLowerCase());
  const setAside = (result.setAside || "").toLowerCase();

  if (setAside && setAside !== "none" && setAside !== "full & open") {
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
    const hasMatch = certsLower.some(c => matchingTerms.some(t => c.includes(t)));

    if (hasMatch) {
      score += 15;
    } else if (certsLower.length > 0) {
      score += 3;
    }
  } else {
    // Full & open — anyone can bid, small baseline
    score += 5;
  }

  // --- Deadline buffer (0-10 pts) — minor factor ---
  // Reduced from 0-15. A long deadline shouldn't add as much signal as
  // industry fit. Tight deadlines still penalize.
  if (result.deadline) {
    const daysLeft = Math.ceil(
      (new Date(result.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft > 21) score += 10;
    else if (daysLeft > 10) score += 6;
    else if (daysLeft > 3) score += 2;
  }

  return Math.min(score, 100);
}

export function getScoreColor(score: number): {
  bg: string;
  text: string;
  label: string;
} {
  if (score >= 70) return { bg: "bg-success/20", text: "text-success", label: "Great Fit" };
  if (score >= 40) return { bg: "bg-accent/20", text: "text-accent", label: "Good Fit" };
  return { bg: "bg-destructive/20", text: "text-destructive", label: "Low Fit" };
}
