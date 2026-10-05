import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma before importing service
vi.mock("../../../src/config/prisma/prisma.js", () => ({
  default: {
    opening: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
    },
    hiringProfile: {
      findMany: vi.fn(),
    },
  },
}));

import prisma from "../../../src/config/prisma/prisma.js";
import { openingService } from "../../../src/services/opening/openingService.js";

describe("OpeningService - Multi-Tenant & Ownership Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: IT_VENDOR only gets openings from their tenant
  it("1. IT_VENDOR only queries and receives openings belonging to their tenant", async () => {
    const mockOpenings = [
      {
        id: "open-1",
        tenantId: "tenant-wayne",
        title: "React Engineer",
        status: "OPEN",
        hiringManager: { id: "mgr-1", firstName: "Lucius", lastName: "Fox" },
      },
    ];

    (prisma.opening.findMany as any).mockResolvedValueOnce(mockOpenings);
    (prisma.opening.count as any).mockResolvedValueOnce(1);

    const result = await openingService.getVendorOpenings("tenant-wayne", {
      page: 1,
      limit: 10,
    });

    expect(prisma.opening.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: "tenant-wayne",
          status: "OPEN",
        },
        skip: 0,
        take: 10,
      })
    );

    expect(prisma.opening.count).toHaveBeenCalledWith({
      where: {
        tenantId: "tenant-wayne",
        status: "OPEN",
      },
    });

    expect(result.openings).toEqual(mockOpenings);
    expect(result.pagination.total).toBe(1);
  });

  // Test 2: IT_VENDOR cannot fetch opening from another tenant
  it("2. IT_VENDOR cannot fetch opening from another tenant (returns null)", async () => {
    // Attempt to fetch opening-lex from tenant-wayne
    (prisma.opening.findFirst as any).mockResolvedValueOnce(null);

    const result = await openingService.getVendorOpeningById(
      "opening-lex",
      "tenant-wayne",
      "vendor-user-1"
    );

    // Database query explicitly enforces tenantId: "tenant-wayne"
    expect(prisma.opening.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "opening-lex",
          tenantId: "tenant-wayne",
        },
      })
    );

    expect(result).toBeNull();
  });

  // Test 3: Vendor opening detail only returns that vendor's uploaded profiles
  it("3. Vendor opening detail strictly queries and returns only that vendor's uploaded profiles", async () => {
    const mockOpeningWithProfiles = {
      id: "open-1",
      tenantId: "tenant-wayne",
      title: "Node.js Engineer",
      status: "OPEN",
      hiringManager: { id: "mgr-1", firstName: "Lucius", lastName: "Fox" },
      hiringProfiles: [
        {
          id: 101,
          openingId: "open-1",
          s3Key: "resumes/candidate-vendor1.pdf",
          originalFilename: "candidate-vendor1.pdf",
          uploadedBy: "vendor-user-1",
          submittedAt: new Date(),
          status: "SUBMITTED",
        },
      ],
    };

    (prisma.opening.findFirst as any).mockResolvedValueOnce(
      mockOpeningWithProfiles
    );

    const result = await openingService.getVendorOpeningById(
      "open-1",
      "tenant-wayne",
      "vendor-user-1"
    );

    expect(prisma.opening.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "open-1",
          tenantId: "tenant-wayne",
        },
        select: expect.objectContaining({
          hiringProfiles: {
            where: {
              uploadedBy: "vendor-user-1",
              isDeleted: false,
            },
            select: expect.any(Object),
            orderBy: {
              submittedAt: "desc",
            },
          },
        }),
      })
    );

    expect(result.profilesCount).toBe(1);
    expect(result.uploadedProfiles).toHaveLength(1);
    expect(result.uploadedProfiles[0].uploadedBy).toBe("vendor-user-1");
  });

  // Test 4: Hiring manager only gets openings assigned to their user ID
  it("4. Hiring manager only queries and receives openings assigned to their user ID", async () => {
    const mockOpenings = [
      {
        id: "open-1",
        tenantId: "tenant-wayne",
        title: "Full Stack Engineer",
        hiringManagerId: "mgr-lucius",
        status: "OPEN",
        _count: { hiringProfiles: 3 },
      },
    ];

    (prisma.opening.findMany as any).mockResolvedValueOnce(mockOpenings);
    (prisma.opening.count as any).mockResolvedValueOnce(1);

    const result = await openingService.getHiringManagerOpenings(
      "tenant-wayne",
      "mgr-lucius",
      { page: 1, limit: 10 }
    );

    expect(prisma.opening.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: "tenant-wayne",
          hiringManagerId: "mgr-lucius",
        },
      })
    );

    expect(prisma.opening.count).toHaveBeenCalledWith({
      where: {
        tenantId: "tenant-wayne",
        hiringManagerId: "mgr-lucius",
      },
    });

    expect(result.openings[0].profilesCount).toBe(3);
  });

  // Test 5: Hiring manager cannot access another manager's opening
  it("5. Hiring manager cannot access another manager's opening (returns null)", async () => {
    (prisma.opening.findFirst as any).mockResolvedValueOnce(null);

    const result = await openingService.getHiringManagerOpeningProfiles(
      "opening-owned-by-other-mgr",
      "tenant-wayne",
      "mgr-lucius"
    );

    expect(prisma.opening.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "opening-owned-by-other-mgr",
          tenantId: "tenant-wayne",
          hiringManagerId: "mgr-lucius",
        },
      })
    );

    expect(result).toBeNull();
  });

  // Test 6: Hiring manager cannot access opening from another tenant
  it("6. Hiring manager cannot access opening from another tenant (returns null)", async () => {
    (prisma.opening.findFirst as any).mockResolvedValueOnce(null);

    const result = await openingService.getHiringManagerOpeningProfiles(
      "opening-in-other-tenant",
      "tenant-wayne",
      "mgr-lucius"
    );

    expect(prisma.opening.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "opening-in-other-tenant",
          tenantId: "tenant-wayne",
          hiringManagerId: "mgr-lucius",
        },
      })
    );

    expect(result).toBeNull();
  });
});
