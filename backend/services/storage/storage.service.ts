import type { StorageProvider, UploadFileInput, StorageHealthResult } from "./storage.interface";
import { LocalProvider } from "./local.provider";
import { SiaS3Provider } from "./sia-s3.provider";

/**
 * StorageService picks the right provider based on STORAGE_PROVIDER env var.
 * This is the only place that decides "local" vs "sia".
 */
export class StorageService {
  private provider: StorageProvider;

  constructor() {
    this.provider = StorageService.createProvider();
  }

  private static createProvider(): StorageProvider {
    const providerName = (process.env.STORAGE_PROVIDER ?? "local").toLowerCase();

    if (providerName === "sia") {
      return new SiaS3Provider();
    }

    return new LocalProvider();
  }

  getProviderName(): string {
    return this.provider.name;
  }

  uploadFile(input: UploadFileInput) {
    return this.provider.uploadFile(input);
  }

  downloadFile(objectKey: string) {
    return this.provider.downloadFile(objectKey);
  }

  deleteFile(objectKey: string) {
    return this.provider.deleteFile(objectKey);
  }

  fileExists(objectKey: string) {
    return this.provider.fileExists(objectKey);
  }

  checkHealth(): Promise<StorageHealthResult> {
    return this.provider.checkHealth();
  }
}

/** Singleton used across the app */
let storageServiceInstance: StorageService | null = null;

export function getStorageService(): StorageService {
  if (!storageServiceInstance) {
    storageServiceInstance = new StorageService();
  }
  return storageServiceInstance;
}
