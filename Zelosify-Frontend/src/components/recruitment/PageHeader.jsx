"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function PageHeader({
  title,
  description,
  backHref,
  backLabel = "Back",
  actions,
  children,
}) {
  return (
    <div className="mb-6 pb-4 border-b border-border">
      {backHref && (
        <div className="mb-3">
          <Link
            href={backHref}
            className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            {backLabel}
          </Link>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2.5">{actions}</div>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
