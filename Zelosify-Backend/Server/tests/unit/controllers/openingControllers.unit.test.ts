import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock openingService before controllers
vi.mock("../../../src/services/opening/openingService.js", () => ({
  openingService: {
    getVendorOpenings: vi.fn(),
    getVendorOpeningById: vi.fn(),
    getHiringManagerOpenings: vi.fn(),
    getHiringManagerOpeningProfiles: vi.fn(),
  },
}));

import { openingService } from "../../../src/services/opening/openingService.js";
import {
  listVendorOpenings,
  getVendorOpening,
} from "../../../src/controllers/vendor/openings/vendorOpeningController.js";
import {
  listHiringManagerOpenings,
  getHiringManagerOpeningProfiles,
} from "../../../src/controllers/hiring/hiringOpeningController.js";

describe("Opening Controllers - HTTP & Error Handling", () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe("Vendor Opening Controller", () => {
    it("returns 401 when vendor has no tenant associated", async () => {
      mockReq = {
        user: { id: "user-1" },
        query: {},
      };

      await listVendorOpenings(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ status: "error" })
      );
    });

    it("returns 200 with openings list and pagination metadata", async () => {
      mockReq = {
        user: { id: "user-1", tenant: { tenantId: "tenant-1" } },
        query: { page: "1", limit: "10" },
      };

      const mockData = {
        openings: [{ id: "op-1", title: "QA Engineer" }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };

      (openingService.getVendorOpenings as any).mockResolvedValueOnce(mockData);

      await listVendorOpenings(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: mockData.openings,
        pagination: mockData.pagination,
      });
    });

    it("returns 400 when opening ID param is invalid or missing", async () => {
      mockReq = {
        user: { id: "user-1", tenant: { tenantId: "tenant-1" } },
        params: { id: "   " },
      };

      await getVendorOpening(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining("Invalid opening ID") })
      );
    });

    it("returns 404 when opening does not exist in vendor tenant", async () => {
      mockReq = {
        user: { id: "user-1", tenant: { tenantId: "tenant-1" } },
        params: { id: "op-outside-tenant" },
      };

      (openingService.getVendorOpeningById as any).mockResolvedValueOnce(null);

      await getVendorOpening(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        error: "Opening not found",
      });
    });
  });

  describe("Hiring Manager Opening Controller", () => {
    it("returns 401 when hiring manager is unauthenticated or missing tenant", async () => {
      mockReq = {
        user: undefined,
        query: {},
      };

      await listHiringManagerOpenings(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it("returns 200 with manager-assigned openings", async () => {
      mockReq = {
        user: { id: "mgr-1", tenant: { tenantId: "tenant-1" } },
        query: {},
      };

      const mockData = {
        openings: [{ id: "op-1", title: "Security Engineer", profilesCount: 2 }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };

      (openingService.getHiringManagerOpenings as any).mockResolvedValueOnce(
        mockData
      );

      await listHiringManagerOpenings(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: mockData.openings,
        pagination: mockData.pagination,
      });
    });

    it("returns 404 when accessing candidate profiles for an unowned opening", async () => {
      mockReq = {
        user: { id: "mgr-1", tenant: { tenantId: "tenant-1" } },
        params: { id: "op-owned-by-mgr-2" },
      };

      (
        openingService.getHiringManagerOpeningProfiles as any
      ).mockResolvedValueOnce(null);

      await getHiringManagerOpeningProfiles(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        error: "Opening not found",
      });
    });

    it("returns 200 with opening and candidate profiles when ownership is verified", async () => {
      mockReq = {
        user: { id: "mgr-1", tenant: { tenantId: "tenant-1" } },
        params: { id: "op-owned-by-mgr-1" },
      };

      const mockResult = {
        opening: { id: "op-owned-by-mgr-1", title: "Cloud Engineer" },
        profiles: [],
        profilesCount: 0,
      };

      (
        openingService.getHiringManagerOpeningProfiles as any
      ).mockResolvedValueOnce(mockResult);

      await getHiringManagerOpeningProfiles(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "success",
        data: mockResult,
      });
    });
  });
});
