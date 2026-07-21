import { getFileService } from "@/backend/services/file.service";
import { jsonError, jsonSuccess } from "@/backend/utils/response";

/** POST /api/files/[fileId]/recovery-key — issue a one-time Sia recovery key */
export async function createRecoveryKey(fileId: string) {
  try {
    const result = await getFileService().createRecoveryKey(fileId);
    return jsonSuccess(result, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create recovery key.";
    const status = message.includes("not found")
      ? 404
      : message.includes("could not be verified")
        ? 503
        : 400;
    return jsonError(message, status);
  }
}
