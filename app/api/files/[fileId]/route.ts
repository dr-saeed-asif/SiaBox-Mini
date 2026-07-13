import { getFileService } from "@/server/services/file.service";
import { jsonSuccess, jsonError } from "@/server/utils/response";

/** DELETE /api/files/[fileId] — delete a file */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;
    await getFileService().deleteFile(fileId);
    return jsonSuccess({ message: "File deleted successfully." });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed.";
    const status = message.includes("not found") ? 404 : 500;
    return jsonError(message, status);
  }
}
