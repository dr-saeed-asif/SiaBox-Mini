"use client";

import { useEffect, useState } from "react";

interface StorageHealth {
  provider: string;
  healthy: boolean;
  message: string;
}

/**
 * Shows whether the current storage backend (local or Sia) is working.
 */
export function StorageStatusCard() {
  const [health, setHealth] = useState<StorageHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHealth() {
      try {
        const res = await fetch("/api/storage/health");
        const json = await res.json();
        if (json.success) {
          setHealth(json.data);
        }
      } catch {
        setHealth({
          provider: "unknown",
          healthy: false,
          message: "Could not reach storage health API.",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchHealth();
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
        Checking storage status...
      </div>
    );
  }

  if (!health) return null;

  return (
    <div
      className={`rounded-lg border p-4 ${
        health.healthy
          ? "border-green-200 bg-green-50"
          : "border-amber-200 bg-amber-50"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${
            health.healthy ? "bg-green-500" : "bg-amber-500"
          }`}
        />
        <span className="text-sm font-medium text-slate-800">
          Storage: {health.provider}
        </span>
        <span
          className={`text-xs font-medium ${
            health.healthy ? "text-green-700" : "text-amber-700"
          }`}
        >
          {health.healthy ? "Online" : "Issue detected"}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-600">{health.message}</p>
    </div>
  );
}
