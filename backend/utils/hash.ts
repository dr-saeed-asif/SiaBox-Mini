import { createHash } from "crypto";

/**
 * Compute SHA-256 hash of a file buffer.
 * Used to verify file integrity after upload/download.
 */
export function computeSha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}
