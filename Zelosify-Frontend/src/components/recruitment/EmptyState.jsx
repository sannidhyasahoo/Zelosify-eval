"use client";

import React from "react";
import { FolderOpen } from "lucide-react";
import { Button } from "@/components/UI/shadcn/button";

export default function EmptyState({
  icon: Icon = FolderOpen,
  title = "No items found",
  description = "There are no records to display at this time.",
  actionLabel,
  onAction,
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/50 p-10 text-center my-6 max-w-md mx-auto">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 text-muted-foreground">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
