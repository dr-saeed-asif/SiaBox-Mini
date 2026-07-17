import { mkdir, readFile, writeFile, unlink, access } from "fs/promises";
import path from "path";
import type {
  StorageProvider,
  UploadFileInput,
  UploadFileResult,
  StorageHealthResult,
} from "./storage.interface";

/**
 * LocalProvider stores files in a folder on your computer.
 * Default path: ./storage/uploads
 *
 * Set STORAGE_PROVIDER=local in .env.local to use this provider.
 */
export class LocalProvider implements StorageProvider {
  readonly name = "local";
  private readonly basePath: string;
  private readonly bucket = "local";

  constructor(basePath?: string) {
    this.basePath = path.resolve(
      process.cwd(),
      basePath ?? process.env.LOCAL_STORAGE_PATH ?? "./storage/uploads"
    );
  }

  private resolvePath(objectKey: string): string {
    // Prevent path traversal — objectKey must stay inside basePath
    const safeKey = objectKey.replace(/\.\./g, "").replace(/^[/\\]+/, "");
    const fullPath = path.join(this.basePath, safeKey);
    if (!fullPath.startsWith(this.basePath)) {
      throw new Error("Invalid object key.");
    }
    return fullPath;
  }

  async uploadFile(input: UploadFileInput): Promise<UploadFileResult> {
    const filePath = this.resolvePath(input.objectKey);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, input.buffer);
    return { bucket: this.bucket, objectKey: input.objectKey };
  }

  async downloadFile(objectKey: string): Promise<Buffer> {
    const filePath = this.resolvePath(objectKey);
    return readFile(filePath);
  }

  async deleteFile(objectKey: string): Promise<void> {
    const filePath = this.resolvePath(objectKey);
    try {
      await unlink(filePath);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }
  }

  async fileExists(objectKey: string): Promise<boolean> {
    try {
      await access(this.resolvePath(objectKey));
      return true;
    } catch {
      return false;
    }
  }

  async checkHealth(): Promise<StorageHealthResult> {
    try {
      await mkdir(this.basePath, { recursive: true });
      return {
        provider: this.name,
        healthy: true,
        message: `Local storage ready at ${this.basePath}`,
      };
    } catch (err) {
      return {
        provider: this.name,
        healthy: false,
        message: `Local storage error: ${err instanceof Error ? err.message : "Unknown error"}`,
      };
    }
  }
}
