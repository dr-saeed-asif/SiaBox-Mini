import { randomUUID } from "crypto";
import path from "path";
import { prisma } from "@/backend/db/prisma";
import { getStorageService } from "@/backend/services/storage/storage.service";
import { computeSha256 } from "@/backend/utils/hash";
import {
  generateRecoveryKey,
  hashRecoveryKey,
  recoveryKeyMatches,
} from "@/backend/utils/recovery-key";
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

export interface DeleteResult {
  fileId: string;
  storageProvider: string;
  cloudCopyRetained: boolean;
  message: string;
}

export interface RecoveryManifest {
  version: 1;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  sha256Hash: string;
  storageProvider: "sia";
  bucket: string;
  objectKey: string;
  issuedAt: string;
}

export interface RecoveryKeyResult {
  recoveryKey: string;
  manifest: RecoveryManifest;
}

export interface RecoverResult {
  fileId: string;
  originalName: string;
  alreadyActive: boolean;
  message: string;
}

export type FileListItem = Pick<
  FileObject,
  | "id"
  | "originalName"
  | "mimeType"
  | "sizeBytes"
  | "sha256Hash"
  | "storageProvider"
  | "bucket"
  | "status"
  | "createdAt"
  | "updatedAt"
>;

/**
 * FileService handles all file business logic.
 * API routes stay thin — they parse requests and call this service.
 */
export class FileService {
  private storage = getStorageService();

  /** List all active files, newest first */
  async listFiles(): Promise<FileListItem[]> {
    return prisma.fileObject.findMany({
      where: { status: "active" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        sizeBytes: true,
        sha256Hash: true,
        storageProvider: true,
        bucket: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
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

    const exists = await this.storage.fileExists(
      file.objectKey,
      file.storageProvider,
      file.bucket
    );
    if (!exists) {
      throw new Error("File exists in database but not in storage. It may have been removed manually.");
    }

    const buffer = await this.storage.downloadFile(
      file.objectKey,
      file.storageProvider,
      file.bucket
    );
    return { file, buffer };
  }

  /** Issue a new one-time recovery key before a Sia file is removed locally. */
  async createRecoveryKey(fileId: string): Promise<RecoveryKeyResult> {
    const file = await this.getFileById(fileId);
    if (!file) {
      throw new Error("File not found.");
    }
    if (file.storageProvider !== "sia") {
      throw new Error("Recovery keys are available only for files stored on Sia.");
    }

    const exists = await this.storage.fileExists(
      file.objectKey,
      file.storageProvider,
      file.bucket
    );
    if (!exists) {
      throw new Error("The Sia cloud object could not be verified. Recovery key was not issued.");
    }

    const recoveryKey = generateRecoveryKey();
    const issuedAt = new Date();
    await prisma.fileObject.update({
      where: { id: file.id },
      data: {
        recoveryKeyHash: hashRecoveryKey(recoveryKey),
        recoveryKeyCreatedAt: issuedAt,
      },
    });

    return {
      recoveryKey,
      manifest: {
        version: 1,
        originalName: file.originalName,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        sha256Hash: file.sha256Hash,
        storageProvider: "sia",
        bucket: file.bucket,
        objectKey: file.objectKey,
        issuedAt: issuedAt.toISOString(),
      },
    };
  }

  /**
   * Remove a file from this app. Sia bytes are deliberately retained; only
   * local-provider bytes are removed from disk.
   */
  async deleteFile(fileId: string, recoveryKey?: string): Promise<DeleteResult> {
    const file = await this.getFileById(fileId);
    if (!file) {
      throw new Error("File not found.");
    }

    if (file.storageProvider !== "sia" && file.storageProvider !== "local") {
      throw new Error(`Unsupported storage provider "${file.storageProvider}".`);
    }

    const cloudCopyRetained = file.storageProvider === "sia";

    if (cloudCopyRetained) {
      if (!file.recoveryKeyHash) {
        throw new Error("Generate and save a recovery key before removing this Sia file.");
      }
      if (!recoveryKey || !recoveryKeyMatches(recoveryKey, file.recoveryKeyHash)) {
        throw new Error("Recovery key does not match this file.");
      }

      const exists = await this.storage.fileExists(
        file.objectKey,
        file.storageProvider,
        file.bucket
      );
      if (!exists) {
        throw new Error("The Sia cloud object could not be verified, so the file was not removed locally.");
      }
    } else {
      await this.storage.deleteLocalFile(file.objectKey);
    }

    await prisma.fileObject.update({
      where: { id: fileId },
      data: { status: "deleted", removedAt: new Date() },
    });

    return {
      fileId: file.id,
      storageProvider: file.storageProvider,
      cloudCopyRetained,
      message: cloudCopyRetained
        ? "File removed from this app. The Sia cloud copy was retained."
        : "Local file removed successfully.",
    };
  }

  /** Restore a locally removed Sia record with its one-time recovery key. */
  async recoverFile(recoveryKey: string): Promise<RecoverResult> {
    const recoveryKeyHash = hashRecoveryKey(recoveryKey);
    const file = await prisma.fileObject.findUnique({
      where: { recoveryKeyHash },
    });

    if (!file || file.storageProvider !== "sia") {
      throw new Error("Recovery key is invalid or no longer available.");
    }

    if (file.status === "active") {
      return {
        fileId: file.id,
        originalName: file.originalName,
        alreadyActive: true,
        message: "This file is already active in your file list.",
      };
    }

    const exists = await this.storage.fileExists(
      file.objectKey,
      file.storageProvider,
      file.bucket
    );
    if (!exists) {
      throw new Error("The recovery record was found, but the Sia cloud object is unavailable.");
    }

    await prisma.fileObject.update({
      where: { id: file.id },
      data: {
        status: "active",
        removedAt: null,
        recoveryKeyHash: null,
        recoveryKeyCreatedAt: null,
      },
    });

    return {
      fileId: file.id,
      originalName: file.originalName,
      alreadyActive: false,
      message: "File recovered successfully. It is available in your file list again.",
    };
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
