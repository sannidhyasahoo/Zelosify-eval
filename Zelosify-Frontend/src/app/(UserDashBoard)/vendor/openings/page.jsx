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
  Filter,
} from "lucide-react";
import { getVendorOpenings } from "@/lib/api/recruitmentApi";
import StatusBadge from "@/components/recruitment/StatusBadge";
import PageHeader from "@/components/recruitment/PageHeader";
import LoadingSkeleton from "@/components/recruitment/LoadingSkeleton";
import ErrorState from "@/components/recruitment/ErrorState";
import EmptyState from "@/components/recruitment/EmptyState";
import PaginationControls from "@/components/recruitment/PaginationControls";
import VirtualList from "@/components/recruitment/VirtualList";
import { Input } from "@/components/UI/shadcn/input";

export default function VendorOpeningsPage() {
  const router = useRouter();
  const [openings, setOpenings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 9 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadOpenings = useCallback(async (page = 1, search = "") => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getVendorOpenings({
        page,
        limit: 9,
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
          "Failed to load job openings. Please try again."
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
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <PageHeader
        title="Job Openings"
        description="Browse active requirements and submit qualified candidate profiles."
      >
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mt-2">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by title, skill, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </form>
          <div className="text-xs text-muted-foreground">
            {pagination.total} {pagination.total === 1 ? "opening" : "openings"} available
          </div>
        </div>
      </PageHeader>

      {/* Main Content Area */}
      {isLoading ? (
        <LoadingSkeleton type="cards" count={6} />
      ) : error ? (
        <ErrorState
          title="Could not load openings"
          message={error}
          onRetry={() => loadOpenings(pagination.page, searchQuery)}
        />
      ) : openings.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No open positions available"
          description={
            searchQuery
              ? `No openings matched your search "${searchQuery}". Try clearing filters.`
              : "There are currently no active job openings assigned to your organization."
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
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {openings.map((opening) => (
              <Link
                key={opening.id}
                href={`/vendor/openings/${opening.id}`}
                className="group block p-5 rounded-lg border border-border bg-card hover:border-foreground/30 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex justify-between items-start gap-2 mb-2.5">
                  <h3 className="font-semibold text-base text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                    {opening.title}
                  </h3>
                  <StatusBadge type="openingStatus" value={opening.status} />
                </div>

                {opening.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                    {opening.description}
                  </p>
                )}

                {/* Metadata tags */}
                <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{opening.location || "Remote / Unspecified"}</span>
                    {opening.contractType && (
                      <span className="text-border">• {opening.contractType}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {opening.experienceMin ?? 0} - {opening.experienceMax ?? 5}+ yrs exp
                    </span>
                  </div>

                  {opening.hiringManager && (
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 shrink-0" />
                      <span>Manager: {opening.hiringManager.name || opening.hiringManager.email}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80 pt-1">
                    <Calendar className="w-3 h-3 shrink-0" />
                    <span>Posted {formatDate(opening.postedDate)}</span>
                  </div>
                </div>

                {/* Skills tags preview */}
                {Array.isArray(opening.requiredSkills) && opening.requiredSkills.length > 0 && (
                  <div className="pt-3 border-t border-border flex flex-wrap gap-1.5 items-center">
                    {opening.requiredSkills.slice(0, 4).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground"
                      >
                        {skill}
                      </span>
                    ))}
                    {opening.requiredSkills.length > 4 && (
                      <span className="text-[11px] text-muted-foreground font-medium">
                        +{opening.requiredSkills.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-4 pt-2 flex items-center justify-end text-xs font-medium text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                  <span>View Details & Upload</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </Link>
            ))}
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
