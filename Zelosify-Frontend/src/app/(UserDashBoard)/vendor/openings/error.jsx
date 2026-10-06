"use client";

import React, { useEffect } from "react";
import ErrorState from "@/components/recruitment/ErrorState";

export default function VendorOpeningsError({ error, reset }) {
  useEffect(() => {
    console.error("[VendorOpenings] Error boundary caught error:", error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-12 max-w-xl">
      <ErrorState
        title="Something went wrong"
        message={error?.message || "An unexpected error occurred while loading vendor openings."}
        onRetry={() => reset()}
      />
    </div>
  );
}
