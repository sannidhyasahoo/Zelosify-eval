"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/UI/shadcn/dialog";
import ScoreBreakdown from "./ScoreBreakdown";
import { Cpu, Clock, CheckCircle2, Layers, ShieldCheck, Hash, Info } from "lucide-react";

export default function AgentTraceModal({
  isOpen,
  onClose,
  profile,
}) {
  if (!profile) return null;

  const metadata = profile.recommendationMetadata || {};
  const scores = metadata.scores;
  const tools = Array.isArray(metadata.tools) ? metadata.tools : [];
  const model = metadata.model || "Mock/Deterministic Engine";
  const tokenUsage = metadata.tokenUsage !== null && metadata.tokenUsage !== undefined
    ? `${metadata.tokenUsage.toLocaleString()} tokens`
    : "Not applicable (Deterministic)";
  const retryCount = metadata.retryCount ?? 0;
  const parsingLatency = metadata.parsingLatencyMs ?? 0;
  const matchingLatency = metadata.matchingLatencyMs ?? 0;
  const totalLatency = profile.recommendationLatencyMs ?? (parsingLatency + matchingLatency);
  const version = profile.recommendationVersion || "1.0.0";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Processing details
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Deterministic matching pipeline telemetry for {profile.originalFilename}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Subtle Explanatory Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-md bg-muted/60 text-xs text-muted-foreground border border-border">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-medium text-foreground">Secure Pipeline Verification</p>
              <p className="leading-relaxed">
                Candidate content is treated as untrusted input. Match scores are calculated using deterministic application rules.
              </p>
            </div>
          </div>

          {/* Score Breakdown Section */}
          {scores && (
            <div className="p-3.5 rounded-lg border border-border bg-card/60 space-y-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Score Components Breakdown
              </h4>
              <ScoreBreakdown scores={scores} />
            </div>
          )}

          {/* Safe Metadata Grid */}
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-md border border-border bg-card/60 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Cpu className="w-3.5 h-3.5" />
                <span className="font-medium">Model</span>
              </div>
              <p className="font-semibold text-foreground truncate">{model}</p>
            </div>

            <div className="p-3 rounded-md border border-border bg-card/60 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Hash className="w-3.5 h-3.5" />
                <span className="font-medium">Token Usage</span>
              </div>
              <p className="font-semibold text-foreground">{tokenUsage}</p>
            </div>

            <div className="p-3 rounded-md border border-border bg-card/60 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-medium">Processing Time</span>
              </div>
              <p className="font-semibold text-foreground">{totalLatency} ms</p>
            </div>

            <div className="p-3 rounded-md border border-border bg-card/60 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Layers className="w-3.5 h-3.5" />
                <span className="font-medium">Version</span>
              </div>
              <p className="font-semibold text-foreground font-mono">v{version}</p>
            </div>
          </div>

          {/* Pipeline Stage Breakdown */}
          <div className="p-3.5 rounded-lg border border-border bg-card/60 space-y-2 text-xs">
            <h4 className="font-semibold text-foreground mb-1">
              Execution Stages
            </h4>
            <div className="flex justify-between py-1 border-b border-border/60">
              <span className="text-muted-foreground">Resume processing & text extraction</span>
              <span className="font-medium text-foreground">{parsingLatency} ms</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/60">
              <span className="text-muted-foreground">Feature extraction & normalization</span>
              <span className="font-medium text-foreground">Completed</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/60">
              <span className="text-muted-foreground">Deterministic match calculation</span>
              <span className="font-medium text-foreground">{matchingLatency} ms</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Retry count</span>
              <span className="font-medium text-foreground">
                {retryCount} {retryCount === 1 ? "retry" : "retries"}
              </span>
            </div>
          </div>

          {/* Tools Telemetry */}
          {tools.length > 0 && (
            <div className="p-3.5 rounded-lg border border-border bg-card/60 space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Verification Tools Executed ({tools.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {tools.map((toolName, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-muted text-foreground text-xs font-mono border border-border"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    {toolName}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
