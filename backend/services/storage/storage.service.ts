import type { StorageProvider, UploadFileInput, StorageHealthResult } from "./storage.interface";
import { LocalProvider } from "./local.provider";
import { SiaS3Provider } from "./sia-s3.provider";

/**
 * StorageService uses STORAGE_PROVIDER for new uploads and resolves existing
 * files through the provider stored in their database metadata.
 */
export class StorageService {
  private readonly activeProvider: StorageProvider;
  private readonly providers = new Map<string, StorageProvider>();

  constructor() {
    const providerName = (process.env.STORAGE_PROVIDER ?? "sia").toLowerCase();
    this.activeProvider = this.getOrCreateProvider(providerName);
  }

  private static createProvider(providerName: string, bucket?: string): StorageProvider {
    if (providerName === "sia") {
      return new SiaS3Provider(bucket);
    }

    if (providerName === "local") {
      return new LocalProvider();
    }

    throw new Error(
      `Unsupported storage provider "${providerName}". Use "sia" or "local".`
    );
  }

  /**
   * Resolve the provider that originally stored a file. This is important when
   * the database contains both local and Sia records after a config switch.
   */
  private getOrCreateProvider(providerName: string, bucket?: string): StorageProvider {
    const normalizedName = providerName.toLowerCase();
    const cacheKey = `${normalizedName}:${bucket ?? "default"}`;
    const cached = this.providers.get(cacheKey);
    if (cached) return cached;

    const provider = StorageService.createProvider(normalizedName, bucket);
    this.providers.set(cacheKey, provider);
    return provider;
  }

  getProviderName(): string {
    return this.activeProvider.name;
  }

  uploadFile(input: UploadFileInput) {
    return this.activeProvider.uploadFile(input);
  }

  downloadFile(objectKey: string, providerName: string, bucket: string) {
    return this.getOrCreateProvider(providerName, bucket).downloadFile(objectKey);
  }

  /** Delete bytes only from the on-disk provider. Sia deletion is not exposed. */
  deleteLocalFile(objectKey: string) {
    return this.getOrCreateProvider("local").deleteFile(objectKey);
  }

  fileExists(objectKey: string, providerName: string, bucket: string) {
    return this.getOrCreateProvider(providerName, bucket).fileExists(objectKey);
  }

  checkHealth(): Promise<StorageHealthResult> {
    return this.activeProvider.checkHealth();
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
