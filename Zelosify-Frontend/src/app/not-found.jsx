"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/UI/shadcn/button";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col relative overflow-hidden selection:bg-coral/30 selection:text-white">
      {/* Atmosphere glow */}
      <div className="pointer-events-none absolute inset-0 bg-hero-glow opacity-50" />
      <div
        className="pointer-events-none absolute inset-0 bg-dots opacity-40"
        style={{
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 75%)",
        }}
      />

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
          <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
            Status: 404
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-grow flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-card-lg border border-border/80 bg-card p-8 text-center shadow-float">
          <div className="mx-auto mb-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-muted/60 border border-border/70 text-[11px] font-mono text-coral">
            <span className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" />
            <span>Resource Not Found</span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Page not found
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            The requested contract workspace or requisition route does not exist or may have been migrated.
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="gap-1.5 text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Go back</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => router.push("/")}
              className="gap-1.5 text-xs"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Dashboard Home</span>
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
