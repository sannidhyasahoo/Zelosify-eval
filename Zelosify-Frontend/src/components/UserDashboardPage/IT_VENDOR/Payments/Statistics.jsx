"use client";

import { ArrowRight } from "lucide-react";

export default function Statistics({ setIsSidebarVisible }) {
  return (
    <div className="w-80 shrink-0 p-4 border-l border-border bg-card/60">
      <div className="space-y-6">
        {/* TOTAL BILL PAYABLE */}
        <div className="text-center">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Financial Telemetry
              </span>
              <button
                onClick={() => setIsSidebarVisible(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close sidebar"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col items-left justify-between mb-4">
              <h3 className="text-sm font-semibold text-left text-foreground">
                Total Authorized Spend
              </h3>
              <span className="text-xs text-muted-foreground text-left mt-0.5">
                Current Quarter
              </span>
            </div>
          </div>
          <div className="relative inline-block my-2">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="7"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="#59d499"
                strokeWidth="7"
                strokeDasharray="351"
                strokeDashoffset="87"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold font-mono text-foreground">
                $2.2m
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                242 contracts
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-border/60 bg-muted/30">
          <div>
            <span className="text-sm font-semibold font-mono text-foreground">
              $864,600
            </span>
            <p className="text-[11px] text-muted-foreground">Settled</p>
          </div>
          <div>
            <span className="text-sm font-semibold font-mono text-foreground">
              $1.34m
            </span>
            <p className="text-[11px] text-muted-foreground">Active</p>
          </div>
        </div>

        {/* Total Budget */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Budget Utilization
            </h4>
          </div>
          <div className="space-y-2">
            <div className="w-full h-1.5 flex rounded-full overflow-hidden bg-muted">
              <div
                className="bg-[#59d499] h-full"
                style={{ width: "89%" }}
              ></div>
              <div
                className="bg-white/[0.15] h-full"
                style={{ width: "11%" }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#59d499]" />
                <span className="text-muted-foreground">Committed</span>
              </div>
              <span className="font-mono text-foreground font-medium">89%</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-white/[0.2]" />
                <span className="text-muted-foreground">Available</span>
              </div>
              <span className="font-mono text-foreground font-medium">11%</span>
            </div>
          </div>
        </div>

        {/* Overview */}
        <div className="space-y-2.5 pt-2 border-t border-border/60 text-xs">
          <h4 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Contract Metrics
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg border border-border/50 bg-muted/20">
              <span className="text-xs font-semibold font-mono text-foreground">
                $2,246
              </span>
              <p className="text-[10px] text-muted-foreground">Avg Value</p>
            </div>
            <div className="p-2.5 rounded-lg border border-border/50 bg-muted/20">
              <span className="text-xs font-semibold font-mono text-foreground">
                0.3%
              </span>
              <p className="text-[10px] text-muted-foreground">Variance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
