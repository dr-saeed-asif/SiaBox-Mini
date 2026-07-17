import { randomUUID } from "crypto";
import path from "path";
import { prisma } from "@/backend/db/prisma";
import { getStorageService } from "@/backend/services/storage/storage.service";
import { computeSha256 } from "@/backend/utils/hash";
import { validateUploadFile } from "@/backend/validators/file.schema";
import type { FileObject } from "@prisma/client";

export interface UploadResult {
  file: FileObject;
}

export interface VerifyResult {
  fileId: string;
  originalName: string;
  storedHash: string;
  downloadedHash: string;
  verified: boolean;
  message: string;
}

/**
 * FileService handles all file business logic.
 * API routes stay thin — they parse requests and call this service.
 */
export class FileService {
  private storage = getStorageService();

  /** List all active files, newest first */
  async listFiles(): Promise<FileObject[]> {
    return prisma.fileObject.findMany({
      where: { status: "active" },
      orderBy: { createdAt: "desc" },
    });
  }

  /** Upload a file: validate → hash → store → save metadata to DB */
  async uploadFile(
    originalName: string,
    mimeType: string,
    buffer: Buffer
  ): Promise<UploadResult> {
    const validation = validateUploadFile(originalName, buffer.length);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const sha256Hash = computeSha256(buffer);
    const ext = path.extname(originalName);
    const objectKey = `${randomUUID()}${ext}`;

    const uploadResult = await this.storage.uploadFile({
      objectKey,
      buffer,
      mimeType: mimeType || "application/octet-stream",
    });

    const file = await prisma.fileObject.create({
      data: {
        originalName,
        mimeType: mimeType || "application/octet-stream",
        sizeBytes: buffer.length,
        sha256Hash,
        storageProvider: this.storage.getProviderName(),
        bucket: uploadResult.bucket,
        objectKey: uploadResult.objectKey,
        status: "active",
      },
    });

    return { file };
  }

  /** Get file metadata by ID */
  async getFileById(fileId: string): Promise<FileObject | null> {
    return prisma.fileObject.findFirst({
      where: { id: fileId, status: "active" },
    });
  }

  /** Download file bytes from storage */
  async downloadFile(fileId: string): Promise<{ file: FileObject; buffer: Buffer }> {
    const file = await this.getFileById(fileId);
    if (!file) {
      throw new Error("File not found.");
    }

    const exists = await this.storage.fileExists(file.objectKey);
    if (!exists) {
      throw new Error("File exists in database but not in storage. It may have been removed manually.");
    }

    const buffer = await this.storage.downloadFile(file.objectKey);
    return { file, buffer };
  }

  /** Soft-delete metadata and remove bytes from storage */
  async deleteFile(fileId: string): Promise<void> {
    const file = await this.getFileById(fileId);
    if (!file) {
      throw new Error("File not found.");
    }

    await this.storage.deleteFile(file.objectKey);

    await prisma.fileObject.update({
      where: { id: fileId },
      data: { status: "deleted" },
    });
  }

  /**
   * Verify integrity: download file again and compare SHA-256 hash
   * with the hash stored at upload time.
   */
  async verifyFile(fileId: string): Promise<VerifyResult> {
    const { file, buffer } = await this.downloadFile(fileId);
    const downloadedHash = computeSha256(buffer);
    const verified = downloadedHash === file.sha256Hash;

    return {
      fileId: file.id,
      originalName: file.originalName,
      storedHash: file.sha256Hash,
      downloadedHash,
      verified,
      message: verified
        ? "File verified successfully. Hash matches — file is intact."
        : "Verification failed. Hash does not match — file may be corrupted or tampered with.",
    };
  }
}

let fileServiceInstance: FileService | null = null;

export function getFileService(): FileService {
  if (!fileServiceInstance) {
    fileServiceInstance = new FileService();
  }
  return fileServiceInstance;
}
