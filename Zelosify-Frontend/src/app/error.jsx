"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/UI/shadcn/button";

export default function ErrorBoundary({ error, reset }) {
  const router = useRouter();

  useEffect(() => {
    console.error("[Zelosify Global Error]:", error);
  }, [error]);

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col relative overflow-hidden selection:bg-coral/30 selection:text-white">
      {/* Atmosphere glow */}
      <div className="pointer-events-none absolute inset-0 bg-hero-glow opacity-50" />

      {/* Header */}
      <header className="relative z-10 py-5 px-6 border-b border-border/80 bg-background/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/assets/logos/main-logo.png"
              alt="Zelosify"
              className="h-7 w-auto object-contain"
            />
          </Link>
          <span className="font-mono text-[11px] text-coral uppercase tracking-wider">
            System Fault
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-grow flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-card-lg border border-border/80 bg-card p-8 text-center shadow-float">
          <div className="mx-auto mb-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-coral/10 border border-coral/30 text-[11px] font-mono text-coral">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Unexpected Application State</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            An error occurred
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {error?.message || "An unexpected error occurred during data processing. Your session remains secure."}
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            {reset && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => reset()}
                className="gap-1.5 text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Action</span>
              </Button>
            )}
            <Button
              variant="default"
              size="sm"
              onClick={() => router.push("/")}
              className="gap-1.5 text-xs"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Workspace Home</span>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 px-6 border-t border-border/80 bg-background/60 text-center font-mono text-[11px] text-muted-foreground">
        © {new Date().getFullYear()} Zelosify. All rights reserved.
      </footer>
    </div>
  );
}
