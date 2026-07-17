import { FileUploadForm } from "@/frontend/components/file-upload-form";
import { StorageStatusCard } from "@/frontend/components/storage-status-card";

export default function UploadPage() {
  const maxSizeMb = parseInt(process.env.MAX_UPLOAD_SIZE_MB ?? "50", 10);
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES ?? "pdf,docx,xlsx,csv,zip,png,jpg,jpeg,mp3,mp4")
    .split(",")
    .map((t) => t.trim())
    .join(", ");

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold text-slate-900">Upload a File</h1>
        <p className="mt-2 text-slate-600">
          Choose a file from your computer and click Upload. The file will be
          stored using the currently active storage provider (local or Sia).
          A SHA-256 hash is saved so you can verify the file later.
        </p>
      </section>

      <StorageStatusCard />

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <FileUploadForm allowedTypes={allowedTypes} maxSizeMb={maxSizeMb} />
      </section>
    </div>
  );
}
