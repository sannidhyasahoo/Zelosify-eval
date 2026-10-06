"use client";

import React from "react";

/**
 * Score breakdown progress bars for skills, experience, and location matching.
 */
export default function ScoreBreakdown({ scores, className = "" }) {
  if (!scores) return null;

  const { skills = 0, experience = 0, location = 0 } = scores;

  // Values can be 0.0 - 1.0 or 0 - 100
  const formatPercent = (val) => {
    if (val === null || val === undefined) return 0;
    const num = Number(val);
    const normalized = num <= 1 ? Math.round(num * 100) : Math.round(num);
    return Math.min(100, Math.max(0, normalized));
  };

  const skillsPct = formatPercent(skills);
  const expPct = formatPercent(experience);
  const locPct = formatPercent(location);

  const items = [
    { label: "Skills", percent: skillsPct, color: "bg-blue-600 dark:bg-blue-500" },
    { label: "Experience", percent: expPct, color: "bg-emerald-600 dark:bg-emerald-500" },
    { label: "Location", percent: locPct, color: "bg-indigo-600 dark:bg-indigo-500" },
  ];

  return (
    <div className={`space-y-2.5 ${className}`}>
      {items.map(({ label, percent, color }) => (
        <div key={label} className="text-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="font-medium text-muted-foreground">{label}</span>
            <span className="font-semibold text-foreground">{percent}%</span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${color}`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
