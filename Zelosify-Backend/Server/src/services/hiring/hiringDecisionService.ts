/**
 * Service managing Hiring Manager decisions (shortlist, reject)
 * and safe recommendation retry workflows.
 * Enforces strict composite tenant and hiring manager ownership boundaries.
 */

import prisma from "../../config/prisma/prisma.js";
import { ProfileStatus, RecommendationStatus } from "@prisma/client";
import { recommendationDispatcher } from "../recommendation/recommendationDispatcher.js";

export interface DecisionScopeParams {
  profileId: number;
  tenantId: string;
  hiringManagerId: string;
}

export class HiringDecisionService {
  /**
   * Shortlists a candidate profile.
   * Requires that the profile is active (not soft deleted) and belongs to an opening
   * assigned to the authenticated Hiring Manager in their tenant.
   */
  async shortlistProfile(params: DecisionScopeParams) {
    return await prisma.$transaction(async (tx) => {
      const profile = await tx.hiringProfile.findFirst({
        where: {
          id: params.profileId,
          isDeleted: false,
          opening: {
            tenantId: params.tenantId,
            hiringManagerId: params.hiringManagerId,
          },
        },
        include: { opening: true },
      });

      if (!profile) {
        return null;
      }

      return await tx.hiringProfile.update({
        where: { id: profile.id },
        data: {
          status: ProfileStatus.SHORTLISTED,
          shortlistedBy: params.hiringManagerId,
          shortlistedAt: new Date(),
          rejectedBy: null,
          rejectedAt: null,
        },
      });
    });
  }

  /**
   * Rejects a candidate profile.
   * Cleans any previous shortlist metadata and ensures consistent audit state.
   */
  async rejectProfile(params: DecisionScopeParams) {
    return await prisma.$transaction(async (tx) => {
      const profile = await tx.hiringProfile.findFirst({
        where: {
          id: params.profileId,
          isDeleted: false,
          opening: {
            tenantId: params.tenantId,
            hiringManagerId: params.hiringManagerId,
          },
        },
        include: { opening: true },
      });

      if (!profile) {
        return null;
      }

      return await tx.hiringProfile.update({
        where: { id: profile.id },
        data: {
          status: ProfileStatus.REJECTED,
          rejectedBy: params.hiringManagerId,
          rejectedAt: new Date(),
          shortlistedBy: null,
          shortlistedAt: null,
        },
      });
    });
  }

  /**
   * Retries recommendation evaluation for an owned candidate profile.
   * Only allows retrying FAILED (or PENDING) profiles. Rejects already COMPLETED profiles.
   */
  async retryRecommendation(params: DecisionScopeParams): Promise<{
    success: boolean;
    reason?: string;
    profile?: any;
  }> {
    const profile = await prisma.hiringProfile.findFirst({
      where: {
        id: params.profileId,
        isDeleted: false,
        opening: {
          tenantId: params.tenantId,
          hiringManagerId: params.hiringManagerId,
        },
      },
    });

    if (!profile) {
      return { success: false, reason: "NOT_FOUND" };
    }

    if (profile.recommendationStatus === RecommendationStatus.COMPLETED) {
      return { success: false, reason: "ALREADY_COMPLETED", profile };
    }

    if (profile.recommendationStatus === RecommendationStatus.PROCESSING) {
      return { success: false, reason: "ALREADY_PROCESSING", profile };
    }

    // Queue for asynchronous processing via dispatcher
    recommendationDispatcher.dispatch(profile.id);

    return { success: true, profile };
  }
}

export const hiringDecisionService = new HiringDecisionService();
