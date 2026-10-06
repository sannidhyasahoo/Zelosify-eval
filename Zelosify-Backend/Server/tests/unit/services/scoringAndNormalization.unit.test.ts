import { describe, it, expect } from "vitest";
import {
  calculateExperienceScore,
  calculateSkillScore,
  calculateLocationScore,
  calculateMatchScore,
  evaluateDecisionPolicy,
} from "../../../src/services/recommendation/scoringService.js";
import {
  normalizeSkill,
  normalizeSkills,
} from "../../../src/services/recommendation/skillNormalization.js";

describe("PHASE 4: Scoring & Normalization Unit Tests", () => {
  // ==========================================
  // SCORING TESTS (Requirements 1 - 13)
  // ==========================================

  describe("Experience Match Scoring", () => {
    it("1. candidate below minimum experience -> 0", () => {
      const score = calculateExperienceScore(2, 5, 8);
      expect(score).toBe(0);
    });

    it("2. within experience range -> 1", () => {
      const scoreMid = calculateExperienceScore(5, 3, 7);
      expect(scoreMid).toBe(1);

      const scoreMinBoundary = calculateExperienceScore(3, 3, 7);
      expect(scoreMinBoundary).toBe(1);

      const scoreMaxBoundary = calculateExperienceScore(7, 3, 7);
      expect(scoreMaxBoundary).toBe(1);

      // If max is null/undefined
      const scoreNoMax = calculateExperienceScore(5, 3, null);
      expect(scoreNoMax).toBe(1);
    });

    it("3. above max -> 0.8", () => {
      const score = calculateExperienceScore(9, 3, 7);
      expect(score).toBe(0.8);
    });
  });

  describe("Skill Match Scoring", () => {
    it("4. exact skill overlap", () => {
      const candidateSkills = ["React", "Node.js", "PostgreSQL"];
      const requiredSkills = ["react", "nodejs", "postgresql"];
      const score = calculateSkillScore(candidateSkills, requiredSkills);
      expect(score).toBe(1);
    });

    it("5. partial skill overlap", () => {
      const candidateSkills = ["React", "CSS"];
      const requiredSkills = ["react", "nodejs", "postgresql", "docker"];
      // Only react matches out of 4 required
      const score = calculateSkillScore(candidateSkills, requiredSkills);
      expect(score).toBe(0.25);
    });

    it("6. empty required skills safe", () => {
      const candidateSkills = ["React", "TypeScript"];
      const score = calculateSkillScore(candidateSkills, []);
      expect(score).toBe(1);
    });
  });

  describe("Location Match Scoring", () => {
    it("7. remote opening location -> 1", () => {
      expect(calculateLocationScore("Gotham City", "Remote")).toBe(1);
      expect(calculateLocationScore("New York, NY", "US - Remote")).toBe(1);
      expect(calculateLocationScore("Unknown", "remote")).toBe(1);
    });

    it("8. exact location -> 1", () => {
      expect(calculateLocationScore("Gotham City", "Gotham City")).toBe(1);
      expect(calculateLocationScore("New York, NY", "new york, ny")).toBe(1);
    });

    it("9. location mismatch -> 0.5", () => {
      expect(calculateLocationScore("Gotham City", "Metropolis")).toBe(0.5);
      expect(calculateLocationScore("San Francisco", "New York")).toBe(0.5);
    });
  });

  describe("Final Match Formula & Decision Policy", () => {
    it("10. final formula correctness", () => {
      // 0.5 * skillMatchScore + 0.3 * experienceMatchScore + 0.2 * locationMatchScore
      const result = calculateMatchScore({
        candidateExp: 5,
        minExp: 3,
        maxExp: 8, // expMatch = 1
        candidateSkills: ["React", "NodeJS"],
        requiredSkills: ["react", "nodejs", "docker", "aws"], // 2/4 = 0.5
        candidateLocation: "Metropolis",
        openingLocation: "Gotham", // mismatch = 0.5
      });

      // 0.5 * 0.5 + 0.3 * 1.0 + 0.2 * 0.5 = 0.25 + 0.30 + 0.10 = 0.65
      expect(result.skillMatchScore).toBe(0.5);
      expect(result.experienceMatchScore).toBe(1);
      expect(result.locationMatchScore).toBe(0.5);
      expect(result.finalScore).toBe(0.65);
    });

    it("11. recommended threshold 0.75", () => {
      const policy1 = evaluateDecisionPolicy(0.75);
      expect(policy1.decision).toBe("Recommended");
      expect(policy1.isRecommended).toBe(true);

      const policy1b = evaluateDecisionPolicy(0.750);
      expect(policy1b.decision).toBe("Recommended");
      expect(policy1b.isRecommended).toBe(true);

      const policy2 = evaluateDecisionPolicy(0.92);
      expect(policy2.decision).toBe("Recommended");
      expect(policy2.isRecommended).toBe(true);
    });

    it("12. borderline threshold 0.50", () => {
      const policy1 = evaluateDecisionPolicy(0.50);
      expect(policy1.decision).toBe("Borderline");
      expect(policy1.isRecommended).toBe(false);

      const policy1b = evaluateDecisionPolicy(0.500);
      expect(policy1b.decision).toBe("Borderline");
      expect(policy1b.isRecommended).toBe(false);

      const policy2 = evaluateDecisionPolicy(0.749);
      expect(policy2.decision).toBe("Borderline");
      expect(policy2.isRecommended).toBe(false);
    });

    it("13. not recommended below 0.50", () => {
      const policy = evaluateDecisionPolicy(0.499);
      expect(policy.decision).toBe("Not Recommended");
      expect(policy.isRecommended).toBe(false);

      const policy49 = evaluateDecisionPolicy(0.49);
      expect(policy49.decision).toBe("Not Recommended");
      expect(policy49.isRecommended).toBe(false);

      const policyZero = evaluateDecisionPolicy(0);
      expect(policyZero.decision).toBe("Not Recommended");
      expect(policyZero.isRecommended).toBe(false);
    });
  });

  // ==========================================
  // NORMALIZATION TESTS (Requirements 14 - 16)
  // ==========================================

  describe("Skill Normalization Aliases", () => {
    it("14. React aliases normalize consistently", () => {
      expect(normalizeSkill("React")).toBe("react");
      expect(normalizeSkill("React.js")).toBe("react");
      expect(normalizeSkill("ReactJS")).toBe("react");
      expect(normalizeSkill("React JS")).toBe("react");
      expect(normalizeSkills(["React", "React.js", "ReactJS", "React JS"])).toEqual(["react"]);
    });

    it("15. Node aliases normalize consistently", () => {
      expect(normalizeSkill("Node")).toBe("nodejs");
      expect(normalizeSkill("Node.js")).toBe("nodejs");
      expect(normalizeSkill("NodeJS")).toBe("nodejs");
      expect(normalizeSkill("node js")).toBe("nodejs");
      expect(normalizeSkills(["Node", "Node.js", "NodeJS"])).toEqual(["nodejs"]);
    });

    it("16. PostgreSQL aliases normalize consistently", () => {
      expect(normalizeSkill("Postgres")).toBe("postgresql");
      expect(normalizeSkill("PostgreSQL")).toBe("postgresql");
      expect(normalizeSkill("psql")).toBe("postgresql");
      expect(normalizeSkill("postgres sql")).toBe("postgresql");
      expect(normalizeSkills(["Postgres", "PostgreSQL", "psql"])).toEqual(["postgresql"]);
    });
  });
});
