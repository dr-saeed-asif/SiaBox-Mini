/**
 * StorageProvider interface — the contract every storage backend must follow.
 *
 * SiaBox Mini uses this abstraction so the app can switch between:
 * - LocalProvider (files on disk, great for learning)
 * - SiaS3Provider (decentralized storage via renterd S3 API)
 *
 * FileService and API routes never talk to S3 or the filesystem directly.
 */

export interface UploadFileInput {
  /** Unique key/path for the object in storage */
  objectKey: string;
  /** File contents */
  buffer: Buffer;
  /** MIME type, e.g. "image/png" */
  mimeType: string;
}

export interface UploadFileResult {
  bucket: string;
  objectKey: string;
}

export interface StorageHealthResult {
  provider: string;
  healthy: boolean;
  message: string;
}

export interface StorageProvider {
  /** Human-readable provider name: "local" or "sia" */
  readonly name: string;

  uploadFile(input: UploadFileInput): Promise<UploadFileResult>;
  downloadFile(objectKey: string): Promise<Buffer>;
  deleteFile(objectKey: string): Promise<void>;
  fileExists(objectKey: string): Promise<boolean>;
  checkHealth(): Promise<StorageHealthResult>;
}
