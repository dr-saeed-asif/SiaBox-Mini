import Link from "next/link";
import { StorageStatusCard } from "@/frontend/components/storage-status-card";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-xl bg-white p-8 shadow-sm border border-slate-200">
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome to SiaBox Mini
        </h1>
        <p className="mt-4 text-lg text-slate-600 leading-relaxed">
          SiaBox Mini is a simple file storage app built to teach you how
          decentralized storage works. Upload files, list them, download them,
          delete them, and verify their integrity — all through a clean web
          interface.
        </p>
        <p className="mt-3 text-slate-600 leading-relaxed">
          The app starts with <strong>local storage</strong> (files saved on
          your computer) so you can learn the basics without any extra setup.
          When you are ready, switch to <strong>Sia storage</strong> to store
          files on the decentralized Sia network using renterd&apos;s S3-compatible
          API.
        </p>
      </section>

      <StorageStatusCard />

      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/upload"
          className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
        >
          <h2 className="text-xl font-semibold text-indigo-700 group-hover:text-indigo-800">
            Upload File
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Pick a file from your computer and upload it to storage. The app
            computes a SHA-256 hash so you can verify integrity later.
          </p>
        </Link>

        <Link
          href="/files"
          className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
        >
          <h2 className="text-xl font-semibold text-indigo-700 group-hover:text-indigo-800">
            View Files
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            See all uploaded files in a table. Download, verify, or delete any
            file with one click.
          </p>
        </Link>
      </section>

      <section className="rounded-xl bg-indigo-50 border border-indigo-100 p-6">
        <h2 className="text-lg font-semibold text-indigo-900">How it works</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-indigo-800">
          <li>You upload a file through the web UI.</li>
          <li>The backend validates it, computes a SHA-256 hash, and saves metadata to SQLite.</li>
          <li>The file bytes go to a storage provider (local folder or Sia S3).</li>
          <li>You can download, verify (re-check the hash), or delete the file anytime.</li>
        </ol>
      </section>
    </div>
  );
}
