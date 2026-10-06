"use client";

import React, { useState, useEffect, useCallback, useRef, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  MapPin,
  Clock,
  User,
  CheckCircle,
  XCircle,
  RefreshCw,
  Cpu,
  FileText,
  AlertTriangle,
  Loader2,
  Calendar,
  Layers,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Search,
  ExternalLink,
  Printer,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/UI/shadcn/button";
import { Input } from "@/components/UI/shadcn/input";
import { exportToCSV, triggerPrint } from "@/utils/exportUtils";
import {
  getHiringManagerOpeningProfiles,
  shortlistProfile,
  rejectProfile,
  retryRecommendation,
} from "@/lib/api/recruitmentApi";
import PageHeader from "@/components/recruitment/PageHeader";
import StatusBadge from "@/components/recruitment/StatusBadge";
import LoadingSkeleton from "@/components/recruitment/LoadingSkeleton";
import ErrorState from "@/components/recruitment/ErrorState";
import EmptyState from "@/components/recruitment/EmptyState";
import ScoreBreakdown from "@/components/recruitment/ScoreBreakdown";
import AgentTraceModal from "@/components/recruitment/AgentTraceModal";

/**
 * Authoritative deterministic classification threshold:
 * score >= 0.75 -> Recommended
 * 0.50 <= score < 0.75 -> Borderline
 * score < 0.50 -> Not Recommended
 */
function getClassificationFromScore(score) {
  if (score === null || score === undefined) return null;
  const num = Number(score);
  if (num >= 0.75) return "Recommended";
  if (num >= 0.5) return "Borderline";
  return "Not Recommended";
}

export default function HiringManagerOpeningDetailPage({ params }) {
  const resolvedParams = typeof params?.then === "function" ? use(params) : params;
  const openingId = resolvedParams?.id;

  const [opening, setOpening] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionInProgress, setActionInProgress] = useState({}); // { [profileId]: 'shortlist' | 'reject' | 'retry' }
  const [selectedTraceProfile, setSelectedTraceProfile] = useState(null);
  const [actionError, setActionError] = useState(null);

  const pollingRef = useRef(null);

  const loadData = useCallback(
    async (isInitial = false) => {
      if (!openingId) return;
      if (isInitial) {
        setIsLoading(true);
        setError(null);
      }
      try {
        const response = await getHiringManagerOpeningProfiles(openingId);
        const data = response.data;
        if (data) {
          setOpening(data.opening);
          const candidateProfiles = data.profiles || [];
          setProfiles(candidateProfiles);

          // Auto-select first profile if none currently selected
          setSelectedProfileId((prev) => {
            if (prev && candidateProfiles.some((p) => p.id === prev)) {
              return prev;
            }
            return candidateProfiles.length > 0 ? candidateProfiles[0].id : null;
          });
        }
      } catch (err) {
        console.error("[HiringManagerOpeningDetail] Error fetching profiles:", err);
        if (isInitial) {
          setError(
            err.response?.data?.error ||
              err.message ||
              "Failed to load opening and candidate profiles."
          );
        }
      } finally {
        if (isInitial) {
          setIsLoading(false);
        }
      }
    },
    [openingId]
  );

  // Initial load
  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Polling logic for pending or processing AI recommendations
  useEffect(() => {
    const hasActiveAiWork = profiles.some((p) => {
      const s = p.recommendationStatus;
      return s === "PENDING" || s === "PROCESSING";
    });

    if (hasActiveAiWork) {
      if (!pollingRef.current) {
        pollingRef.current = setInterval(() => {
          loadData(false);
        }, 2500);
      }
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [profiles, loadData]);

  const handleShortlist = async (profileId) => {
    setActionInProgress((prev) => ({ ...prev, [profileId]: "shortlist" }));
    setActionError(null);
    try {
      await shortlistProfile(profileId);
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, status: "SHORTLISTED" } : p))
      );
      toast.success("Candidate shortlisted successfully");
    } catch (err) {
      console.error("[HiringManagerOpeningDetail] Shortlist error:", err);
      const msg = err.response?.data?.error || err.message || "Failed to shortlist profile.";
      setActionError(msg);
      toast.error(msg);
    } finally {
      setActionInProgress((prev) => {
        const next = { ...prev };
        delete next[profileId];
        return next;
      });
    }
  };

  const handleReject = async (profileId) => {
    setActionInProgress((prev) => ({ ...prev, [profileId]: "reject" }));
    setActionError(null);
    try {
      await rejectProfile(profileId);
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, status: "REJECTED" } : p))
      );
      toast.success("Candidate marked as rejected");
    } catch (err) {
      console.error("[HiringManagerOpeningDetail] Reject error:", err);
      const msg = err.response?.data?.error || err.message || "Failed to reject profile.";
      setActionError(msg);
      toast.error(msg);
    } finally {
      setActionInProgress((prev) => {
        const next = { ...prev };
        delete next[profileId];
        return next;
      });
    }
  };

  const handleRetryRecommendation = async (profileId) => {
    setActionInProgress((prev) => ({ ...prev, [profileId]: "retry" }));
    setActionError(null);
    toast.info("Retrying candidate recommendation analysis...");
    try {
      await retryRecommendation(profileId);
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profileId
            ? { ...p, recommendationStatus: "PROCESSING" }
            : p
        )
      );
    } catch (err) {
      console.error("[HiringManagerOpeningDetail] Retry recommendation error:", err);
      const msg = err.response?.data?.error || err.message || "Failed to re-trigger analysis.";
      setActionError(msg);
      toast.error(msg);
    } finally {
      setActionInProgress((prev) => {
        const next = { ...prev };
        delete next[profileId];
        return next;
      });
    }
  };

  const handleExportCandidates = () => {
    if (!profiles || profiles.length === 0) {
      toast.error("No candidates to export");
      return;
    }
    const cols = [
      { label: "Candidate File", key: "originalFilename" },
      { label: "Status", key: "status" },
      {
        label: "Recommendation",
        key: (p) => getClassificationFromScore(p.recommendationScore) || p.recommendationStatus || "N/A",
      },
      {
        label: "Match Score",
        key: (p) => (p.recommendationScore != null ? `${Math.round(Number(p.recommendationScore) * 100)}%` : "N/A"),
      },
      {
        label: "Confidence",
        key: (p) => (p.recommendationConfidence != null ? `${Math.round(Number(p.recommendationConfidence) * 100)}%` : "N/A"),
      },
      { label: "Vendor", key: (p) => p.vendor?.name || p.vendor?.companyName || "N/A" },
      { label: "Submitted", key: (p) => (p.submittedAt ? new Date(p.submittedAt).toLocaleDateString() : "N/A") },
    ];
    exportToCSV(`candidates_${opening?.title?.replace(/[^a-zA-Z0-9_-]/g, "_") || "opening"}.csv`, profiles, cols);
    toast.success(`Exported ${profiles.length} candidates to CSV`);
  };

  const handlePrintOverview = () => {
    toast.info("Opening system print dialog...");
    triggerPrint();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <LoadingSkeleton type="detail" />
      </div>
    );
  }

  if (error || !opening) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <ErrorState
          title="Opening Not Found"
          message={error || "The requested opening could not be loaded."}
          onRetry={() => loadData(true)}
        />
      </div>
    );
  }

  // Filtered candidate list
  const filteredProfiles = profiles.filter((p) =>
    searchFilter.trim() === ""
      ? true
      : p.originalFilename.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const selectedProfile =
    profiles.find((p) => p.id === selectedProfileId) || profiles[0] || null;

  const shortlistedCount = profiles.filter((p) => p.status === "SHORTLISTED").length;
  const rejectedCount = profiles.filter((p) => p.status === "REJECTED").length;
  const activeAiCount = profiles.filter(
    (p) => p.recommendationStatus === "PENDING" || p.recommendationStatus === "PROCESSING"
  ).length;

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link
          href="/hiring-manager/openings"
          className="hover:text-foreground transition-colors"
        >
          My Openings
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground truncate max-w-sm">{opening.title}</span>
      </nav>

      {/* Page Header */}
      <PageHeader
        title={opening.title}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintOverview}
              className="gap-1.5 h-8 text-xs font-mono border-border bg-card/60 hover:bg-card"
            >
              <Printer className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Print</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCandidates}
              className="gap-1.5 h-8 text-xs font-mono border-border bg-card/60 hover:bg-card"
            >
              <Upload className="w-3.5 h-3.5 text-muted-foreground rotate-180" />
              <span>Export CSV</span>
            </Button>
            <StatusBadge type="openingStatus" value={opening.status} />
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-muted-foreground mt-1 font-mono">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>{opening.location || "Remote / Unspecified"}</span>
          </div>
          {opening.contractType && (
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 shrink-0" />
              <span>{opening.contractType}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>
              {opening.experienceMin ?? 0} - {opening.experienceMax ?? 5}+ yrs exp
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>Posted {formatDate(opening.postedDate)}</span>
          </div>
        </div>
      </PageHeader>

      {/* Queue Summary Stat Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg border border-border bg-card">
          <p className="text-[11px] text-muted-foreground">Total Candidates</p>
          <p className="text-lg font-bold text-foreground mt-0.5">{profiles.length}</p>
        </div>
        <div className="p-3 rounded-lg border border-border bg-card">
          <p className="text-[11px] text-muted-foreground">Shortlisted</p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {shortlistedCount}
          </p>
        </div>
        <div className="p-3 rounded-lg border border-border bg-card">
          <p className="text-[11px] text-muted-foreground">Rejected</p>
          <p className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-0.5">
            {rejectedCount}
          </p>
        </div>
        <div className="p-3 rounded-lg border border-border bg-card">
          <p className="text-[11px] text-muted-foreground">In Review / Analysis</p>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-0.5 flex items-center gap-1.5">
            {activeAiCount}
            {activeAiCount > 0 && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />}
          </p>
        </div>
      </div>

      {/* Action Error Banner */}
      {actionError && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Master-Detail Candidate Review Workspace */}
      {profiles.length === 0 ? (
        <div className="py-12 bg-card rounded-lg border border-border">
          <EmptyState
            icon={FileText}
            title="No candidate profiles submitted"
            description="Vendors have not submitted any candidate resumes for this opening yet."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT: Candidate List Master Pane */}
          <div className="lg:col-span-5 rounded-lg border border-border bg-card overflow-hidden space-y-0">
            <div className="p-3 border-b border-border bg-muted/20">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter candidate names..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-8 h-8 text-xs bg-background"
                />
              </div>
            </div>

            <div className="divide-y divide-border max-h-[700px] overflow-y-auto">
              {filteredProfiles.map((p) => {
                const isSelected = p.id === selectedProfile?.id;
                const recStatus = p.recommendationStatus || "PENDING";
                const classification =
                  recStatus === "COMPLETED"
                    ? getClassificationFromScore(p.recommendationScore)
                    : null;
                const matchPct =
                  p.recommendationScore !== null && p.recommendationScore !== undefined
                    ? Math.round(Number(p.recommendationScore) * 100)
                    : null;

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProfileId(p.id)}
                    className={`p-3.5 cursor-pointer transition-colors text-xs space-y-2 ${
                      isSelected
                        ? "bg-muted/80 border-l-2 border-l-blue-600 dark:border-l-blue-400"
                        : "hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="font-semibold text-foreground truncate max-w-[190px]">
                          {p.originalFilename}
                        </span>
                      </div>
                      <StatusBadge type="profileStatus" value={p.status} />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Submitted {formatDate(p.submittedAt)}</span>
                      {matchPct !== null ? (
                        <span className="font-mono font-semibold text-foreground">
                          {matchPct}% Match
                        </span>
                      ) : (
                        <StatusBadge type="recommendationStatus" value={recStatus} />
                      )}
                    </div>

                    {classification && (
                      <div className="pt-0.5">
                        <StatusBadge
                          type="decision"
                          value={classification}
                          className="text-[10px]"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Selected Candidate Detail Pane */}
          {selectedProfile && (
            <div className="lg:col-span-7 rounded-lg border border-border bg-card p-5 space-y-5">
              {/* Candidate File Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-muted border border-border flex items-center justify-center text-foreground shrink-0">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-foreground break-all">
                      {selectedProfile.originalFilename}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      Submitted {formatDate(selectedProfile.submittedAt)}
                      {selectedProfile.recommendationLatencyMs && (
                        <span> • Latency: {selectedProfile.recommendationLatencyMs}ms</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs text-muted-foreground">Decision:</span>
                  <StatusBadge type="profileStatus" value={selectedProfile.status} />
                </div>
              </div>

              {/* SEPARATE SECTION 1: AI Recommendation */}
              <div className="rounded-lg bg-muted/30 border border-border/80 p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>AI Recommendation</span>
                  </div>
                  <StatusBadge
                    type="recommendationStatus"
                    value={selectedProfile.recommendationStatus || "PENDING"}
                  />
                </div>

                {selectedProfile.recommendationStatus === "COMPLETED" && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusBadge
                        type="decision"
                        value={
                          getClassificationFromScore(selectedProfile.recommendationScore) ||
                          "Recommended"
                        }
                        className="text-xs px-2.5 py-1"
                      />

                      {selectedProfile.recommendationScore !== null && (
                        <div className="text-xs font-medium text-foreground">
                          Match Score:{" "}
                          <span className="font-bold text-sm">
                            {Math.round(Number(selectedProfile.recommendationScore) * 100)}%
                          </span>
                        </div>
                      )}

                      {selectedProfile.recommendationConfidence !== null && (
                        <div className="text-xs text-muted-foreground">
                          Confidence:{" "}
                          <span className="font-semibold text-foreground">
                            {Math.round(
                              Number(selectedProfile.recommendationConfidence) * 100
                            )}
                            %
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Recommendation Reasoning */}
                    {selectedProfile.recommendationReason && (
                      <p className="text-xs text-foreground/90 leading-relaxed bg-background/60 p-3 rounded border border-border/60">
                        {selectedProfile.recommendationReason}
                      </p>
                    )}

                    {/* Score Breakdown Bars (Skills / Experience / Location) */}
                    {selectedProfile.recommendationMetadata?.scores && (
                      <div className="pt-1">
                        <ScoreBreakdown
                          scores={selectedProfile.recommendationMetadata.scores}
                          className="max-w-md"
                        />
                      </div>
                    )}

                    {/* Untrusted input explanation banner */}
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>
                        Candidate content is treated as untrusted input. Match scores are calculated using deterministic application rules.
                      </span>
                    </div>

                    {/* Evaluation Details Trigger */}
                    <div className="pt-2 border-t border-border/50">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTraceProfile(selectedProfile)}
                        className="text-xs h-8 gap-1.5 border-border"
                      >
                        <Cpu className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Evaluation details</span>
                      </Button>
                    </div>
                  </div>
                )}

                {selectedProfile.recommendationStatus === "PROCESSING" && (
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                    <span>Analyzing candidate against opening requirements...</span>
                  </div>
                )}

                {selectedProfile.recommendationStatus === "PENDING" && (
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground py-3">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>Queued for automated matching analysis...</span>
                  </div>
                )}

                {selectedProfile.recommendationStatus === "FAILED" && (
                  <div className="flex items-center justify-between gap-3 py-2">
                    <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Analysis failed. Candidate parsing was interrupted.</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRetryRecommendation(selectedProfile.id)}
                      disabled={actionInProgress[selectedProfile.id] === "retry"}
                      className="h-8 text-xs gap-1.5 border-border"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${
                          actionInProgress[selectedProfile.id] === "retry"
                            ? "animate-spin"
                            : ""
                        }`}
                      />
                      Retry Analysis
                    </Button>
                  </div>
                )}
              </div>

              {/* SEPARATE SECTION 2: Hiring Decision */}
              <div className="p-4 rounded-lg border border-border bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Hiring Decision
                  </h4>
                  <StatusBadge type="profileStatus" value={selectedProfile.status} />
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Record your managerial evaluation decision. Shortlisting moves the candidate forward for client review.
                </p>

                <div className="flex items-center gap-3 pt-1">
                  <Button
                    size="sm"
                    variant={selectedProfile.status === "SHORTLISTED" ? "default" : "outline"}
                    onClick={() => handleShortlist(selectedProfile.id)}
                    disabled={
                      actionInProgress[selectedProfile.id] === "shortlist" ||
                      actionInProgress[selectedProfile.id] === "reject"
                    }
                    className={`text-xs h-9 px-4 gap-1.5 font-medium ${
                      selectedProfile.status === "SHORTLISTED"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "border-border hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-700"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>
                      {selectedProfile.status === "SHORTLISTED"
                        ? "Shortlisted"
                        : "Shortlist"}
                    </span>
                  </Button>

                  <Button
                    size="sm"
                    variant={selectedProfile.status === "REJECTED" ? "destructive" : "outline"}
                    onClick={() => handleReject(selectedProfile.id)}
                    disabled={
                      actionInProgress[selectedProfile.id] === "shortlist" ||
                      actionInProgress[selectedProfile.id] === "reject"
                    }
                    className={`text-xs h-9 px-4 gap-1.5 font-medium ${
                      selectedProfile.status === "REJECTED"
                        ? "bg-rose-600 hover:bg-rose-700 text-white"
                        : "border-border hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-700"
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>
                      {selectedProfile.status === "REJECTED" ? "Rejected" : "Reject"}
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Processing Details Modal (Triggered by 'Evaluation details') */}
      <AgentTraceModal
        isOpen={!!selectedTraceProfile}
        onClose={() => setSelectedTraceProfile(null)}
        profile={selectedTraceProfile}
      />
    </div>
  );
}
