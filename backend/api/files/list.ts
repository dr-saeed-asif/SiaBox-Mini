import { getFileService } from "@/backend/services/file.service";
import { jsonSuccess, jsonError } from "@/backend/utils/response";

/** GET /api/files — list all uploaded files */
export async function listFiles() {
  try {
    const files = await getFileService().listFiles();
    return jsonSuccess(files);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list files.";
    return jsonError(message, 500);
  }
}
