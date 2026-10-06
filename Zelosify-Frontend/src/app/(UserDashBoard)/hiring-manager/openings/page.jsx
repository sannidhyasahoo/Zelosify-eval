"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  MapPin,
  Clock,
  Users,
  ChevronRight,
  Search,
} from "lucide-react";
import { getHiringManagerOpenings } from "@/lib/api/recruitmentApi";
import StatusBadge from "@/components/recruitment/StatusBadge";
import PageHeader from "@/components/recruitment/PageHeader";
import LoadingSkeleton from "@/components/recruitment/LoadingSkeleton";
import ErrorState from "@/components/recruitment/ErrorState";
import EmptyState from "@/components/recruitment/EmptyState";
import PaginationControls from "@/components/recruitment/PaginationControls";
import { Input } from "@/components/UI/shadcn/input";

export default function HiringManagerOpeningsPage() {
  const router = useRouter();
  const [openings, setOpenings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadOpenings = useCallback(async (page = 1, search = "") => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getHiringManagerOpenings({
        page,
        limit: 10,
        search: search.trim() || undefined,
      });
      setOpenings(response.data || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (err) {
      console.error("[HiringManagerOpenings] Error loading openings:", err);
      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to load your assigned openings."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOpenings(1, searchQuery);
  }, [loadOpenings]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadOpenings(1, searchQuery);
  };

  const handlePageChange = (newPage) => {
    loadOpenings(newPage, searchQuery);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
      <PageHeader
        title="My Openings"
        description="Review candidate submissions and make informed contract hiring decisions."
      >
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mt-2">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Filter by title, skill, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </form>
          <div className="text-xs text-muted-foreground font-mono">
            {pagination.total} {pagination.total === 1 ? "opening" : "openings"} active in queue
          </div>
        </div>
      </PageHeader>

      {/* Content Area */}
      {isLoading ? (
        <LoadingSkeleton type="table" count={6} />
      ) : error ? (
        <ErrorState
          title="Failed to Load Openings"
          message={error}
          onRetry={() => loadOpenings(pagination.page, searchQuery)}
        />
      ) : openings.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No open roles in queue"
          description={
            searchQuery
              ? `No openings matched "${searchQuery}".`
              : "You do not have any job openings currently assigned to your manager account."
          }
          actionLabel={searchQuery ? "Clear Filter" : undefined}
          onAction={
            searchQuery
              ? () => {
                  setSearchQuery("");
                  loadOpenings(1, "");
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="rounded-card border border-border/80 bg-card shadow-key overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/40 border-b border-border/70 text-muted-foreground font-medium">
                    <th className="py-3 px-4 font-mono text-[11px] uppercase tracking-wider">Role</th>
                    <th className="py-3 px-4 font-mono text-[11px] uppercase tracking-wider">Location</th>
                    <th className="py-3 px-4 font-mono text-[11px] uppercase tracking-wider">Experience</th>
                    <th className="py-3 px-4 font-mono text-[11px] uppercase tracking-wider">Contract Type</th>
                    <th className="py-3 px-4 text-center font-mono text-[11px] uppercase tracking-wider">Candidates</th>
                    <th className="py-3 px-4 font-mono text-[11px] uppercase tracking-wider">Status</th>
                    <th className="py-3 px-4 text-right font-mono text-[11px] uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {openings.map((opening) => (
                    <tr
                      key={opening.id}
                      className="hover:bg-muted/30 transition-colors group cursor-pointer"
                      onClick={() => {
                        router.push(`/hiring-manager/openings/${opening.id}`);
                      }}
                    >
                      <td className="py-3.5 px-4 font-semibold text-foreground group-hover:text-white transition-colors">
                        <div className="max-w-xs truncate">{opening.title}</div>
                        {Array.isArray(opening.requiredSkills) && opening.requiredSkills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {opening.requiredSkills.slice(0, 3).map((s, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground border border-border/50"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span>{opening.location || "Remote"}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap font-mono">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {opening.experienceMin ?? 0} - {opening.experienceMax ?? 5}+ yrs
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[11px] bg-muted/60 border border-border/60">
                          {opening.contractType || "Contract"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-muted text-foreground border border-border">
                          <Users className="w-3 h-3 text-muted-foreground" />
                          <span>{opening.profilesCount ?? 0}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge type="openingStatus" value={opening.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/hiring-manager/openings/${opening.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center text-xs font-medium text-foreground hover:text-white transition-colors gap-1"
                        >
                          <span>Review</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <PaginationControls
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
