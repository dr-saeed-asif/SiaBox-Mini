"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FileTable, type FileRecord } from "@/frontend/components/file-table";
import { StorageStatusCard } from "@/frontend/components/storage-status-card";

export default function FilesPage() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/files");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Failed to load files.");
      }
      setFiles(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your Files</h1>
          <p className="mt-2 text-slate-600">
            All uploaded files are listed below. Use Download to get a copy,
            Verify to check the SHA-256 hash, or Delete to remove a file from
            storage.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchFiles}
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <Link
            href="/upload"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Upload New
          </Link>
        </div>
      </section>

      <StorageStatusCard />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading && files.length === 0 ? (
        <div className="text-center text-slate-500 py-12">Loading files...</div>
      ) : (
        <FileTable files={files} onRefresh={fetchFiles} />
      )}
    </div>
  );
}
