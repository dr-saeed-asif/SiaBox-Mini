import { getFileService } from "@/backend/services/file.service";
import { jsonError } from "@/backend/utils/response";

/** GET /api/files/[fileId]/download — download a file by ID */
export async function downloadFile(fileId: string) {
  try {
    const { file, buffer } = await getFileService().downloadFile(fileId);

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file.originalName)}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Download failed.";
    const status = message.includes("not found") ? 404 : 500;
    return jsonError(message, status);
  }
}
