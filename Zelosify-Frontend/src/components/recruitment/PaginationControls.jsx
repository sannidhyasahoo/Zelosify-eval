"use client";

import React from "react";
import { Button } from "@/components/UI/shadcn/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function PaginationControls({
  page = 1,
  totalPages = 1,
  total = 0,
  limit = 10,
  onPageChange,
  className = "",
}) {
  if (totalPages <= 1) return null;

  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  return (
    <div
      className={`flex items-center justify-between py-4 px-2 text-sm text-muted-foreground ${className}`}
    >
      <div>
        {total > 0 ? (
          <span>
            Showing <strong className="text-foreground">{startRecord}</strong> to{" "}
            <strong className="text-foreground">{endRecord}</strong> of{" "}
            <strong className="text-foreground">{total}</strong> results
          </span>
        ) : (
          <span>
            Page <strong className="text-foreground">{page}</strong> of{" "}
            <strong className="text-foreground">{totalPages}</strong>
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="border-border gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        <span className="text-xs px-2 font-medium">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="border-border gap-1"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
