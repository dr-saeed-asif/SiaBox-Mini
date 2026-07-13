import { getStorageService } from "@/server/services/storage/storage.service";
import { jsonSuccess, jsonError } from "@/server/utils/response";

/** GET /api/storage/health — check if storage backend is reachable */
export async function GET() {
  try {
    const health = await getStorageService().checkHealth();
    return jsonSuccess(health, health.healthy ? 200 : 503);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Health check failed.";
    return jsonError(message, 500);
  }
}
