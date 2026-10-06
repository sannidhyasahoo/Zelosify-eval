"use client";

import React from "react";

/**
 * Universal status badge with crisp typography and restrained color tokens.
 */
export default function StatusBadge({ type = "status", value, className = "" }) {
  if (!value) return null;

  const normalized = String(value).toUpperCase();

  // Color mappings based on badge type
  let badgeClasses = "bg-muted text-muted-foreground border-border";

  if (type === "decision" || type === "recommendationClassification") {
    if (value === "Recommended" || normalized === "RECOMMENDED") {
      badgeClasses =
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
    } else if (value === "Borderline" || normalized === "BORDERLINE") {
      badgeClasses =
        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
    } else if (value === "Not Recommended" || normalized === "NOT RECOMMENDED" || normalized === "NOT_RECOMMENDED") {
      badgeClasses =
        "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800";
    }
  } else if (type === "recommendationStatus") {
    switch (normalized) {
      case "COMPLETED":
        badgeClasses =
          "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
        break;
      case "PROCESSING":
        badgeClasses =
          "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 animate-pulse";
        break;
      case "PENDING":
        badgeClasses =
          "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
        break;
      case "FAILED":
        badgeClasses =
          "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800";
        break;
      default:
        badgeClasses = "bg-muted text-muted-foreground border-border";
    }
  } else if (type === "profileStatus") {
    switch (normalized) {
      case "SHORTLISTED":
        badgeClasses =
          "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
        break;
      case "REJECTED":
        badgeClasses =
          "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800";
        break;
      case "SUBMITTED":
      default:
        badgeClasses =
          "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
        break;
    }
  } else if (type === "openingStatus") {
    switch (normalized) {
      case "ACTIVE":
        badgeClasses =
          "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
        break;
      case "CLOSED":
        badgeClasses =
          "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
        break;
      case "DRAFT":
      default:
        badgeClasses =
          "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
        break;
    }
  }

  // Mapping human product copy for AI recommendation states
  let displayText = typeof value === "string" ? value.replace(/_/g, " ") : String(value);

  if (type === "recommendationStatus") {
    switch (normalized) {
      case "PENDING":
        displayText = "Analysis queued";
        break;
      case "PROCESSING":
        displayText = "Analyzing candidate";
        break;
      case "COMPLETED":
        displayText = "Analysis complete";
        break;
      case "FAILED":
        displayText = "Analysis failed";
        break;
      default:
        break;
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-medium border ${badgeClasses} ${className}`}
    >
      {displayText}
    </span>
  );
}
