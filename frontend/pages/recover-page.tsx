"use client";

import { useState } from "react";
import Link from "next/link";

interface RecoverResult {
  originalName: string;
  alreadyActive: boolean;
  message: string;
}

export default function RecoverPage() {
  const [recoveryKey, setRecoveryKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecoverResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/files/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recoveryKey: recoveryKey.trim() }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error ?? "Recovery failed.");
      }
      setResult(json.data);
      setRecoveryKey("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recovery failed.");
    } finally {
      setLoading(false);
    }
  }

  async function importRecoveryFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      const document = JSON.parse(await file.text()) as { recoveryKey?: unknown };
      if (typeof document.recoveryKey !== "string") {
        throw new Error("This file does not contain a valid recovery key.");
      }
      setRecoveryKey(document.recoveryKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read recovery file.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section>
        <h1 className="text-2xl font-bold text-slate-900">Recover a Sia File</h1>
        <p className="mt-2 text-slate-600">
          Paste your one-time recovery key or import the JSON recovery file.
          The app will verify the cloud object before restoring it to your file list.
        </p>
      </section>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label htmlFor="recovery-key" className="mb-2 block text-sm font-medium text-slate-700">
            Recovery key
          </label>
          <textarea
            id="recovery-key"
            value={recoveryKey}
            onChange={(event) => setRecoveryKey(event.target.value)}
            rows={3}
            placeholder="SBX1_..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div>
          <label htmlFor="recovery-file" className="mb-2 block text-sm font-medium text-slate-700">
            Or import a recovery file
          </label>
          <input
            id="recovery-file"
            type="file"
            accept=".json,application/json"
            onChange={(event) => importRecoveryFile(event.target.files?.[0])}
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !recoveryKey.trim()}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Recovering..." : "Recover File"}
        </button>
      </form>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-4 text-green-900">
          <p className="font-medium">{result.message}</p>
          <p className="mt-1 text-sm">File: {result.originalName}</p>
          <Link href="/files" className="mt-3 inline-block text-sm font-semibold text-indigo-700 hover:underline">
            Open Files
          </Link>
        </div>
      )}
    </div>
  );
}
