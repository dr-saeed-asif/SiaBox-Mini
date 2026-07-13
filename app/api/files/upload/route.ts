import { getFileService } from "@/server/services/file.service";
import { jsonSuccess, jsonError } from "@/server/utils/response";

/** POST /api/files/upload — upload a new file */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return jsonError("No file provided. Please select a file to upload.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await getFileService().uploadFile(
      file.name,
      file.type,
      buffer
    );

    return jsonSuccess(result.file, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    return jsonError(message, 400);
  }
}
