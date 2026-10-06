"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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
        title="Assigned Openings"
        description="Review candidate profiles, AI match scores, and make shortlist/rejection decisions."
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
          <div className="text-xs text-muted-foreground">
            {pagination.total} {pagination.total === 1 ? "opening" : "openings"} assigned
          </div>
        </div>
      </PageHeader>

      {/* Content Area */}
      {isLoading ? (
        <LoadingSkeleton type="table" count={6} />
      ) : error ? (
        <ErrorState
          title="Failed to Load Assigned Openings"
          message={error}
          onRetry={() => loadOpenings(pagination.page, searchQuery)}
        />
      ) : openings.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No assigned openings"
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
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/40 border-b border-border text-muted-foreground font-medium">
                    <th className="py-3 px-4">Role Title</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Experience</th>
                    <th className="py-3 px-4">Opening Status</th>
                    <th className="py-3 px-4 text-center">Candidates</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {openings.map((opening) => (
                    <tr
                      key={opening.id}
                      className="hover:bg-muted/20 transition-colors group cursor-pointer"
                      onClick={() => {
                        window.location.href = `/hiring-manager/openings/${opening.id}`;
                      }}
                    >
                      <td className="py-3 px-4 font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        <div className="max-w-xs truncate">{opening.title}</div>
                        {opening.contractType && (
                          <span className="text-[11px] font-normal text-muted-foreground">
                            {opening.contractType}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span>{opening.location || "Remote"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {opening.experienceMin ?? 0} - {opening.experienceMax ?? 5}+ yrs
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge type="openingStatus" value={opening.status} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground border border-border">
                          <Users className="w-3 h-3 text-muted-foreground" />
                          {opening.profilesCount ?? 0}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/hiring-manager/openings/${opening.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline gap-0.5"
                        >
                          Review
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
