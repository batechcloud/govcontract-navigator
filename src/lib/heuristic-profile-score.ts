import type { CompanyProfile } from "@/hooks/useProfile";
import type { ProfileScoreResult, ProfileSuggestion } from "@/hooks/useAIProfileScore";

/**
 * Instant client-side profile health score.
 * Mirrors the criteria the AI optimizer uses, so the displayed score is stable
 * before the AI response arrives (which can take 5-10s).
 */
export function computeHeuristicProfileScore(
  profile: CompanyProfile | null | undefined
): ProfileScoreResult {
  if (!profile) {
    return {
      score: 0,
      summary: "Set up your company profile to start winning federal contracts.",
      suggestions: [
        {
          title: "Create your company profile",
          description:
            "Add your company name, NAICS codes, and certifications to unlock recommendations.",
          priority: "high",
        },
      ],
    };
  }

  let score = 0;
  const suggestions: ProfileSuggestion[] = [];

  // SAM UEI (20)
  if (profile.sam_uei) score += 20;
  else
    suggestions.push({
      title: "Register a SAM UEI",
      description: "SAM UEI is required to bid on any federal contract.",
      priority: "high",
    });

  // CAGE code (10)
  if (profile.cage_code) score += 10;
  else
    suggestions.push({
      title: "Add your CAGE code",
      description: "Identifies your company across DoD and federal systems.",
      priority: "high",
    });

  // NAICS codes (15)
  const naicsCount = profile.naics_codes?.length || 0;
  if (naicsCount >= 3) score += 15;
  else if (naicsCount > 0) score += 8;
  else
    suggestions.push({
      title: "Add NAICS codes",
      description: "Pick 3+ NAICS codes that match your services.",
      priority: "high",
    });

  // Certifications (15)
  const certCount = profile.certifications?.length || 0;
  if (certCount >= 2) score += 15;
  else if (certCount > 0) score += 8;
  else
    suggestions.push({
      title: "List your certifications",
      description: "Set-asides like 8(a), WOSB, HUBZone unlock targeted contracts.",
      priority: "medium",
    });

  // Capabilities (10)
  const capCount = profile.capabilities?.length || 0;
  if (capCount >= 3) score += 10;
  else if (capCount > 0) score += 5;
  else
    suggestions.push({
      title: "Describe your capabilities",
      description: "Capabilities power AI matching and proposal generation.",
      priority: "medium",
    });

  // Past performance (10)
  const ppCount = Array.isArray(profile.past_performance)
    ? profile.past_performance.length
    : 0;
  if (ppCount >= 2) score += 10;
  else if (ppCount > 0) score += 5;
  else
    suggestions.push({
      title: "Add past performance",
      description: "Past contracts demonstrate your win history.",
      priority: "medium",
    });

  // Company basics (10)
  if (profile.year_founded) score += 3;
  if (profile.employee_count) score += 3;
  if (profile.annual_revenue) score += 4;

  // Preferences (10)
  if ((profile.preferred_agencies?.length || 0) > 0) score += 5;
  if ((profile.contract_types?.length || 0) > 0) score += 5;

  score = Math.min(100, Math.max(0, score));

  const summary =
    score >= 70
      ? "Your profile looks federal-ready. Keep refining for better matches."
      : score >= 40
      ? "Good start — finish a few more sections to unlock stronger recommendations."
      : "Your profile needs more detail before you can win competitive bids.";

  return { score, summary, suggestions: suggestions.slice(0, 3) };
}
