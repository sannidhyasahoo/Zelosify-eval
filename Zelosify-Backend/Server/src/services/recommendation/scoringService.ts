/**
 * Pure deterministic scoring and decision policy service.
 * The LLM must NEVER calculate these numeric scores or override policies.
 */

import { normalizeSkills } from "./skillNormalization.js";

export interface MatchScoreInput {
  candidateExp: number;
  minExp: number;
  maxExp?: number | null;
  candidateSkills: string[];
  requiredSkills: string[];
  candidateLocation: string;
  openingLocation?: string | null;
}

export interface MatchScoreResult {
  skillMatchScore: number;
  experienceMatchScore: number;
  locationMatchScore: number;
  finalScore: number;
}

export type RecommendationDecision = "Recommended" | "Borderline" | "Not Recommended";

export interface DecisionPolicyResult {
  decision: RecommendationDecision;
  isRecommended: boolean;
}

/**
 * Calculates experience match score based on deterministic thresholds:
 * - candidateExp < min => 0
 * - candidateExp within range => 1
 * - candidateExp > max => 0.8
 * - If max is null, candidateExp >= min => 1
 */
export function calculateExperienceScore(
  candidateExp: number,
  minExp: number,
  maxExp?: number | null
): number {
  const exp = Math.max(0, candidateExp || 0);
  const min = Math.max(0, minExp || 0);

  if (exp < min) {
    return 0;
  }

  if (maxExp === null || maxExp === undefined) {
    return 1;
  }

  if (exp <= maxExp) {
    return 1;
  }

  return 0.8;
}

/**
 * Calculates skill match score based on normalized skills:
 * skillMatchScore = (number of required normalized skills matched) / (number of required normalized skills)
 * Returns 1 if requiredSkills is empty.
 */
export function calculateSkillScore(
  candidateSkills: string[],
  requiredSkills: string[]
): number {
  const normRequired = normalizeSkills(requiredSkills);
  if (normRequired.length === 0) {
    return 1;
  }

  const normCandidate = new Set(normalizeSkills(candidateSkills));
  const matchedCount = normRequired.filter((skill) => normCandidate.has(skill)).length;

  return matchedCount / normRequired.length;
}

/**
 * Normalizes location strings for comparison (removes whitespace and case differences).
 */
export function normalizeLocation(loc: string | null | undefined): string {
  if (!loc || typeof loc !== "string") return "";
  return loc.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Calculates location match score:
 * - Remote opening => 1
 * - Exact normalized match => 1
 * - Onsite/hybrid mismatch => 0.5
 */
export function calculateLocationScore(
  candidateLocation: string,
  openingLocation?: string | null
): number {
  const normOpening = normalizeLocation(openingLocation);
  const normCandidate = normalizeLocation(candidateLocation);

  // If opening is remote or includes "remote", location is fully satisfied
  if (normOpening.includes("remote")) {
    return 1;
  }

  // Exact normalized location match
  if (normOpening && normCandidate && normOpening === normCandidate) {
    return 1;
  }

  // Mismatch
  return 0.5;
}

/**
 * Calculates full deterministic match score:
 * finalScore = 0.5 * skillMatchScore + 0.3 * experienceMatchScore + 0.2 * locationMatchScore
 */
export function calculateMatchScore(input: MatchScoreInput): MatchScoreResult {
  const skillMatchScore = calculateSkillScore(input.candidateSkills, input.requiredSkills);
  const experienceMatchScore = calculateExperienceScore(
    input.candidateExp,
    input.minExp,
    input.maxExp
  );
  const locationMatchScore = calculateLocationScore(
    input.candidateLocation,
    input.openingLocation
  );

  const rawFinalScore =
    0.5 * skillMatchScore + 0.3 * experienceMatchScore + 0.2 * locationMatchScore;

  // Round to 4 decimal places for precision consistency
  const finalScore = Math.round(rawFinalScore * 10000) / 10000;

  return {
    skillMatchScore,
    experienceMatchScore,
    locationMatchScore,
    finalScore,
  };
}

/**
 * Evaluates decision policy outside the LLM:
 * - finalScore >= 0.75 => Recommended (isRecommended: true)
 * - 0.50 <= finalScore < 0.75 => Borderline (isRecommended: false)
 * - finalScore < 0.50 => Not Recommended (isRecommended: false)
 */
export function evaluateDecisionPolicy(finalScore: number): DecisionPolicyResult {
  if (finalScore >= 0.75) {
    return {
      decision: "Recommended",
      isRecommended: true,
    };
  }

  if (finalScore >= 0.5) {
    return {
      decision: "Borderline",
      isRecommended: false,
    };
  }

  return {
    decision: "Not Recommended",
    isRecommended: false,
  };
}
