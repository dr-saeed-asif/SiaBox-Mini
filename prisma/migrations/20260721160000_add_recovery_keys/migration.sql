-- Add one-time recovery metadata without changing existing file records.
ALTER TABLE "FileObject" ADD COLUMN "recoveryKeyHash" TEXT;
ALTER TABLE "FileObject" ADD COLUMN "recoveryKeyCreatedAt" DATETIME;
ALTER TABLE "FileObject" ADD COLUMN "removedAt" DATETIME;

CREATE UNIQUE INDEX "FileObject_recoveryKeyHash_key"
ON "FileObject"("recoveryKeyHash");
