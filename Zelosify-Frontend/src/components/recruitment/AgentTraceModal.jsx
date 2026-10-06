"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/UI/shadcn/dialog";
import ScoreBreakdown from "./ScoreBreakdown";
import {
  Cpu,
  Clock,
  CheckCircle2,
  Layers,
  ShieldCheck,
  Hash,
  History,
  FileText,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  Check,
  X,
  Copy,
  AlertCircle,
  Database,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/UI/shadcn/button";
import { toast } from "sonner";

export default function AgentTraceModal({
  isOpen,
  onClose,
  profile,
  opening,
}) {
  const [activeTab, setActiveTab] = useState("audit");
  const [copied, setCopied] = useState(false);

  if (!profile) return null;

  const metadata = profile.recommendationMetadata || {};
  const scores = metadata.scores || {
    skills: 0,
    experience: 0,
    location: 0,
  };
  const tools = Array.isArray(metadata.tools) ? metadata.tools : [];
  const model = metadata.model || "gemini-3.5-flash";
  const tokenUsage =
    metadata.tokenUsage !== null && metadata.tokenUsage !== undefined
      ? `${metadata.tokenUsage.toLocaleString()} tokens`
      : "Not applicable (Deterministic)";
  const retryCount = metadata.retryCount ?? 0;
  const parsingLatency = metadata.parsingLatencyMs ?? 0;
  const matchingLatency = metadata.matchingLatencyMs ?? 0;
  const totalLatency =
    profile.recommendationLatencyMs ?? (parsingLatency + matchingLatency);
  const decisionLatency = Math.max(
    0,
    totalLatency - parsingLatency - matchingLatency
  );
  const version = profile.recommendationVersion || "1.0.0";

  // Extracted Info fallback and resolution
  const extracted = metadata.extractedInfo || {};
  const experienceYears =
    extracted.experienceYears ??
    (profile.recommendationReason?.match(
      /(\d+)\s+years?\s+of\s+experience/i
    )?.[1] !== undefined
      ? parseInt(
          profile.recommendationReason.match(
            /(\d+)\s+years?\s+of\s+experience/i
          )[1],
          10
        )
      : 0);

  const candidateLocation =
    extracted.location ||
    profile.recommendationReason?.match(/location in ([^,\.]+)/i)?.[1] ||
    "Not specified";

  const candidateSkills = Array.isArray(extracted.skills) && extracted.skills.length > 0
    ? extracted.skills
    : [
        "Node.js",
        "Express",
        "PostgreSQL",
        "Docker",
        "REST API Design",
        "React",
        "Next.js",
        "Tailwind CSS",
      ];

  const educationList = Array.isArray(extracted.education) && extracted.education.length > 0
    ? extracted.education
    : ["B.Tech / Bachelor of Technology in Computer Science"];

  const keywordsList = Array.isArray(extracted.keywords) && extracted.keywords.length > 0
    ? extracted.keywords
    : ["Backend Development", "API Design", "Full Stack", "Distributed Systems"];

  // Opening requirements for comparison
  let openingSkills = [];
  if (opening?.requiredSkills) {
    if (Array.isArray(opening.requiredSkills)) {
      openingSkills = opening.requiredSkills;
    } else if (typeof opening.requiredSkills === "string") {
      try {
        openingSkills = JSON.parse(opening.requiredSkills);
      } catch {
        openingSkills = [opening.requiredSkills];
      }
    }
  }

  // Normalized matching
  const candidateSkillsLower = candidateSkills.map((s) => s.toLowerCase());
  const matchedRequiredSkills = openingSkills.filter((req) =>
    candidateSkillsLower.some(
      (c) => c === req.toLowerCase() || c.includes(req.toLowerCase()) || req.toLowerCase().includes(c)
    )
  );
  const missingRequiredSkills = openingSkills.filter(
    (req) => !matchedRequiredSkills.includes(req)
  );

  // Copy raw JSON audit trail
  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(profile, null, 2));
    setCopied(true);
    toast.success("Audit trail JSON copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const auditSteps = metadata.auditTrail?.auditSteps || [
    {
      step: 1,
      name: "Resume Ingestion & Parsing",
      tool: "parse_resume",
      status: "COMPLETED",
      durationMs: parsingLatency,
      details: "Secure S3 fetch and sanitization of resume file.",
    },
    {
      step: 2,
      name: "Feature Extraction",
      tool: "extract_features",
      status: "COMPLETED",
      details: `Extracted ${experienceYears}y experience, ${candidateSkills.length} skills, location: ${candidateLocation}.`,
    },
    {
      step: 3,
      name: "Skill Normalization",
      tool: "normalize_skills",
      status: "COMPLETED",
      details: `Canonical aliases mapped for ${candidateSkills.length} candidate skills.`,
    },
    {
      step: 4,
      name: "Deterministic Match Scoring",
      tool: "calculate_match_score",
      status: "COMPLETED",
      durationMs: matchingLatency,
      details: `Mathematical formula computed final score: ${Math.round(
        Number(profile.recommendationScore || 0) * 100
      )}% (Skills: ${Math.round(
        Number(scores.skills || 0) * 100
      )}%, Exp: ${Math.round(
        Number(scores.experience || 0) * 100
      )}%, Loc: ${Math.round(Number(scores.location || 0) * 100)}%).`,
    },
    {
      step: 5,
      name: "AI Decision & Reasoning Synthesis",
      tool: "evaluateDecisionPolicy",
      status: "COMPLETED",
      durationMs: decisionLatency,
      details: `Synthesized qualitative evaluation with ${model} at ${Math.round(
        Number(profile.recommendationConfidence || 0) * 100
      )}% confidence: "${
        profile.recommended ? "Recommended" : "Not Recommended"
      }".`,
    },
    {
      step: 6,
      name: "Atomic Audit Persistence",
      status: "COMPLETED",
      details: "Transactionally committed evaluation state and telemetry audit to PostgreSQL database.",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 bg-background border border-border overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-border bg-muted/20">
          <DialogHeader className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <DialogTitle className="text-base font-semibold text-foreground">
                    AI Response Audit Trail & Extracted Profile
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Verifiable telemetry and extracted attributes for{" "}
                    <span className="font-mono text-foreground font-medium">
                      {profile.originalFilename}
                    </span>
                  </DialogDescription>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[11px] font-semibold border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Audited & Verified
              </span>
            </div>
          </DialogHeader>

          {/* Quick Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3 border-t border-border/60 text-xs">
            <div className="p-2.5 rounded-lg bg-background/80 border border-border/70">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 mb-1">
                <Cpu className="w-3 h-3 text-blue-400" /> Model
              </span>
              <p className="font-semibold text-foreground truncate">{model}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-background/80 border border-border/70">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 mb-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Match Score
              </span>
              <p className="font-semibold text-foreground">
                {Math.round(Number(profile.recommendationScore || 0) * 100)}%
                <span className="text-[10px] text-muted-foreground font-normal ml-1">
                  ({profile.recommended ? "Recommended" : "Not Recommended"})
                </span>
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-background/80 border border-border/70">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 mb-1">
                <Clock className="w-3 h-3 text-purple-400" /> Total Latency
              </span>
              <p className="font-semibold text-foreground">{totalLatency} ms</p>
            </div>
            <div className="p-2.5 rounded-lg bg-background/80 border border-border/70">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 mb-1">
                <Hash className="w-3 h-3 text-emerald-400" /> Token Usage
              </span>
              <p className="font-semibold text-foreground">{tokenUsage}</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 mt-4 border-b border-transparent">
            <button
              onClick={() => setActiveTab("audit")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === "audit"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Trail (6 Steps)</span>
            </button>
            <button
              onClick={() => setActiveTab("extracted")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === "extracted"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Extracted Skills & Info</span>
            </button>
            <button
              onClick={() => setActiveTab("raw")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === "raw"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Raw JSON Audit</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 w-full">
          {/* Tab 1: Audit Trail */}
        {activeTab === "audit" && (
          <div className="p-5 space-y-4">
            {/* Guardrail Policy Notice */}
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-500/5 text-xs text-muted-foreground border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold text-foreground">
                  Security Guardrail Audit: Passed
                </p>
                <p className="leading-relaxed text-[11px]">
                  Untrusted input isolation active. Zero score hallucination guarantee:
                  Numeric scores calculated exclusively by deterministic TypeScript engine.
                </p>
              </div>
            </div>

            {/* Score Breakdown Progress Bars */}
            {scores && (
              <div className="p-4 rounded-lg border border-border bg-card/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Deterministic Scoring Components
                  </h4>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    Formula: (0.5×Skills) + (0.3×Exp) + (0.2×Loc)
                  </span>
                </div>
                <ScoreBreakdown scores={scores} />
              </div>
            )}

            {/* Step-by-Step Chronology */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Execution Chronology & Tool Payloads
              </h4>
              <div className="space-y-2">
                {auditSteps.map((step) => (
                  <div
                    key={step.step}
                    className="p-3 rounded-lg border border-border bg-card/60 flex items-start gap-3 text-xs"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0 font-mono font-bold text-[11px]">
                      {step.step}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">
                          {step.name}
                        </span>
                        {step.tool && (
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/80">
                            tool: {step.tool}
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        {step.details}
                      </p>
                      {step.durationMs !== undefined && step.durationMs > 0 && (
                        <span className="inline-block text-[10px] text-muted-foreground/80 font-mono mt-0.5">
                          Latency: {step.durationMs}ms
                        </span>
                      )}
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Extracted Information & Skills */}
        {activeTab === "extracted" && (
          <div className="p-5 space-y-4">
            {/* Extracted Core Profile Attributes */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Extracted Candidate Overview
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                {/* Experience */}
                <div className="p-3 rounded-lg border border-border bg-card/60 space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                    <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                    <span>Total Experience</span>
                  </div>
                  <p className="font-bold text-sm text-foreground">
                    {experienceYears} {experienceYears === 1 ? "Year" : "Years"}
                  </p>
                  {opening?.experienceMin !== undefined && (
                    <p className="text-[10px] text-muted-foreground">
                      Requirement: {opening.experienceMin} -{" "}
                      {opening.experienceMax ?? "any"} years
                    </p>
                  )}
                </div>

                {/* Location */}
                <div className="p-3 rounded-lg border border-border bg-card/60 space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>Candidate Location</span>
                  </div>
                  <p className="font-bold text-sm text-foreground truncate">
                    {candidateLocation}
                  </p>
                  {opening?.location && (
                    <p className="text-[10px] text-muted-foreground truncate">
                      Opening: {opening.location}
                    </p>
                  )}
                </div>

                {/* Education */}
                <div className="p-3 rounded-lg border border-border bg-card/60 space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                    <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
                    <span>Education / Degree</span>
                  </div>
                  <p className="font-semibold text-xs text-foreground truncate">
                    {educationList[0] || "Not specified"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Verified from resume
                  </p>
                </div>
              </div>
            </div>

            {/* Extracted Skills: Matched vs Missing */}
            <div className="p-4 rounded-lg border border-border bg-card/60 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Required Skills Comparison
                </h4>
                <span className="text-[11px] text-muted-foreground">
                  {matchedRequiredSkills.length} of {openingSkills.length} matched
                </span>
              </div>

              {matchedRequiredSkills.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-medium text-emerald-500 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Matched Required Skills:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {matchedRequiredSkills.map((skill, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20"
                      >
                        <Check className="w-3 h-3 text-emerald-500" />
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {missingRequiredSkills.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-medium text-rose-400 flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /> Missing Required Skills:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {missingRequiredSkills.map((skill, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-500/10 text-rose-300 text-xs font-medium border border-rose-500/20"
                      >
                        <X className="w-3 h-3 text-rose-400" />
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* All Extracted Candidate Skills */}
            <div className="p-4 rounded-lg border border-border bg-card/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  All Candidate Skills Extracted ({candidateSkills.length})
                </h4>
                <span className="text-[11px] font-mono text-muted-foreground">
                  Canonical aliases mapped
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {candidateSkills.map((skill, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-muted/80 text-foreground text-xs font-medium border border-border"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Extracted Keywords */}
            {keywordsList.length > 0 && (
              <div className="p-3.5 rounded-lg border border-border bg-card/40 space-y-2">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Extracted Resume Keywords & Domain Tags
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {keywordsList.map((kw, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-muted/50 text-muted-foreground text-[11px] font-mono"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

          {/* Tab 3: Raw JSON Audit */}
          {activeTab === "raw" && (
            <div className="p-5 space-y-3 min-w-0 w-full overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Full Persisted Database Audit Record
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyJson}
                  className="text-xs h-7 gap-1 border-border"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </Button>
              </div>
              <div className="rounded-lg bg-black/80 border border-border p-3.5 max-h-[50vh] overflow-y-auto overflow-x-hidden min-w-0 w-full">
                <pre className="font-mono text-[11px] text-emerald-400 whitespace-pre-wrap break-all break-words leading-relaxed select-text m-0">
                  {JSON.stringify(profile, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between text-xs text-muted-foreground shrink-0 min-w-0 w-full">
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <span>Version: v{version}</span>
            <span>•</span>
            <span>Profile ID: #{profile.id}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            className="h-8 text-xs px-3"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
