import { sanitizeFilename } from "./vendorRequestValidation.js";

export const ALLOWED_MIME_TYPES = {
  PDF: "application/pdf",
  PPTX: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
} as const;

export const ALLOWED_EXTENSIONS = [".pdf", ".pptx"] as const;

export const MAX_FILES_PER_REQUEST = 10;

export interface PresignFileInput {
  filename: string;
  contentType: string;
}

export interface ProfileSubmissionItem {
  s3Key: string;
  originalFilename: string;
}

export interface ValidationOutcome {
  isValid: boolean;
  error?: string;
  sanitizedFilename?: string;
  cleanExtension?: string;
}

/**
 * Validates a single file descriptor for presigned URL generation.
 */
export function validatePresignFile(file: any): ValidationOutcome {
  if (!file || typeof file !== "object") {
    return { isValid: false, error: "Invalid file object in files list" };
  }

  const { filename, contentType } = file;

  if (!filename || typeof filename !== "string" || filename.trim() === "") {
    return { isValid: false, error: "Filename is required and cannot be empty" };
  }

  // Prevent path traversal attempts
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return {
      isValid: false,
      error: `Path traversal detected in filename: ${filename}`,
    };
  }

  if (!contentType || typeof contentType !== "string" || contentType.trim() === "") {
    return { isValid: false, error: `Content-Type is required for ${filename}` };
  }

  const normalizedContentType = contentType.trim().toLowerCase();
  const lowerFilename = filename.trim().toLowerCase();

  const isPdf = lowerFilename.endsWith(".pdf");
  const isPptx = lowerFilename.endsWith(".pptx");

  if (!isPdf && !isPptx) {
    return {
      isValid: false,
      error: `Unsupported file extension for ${filename}. Allowed formats: .pdf, .pptx`,
    };
  }

  if (isPdf && normalizedContentType !== ALLOWED_MIME_TYPES.PDF) {
    return {
      isValid: false,
      error: `Content-Type mismatch for ${filename}: Expected ${ALLOWED_MIME_TYPES.PDF}, got ${contentType}`,
    };
  }

  if (isPptx && normalizedContentType !== ALLOWED_MIME_TYPES.PPTX) {
    return {
      isValid: false,
      error: `Content-Type mismatch for ${filename}: Expected ${ALLOWED_MIME_TYPES.PPTX}, got ${contentType}`,
    };
  }

  const sanitized = sanitizeFilename(filename.trim());
  const ext = isPdf ? ".pdf" : ".pptx";

  return {
    isValid: true,
    sanitizedFilename: sanitized,
    cleanExtension: ext,
  };
}

/**
 * Validates the full array of files for presigning.
 */
export function validatePresignFilesList(files: any): {
  isValid: boolean;
  error?: string;
} {
  if (!files || !Array.isArray(files)) {
    return { isValid: false, error: "Body must contain a 'files' array" };
  }

  if (files.length === 0) {
    return { isValid: false, error: "Files array cannot be empty" };
  }

  if (files.length > MAX_FILES_PER_REQUEST) {
    return {
      isValid: false,
      error: `Cannot request more than ${MAX_FILES_PER_REQUEST} files per request`,
    };
  }

  for (const file of files) {
    const outcome = validatePresignFile(file);
    if (!outcome.isValid) {
      return { isValid: false, error: outcome.error };
    }
  }

  return { isValid: true };
}

/**
 * Validates that an S3 key strictly matches the expected tenant and opening prefix.
 */
export function validateS3KeyPrefix(
  s3Key: string,
  tenantId: string,
  openingId: string
): boolean {
  if (!s3Key || typeof s3Key !== "string") {
    return false;
  }

  // Prevent path traversal
  if (s3Key.includes("..")) {
    return false;
  }

  const expectedPrefix = `${tenantId}/${openingId}/`;
  if (!s3Key.startsWith(expectedPrefix)) {
    return false;
  }

  // Must have a filename after prefix
  const remainder = s3Key.slice(expectedPrefix.length);
  if (!remainder || remainder.trim() === "" || remainder.includes("/")) {
    return false;
  }

  const lowerRemainder = remainder.toLowerCase();
  return lowerRemainder.endsWith(".pdf") || lowerRemainder.endsWith(".pptx");
}
