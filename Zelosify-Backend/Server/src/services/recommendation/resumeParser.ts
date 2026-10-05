/**
 * Resume text extraction and sanitization utility.
 * Parses PDF and PPTX buffers and extracts structured resume attributes.
 * Resume text is strictly treated as untrusted external data.
 */

import pdf from "pdf-extraction";
import JSZip from "jszip";
import { normalizeSkills, SKILL_ALIASES } from "./skillNormalization.js";

export interface StructuredResume {
  experienceYears: number;
  skills: string[];
  normalizedSkills: string[];
  location: string;
  education: string[];
  keywords: string[];
  sanitizedText?: string;
}

/**
 * Extracts plain text from PPTX files using JSZip.
 * Traverses slide XML files and collects <a:t> text nodes.
 */
export async function extractTextFromPptx(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files).filter((fileName) =>
    /^ppt\/slides\/slide\d+\.xml$/i.test(fileName)
  );

  slideFiles.sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)?.[0] || "0", 10);
    const numB = parseInt(b.match(/\d+/)?.[0] || "0", 10);
    return numA - numB;
  });

  const texts: string[] = [];
  for (const fileName of slideFiles) {
    const file = zip.file(fileName);
    if (file) {
      const xml = await file.async("text");
      const matches = xml.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/gi) || [];
      const slideText = matches
        .map((m) => m.replace(/<[^>]+>/g, "").trim())
        .filter(Boolean)
        .join(" ");
      if (slideText) {
        texts.push(slideText);
      }
    }
  }

  return texts.join("\n");
}

/**
 * Extracts raw text from either PDF or PPTX buffer.
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const lower = filename.toLowerCase();

  if (lower.endsWith(".pdf")) {
    const data = await pdf(buffer);
    return data.text || "";
  }

  if (lower.endsWith(".pptx")) {
    return await extractTextFromPptx(buffer);
  }

  throw new Error(`Unsupported file type for resume extraction: ${filename}`);
}

/**
 * Basic sanitization against prompt injection attacks and control characters.
 * Protects system prompt boundaries without corrupting normal resume content.
 */
export function sanitizeResumeText(rawText: string): string {
  if (!rawText || typeof rawText !== "string") return "";

  let sanitized = rawText
    // Remove non-printable control characters except standard tabs and newlines
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Neutralize common prompt injection prefixes and overrides
    .replace(/(?:ignore|disregard|forget)\s+(?:all\s+)?(?:previous|prior|above)\s+(?:instructions|prompts|directives)/gi, "[SANITIZED_PROMPT_INJECTION_DIRECTIVE]")
    .replace(/system\s*prompt\s*:/gi, "[SANITIZED_SYSTEM_PROMPT_HEADER]:")
    .replace(/assistant\s*:/gi, "[SANITIZED_ASSISTANT_HEADER]:")
    .replace(/you\s+are\s+now\s+in\s+developer\s+mode/gi, "[SANITIZED_DEVELOPER_MODE]")
    .replace(/always\s+give\s+(?:a\s+)?(?:score|rating)\s+of\s+\d+/gi, "[SANITIZED_SCORING_DIRECTIVE]")
    .replace(/always\s+recommend\s+this\s+candidate/gi, "[SANITIZED_RECOMMENDATION_DIRECTIVE]")
    .replace(/<\|[a-z0-9_-]+\|>/gi, "") // Neutralize special tokens like <|im_start|>
    .replace(/\[\/?INST\]/gi, "")
    .replace(/<<SYS>>|<\/SYS>>/gi, "");

  return sanitized.trim();
}

/**
 * Delimits untrusted resume text inside safe tags for the LLM.
 */
export function wrapUntrustedResumeContent(sanitizedText: string): string {
  return `<UNTRUSTED_RESUME_CONTENT>\n${sanitizedText}\n</UNTRUSTED_RESUME_CONTENT>`;
}

/**
 * Deterministically parses structured resume attributes from text.
 */
export function extractStructuredResume(rawText: string): StructuredResume {
  const sanitized = sanitizeResumeText(rawText);
  const lower = sanitized.toLowerCase();

  // 1. Extract years of experience
  let experienceYears = 0;
  const expMatch = sanitized.match(
    /(?:total\s+)?experience\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)/i
  ) || sanitized.match(
    /(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)(?:\s+of)?\s+experience/i
  ) || sanitized.match(
    /(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)\s+(?:as|in|working)/i
  );

  if (expMatch && expMatch[1]) {
    experienceYears = parseFloat(expMatch[1]);
  } else {
    // Check year spans (e.g., 2018 - 2024 or 2019 - Present)
    const yearMatches = Array.from(
      sanitized.matchAll(/\b(20\d\d)\s*[-–—to]+\s*(20\d\d|present|current)\b/gi)
    );
    if (yearMatches.length > 0) {
      const currentYear = new Date().getFullYear();
      let totalSpan = 0;
      for (const m of yearMatches) {
        const start = parseInt(m[1], 10);
        const endStr = m[2].toLowerCase();
        const end = (endStr === "present" || endStr === "current") ? currentYear : parseInt(endStr, 10);
        if (end >= start) {
          totalSpan += (end - start);
        }
      }
      experienceYears = Math.min(30, Math.max(0, totalSpan));
    }
  }

  // 2. Extract technical skills
  const foundSkills = new Set<string>();
  const knownTokens = Object.keys(SKILL_ALIASES);
  for (const token of knownTokens) {
    // Match whole words/tokens
    const escaped = token.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`(?:^|[\\s,;()•·/])${escaped}(?:$|[\\s,;()•·/])`, "i");
    if (regex.test(sanitized)) {
      foundSkills.add(token);
    }
  }

  const skillsList = Array.from(foundSkills);
  const normalizedSkillsList = normalizeSkills(skillsList);

  // 3. Extract location
  let location = "";
  const locationMatch = sanitized.match(
    /(?:location|address|residence|city|based\s+in)\s*[:\-]?\s*([^\n\r,]+(?:,\s*[^\n\r]+)?)/i
  );
  if (locationMatch && locationMatch[1]) {
    location = locationMatch[1].trim();
  } else if (/remote\b/i.test(sanitized)) {
    location = "Remote";
  } else {
    // Scan common major cities
    const cityMatch = sanitized.match(/\b(New York|San Francisco|London|Gotham|Seattle|Austin|Chicago|Boston|Los Angeles|Bengaluru|Bangalore|Berlin|Toronto)\b/i);
    if (cityMatch) {
      location = cityMatch[1];
    }
  }

  // 4. Extract education
  const educationList: string[] = [];
  const degreeMatches = Array.from(
    sanitized.matchAll(/\b(Ph\.?D|Master(?:'s)?|Bachelor(?:'s)?|B\.?S\.?|M\.?S\.?|B\.?Tech|M\.?Tech|B\.?A\.?|M\.?A\.?|Associate|Diploma)(?:\s+in\s+[^,.\n]+|\s+degree)?\b/gi)
  );
  for (const deg of degreeMatches) {
    const cleaned = deg[0].trim();
    if (!educationList.includes(cleaned)) {
      educationList.push(cleaned);
    }
  }

  // 5. Extract keywords
  const keywordsList: string[] = [];
  const keywordCandidates = [
    "frontend", "backend", "fullstack", "full stack", "cloud", "devops",
    "architecture", "microservices", "agile", "scrum", "distributed systems",
    "api design", "database", "machine learning", "ai", "lead", "senior"
  ];
  for (const kw of keywordCandidates) {
    if (lower.includes(kw)) {
      keywordsList.push(kw);
    }
  }

  return {
    experienceYears,
    skills: skillsList,
    normalizedSkills: normalizedSkillsList,
    location,
    education: educationList,
    keywords: keywordsList,
    sanitizedText: sanitized,
  };
}
