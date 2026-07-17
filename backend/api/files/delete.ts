import { getFileService } from "@/backend/services/file.service";
import { jsonSuccess, jsonError } from "@/backend/utils/response";

/** DELETE /api/files/[fileId] — delete a file */
export async function deleteFile(fileId: string) {
  try {
    await getFileService().deleteFile(fileId);
    return jsonSuccess({ message: "File deleted successfully." });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed.";
    const status = message.includes("not found") ? 404 : 500;
    return jsonError(message, status);
  }
}
