import prisma from "../../config/prisma/prisma.js";
import { OpeningStatus } from "@prisma/client";
import {
  parsePagination,
  buildPaginationMeta,
  PaginationMeta,
} from "../../utils/pagination/paginationUtils.js";

/**
 * Service layer for tenant-scoped and ownership-scoped opening operations.
 * Business and query logic resides here to keep controllers thin and ensure
 * that database queries strictly enforce tenant boundaries.
 */
export class OpeningService {
  /**
   * Retrieves paginated OPEN openings for an IT Vendor within their tenant.
   *
   * @param tenantId - The authenticated vendor's tenant ID
   * @param query - Request query parameters for pagination
   */
  async getVendorOpenings(
    tenantId: string,
    query: Record<string, any> = {}
  ): Promise<{ openings: any[]; pagination: PaginationMeta }> {
    const { page, limit, skip } = parsePagination(query, 10, 50);

    const [openings, total] = await Promise.all([
      prisma.opening.findMany({
        where: {
          tenantId,
          status: OpeningStatus.OPEN,
        },
        skip,
        take: limit,
        orderBy: {
          postedDate: "desc",
        },
        select: {
          id: true,
          tenantId: true,
          title: true,
          description: true,
          location: true,
          contractType: true,
          experienceMin: true,
          experienceMax: true,
          requiredSkills: true,
          postedDate: true,
          expectedCompletionDate: true,
          actionDate: true,
          status: true,
          hiringManager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              department: true,
            },
          },
        },
      }),
      prisma.opening.count({
        where: {
          tenantId,
          status: OpeningStatus.OPEN,
        },
      }),
    ]);

    return {
      openings,
      pagination: buildPaginationMeta(total, page, limit),
    };
  }

  /**
   * Retrieves full opening details for an IT Vendor, including ONLY their own uploaded profiles.
   *
   * @param openingId - Target opening ID
   * @param tenantId - The authenticated vendor's tenant ID
   * @param vendorUserId - The authenticated vendor's user ID
   */
  async getVendorOpeningById(
    openingId: string,
    tenantId: string,
    vendorUserId: string
  ): Promise<any | null> {
    const opening = await prisma.opening.findFirst({
      where: {
        id: openingId,
        tenantId, // Strict tenant boundary in DB query
      },
      select: {
        id: true,
        tenantId: true,
        title: true,
        description: true,
        location: true,
        contractType: true,
        experienceMin: true,
        experienceMax: true,
        requiredSkills: true,
        postedDate: true,
        expectedCompletionDate: true,
        actionDate: true,
        status: true,
        hiringManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
          },
        },
        hiringProfiles: {
          where: {
            uploadedBy: vendorUserId, // Only profiles uploaded by this vendor
            isDeleted: false,
          },
          select: {
            id: true,
            openingId: true,
            s3Key: true,
            originalFilename: true,
            uploadedBy: true,
            submittedAt: true,
            status: true,
          },
          orderBy: {
            submittedAt: "desc",
          },
        },
      },
    });

    if (!opening) {
      return null;
    }

    const { hiringProfiles, ...openingDetails } = opening;

    return {
      ...openingDetails,
      profilesCount: hiringProfiles.length,
      uploadedProfiles: hiringProfiles,
    };
  }

  /**
   * Retrieves openings belonging to the authenticated Hiring Manager in their tenant.
   *
   * @param tenantId - The authenticated hiring manager's tenant ID
   * @param hiringManagerId - The authenticated hiring manager's user ID
   * @param query - Request query parameters for pagination
   */
  async getHiringManagerOpenings(
    tenantId: string,
    hiringManagerId: string,
    query: Record<string, any> = {}
  ): Promise<{ openings: any[]; pagination: PaginationMeta }> {
    const { page, limit, skip } = parsePagination(query, 10, 50);

    const [openings, total] = await Promise.all([
      prisma.opening.findMany({
        where: {
          tenantId,
          hiringManagerId,
        },
        skip,
        take: limit,
        orderBy: {
          postedDate: "desc",
        },
        select: {
          id: true,
          tenantId: true,
          title: true,
          description: true,
          location: true,
          contractType: true,
          experienceMin: true,
          experienceMax: true,
          requiredSkills: true,
          postedDate: true,
          expectedCompletionDate: true,
          actionDate: true,
          status: true,
          _count: {
            select: {
              hiringProfiles: {
                where: {
                  isDeleted: false,
                },
              },
            },
          },
        },
      }),
      prisma.opening.count({
        where: {
          tenantId,
          ...managerCondition,
        },
      }),
    ]);

    const formattedOpenings = openings.map(({ _count, ...rest }) => ({
      ...rest,
      profilesCount: _count?.hiringProfiles ?? 0,
    }));

    return {
      openings: formattedOpenings,
      pagination: buildPaginationMeta(total, page, limit),
    };
  }

  /**
   * Retrieves opening metadata and submitted candidate profiles for a Hiring Manager.
   * Enforces BOTH opening.tenantId === loggedInUser.tenantId AND opening.hiringManagerId === loggedInUser.id
   *
   * @param openingId - Target opening ID
   * @param tenantId - The authenticated hiring manager's tenant ID
   * @param hiringManagerId - The authenticated hiring manager's user ID
   */
  async getHiringManagerOpeningProfiles(
    openingId: string,
    tenantId: string,
    hiringManagerId: string
  ): Promise<any | null> {
    const opening = await prisma.opening.findFirst({
      where: {
        id: openingId,
        tenantId, // Must belong to same tenant
        hiringManagerId, // Must be owned by this hiring manager
      },
      select: {
        id: true,
        tenantId: true,
        title: true,
        description: true,
        location: true,
        contractType: true,
        experienceMin: true,
        experienceMax: true,
        requiredSkills: true,
        postedDate: true,
        expectedCompletionDate: true,
        actionDate: true,
        status: true,
        hiringProfiles: {
          where: {
            isDeleted: false,
          },
          select: {
            id: true,
            openingId: true,
            s3Key: true,
            originalFilename: true,
            uploadedBy: true,
            submittedAt: true,
            status: true,
            shortlistedBy: true,
            shortlistedAt: true,
            rejectedBy: true,
            rejectedAt: true,
            recommended: true,
            recommendationScore: true,
            recommendationConfidence: true,
            recommendationReason: true,
            recommendationLatencyMs: true,
            recommendationVersion: true,
            recommendedAt: true,
            recommendationStatus: true,
            recommendationMetadata: true,
            isDeleted: true,
          },
          orderBy: {
            submittedAt: "desc",
          },
        },
      },
    });

    if (!opening) {
      return null;
    }

    const { hiringProfiles, ...openingMetadata } = opening;

    return {
      opening: openingMetadata,
      profiles: hiringProfiles,
      profilesCount: hiringProfiles.length,
    };
  }
}

export const openingService = new OpeningService();
