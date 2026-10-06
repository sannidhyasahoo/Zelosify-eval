"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("[Zelosify Global Root Error]:", error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#040506] text-white flex flex-col items-center justify-center p-4 selection:bg-[#ff6363]/30 font-sans antialiased">
        <div className="w-full max-w-md rounded-xl border border-[#2f3031] bg-[#111214] p-8 text-center shadow-2xl space-y-4">
          <div className="mx-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#ff6363]/10 border border-[#ff6363]/30 text-[11px] font-mono text-[#ff6363]">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Root Exception</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white">
            System recovery required
          </h1>
          <p className="text-xs text-[#9c9c9d] leading-relaxed">
            {error?.message ||
              "A critical initialization error occurred. Please refresh or return to the workspace."}
          </p>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => reset()}
              className="inline-flex items-center gap-1.5 text-xs font-medium bg-[#e6e6e6] text-[#07080a] hover:bg-white px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
            <a
              href="/login"
              className="inline-flex items-center text-xs font-medium text-[#9c9c9d] hover:text-white px-4 py-2 rounded-lg border border-[#2f3031] bg-[#07080a] transition-colors"
            >
              Back to Sign In
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
