import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";
import type {
  StorageProvider,
  UploadFileInput,
  UploadFileResult,
  StorageHealthResult,
} from "./storage.interface";

/**
 * SiaS3Provider talks to renterd's S3-compatible API.
 *
 * renterd exposes an S3 endpoint so apps can use the standard AWS S3 SDK.
 * Credentials stay on the server only — never expose them to the browser.
 *
 * Set STORAGE_PROVIDER=sia in .env.local to use this provider.
 */
export class SiaS3Provider implements StorageProvider {
  readonly name = "sia";
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    const endpoint = process.env.SIA_S3_ENDPOINT ?? "http://127.0.0.1:8080";
    const region = process.env.SIA_S3_REGION ?? "us-east-1";
    const accessKey = process.env.SIA_S3_ACCESS_KEY ?? "";
    const secretKey = process.env.SIA_S3_SECRET_KEY ?? "";
    const forcePathStyle = process.env.SIA_S3_FORCE_PATH_STYLE === "true";

    this.bucket = process.env.SIA_S3_BUCKET ?? "siabox-mini";

    this.client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle,
    });
  }

  async uploadFile(input: UploadFileInput): Promise<UploadFileResult> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.objectKey,
        Body: input.buffer,
        ContentType: input.mimeType,
      })
    );
    return { bucket: this.bucket, objectKey: input.objectKey };
  }

  async downloadFile(objectKey: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
      })
    );

    if (!response.Body) {
      throw new Error("Empty response from Sia S3 storage.");
    }

    const bytes = await response.Body.transformToByteArray();
    return Buffer.from(bytes);
  }

  async deleteFile(objectKey: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
      })
    );
  }

  async fileExists(objectKey: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: objectKey,
        })
      );
      return true;
    } catch {
      return false;
    }
  }

  async checkHealth(): Promise<StorageHealthResult> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return {
        provider: this.name,
        healthy: true,
        message: `Connected to Sia S3 bucket "${this.bucket}"`,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";

      // Bucket might not exist yet — try to create it (common on first run)
      if (message.includes("NotFound") || message.includes("404")) {
        try {
          await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
          return {
            provider: this.name,
            healthy: true,
            message: `Created Sia S3 bucket "${this.bucket}"`,
          };
        } catch (createErr) {
          return {
            provider: this.name,
            healthy: false,
            message: `Could not connect to Sia S3: ${createErr instanceof Error ? createErr.message : message}`,
          };
        }
      }

      return {
        provider: this.name,
        healthy: false,
        message: `Sia S3 health check failed: ${message}. Is renterd running?`,
      };
    }
  }
}
