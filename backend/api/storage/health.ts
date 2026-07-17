import { getStorageService } from "@/backend/services/storage/storage.service";
import { jsonSuccess, jsonError } from "@/backend/utils/response";

/** GET /api/storage/health — check if storage backend is reachable */
export async function storageHealth() {
  try {
    const health = await getStorageService().checkHealth();
    return jsonSuccess(health, health.healthy ? 200 : 503);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Health check failed.";
    return jsonError(message, 500);
  }
}
