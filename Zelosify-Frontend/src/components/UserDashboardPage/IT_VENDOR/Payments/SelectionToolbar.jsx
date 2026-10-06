"use client";

import { Printer, Upload, X } from "lucide-react";
import { Button } from "@/components/UI/shadcn/button";

export default function SelectionToolbar({
  selectedCount,
  onExport,
  onPrint,
  onClear,
}) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 rounded-card border border-border/80 bg-card/90 backdrop-blur-xl px-4 py-2 shadow-float flex items-center gap-3 animate-in fade-up duration-200">
      <div className="flex items-center gap-2 pr-2 border-r border-border/60">
        <span className="w-2 h-2 rounded-full bg-coral animate-pulse" />
        <span className="text-xs font-mono font-medium text-foreground">
          {selectedCount} selected
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onExport}
        className="h-7 text-xs gap-1.5"
      >
        <Upload className="h-3 w-3" /> Export CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onPrint}
        className="h-7 text-xs gap-1.5"
      >
        <Printer className="h-3 w-3" /> Print
      </Button>
      {onClear && (
        <button
          onClick={onClear}
          className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
          title="Clear selection"
          aria-label="Clear selection"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
