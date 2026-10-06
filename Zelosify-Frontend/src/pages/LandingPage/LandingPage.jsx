"use client";

import React from "react";
import Link from "next/link";
import LandingNavbar from "@/components/LandingPage/navbar/LandingNavbar";
import {
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Clock,
  ArrowRight,
  Sparkles,
  Lock,
  Layers,
  ChevronRight,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#040506] text-white selection:bg-[#ff6363]/30 selection:text-white font-sans antialiased overflow-x-hidden">
      {/* Top Navigation */}
      <LandingNavbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headline & Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#111214] border border-[#2f3031] text-[11px] font-mono text-[#9c9c9d]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff6363] animate-pulse"></span>
              <span>Intelligent Contract Workforce Review</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-white leading-[1.15]">
              Better contract hiring decisions, without adding more hiring overhead.
            </h1>

            <p className="text-base sm:text-lg text-[#9c9c9d] font-normal leading-relaxed max-w-xl">
              Zelosify gives vendors a secure workspace to submit candidates and helps hiring teams review every profile with consistent, explainable matching.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-medium bg-[#e6e6e6] text-[#07080a] hover:bg-white px-5 py-2.5 rounded transition-all shadow-sm group"
              >
                <span>Get started</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center text-sm font-medium text-[#9c9c9d] hover:text-white px-4 py-2.5 rounded border border-[#2f3031] hover:border-[#454647] bg-[#07080a] transition-colors"
              >
                Sign in
              </Link>
            </div>

            <div className="pt-4 flex items-center gap-6 text-xs text-[#6a6b6c]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#59d499]" />
                Zero setup overhead
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#59d499]" />
                Role-isolated portals
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#59d499]" />
                Deterministic scoring
              </span>
            </div>
          </div>

          {/* Right Column: Authentic Product-Preview Mockup */}
          <div className="lg:col-span-5">
            <div className="relative rounded-xl border border-[#2f3031] bg-[#07080a] p-5 shadow-2xl space-y-4">
              {/* Window Chrome / Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#1b1c1e]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#2f3031]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#2f3031]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#2f3031]"></div>
                </div>
                <div className="text-[11px] font-mono text-[#6a6b6c]">
                  candidate_review.tsx
                </div>
              </div>

              {/* Candidate File Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-[#111214] border border-[#2f3031] flex items-center justify-center text-[#e6e6e6]">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white truncate max-w-[200px]">
                      Sarah_Chen_Principal_React_Engineer.pdf
                    </h3>
                    <p className="text-[10px] text-[#6a6b6c] flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      Submitted today • Senior Fullstack Opening
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#59d499]/10 text-[#59d499] border border-[#59d499]/20">
                  Recommended
                </span>
              </div>

              {/* AI Recommendation Summary Block */}
              <div className="rounded-lg bg-[#111214] border border-[#1b1c1e] p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#9c9c9d]">
                    <Sparkles className="w-3 h-3 text-[#ff6363]" />
                    <span>AI Match Intelligence</span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-white">88%</span>
                    <span className="text-[10px] text-[#6a6b6c] ml-1">Match Score</span>
                  </div>
                </div>

                {/* Score Breakdown Bars */}
                <div className="space-y-2 pt-1 text-[11px]">
                  <div>
                    <div className="flex justify-between text-[#9c9c9d] mb-1">
                      <span>Skills Match</span>
                      <span className="font-mono text-white">92%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#1b1c1e] rounded-full overflow-hidden">
                      <div className="h-full bg-[#59d499] rounded-full w-[92%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[#9c9c9d] mb-1">
                      <span>Experience Verification</span>
                      <span className="font-mono text-white">85%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#1b1c1e] rounded-full overflow-hidden">
                      <div className="h-full bg-[#59d499] rounded-full w-[85%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[#9c9c9d] mb-1">
                      <span>Location Alignment</span>
                      <span className="font-mono text-white">80%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#1b1c1e] rounded-full overflow-hidden">
                      <div className="h-full bg-[#56c2ff] rounded-full w-[80%]"></div>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-[#9c9c9d] leading-relaxed border-t border-[#1b1c1e] pt-2">
                  "Exceeds core frontend architecture requirements with 8+ years hands-on React and TypeScript systems experience."
                </p>
              </div>

              {/* Hiring Decision State */}
              <div className="pt-1 flex items-center justify-between text-xs">
                <span className="text-[#6a6b6c]">Current Decision:</span>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#59d499]/10 text-[#59d499] border border-[#59d499]/20 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Shortlisted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Polished Capability Sections */}
      <section id="capabilities" className="py-20 border-t border-[#1b1c1e] bg-[#07080a]/60 px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="max-w-xl">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#ff6363] mb-2">
              Core Platform Capabilities
            </h2>
            <p className="text-2xl sm:text-3xl font-normal text-white tracking-tight">
              Built for precision contracting workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Capability A */}
            <div id="workflow" className="p-6 rounded-xl border border-[#2f3031] bg-[#07080a] space-y-4 hover:border-[#454647] transition-colors">
              <div className="w-10 h-10 rounded-lg bg-[#111214] border border-[#2f3031] flex items-center justify-center text-white">
                <Briefcase className="w-5 h-5 text-[#e6e6e6]" />
              </div>
              <h3 className="text-base font-semibold text-white">
                Unified vendor and hiring workflow
              </h3>
              <p className="text-xs sm:text-sm text-[#9c9c9d] leading-relaxed">
                Vendors submit candidate resumes directly into encrypted storage. Hiring managers receive profiles in an organized operational review queue without email attachments.
              </p>
            </div>

            {/* Capability B */}
            <div className="p-6 rounded-xl border border-[#2f3031] bg-[#07080a] space-y-4 hover:border-[#454647] transition-colors">
              <div className="w-10 h-10 rounded-lg bg-[#111214] border border-[#2f3031] flex items-center justify-center text-white">
                <Sparkles className="w-5 h-5 text-[#ff6363]" />
              </div>
              <h3 className="text-base font-semibold text-white">
                Explainable candidate matching
              </h3>
              <p className="text-xs sm:text-sm text-[#9c9c9d] leading-relaxed">
                Every recommendation provides transparent matching scores across skills, verified experience, and location with complete score breakdown telemetry.
              </p>
            </div>

            {/* Capability C */}
            <div id="security" className="p-6 rounded-xl border border-[#2f3031] bg-[#07080a] space-y-4 hover:border-[#454647] transition-colors">
              <div className="w-10 h-10 rounded-lg bg-[#111214] border border-[#2f3031] flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5 text-[#59d499]" />
              </div>
              <h3 className="text-base font-semibold text-white">
                Security & role isolation
              </h3>
              <p className="text-xs sm:text-sm text-[#9c9c9d] leading-relaxed">
                Strict multi-tenant boundaries ensure vendors only see their own submissions. Recommendation scores and reasoning are strictly guarded for hiring managers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-10 border-t border-[#1b1c1e] px-4 text-xs text-[#6a6b6c]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-white">Zelosify</span>
            <span>•</span>
            <span>Enterprise Contractor Decision Workspace</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-white transition-colors">
              Sign In
            </Link>
            <span>•</span>
            <span className="font-mono text-[11px]">v1.0.0 Production</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
