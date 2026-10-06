// ===== Local AUTH =====
export {
  register,
  verifyLogin,
  verifyTOTP,
  verifyInitialTOTP,
} from "./auth/local/localAuthController.js";

// ===== Unified AUTH Logout =====
export { logout } from "./auth/logout(unified)/logout.js";

// ===== User details retrieval =====
export { getUserDetails } from "./auth/user/getUserDetails.js";

// ===== STORAGE =====
export { listOfObjects } from "./storage/storageController.js";

// ===== FORM =====
export { createDigitalInitiative } from "./form/initiativeRequestController.js";

// ===== VENDOR MANAGEMENT =====
// Vendor resource requests
export {
  fetchRequestData,
  //   updateVendorRequest,
  //   generatePresignedUrls,
  //   uploadAttachment,
  //   // deleteAttachment,
} from "./vendor/resourceRequest/vendorRequestController.js";

// Vendor openings
export {
  listVendorOpenings,
  getVendorOpening,
  presignCandidateProfiles,
  uploadCandidateProfiles,
} from "./vendor/openings/vendorOpeningController.js";

// Vendor candidate profiles
export {
  softDeleteProfile,
  previewProfile,
} from "./vendor/profiles/vendorProfileController.js";

// ===== HIRING MANAGEMENT =====
export { fetchData } from "./hiring/hiringProfileController.js";

// Hiring manager openings and profile decisions
export {
  listHiringManagerOpenings,
  getHiringManagerOpeningProfiles,
} from "./hiring/hiringOpeningController.js";
export {
  shortlistCandidateProfile,
  rejectCandidateProfile,
  retryCandidateRecommendation,
} from "./hiring/hiringProfileController.js";


