"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FileUploadFormProps {
  allowedTypes?: string;
  maxSizeMb?: number;
}

/**
 * Simple file upload form.
 * Sends the file to POST /api/files/upload as multipart form data.
 */
export function FileUploadForm({
  allowedTypes = "pdf, docx, xlsx, csv, zip, png, jpg, jpeg, mp3, mp4",
  maxSizeMb = 50,
}: FileUploadFormProps) {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!selectedFile) {
      setMessage({ type: "error", text: "Please choose a file first." });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Upload failed.");
      }

      setMessage({
        type: "success",
        text: `"${selectedFile.name}" uploaded successfully!`,
      });
      setSelectedFile(null);

      // Reset file input
      const input = document.getElementById("file-input") as HTMLInputElement | null;
      if (input) input.value = "";

      setTimeout(() => router.push("/files"), 1500);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Upload failed.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="file-input" className="mb-2 block text-sm font-medium text-slate-700">
          Choose a file
        </label>
        <input
          id="file-input"
          type="file"
          onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
        />
        <p className="mt-2 text-xs text-slate-500">
          Allowed types: {allowedTypes}. Max size: {maxSizeMb} MB.
        </p>
      </div>

      {selectedFile && (
        <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
          Selected: <strong>{selectedFile.name}</strong> (
          {(selectedFile.size / 1024).toFixed(1)} KB)
        </div>
      )}

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !selectedFile}
        className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Uploading..." : "Upload File"}
      </button>
    </form>
  );
}
