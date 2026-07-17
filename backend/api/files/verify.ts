import { getFileService } from "@/backend/services/file.service";
import { jsonSuccess, jsonError } from "@/backend/utils/response";

/** POST /api/files/[fileId]/verify — verify file integrity via SHA-256 */
export async function verifyFile(fileId: string) {
  try {
    const result = await getFileService().verifyFile(fileId);
    return jsonSuccess(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verification failed.";
    const status = message.includes("not found") ? 404 : 500;
    return jsonError(message, status);
  }
}
