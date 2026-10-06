"use client";

import React from "react";
import Link from "next/link";
import useAuth from "@/hooks/Auth/useAuth";
import {
  Briefcase,
  ShieldCheck,
  CreditCard,
  ArrowRight,
  Cpu,
  Clock,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/UI/shadcn/button";

export default function HomeLayout() {
  const { user, getDisplayName } = useAuth();
  const displayName = getDisplayName() || user?.email || "User";
  const role = user?.role || "WORKSPACE_USER";
  const companyName = user?.tenant?.companyName || user?.companyName || "Bruce Wayne Corp";

  const isVendor = role === "IT_VENDOR";
  const isHiringManager = role === "HIRING_MANAGER";

  return (
    <div className="page-shell space-y-8 animate-in fade-up duration-200">
      {/* Top Banner / Welcome */}
      <div className="rounded-card border border-border/80 bg-card p-6 shadow-key relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-muted/60 border border-border/70 text-[11px] font-mono text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-[#59d499]"></span>
              <span>{companyName} Workspace</span>
            </div>
            <h1 className="page-title text-xl sm:text-2xl font-semibold">
              Welcome back, {displayName}
            </h1>
            <p className="page-subtitle text-xs sm:text-sm">
              Role: <span className="font-mono text-foreground font-medium">{role.replace(/_/g, " ")}</span> • Multi-tenant isolation active
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isVendor ? (
              <Button asChild size="sm" className="gap-2 text-xs">
                <Link href="/vendor/openings">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Openings Queue</span>
                </Link>
              </Button>
            ) : isHiringManager ? (
              <Button asChild size="sm" className="gap-2 text-xs">
                <Link href="/hiring-manager/openings">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Review Openings</span>
                </Link>
              </Button>
            ) : (
              <Button asChild size="sm" className="gap-2 text-xs">
                <Link href="/hiring-manager/openings">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>View Openings</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="space-y-3">
        <h2 className="eyebrow">Workspace Navigation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1 */}
          <Link
            href={isVendor ? "/vendor/openings" : "/hiring-manager/openings"}
            className="group rounded-card border border-border/70 bg-card p-5 shadow-key transition-all duration-200 hover:border-border hover:bg-muted/40 hover:shadow-key-hover block"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-border/70 flex items-center justify-center text-foreground group-hover:border-coral/50 transition-colors">
                <Briefcase className="w-4 h-4 text-coral" />
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              {isVendor ? "Contract Openings" : "My Assigned Openings"}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              {isVendor
                ? "Browse open requisition roles and upload candidate resumes directly to encrypted storage."
                : "Review candidate profiles, evaluate match breakdowns, and make shortlist/reject decisions."}
            </p>
          </Link>

          {/* Card 2 */}
          {isVendor ? (
            <Link
              href="/vendor/payments"
              className="group rounded-card border border-border/70 bg-card p-5 shadow-key transition-all duration-200 hover:border-border hover:bg-muted/40 hover:shadow-key-hover block"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-border/70 flex items-center justify-center text-foreground group-hover:border-border transition-colors">
                  <CreditCard className="w-4 h-4 text-[#56c2ff]" />
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                Payments & Statements
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Track authorized contract purchase orders, billing cycles, and invoice statuses.
              </p>
            </Link>
          ) : (
            <div className="rounded-card border border-border/70 bg-card p-5 shadow-key">
              <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-border/70 flex items-center justify-center text-foreground mb-3">
                <ShieldCheck className="w-4 h-4 text-[#59d499]" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                Role Isolation & RBAC
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Hiring manager access is strictly bounded to assigned department requisitions.
              </p>
            </div>
          )}

          {/* Card 3: Security & Telemetry */}
          <div className="rounded-card border border-border/70 bg-card p-5 shadow-key">
            <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-border/70 flex items-center justify-center text-foreground mb-3">
              <Cpu className="w-4 h-4 text-[#59d499]" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              Deterministic Matching Engine
            </h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Authoritative threshold policy: Recommended ≥ 0.75, Borderline 0.50–0.749.
            </p>
          </div>
        </div>
      </div>

      {/* System Telemetry Row */}
      <div className="rounded-card border border-border/70 bg-card/60 p-4 shadow-key text-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-border/60">
          <div className="pt-2 md:pt-0 md:px-3">
            <span className="text-muted-foreground text-[11px]">Storage Engine</span>
            <p className="font-mono font-medium text-foreground mt-0.5">S3 Direct (Encrypted)</p>
          </div>
          <div className="pt-2 md:pt-0 md:px-3">
            <span className="text-muted-foreground text-[11px]">Matching Policy</span>
            <p className="font-mono font-medium text-foreground mt-0.5">Rule-Based ≥ 0.75</p>
          </div>
          <div className="pt-2 md:pt-0 md:px-3">
            <span className="text-muted-foreground text-[11px]">Auth Protocol</span>
            <p className="font-mono font-medium text-foreground mt-0.5">Keycloak + TOTP 2FA</p>
          </div>
          <div className="pt-2 md:pt-0 md:px-3">
            <span className="text-muted-foreground text-[11px]">Tenant Domain</span>
            <p className="font-mono font-medium text-[#59d499] mt-0.5">Isolated Multi-Tenant</p>
          </div>
        </div>
      </div>
    </div>
  );
}
