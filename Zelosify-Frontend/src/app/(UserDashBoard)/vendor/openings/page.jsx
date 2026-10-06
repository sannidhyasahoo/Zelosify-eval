"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  MapPin,
  Calendar,
  Clock,
  User,
  ChevronRight,
  Search,
} from "lucide-react";
import { getVendorOpenings } from "@/lib/api/recruitmentApi";
import StatusBadge from "@/components/recruitment/StatusBadge";
import PageHeader from "@/components/recruitment/PageHeader";
import LoadingSkeleton from "@/components/recruitment/LoadingSkeleton";
import ErrorState from "@/components/recruitment/ErrorState";
import EmptyState from "@/components/recruitment/EmptyState";
import PaginationControls from "@/components/recruitment/PaginationControls";
import { Input } from "@/components/UI/shadcn/input";

export default function VendorOpeningsPage() {
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
      const response = await getVendorOpenings({
        page,
        limit: 10,
        search: search.trim() || undefined,
      });
      setOpenings(response.data || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (err) {
      console.error("[VendorOpenings] Error loading openings:", err);
      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to load contract openings. Please try again."
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

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
      <PageHeader
        title="Contract Openings"
        description="Find active roles and submit candidates for review."
      >
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mt-2">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by role, skill, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </form>
          <div className="text-xs text-muted-foreground font-mono">
            {pagination.total} {pagination.total === 1 ? "opening" : "openings"} available
          </div>
        </div>
      </PageHeader>

      {/* Main Content Area */}
      {isLoading ? (
        <LoadingSkeleton type="table" count={6} />
      ) : error ? (
        <ErrorState
          title="Could not load contract openings"
          message={error}
          onRetry={() => loadOpenings(pagination.page, searchQuery)}
        />
      ) : openings.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No open positions available"
          description={
            searchQuery
              ? `No openings matched "${searchQuery}". Try clearing your search.`
              : "There are currently no active contract openings available."
          }
          actionLabel={searchQuery ? "Clear Search" : undefined}
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
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Experience</th>
                    <th className="py-3 px-4">Contract Type</th>
                    <th className="py-3 px-4">Hiring Manager</th>
                    <th className="py-3 px-4">Posted Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {openings.map((opening) => (
                    <tr
                      key={opening.id}
                      className="hover:bg-muted/20 transition-colors group cursor-pointer"
                      onClick={() => {
                        router.push(`/vendor/openings/${opening.id}`);
                      }}
                    >
                      <td className="py-3.5 px-4 font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        <div className="max-w-xs truncate">{opening.title}</div>
                        {Array.isArray(opening.requiredSkills) && opening.requiredSkills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {opening.requiredSkills.slice(0, 3).map((s, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.2 rounded text-[10px] font-normal bg-muted text-muted-foreground border border-border/50"
                              >
                                {s}
                              </span>
                            ))}
                            {opening.requiredSkills.length > 3 && (
                              <span className="text-[10px] text-muted-foreground">
                                +{opening.requiredSkills.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span>{opening.location || "Remote"}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
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
                      <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[150px]">
                            {opening.hiringManager?.name ||
                              opening.hiringManager?.email ||
                              "Hiring Team"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap font-mono text-[11px]">
                        {formatDate(opening.postedDate)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/vendor/openings/${opening.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center text-xs font-medium text-foreground hover:text-blue-600 dark:hover:text-blue-400 gap-1 group-hover:translate-x-0.5 transition-all"
                        >
                          <span>View Role</span>
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
