"use client";

import { useState } from "react";

interface FileActionsProps {
  fileId: string;
  fileName: string;
  onRefresh: () => void;
}

/**
 * Download, Verify, and Delete buttons for a single file row.
 */
export function FileActions({ fileId, fileName, onRefresh }: FileActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

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

  async function handleDelete() {
    if (!confirm(`Delete "${fileName}"? This cannot be undone.`)) return;

    setLoading("delete");
    try {
      const res = await fetch(`/api/files/${fileId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Delete failed.");
      }
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setLoading(null);
    }
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
          {loading === "delete" ? "..." : "Delete"}
        </button>
      </div>
      {verifyMessage && (
        <p className="max-w-xs text-xs text-slate-600">{verifyMessage}</p>
      )}
    </div>
  );
}
