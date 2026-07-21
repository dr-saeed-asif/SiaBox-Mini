import { getFileService } from "@/backend/services/file.service";
import { jsonSuccess, jsonError } from "@/backend/utils/response";

/** DELETE /api/files/[fileId] — remove locally while retaining Sia bytes */
export async function deleteFile(request: Request, fileId: string) {
  try {
    let recoveryKey: string | undefined;
    try {
      const body = (await request.json()) as { recoveryKey?: unknown };
      if (typeof body.recoveryKey === "string") recoveryKey = body.recoveryKey;
    } catch {
      // Local-provider deletion does not require a JSON body.
    }

    const result = await getFileService().deleteFile(fileId, recoveryKey);
    return jsonSuccess(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed.";
    const status = message.includes("not found")
      ? 404
      : message.includes("Recovery key") || message.includes("recovery key")
        ? 400
        : message.includes("could not be verified")
          ? 503
          : 500;
    return jsonError(message, status);
  }
}
