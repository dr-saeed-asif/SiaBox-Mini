import { getFileService } from "@/server/services/file.service";
import { jsonSuccess, jsonError } from "@/server/utils/response";

/** GET /api/files — list all uploaded files */
export async function GET() {
  try {
    const files = await getFileService().listFiles();
    return jsonSuccess(files);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list files.";
    return jsonError(message, 500);
  }
}
