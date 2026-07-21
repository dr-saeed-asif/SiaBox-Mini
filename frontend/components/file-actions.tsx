"use client";

import { useState } from "react";

interface RecoveryManifest {
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

interface RecoveryPackage {
  recoveryKey: string;
  manifest: RecoveryManifest;
}

interface FileActionsProps {
  fileId: string;
  fileName: string;
  storageProvider: string;
  onRefresh: () => void;
}

/**
 * Download, Verify, and local-removal buttons for a single file row.
 */
export function FileActions({
  fileId,
  fileName,
  storageProvider,
  onRefresh,
}: FileActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [recoveryPackage, setRecoveryPackage] = useState<RecoveryPackage | null>(null);
  const [recoverySaved, setRecoverySaved] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  async function handleDownload() {
    setLoading("download");
    try {
      const res = await fetch(`/api/files/${fileId}/download`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Download failed.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setLoading(null);
    }
  }

  async function handleVerify() {
    setLoading("verify");
    setVerifyMessage(null);
    try {
      const res = await fetch(`/api/files/${fileId}/verify`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Verification failed.");
      }
      setVerifyMessage(json.data.message);
    } catch (err) {
      setVerifyMessage(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setLoading(null);
    }
  }

  async function performDelete(recoveryKey?: string) {
    setLoading("delete");
    try {
      const res = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
        headers: recoveryKey ? { "Content-Type": "application/json" } : undefined,
        body: recoveryKey ? JSON.stringify({ recoveryKey }) : undefined,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Delete failed.");
      }
      setRecoveryPackage(null);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete() {
    if (storageProvider !== "sia") {
      if (!confirm(`Delete the local file "${fileName}"?`)) return;
      await performDelete();
      return;
    }

    setLoading("recovery");
    setCopyMessage(null);
    setRecoverySaved(false);
    try {
      const res = await fetch(`/api/files/${fileId}/recovery-key`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Could not create recovery key.");
      }
      setRecoveryPackage(json.data);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not create recovery key.");
    } finally {
      setLoading(null);
    }
  }

  async function copyRecoveryKey() {
    if (!recoveryPackage) return;
    try {
      await navigator.clipboard.writeText(recoveryPackage.recoveryKey);
      setRecoverySaved(true);
      setCopyMessage("Recovery key copied.");
    } catch {
      setCopyMessage("Copy failed. Select and copy the key manually.");
    }
  }

  function downloadRecoveryFile() {
    if (!recoveryPackage) return;
    const recoveryDocument = {
      format: "SiaBox Mini Recovery File",
      recoveryKey: recoveryPackage.recoveryKey,
      ...recoveryPackage.manifest,
    };
    const blob = new Blob([JSON.stringify(recoveryDocument, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, "_");
    link.href = url;
    link.download = `${safeName}.siabox-recovery.json`;
    link.click();
    URL.revokeObjectURL(url);
    setRecoverySaved(true);
    setCopyMessage("Recovery file downloaded.");
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleDownload}
          disabled={!!loading}
          className="rounded bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading === "download" ? "..." : "Download"}
        </button>
        <button
          onClick={handleVerify}
          disabled={!!loading}
          className="rounded bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading === "verify" ? "..." : "Verify"}
        </button>
        <button
          onClick={handleDelete}
          disabled={!!loading}
          className="rounded bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading === "delete" || loading === "recovery"
            ? "..."
            : storageProvider === "sia"
              ? "Remove"
              : "Delete"}
        </button>
      </div>
      {verifyMessage && (
        <p className="max-w-xs text-xs text-slate-600">{verifyMessage}</p>
      )}

      {recoveryPackage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`recovery-title-${fileId}`}
        >
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl">
            <h2 id={`recovery-title-${fileId}`} className="text-xl font-bold text-slate-900">
              Save your recovery key
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Keep this key or download the recovery file before removing
              <strong> {fileName}</strong>. The Sia cloud copy will remain intact.
            </p>

            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                One-time recovery key
              </p>
              <code className="mt-2 block break-all text-sm text-slate-900">
                {recoveryPackage.recoveryKey}
              </code>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copyRecoveryKey}
                className="rounded-lg border border-indigo-300 bg-white px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
              >
                Copy key
              </button>
              <button
                type="button"
                onClick={downloadRecoveryFile}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Download recovery file
              </button>
            </div>

            {copyMessage && <p className="mt-3 text-sm text-slate-600">{copyMessage}</p>}

            <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => setRecoveryPackage(null)}
                disabled={loading === "delete"}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => performDelete(recoveryPackage.recoveryKey)}
                disabled={!recoverySaved || loading === "delete"}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading === "delete" ? "Removing..." : "I saved it — Remove"}
              </button>
            </div>
            {!recoverySaved && (
              <p className="mt-2 text-right text-xs text-amber-700">
                Copy the key or download the recovery file to continue.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
