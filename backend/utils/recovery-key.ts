import { createHash, randomBytes, timingSafeEqual } from "crypto";

const RECOVERY_KEY_PREFIX = "SBX1_";
const RECOVERY_KEY_PATTERN = /^SBX1_[A-Za-z0-9_-]{43}$/;

/** Generate a 256-bit, URL-safe, one-time recovery key. */
export function generateRecoveryKey(): string {
  return `${RECOVERY_KEY_PREFIX}${randomBytes(32).toString("base64url")}`;
}

/** Validate and normalize a recovery key received from the user. */
export function normalizeRecoveryKey(value: string): string {
  const normalized = value.trim();
  if (!RECOVERY_KEY_PATTERN.test(normalized)) {
    throw new Error("Invalid recovery key format.");
  }
  return normalized;
}

/** Store only this irreversible hash in SQLite, never the plaintext key. */
export function hashRecoveryKey(value: string): string {
  const normalized = normalizeRecoveryKey(value);
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

/** Constant-time comparison for a submitted key and the stored hash. */
export function recoveryKeyMatches(value: string, storedHash: string): boolean {
  const candidate = Buffer.from(hashRecoveryKey(value), "hex");
  const stored = Buffer.from(storedHash, "hex");
  return candidate.length === stored.length && timingSafeEqual(candidate, stored);
}
