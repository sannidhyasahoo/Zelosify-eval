"use client";

import React from "react";

export function CardSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-lg border border-border bg-card animate-pulse space-y-4"
        >
          <div className="flex justify-between items-start">
            <div className="h-5 w-2/3 bg-muted rounded"></div>
            <div className="h-5 w-16 bg-muted rounded-full"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-muted rounded"></div>
            <div className="h-4 w-5/6 bg-muted rounded"></div>
          </div>
          <div className="pt-3 border-t border-border flex justify-between">
            <div className="h-4 w-20 bg-muted rounded"></div>
            <div className="h-4 w-24 bg-muted rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="w-full rounded-lg border border-border bg-card overflow-hidden">
      <div className="h-12 bg-muted/40 border-b border-border flex items-center px-4 gap-4 animate-pulse">
        <div className="h-4 w-1/4 bg-muted rounded"></div>
        <div className="h-4 w-1/4 bg-muted rounded"></div>
        <div className="h-4 w-1/4 bg-muted rounded"></div>
        <div className="h-4 w-1/4 bg-muted rounded"></div>
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-14 flex items-center px-4 gap-4 animate-pulse"
          >
            <div className="h-4 w-1/4 bg-muted rounded"></div>
            <div className="h-4 w-1/4 bg-muted rounded"></div>
            <div className="h-4 w-1/4 bg-muted rounded"></div>
            <div className="h-4 w-1/4 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="p-6 rounded-lg border border-border bg-card space-y-4">
        <div className="h-8 w-1/3 bg-muted rounded"></div>
        <div className="h-4 w-2/3 bg-muted rounded"></div>
        <div className="flex gap-4 pt-2">
          <div className="h-5 w-24 bg-muted rounded"></div>
          <div className="h-5 w-24 bg-muted rounded"></div>
          <div className="h-5 w-24 bg-muted rounded"></div>
        </div>
      </div>
      <div className="p-6 rounded-lg border border-border bg-card space-y-4">
        <div className="h-6 w-1/4 bg-muted rounded"></div>
        <div className="h-32 w-full bg-muted rounded"></div>
      </div>
    </div>
  );
}

export default function LoadingSkeleton({ type = "cards", count = 3 }) {
  if (type === "table") return <TableSkeleton rows={count} />;
  if (type === "detail") return <DetailSkeleton />;
  return <CardSkeleton count={count} />;
}
