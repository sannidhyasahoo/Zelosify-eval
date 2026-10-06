"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
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
  UploadCloud,
  ChevronRight,
  AlertTriangle,
  Printer,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/UI/shadcn/button";
import { exportToCSV, triggerPrint } from "@/utils/exportUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/UI/shadcn/dialog";
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

export default function VendorOpeningDetailPage({ params }) {
  const resolvedParams = typeof params?.then === "function" ? use(params) : params;
  const openingId = resolvedParams?.id;

  const [opening, setOpening] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Remove confirmation modal state
  const [profileToDelete, setProfileToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadOpeningData = useCallback(async () => {
    if (!openingId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await getVendorOpening(openingId);
      const data = response.data;
      setOpening(data);
      setProfiles(data?.hiringProfiles || []);
    } catch (err) {
      console.error("[VendorOpeningDetail] Error loading opening:", err);
      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to load contract opening details."
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

  const handleConfirmDelete = async () => {
    if (!profileToDelete) return;
    setIsDeleting(true);
    setActionError(null);
    try {
      await deleteVendorProfile(profileToDelete.id);
      setProfiles((prev) => prev.filter((p) => p.id !== profileToDelete.id));
      toast.success("Candidate profile removed successfully");
      setProfileToDelete(null);
    } catch (err) {
      console.error("[VendorOpeningDetail] Delete error:", err);
      setActionError(
        err.response?.data?.error || err.message || "Failed to remove candidate profile."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUploadSuccess = () => {
    setIsUploadModalOpen(false);
    loadOpeningData();
  };

  const handleExportCandidates = () => {
    if (!profiles || profiles.length === 0) {
      toast.error("No candidate profiles to export");
      return;
    }
    const cols = [
      { label: "Filename", key: "originalFilename" },
      { label: "Submitted Time", key: (p) => (p.submittedAt ? new Date(p.submittedAt).toLocaleString() : "N/A") },
      { label: "Status", key: (p) => p.recommendationStatus || "PENDING" },
    ];
    exportToCSV(`candidates_${opening?.title?.replace(/[^a-zA-Z0-9_-]/g, "_") || "opening"}.csv`, profiles, cols);
    toast.success(`Exported ${profiles.length} candidate profiles to CSV`);
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
          title="Contract Opening Not Found"
          message={error || "The requested opening could not be loaded."}
          onRetry={loadOpeningData}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link
          href="/vendor/openings"
          className="hover:text-foreground transition-colors"
        >
          Contract Openings
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground truncate max-w-sm">{opening.title}</span>
      </nav>

      {/* Top Header with Primary "Submit candidate" Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              {opening.title}
            </h1>
            <StatusBadge type="openingStatus" value={opening.status} />
          </div>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-muted-foreground mt-2 font-mono">
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
            {opening.hiringManager && (
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 shrink-0" />
                <span>Manager: {opening.hiringManager.name || opening.hiringManager.email}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>Posted {formatDate(opening.postedDate)}</span>
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <Button
          onClick={() => setIsUploadModalOpen(true)}
          className="h-9 px-4 text-xs font-medium bg-[#e6e6e6] text-[#07080a] hover:bg-white gap-2 shrink-0 self-start sm:self-auto shadow-sm"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Submit candidate</span>
        </Button>
      </div>

      {/* Role Details (Compact & Readable) */}
      <div className="p-4 rounded-lg border border-border bg-card space-y-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Role Overview
          </h3>
          <p className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-line">
            {opening.description || "No description provided for this opening."}
          </p>
        </div>

        {Array.isArray(opening.requiredSkills) && opening.requiredSkills.length > 0 && (
          <div className="pt-2 border-t border-border/60">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Required Skills
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {opening.requiredSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-foreground border border-border"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Error Banner */}
      {actionError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-coral/10 border border-coral/30 text-coral text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Candidate Submissions Operational Table */}
      <div className="rounded-card border border-border/80 bg-card shadow-key overflow-hidden">
        <div className="p-4 border-b border-border/70 flex justify-between items-center bg-muted/20">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Submitted Candidates ({profiles.length})
            </h2>
            <p className="text-xs text-muted-foreground">
              Candidate resumes submitted by your agency for this position.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintOverview}
              className="h-8 text-xs gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCandidates}
              className="h-8 text-xs gap-1.5"
            >
              <Upload className="w-3.5 h-3.5 rotate-180" />
              <span>Export CSV</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUploadModalOpen(true)}
              className="h-8 text-xs gap-1.5"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Profiles</span>
            </Button>
          </div>
        </div>

        {profiles.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={FileText}
              title="No candidates submitted yet"
              description="Click 'Submit candidate' above to upload candidate resumes for this contract opening."
              actionLabel="Submit candidate"
              onAction={() => setIsUploadModalOpen(true)}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-border/70 text-muted-foreground font-medium">
                  <th className="py-3 px-4 font-mono text-[11px] uppercase tracking-wider">Filename</th>
                  <th className="py-3 px-4 font-mono text-[11px] uppercase tracking-wider">Submitted Time</th>
                  <th className="py-3 px-4 font-mono text-[11px] uppercase tracking-wider">Analysis Status</th>
                  <th className="py-3 px-4 text-right font-mono text-[11px] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {profiles.map((profile) => (
                  <tr
                    key={profile.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="max-w-md truncate">
                          {profile.originalFilename}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap font-mono text-[11px]">
                      {formatDate(profile.submittedAt)}
                    </td>
                    {/* CRITICAL: IT_VENDOR must ONLY see recommendationStatus, NEVER score or reasoning */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge
                        type="recommendationStatus"
                        value={profile.recommendationStatus || "PENDING"}
                      />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(profile.id)}
                          className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                          title="Preview candidate resume"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setProfileToDelete(profile)}
                          className="h-7 px-2 text-xs gap-1 text-coral hover:bg-coral/10"
                          title="Remove candidate submission"
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

      {/* Candidate Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Submit Candidate Resumes
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select or drop candidate documents (PDF or PPTX, max 10 files, 10MB each).
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <CandidateUploadDropzone
              openingId={openingId}
              onUploadSuccess={handleUploadSuccess}
              onCancel={() => setIsUploadModalOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <Dialog
        open={!!profileToDelete}
        onOpenChange={(open) => {
          if (!open) setProfileToDelete(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-sm font-semibold">
                  Remove Candidate Profile
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-1">
                  Are you sure you want to remove{" "}
                  <span className="font-semibold text-foreground">
                    {profileToDelete?.originalFilename}
                  </span>
                  ? This will delete the candidate from this opening.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <DialogFooter className="pt-3 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setProfileToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Removing..." : "Remove Profile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
