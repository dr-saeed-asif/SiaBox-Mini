import { getFileService } from "@/backend/services/file.service";
import { jsonError, jsonSuccess } from "@/backend/utils/response";

/** POST /api/files/recover — restore a removed Sia file with its recovery key */
export async function recoverFile(request: Request) {
  try {
    const body = (await request.json()) as { recoveryKey?: unknown };
    if (typeof body.recoveryKey !== "string" || !body.recoveryKey.trim()) {
      return jsonError("Recovery key is required.", 400);
    }

    const result = await getFileService().recoverFile(body.recoveryKey);
    return jsonSuccess(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Recovery failed.";
    const status = message.includes("unavailable") ? 503 : 400;
    return jsonError(message, status);
  }
}
