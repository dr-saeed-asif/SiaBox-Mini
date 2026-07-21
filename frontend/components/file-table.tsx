"use client";

import { FileActions } from "./file-actions";

export interface FileRecord {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storageProvider: string;
  createdAt: string;
}

interface FileTableProps {
  files: FileRecord[];
  onRefresh: () => void;
}

/** Format bytes into a human-readable size */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Format ISO date for display */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

/**
 * Table showing all uploaded files with action buttons.
 */
export function FileTable({ files, onRefresh }: FileTableProps) {
  if (files.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
        <p className="text-slate-600">No files uploaded yet.</p>
        <p className="mt-1 text-sm text-slate-500">
          Go to the Upload page to add your first file.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-700">File Name</th>
            <th className="px-4 py-3 text-left font-medium text-slate-700">Size</th>
            <th className="px-4 py-3 text-left font-medium text-slate-700">MIME Type</th>
            <th className="px-4 py-3 text-left font-medium text-slate-700">Provider</th>
            <th className="px-4 py-3 text-left font-medium text-slate-700">Uploaded</th>
            <th className="px-4 py-3 text-left font-medium text-slate-700">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {files.map((file) => (
            <tr key={file.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">{file.originalName}</td>
              <td className="px-4 py-3 text-slate-600">{formatSize(file.sizeBytes)}</td>
              <td className="px-4 py-3 text-slate-600">{file.mimeType}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    file.storageProvider === "sia"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {file.storageProvider}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-600">{formatDate(file.createdAt)}</td>
              <td className="px-4 py-3">
                <FileActions
                  fileId={file.id}
                  fileName={file.originalName}
                  storageProvider={file.storageProvider}
                  onRefresh={onRefresh}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
