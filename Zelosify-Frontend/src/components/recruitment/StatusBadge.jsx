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
      badgeClasses = "bg-[#59d499]/10 text-[#59d499] border-[#59d499]/30";
    } else if (value === "Borderline" || normalized === "BORDERLINE") {
      badgeClasses = "bg-[#f5b94a]/10 text-[#f5b94a] border-[#f5b94a]/30";
    } else if (value === "Not Recommended" || normalized === "NOT RECOMMENDED" || normalized === "NOT_RECOMMENDED") {
      badgeClasses = "bg-coral/10 text-coral border-coral/30";
    }
  } else if (type === "recommendationStatus") {
    switch (normalized) {
      case "COMPLETED":
        badgeClasses = "bg-[#59d499]/10 text-[#59d499] border-[#59d499]/30";
        break;
      case "PROCESSING":
        badgeClasses = "bg-[#56c2ff]/10 text-[#56c2ff] border-[#56c2ff]/30 animate-pulse";
        break;
      case "PENDING":
        badgeClasses = "bg-white/[0.04] text-muted-foreground border-border/70";
        break;
      case "FAILED":
        badgeClasses = "bg-coral/10 text-coral border-coral/30";
        break;
      default:
        badgeClasses = "bg-white/[0.04] text-muted-foreground border-border/70";
    }
  } else if (type === "profileStatus") {
    switch (normalized) {
      case "SHORTLISTED":
        badgeClasses = "bg-[#59d499]/10 text-[#59d499] border-[#59d499]/30";
        break;
      case "REJECTED":
        badgeClasses = "bg-coral/10 text-coral border-coral/30";
        break;
      case "SUBMITTED":
      default:
        badgeClasses = "bg-white/[0.04] text-muted-foreground border-border/70";
        break;
    }
  } else if (type === "openingStatus") {
    switch (normalized) {
      case "ACTIVE":
        badgeClasses = "bg-[#59d499]/10 text-[#59d499] border-[#59d499]/30";
        break;
      case "CLOSED":
        badgeClasses = "bg-white/[0.03] text-muted-foreground/80 border-border/50";
        break;
      case "DRAFT":
      default:
        badgeClasses = "bg-[#f5b94a]/10 text-[#f5b94a] border-[#f5b94a]/30";
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
      className={`inline-flex items-center px-2 py-0.5 rounded-[6px] text-[11px] font-medium border ${badgeClasses} ${className}`}
    >
      {displayText}
    </span>
  );
}
