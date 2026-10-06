"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Clock,
  Briefcase,
  User,
  Calendar,
  Eye,
  Trash2,
  FileText,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/UI/shadcn/button";
import {
  getVendorOpening,
  getVendorProfilePreview,
  deleteVendorProfile,
} from "@/lib/api/recruitmentApi";
import PageHeader from "@/components/recruitment/PageHeader";
import StatusBadge from "@/components/recruitment/StatusBadge";
import LoadingSkeleton from "@/components/recruitment/LoadingSkeleton";
import ErrorState from "@/components/recruitment/ErrorState";
import EmptyState from "@/components/recruitment/EmptyState";
import CandidateUploadDropzone from "@/components/recruitment/CandidateUploadDropzone";
import VirtualList from "@/components/recruitment/VirtualList";

export default function VendorOpeningDetailPage({ params }) {
  // In Next.js 15, params can be a Promise or object
  const resolvedParams = typeof params?.then === "function" ? use(params) : params;
  const openingId = resolvedParams?.id;

  const [opening, setOpening] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadOpeningData = useCallback(async () => {
    if (!openingId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await getVendorOpening(openingId);
      const data = response.data;
      setOpening(data);
      // The vendor opening endpoint returns candidate profiles uploaded by this specific vendor in `hiringProfiles`
      setProfiles(data?.hiringProfiles || []);
    } catch (err) {
      console.error("[VendorOpeningDetail] Error loading opening:", err);
      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to load opening details."
      );
    } finally {
      setIsLoading(false);
    }
  }, [openingId]);

  useEffect(() => {
    loadOpeningData();
  }, [loadOpeningData]);

  const handlePreview = async (profileId) => {
    setActionError(null);
    try {
      const response = await getVendorProfilePreview(profileId);
      const previewUrl = response.data?.previewUrl;
      if (previewUrl) {
        window.open(previewUrl, "_blank", "noopener,noreferrer");
      } else {
        throw new Error("Preview link not available");
      }
    } catch (err) {
      console.error("[VendorOpeningDetail] Preview error:", err);
      setActionError(
        err.response?.data?.error || err.message || "Unable to generate preview link."
      );
    }
  };

  const handleDelete = async (profileId) => {
    if (!confirm("Are you sure you want to remove this candidate profile?")) {
      return;
    }
    setDeletingId(profileId);
    setActionError(null);
    try {
      await deleteVendorProfile(profileId);
      setProfiles((prev) => prev.filter((p) => p.id !== profileId));
    } catch (err) {
      console.error("[VendorOpeningDetail] Delete error:", err);
      setActionError(
        err.response?.data?.error || err.message || "Failed to remove candidate profile."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleUploadSuccess = () => {
    // Refresh the profiles list after successful submission
    loadOpeningData();
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
          message={error || "The requested job opening could not be loaded."}
          onRetry={loadOpeningData}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
      {/* Top Header */}
      <PageHeader
        title={opening.title}
        backHref="/vendor/openings"
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
              {opening.experienceMin ?? 0} - {opening.experienceMax ?? 5}+ years
            </span>
          </div>
          {opening.hiringManager && (
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 shrink-0" />
              <span>Hiring Manager: {opening.hiringManager.name || opening.hiringManager.email}</span>
            </div>
          )}
        </div>
      </PageHeader>

      {/* Opening Specification & Skills */}
      <div className="p-5 rounded-lg border border-border bg-card space-y-4">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Role Overview
          </h3>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
            {opening.description || "No description provided for this opening."}
          </p>
        </div>

        {Array.isArray(opening.requiredSkills) && opening.requiredSkills.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Required Skills
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {opening.requiredSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded text-xs font-medium bg-muted text-foreground border border-border"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upload Candidate Profiles Section */}
      <div className="p-5 rounded-lg border border-border bg-card space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Submit Candidate Resumes
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Files are transferred directly to encrypted cloud storage. AI verification begins automatically after submission.
          </p>
        </div>

        <CandidateUploadDropzone
          openingId={openingId}
          onUploadSuccess={handleUploadSuccess}
        />
      </div>

      {/* Action Error Banner */}
      {actionError && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Submitted Profiles Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Submitted Candidates ({profiles.length})
            </h2>
            <p className="text-xs text-muted-foreground">
              Profiles uploaded by your agency for this role.
            </p>
          </div>
        </div>

        {profiles.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={FileText}
              title="No candidates uploaded yet"
              description="Use the upload area above to submit candidate resumes for this opening."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-muted-foreground font-medium">
                  <th className="py-3 px-4">Candidate File</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4">Upload Status</th>
                  <th className="py-3 px-4">AI Processing State</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {profiles.map((profile) => (
                  <tr
                    key={profile.id}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="font-medium text-foreground max-w-xs truncate">
                          {profile.originalFilename}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                      {formatDate(profile.submittedAt)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Uploaded
                      </span>
                    </td>
                    {/* CRITICAL: IT_VENDOR must ONLY see recommendationStatus, NEVER scores or reasoning */}
                    <td className="py-3 px-4">
                      <StatusBadge
                        type="recommendationStatus"
                        value={profile.recommendationStatus || "PENDING"}
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(profile.id)}
                          className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                          title="Preview original document"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(profile.id)}
                          disabled={deletingId === profile.id}
                          className="h-7 px-2 text-xs gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Remove profile"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
