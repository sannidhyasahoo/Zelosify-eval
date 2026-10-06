"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/UI/shadcn/button";

export default function ErrorState({
  title = "Failed to load data",
  message = "An error occurred while communicating with the server. Please check your connection and try again.",
  onRetry,
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-8 text-center my-6 max-w-lg mx-auto">
      <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6">{message}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          className="inline-flex items-center gap-2 border-border"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}
