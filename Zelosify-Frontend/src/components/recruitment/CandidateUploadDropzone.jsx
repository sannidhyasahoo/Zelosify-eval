"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, RefreshCw, X, Loader2 } from "lucide-react";
import { Button } from "@/components/UI/shadcn/button";
import {
  presignCandidateProfiles,
  uploadFileToS3,
  submitCandidateProfiles,
} from "@/lib/api/recruitmentApi";

const MAX_FILES = 10;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit per file

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "application/vnd.ms-powerpoint": [".pptx"],
};

export default function CandidateUploadDropzone({ openingId, onUploadSuccess }) {
  const [fileQueue, setFileQueue] = useState([]); // Array of { id, file, progress, status, error, s3Key }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState(null);

  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      setGlobalError(null);

      if (rejectedFiles && rejectedFiles.length > 0) {
        const errors = rejectedFiles
          .map((r) => `${r.file.name}: ${r.errors.map((e) => e.message).join(", ")}`)
          .join(" | ");
        setGlobalError(`Some files were rejected. Only PDF and PPTX up to 10MB are permitted.`);
      }

      if (!acceptedFiles || acceptedFiles.length === 0) return;

      setFileQueue((prev) => {
        const combined = [...prev];
        for (const file of acceptedFiles) {
          // Check max limit
          if (combined.length >= MAX_FILES) {
            setGlobalError(`Maximum ${MAX_FILES} files can be uploaded per batch.`);
            break;
          }
          // Prevent exact duplicate filename in same queue
          if (!combined.some((item) => item.file.name === file.name)) {
            combined.push({
              id: `${file.name}-${Date.now()}-${Math.random()}`,
              file,
              progress: 0,
              status: "idle", // 'idle' | 'presigning' | 'uploading' | 's3_completed' | 'submitted' | 'failed'
              error: null,
              s3Key: null,
            });
          }
        }
        return combined;
      });
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: MAX_FILES,
    maxSize: MAX_FILE_SIZE_BYTES,
    disabled: isSubmitting,
  });

  const removeFile = (id) => {
    if (isSubmitting) return;
    setFileQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleStartUpload = async () => {
    if (fileQueue.length === 0 || isSubmitting) return;
    setGlobalError(null);
    setIsSubmitting(true);

    try {
      // Step 1: Call Presign endpoint
      const filesToPresign = fileQueue.map((item) => ({
        filename: item.file.name,
        contentType: item.file.type || "application/pdf",
        sizeBytes: item.file.size,
      }));

      const presignResponse = await presignCandidateProfiles(openingId, filesToPresign);
      const presignItems = presignResponse.data || [];

      if (!presignItems || presignItems.length === 0) {
        throw new Error("No presigned URLs returned from server.");
      }

      // Map presign results to files
      const presignMap = new Map();
      presignItems.forEach((p) => {
        presignMap.set(p.filename, p);
      });

      // Step 2: Upload each file directly to S3 via PUT (NOT via Express)
      const uploadPromises = fileQueue.map(async (queueItem) => {
        const presignedData = presignMap.get(queueItem.file.name);
        if (!presignedData || !presignedData.uploadUrl) {
          throw new Error(`Failed to get presigned URL for ${queueItem.file.name}`);
        }

        // Update queue item state to uploading
        setFileQueue((prev) =>
          prev.map((item) =>
            item.id === queueItem.id
              ? { ...item, status: "uploading", s3Key: presignedData.s3Key }
              : item
          )
        );

        await uploadFileToS3(
          presignedData.uploadUrl,
          queueItem.file,
          (percent) => {
            setFileQueue((prev) =>
              prev.map((item) =>
                item.id === queueItem.id ? { ...item, progress: percent } : item
              )
            );
          }
        );

        setFileQueue((prev) =>
          prev.map((item) =>
            item.id === queueItem.id
              ? { ...item, status: "s3_completed", progress: 100 }
              : item
          )
        );

        return {
          originalFilename: queueItem.file.name,
          s3Key: presignedData.s3Key,
          contentType: queueItem.file.type || "application/pdf",
          sizeBytes: queueItem.file.size,
        };
      });

      const uploadedProfiles = await Promise.all(uploadPromises);

      // Step 3: Only after successful S3 uploads, atomically call submit endpoint
      const submitResponse = await submitCandidateProfiles(openingId, uploadedProfiles);

      // Step 4: Mark all queue items as submitted
      setFileQueue((prev) =>
        prev.map((item) => ({ ...item, status: "submitted" }))
      );

      // Clear queue after short delay and notify parent to refresh list
      setTimeout(() => {
        setFileQueue([]);
        setIsSubmitting(false);
        if (onUploadSuccess) {
          onUploadSuccess(submitResponse.data || []);
        }
      }, 800);
    } catch (err) {
      console.error("[CandidateUpload] Error during upload workflow:", err);
      const errMsg =
        err.response?.data?.error ||
        err.message ||
        "Upload failed. Please check your network and retry.";
      setGlobalError(errMsg);
      setFileQueue((prev) =>
        prev.map((item) =>
          item.status !== "s3_completed"
            ? { ...item, status: "failed", error: errMsg }
            : item
        )
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Dropzone Container */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
            : "border-border hover:border-foreground/30 bg-card/40"
        } ${isSubmitting ? "pointer-events-none opacity-60" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {isDragActive
                ? "Drop candidate resumes here..."
                : "Click or drag & drop candidate profiles"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Supports PDF and PPTX only • Up to 10 files per submission • Max 10MB each
            </p>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {globalError && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{globalError}</span>
        </div>
      )}

      {/* File Queue List */}
      {fileQueue.length > 0 && (
        <div className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/40 flex justify-between items-center text-xs font-medium text-muted-foreground">
            <span>Selected Files ({fileQueue.length}/{MAX_FILES})</span>
            {!isSubmitting && (
              <button
                type="button"
                onClick={() => setFileQueue([])}
                className="hover:text-foreground transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="divide-y divide-border">
            {fileQueue.map((item) => (
              <div key={item.id} className="p-3 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="font-medium text-foreground truncate max-w-xs sm:max-w-md">
                      {item.file.name}
                    </span>
                    <span className="text-muted-foreground shrink-0">
                      ({(item.file.size / (1024 * 1024)).toFixed(1)} MB)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === "s3_completed" || item.status === "submitted" ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Uploaded
                      </span>
                    ) : item.status === "uploading" ? (
                      <span className="text-blue-600 dark:text-blue-400 font-medium">
                        {item.progress}%
                      </span>
                    ) : item.status === "failed" ? (
                      <span className="text-rose-600 dark:text-rose-400 font-medium">
                        Failed
                      </span>
                    ) : !isSubmitting ? (
                      <button
                        type="button"
                        onClick={() => removeFile(item.id)}
                        className="text-muted-foreground hover:text-foreground p-1"
                        aria-label="Remove file"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Individual Progress Bar during upload */}
                {item.status === "uploading" && (
                  <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-150"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-3 bg-muted/20 flex justify-end">
            <Button
              onClick={handleStartUpload}
              disabled={isSubmitting || fileQueue.length === 0}
              size="sm"
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Uploading directly to S3...
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  Submit {fileQueue.length} {fileQueue.length === 1 ? "Profile" : "Profiles"}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
