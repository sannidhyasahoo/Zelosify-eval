import axiosInstance from "@/utils/Axios/AxiosInstance";

/**
 * IT_VENDOR API Helpers
 */

/**
 * List vendor openings with optional query params (page, limit, search)
 */
export async function getVendorOpenings(params = {}) {
  const response = await axiosInstance.get("/api/v1/vendor/openings", {
    params,
  });
  return response.data;
}

/**
 * Get vendor opening detail by ID
 */
export async function getVendorOpening(id) {
  const response = await axiosInstance.get(`/api/v1/vendor/openings/${id}`);
  return response.data;
}

/**
 * Request presigned upload URLs for candidate resume files
 * @param {string} openingId
 * @param {Array<{filename: string, contentType: string, sizeBytes: number}>} files
 */
export async function presignCandidateProfiles(openingId, files) {
  const response = await axiosInstance.post(
    `/api/v1/vendor/openings/${openingId}/profiles/presign`,
    { files }
  );
  return response.data;
}

/**
 * Atomically submit uploaded profiles after S3 PUT succeeds
 * @param {string} openingId
 * @param {Array<{originalFilename: string, s3Key: string, contentType: string, sizeBytes: number}>} profiles
 */
export async function submitCandidateProfiles(openingId, profiles) {
  const response = await axiosInstance.post(
    `/api/v1/vendor/openings/${openingId}/profiles/upload`,
    { profiles }
  );
  return response.data;
}

/**
 * Directly upload a file buffer/blob to the S3 presigned PUT URL
 * NOTE: This does NOT route through Express.
 */
export async function uploadFileToS3(uploadUrl, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentCompleted = Math.round((event.loaded * 100) / event.total);
          onProgress(percentCompleted);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(true);
      } else {
        reject(new Error(`S3 upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error during S3 upload"));
    };

    xhr.send(file);
  });
}

/**
 * Get short-lived presigned URL to preview a vendor candidate resume
 */
export async function getVendorProfilePreview(profileId) {
  const response = await axiosInstance.get(
    `/api/v1/vendor/profiles/${profileId}/preview`
  );
  return response.data;
}

/**
 * Soft-delete a vendor candidate profile
 */
export async function deleteVendorProfile(profileId) {
  const response = await axiosInstance.delete(
    `/api/v1/vendor/profiles/${profileId}`
  );
  return response.data;
}

/**
 * HIRING_MANAGER API Helpers
 */

/**
 * List hiring manager openings with optional query params
 */
export async function getHiringManagerOpenings(params = {}) {
  const response = await axiosInstance.get("/api/v1/hiring-manager/openings", {
    params,
  });
  return response.data;
}

/**
 * Get hiring manager opening detail and associated candidate profiles
 */
export async function getHiringManagerOpeningProfiles(openingId) {
  const response = await axiosInstance.get(
    `/api/v1/hiring-manager/openings/${openingId}/profiles`
  );
  return response.data;
}

/**
 * Shortlist a candidate profile
 */
export async function shortlistProfile(profileId) {
  const response = await axiosInstance.post(
    `/api/v1/hiring-manager/profiles/${profileId}/shortlist`
  );
  return response.data;
}

/**
 * Reject a candidate profile
 */
export async function rejectProfile(profileId) {
  const response = await axiosInstance.post(
    `/api/v1/hiring-manager/profiles/${profileId}/reject`
  );
  return response.data;
}

/**
 * Retry recommendation analysis for a FAILED profile
 */
export async function retryRecommendation(profileId) {
  const response = await axiosInstance.post(
    `/api/v1/hiring-manager/profiles/${profileId}/recommendation/retry`
  );
  return response.data;
}
