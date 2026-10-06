"use client";

import React, { useState, useEffect, useCallback, useRef, use } from "react";
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
} from "lucide-react";
import { Button } from "@/components/UI/shadcn/button";
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
import VirtualList from "@/components/recruitment/VirtualList";

/**
 * Derive deterministic classification strictly from recommendationScore:
 * >= 0.75 -> Recommended
 * >= 0.50 && < 0.75 -> Borderline
 * < 0.50 -> Not Recommended
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
          setProfiles(data.profiles || []);
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

  // Polling logic:
  // If any profile has recommendationStatus in ['PENDING', 'PROCESSING'], poll every 2.5s.
  // Stop polling when all profiles reach terminal status ('COMPLETED', 'FAILED').
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

  // Decision actions: Shortlist
  const handleShortlist = async (profileId) => {
    setActionError(null);
    setActionInProgress((prev) => ({ ...prev, [profileId]: "shortlist" }));
    try {
      const response = await shortlistProfile(profileId);
      const updated = response.data;
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profileId
            ? {
                ...p,
                status: "SHORTLISTED",
                shortlistedAt: updated?.shortlistedAt || new Date().toISOString(),
                rejectedAt: null,
                rejectedBy: null,
              }
            : p
        )
      );
    } catch (err) {
      console.error("[HiringManager] Error shortlisting:", err);
      setActionError(
        err.response?.data?.error || err.message || "Failed to shortlist candidate."
      );
    } finally {
      setActionInProgress((prev) => {
        const next = { ...prev };
        delete next[profileId];
        return next;
      });
    }
  };

  // Decision actions: Reject
  const handleReject = async (profileId) => {
    setActionError(null);
    setActionInProgress((prev) => ({ ...prev, [profileId]: "reject" }));
    try {
      const response = await rejectProfile(profileId);
      const updated = response.data;
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profileId
            ? {
                ...p,
                status: "REJECTED",
                rejectedAt: updated?.rejectedAt || new Date().toISOString(),
                shortlistedAt: null,
                shortlistedBy: null,
              }
            : p
        )
      );
    } catch (err) {
      console.error("[HiringManager] Error rejecting:", err);
      setActionError(
        err.response?.data?.error || err.message || "Failed to reject candidate."
      );
    } finally {
      setActionInProgress((prev) => {
        const next = { ...prev };
        delete next[profileId];
        return next;
      });
    }
  };

  // Retry failed recommendation
  const handleRetryRecommendation = async (profileId) => {
    setActionError(null);
    setActionInProgress((prev) => ({ ...prev, [profileId]: "retry" }));
    try {
      await retryRecommendation(profileId);
      // Immediately reflect state to PENDING/Queued
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profileId
            ? { ...p, recommendationStatus: "PENDING" }
            : p
        )
      );
      // Trigger data refresh
      loadData(false);
    } catch (err) {
      console.error("[HiringManager] Error retrying recommendation:", err);
      setActionError(
        err.response?.data?.error ||
          err.message ||
          "Failed to schedule recommendation retry."
      );
    } finally {
      setActionInProgress((prev) => {
        const next = { ...prev };
        delete next[profileId];
        return next;
      });
    }
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
          message={error || "Could not retrieve opening details."}
          onRetry={() => loadData(true)}
        />
      </div>
    );
  }

  // Summary counts
  const shortlistedCount = profiles.filter((p) => p.status === "SHORTLISTED").length;
  const rejectedCount = profiles.filter((p) => p.status === "REJECTED").length;
  const activeAiCount = profiles.filter(
    (p) => p.recommendationStatus === "PENDING" || p.recommendationStatus === "PROCESSING"
  ).length;

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
      {/* Page Header */}
      <PageHeader
        title={opening.title}
        backHref="/hiring-manager/openings"
        backLabel="Back to Openings"
        actions={<StatusBadge type="openingStatus" value={opening.status} />}
      >
        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-muted-foreground mt-1">
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
        </div>
      </PageHeader>

      {/* Opening Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg border border-border bg-card">
          <p className="text-xs text-muted-foreground">Total Candidates</p>
          <p className="text-xl font-bold text-foreground mt-0.5">{profiles.length}</p>
        </div>
        <div className="p-3.5 rounded-lg border border-border bg-card">
          <p className="text-xs text-muted-foreground">Shortlisted</p>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {shortlistedCount}
          </p>
        </div>
        <div className="p-3.5 rounded-lg border border-border bg-card">
          <p className="text-xs text-muted-foreground">Rejected</p>
          <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
            {rejectedCount}
          </p>
        </div>
        <div className="p-3.5 rounded-lg border border-border bg-card">
          <p className="text-xs text-muted-foreground">AI Evaluating</p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5 flex items-center gap-1.5">
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

      {/* Candidates List / Review Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            Candidate Submissions ({profiles.length})
          </h2>
          {activeAiCount > 0 && (
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Live evaluating ({activeAiCount} in-flight)...
            </span>
          )}
        </div>

        {profiles.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No candidate profiles submitted"
            description="Vendors have not submitted any resumes for this opening yet."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {profiles.map((profile) => {
              const recStatus = profile.recommendationStatus || "PENDING";
              const isCompleted = recStatus === "COMPLETED";
              const isFailed = recStatus === "FAILED";
              const isProcessing = recStatus === "PROCESSING" || recStatus === "PENDING";

              // Strictly derived from numeric score
              const classification = isCompleted
                ? getClassificationFromScore(profile.recommendationScore)
                : null;

              const scorePct =
                profile.recommendationScore !== null && profile.recommendationScore !== undefined
                  ? Math.round(Number(profile.recommendationScore) * 100)
                  : null;

              const confidencePct =
                profile.recommendationConfidence !== null &&
                profile.recommendationConfidence !== undefined
                  ? Math.round(Number(profile.recommendationConfidence) * 100)
                  : null;

              const inProgress = actionInProgress[profile.id];

              return (
                <div
                  key={profile.id}
                  className="rounded-lg border border-border bg-card p-5 space-y-4 transition-all hover:border-foreground/20"
                >
                  {/* Top Bar: Candidate name, submitted date, status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-foreground">
                          {profile.originalFilename}
                        </h3>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          Submitted {formatDate(profile.submittedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Decision:</span>
                      <StatusBadge type="profileStatus" value={profile.status} />
                    </div>
                  </div>

                  {/* Middle Section: AI Recommendation Details */}
                  <div className="rounded-lg bg-muted/30 border border-border/80 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>AI Match Intelligence</span>
                      </div>
                      <StatusBadge type="recommendationStatus" value={recStatus} />
                    </div>

                    {/* COMPLETED State */}
                    {isCompleted && (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          {classification && (
                            <StatusBadge
                              type="decision"
                              value={classification}
                              className="text-xs px-2.5 py-1"
                            />
                          )}

                          {scorePct !== null && (
                            <div className="text-xs font-medium text-foreground">
                              Match Score: <span className="font-bold text-sm">{scorePct}%</span>
                            </div>
                          )}

                          {confidencePct !== null && (
                            <div className="text-xs text-muted-foreground">
                              Confidence: <span className="font-semibold text-foreground">{confidencePct}%</span>
                            </div>
                          )}

                          {profile.recommendationLatencyMs && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{profile.recommendationLatencyMs}ms</span>
                            </div>
                          )}
                        </div>

                        {/* Recommendation Reasoning */}
                        {profile.recommendationReason && (
                          <p className="text-xs text-foreground/90 leading-relaxed bg-background/60 p-2.5 rounded border border-border/60">
                            {profile.recommendationReason}
                          </p>
                        )}

                        {/* PART 7: Score Breakdown Horizontal Bars */}
                        {profile.recommendationMetadata?.scores && (
                          <div className="pt-1">
                            <ScoreBreakdown
                              scores={profile.recommendationMetadata.scores}
                              className="max-w-md"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* PROCESSING / PENDING State */}
                    {isProcessing && (
                      <div className="flex items-center gap-2.5 text-xs text-muted-foreground py-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                        <span>
                          {recStatus === "PROCESSING"
                            ? "AI tool-calling agent is parsing and evaluating candidate..."
                            : "Queued for automatic recommendation processing..."}
                        </span>
                      </div>
                    )}

                    {/* FAILED State with Retry (PART 10) */}
                    {isFailed && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1">
                        <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>AI Analysis Failed</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRetryRecommendation(profile.id)}
                          disabled={inProgress === "retry"}
                          className="h-8 text-xs gap-1.5 border-border"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${inProgress === "retry" ? "animate-spin" : ""}`} />
                          Retry Analysis
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Footer: View Analysis & Shortlist/Reject Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    {/* View Analysis Modal Trigger (PART 8) */}
                    {isCompleted ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTraceProfile(profile)}
                        className="text-xs h-8 text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 gap-1.5 self-start"
                      >
                        <Cpu className="w-3.5 h-3.5" />
                        View Analysis & Telemetry
                      </Button>
                    ) : (
                      <div />
                    )}

                    {/* Shortlist & Reject Actions (PART 9) */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Button
                        size="sm"
                        variant={profile.status === "SHORTLISTED" ? "default" : "outline"}
                        onClick={() => handleShortlist(profile.id)}
                        disabled={inProgress === "shortlist" || inProgress === "reject"}
                        className={`text-xs h-8 gap-1.5 ${
                          profile.status === "SHORTLISTED"
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "border-border hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-700"
                        }`}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        {profile.status === "SHORTLISTED" ? "Shortlisted" : "Shortlist"}
                      </Button>

                      <Button
                        size="sm"
                        variant={profile.status === "REJECTED" ? "destructive" : "outline"}
                        onClick={() => handleReject(profile.id)}
                        disabled={inProgress === "shortlist" || inProgress === "reject"}
                        className={`text-xs h-8 gap-1.5 ${
                          profile.status === "REJECTED"
                            ? "bg-rose-600 hover:bg-rose-700 text-white"
                            : "border-border hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-700"
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        {profile.status === "REJECTED" ? "Rejected" : "Reject"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Agent Trace Drawer/Modal (PART 8) */}
      <AgentTraceModal
        isOpen={!!selectedTraceProfile}
        onClose={() => setSelectedTraceProfile(null)}
        profile={selectedTraceProfile}
      />
    </div>
  );
}
