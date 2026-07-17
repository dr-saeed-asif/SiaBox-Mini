/**
 * File upload validation helpers.
 * Reads limits from environment variables so you can tune them in .env.local
 */

export function getMaxUploadSizeBytes(): number {
  const mb = parseInt(process.env.MAX_UPLOAD_SIZE_MB ?? "50", 10);
  return mb * 1024 * 1024;
}

export function getAllowedExtensions(): string[] {
  const raw = process.env.ALLOWED_FILE_TYPES ?? "pdf,docx,xlsx,csv,zip,png,jpg,jpeg,mp3,mp4";
  return raw.split(",").map((ext) => ext.trim().toLowerCase()).filter(Boolean);
}

export function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  if (parts.length < 2) return "";
  return parts.pop()!.toLowerCase();
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/** Validate file size and extension before upload */
export function validateUploadFile(
  filename: string,
  sizeBytes: number
): FileValidationResult {
  const maxSize = getMaxUploadSizeBytes();
  if (sizeBytes <= 0) {
    return { valid: false, error: "File is empty. Please choose a file with content." };
  }
  if (sizeBytes > maxSize) {
    const maxMb = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `File is too large. Maximum allowed size is ${maxMb} MB.`,
    };
  }

  const ext = getFileExtension(filename);
  const allowed = getAllowedExtensions();
  if (!ext || !allowed.includes(ext)) {
    return {
      valid: false,
      error: `File type ".${ext || "unknown"}" is not allowed. Allowed types: ${allowed.join(", ")}.`,
    };
  }

  return { valid: true };
}
