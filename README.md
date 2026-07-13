# SiaBox Mini — Simple Decentralized File Storage App

A beginner-friendly Next.js project that teaches you how to upload, list, download, delete, and verify files using a clean storage abstraction. It works out of the box with **local storage** (files on your disk) and can be switched to **Sia decentralized storage** with a single environment variable.

---

## 1. What is SiaBox Mini?

SiaBox Mini is a small full-stack app with:

- A web UI to upload, list, download, verify, and delete files
- A SQLite database (via Prisma) that stores file metadata
- A storage abstraction layer that can save file bytes either:
  - on your local disk (`local` mode), or
  - on the Sia decentralized network (`sia` mode)
- SHA-256 hash verification so you can prove a file was not corrupted

It is intentionally simple, so a developer with **zero Sia knowledge** can read the code top to bottom and understand every piece.

## 2. What is Sia? (in simple words)

Sia is a **decentralized cloud storage network**. Instead of storing your files on one company's servers (like AWS or Google Drive), Sia:

- splits your file into encrypted pieces,
- spreads those pieces across many independent computers ("hosts") around the world,
- pays those hosts with Siacoin cryptocurrency,
- and can rebuild your file from the pieces whenever you ask for it.

No single host can read your data (it's encrypted), and no single host going offline loses your data (there is redundancy). Think of it as "Dropbox, but run by thousands of strangers who can't see your files."

## 3. How local storage mode works

When `STORAGE_PROVIDER=local` in your `.env.local`:

1. You upload a file through the UI.
2. The backend computes its SHA-256 hash.
3. The file bytes are written to `./storage/uploads/<random-uuid>.<ext>`.
4. The metadata (name, size, hash, key, etc.) is saved to SQLite.

This mode needs **no external services** — perfect for learning and development.

## 4. How Sia storage mode works

When `STORAGE_PROVIDER=sia`:

1. Same upload flow, but instead of writing to disk, the backend uses the **AWS S3 SDK** to send the file to **renterd's S3-compatible API**.
2. renterd then encrypts the file and distributes it across Sia hosts.
3. Downloads, deletes, and existence checks go through the same S3 API.

The app code doesn't change at all — only the provider behind the `StorageProvider` interface changes. That is the whole point of the storage abstraction:

```
API route → FileService → StorageService → LocalProvider  (local mode)
                                         → SiaS3Provider  (sia mode)
```

## 5. How to set up .env.local

Copy the example file and adjust as needed:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env.local

# macOS / Linux
cp .env.example .env.local
```

The defaults work for local mode. Prisma also reads `DATABASE_URL`, which is included in `.env.example`.

> Note: Prisma CLI reads `.env` (not `.env.local`), so also create a plain `.env` with `DATABASE_URL="file:./dev.db"` for migrations. Next.js itself reads `.env.local` at runtime.

## 6. How to run the Prisma migration

```bash
npm install
npx prisma migrate dev --name init
```

This creates `prisma/dev.db` (SQLite) with the `FileObject` table.

## 7. How to run the app

```bash
npm run dev
```

Open http://localhost:3000 — you should see the home page with a green "Storage: local — Online" status card.

## 8. How to switch from local to Sia

1. Make sure `renterd` is running and its S3 API is enabled (see next section).
2. Create S3 credentials in the renterd config.
3. Edit `.env.local`:

```env
STORAGE_PROVIDER="sia"
SIA_S3_ENDPOINT="http://127.0.0.1:8080"
SIA_S3_ACCESS_KEY="your-access-key"
SIA_S3_SECRET_KEY="your-secret-key"
SIA_S3_BUCKET="siabox-mini"
```

4. Restart the dev server (`npm run dev`).
5. Check the home page — the status card should now say "Storage: sia".

New uploads will go to Sia. Files uploaded earlier in local mode stay on disk and are still downloadable as long as you don't delete them (each file records which provider stored it... actually in this simple app, downloads always use the *current* provider, so switch back to local mode to retrieve local files).

## 9. What is renterd?

`renterd` is the official Sia **renter** software from the Sia Foundation. A "renter" is someone who rents storage space from Sia hosts. renterd:

- manages your Siacoin wallet,
- forms contracts with storage hosts,
- encrypts, uploads, and repairs your data,
- and exposes two APIs: its own REST API and an **S3-compatible API**.

The S3-compatible API is the magic piece: it means any app or tool that speaks the AWS S3 protocol (like this project, using `@aws-sdk/client-s3`) can use Sia as a drop-in storage backend.

To try it: download renterd from https://sia.tech/software/renterd, run it, fund the wallet with Siacoin (testnet Zen is free), set your autopilot settings so contracts form, and enable S3 credentials in the config.

## 10. Common errors and fixes

| Error | Cause | Fix |
|---|---|---|
| `Environment variable not found: DATABASE_URL` when running Prisma | Prisma CLI reads `.env`, not `.env.local` | Create a `.env` file containing `DATABASE_URL="file:./dev.db"` |
| `Table main.FileObject does not exist` | Migration never ran | Run `npx prisma migrate dev --name init` |
| Status card shows "Sia S3 health check failed... Is renterd running?" | renterd is not running or wrong endpoint | Start renterd, confirm `SIA_S3_ENDPOINT` matches its S3 address |
| `403 Forbidden` / `InvalidAccessKeyId` from Sia | Wrong S3 credentials | Check `SIA_S3_ACCESS_KEY` and `SIA_S3_SECRET_KEY` match renterd's config |
| Upload rejected: "File type not allowed" | Extension not in whitelist | Add the extension to `ALLOWED_FILE_TYPES` in `.env.local` and restart |
| Upload rejected: "File is too large" | File exceeds limit | Raise `MAX_UPLOAD_SIZE_MB` in `.env.local` and restart |
| "File exists in database but not in storage" | You switched providers, or deleted the file manually from disk | Switch back to the original provider, or delete the record from the Files page |
| Uploads to Sia fail with `NoSuchBucket` | Bucket doesn't exist in renterd | The health check tries to auto-create it; otherwise create bucket `siabox-mini` in the renterd UI |

---

## Project structure

```
app/
  page.tsx                     ← Home page
  upload/page.tsx              ← Upload page
  files/page.tsx               ← Files list page
  api/
    files/route.ts             ← GET  /api/files (list)
    files/upload/route.ts      ← POST /api/files/upload
    files/[fileId]/route.ts    ← DELETE /api/files/[fileId]
    files/[fileId]/download/route.ts ← GET /api/files/[fileId]/download
    files/[fileId]/verify/route.ts   ← POST /api/files/[fileId]/verify
    storage/health/route.ts    ← GET /api/storage/health
components/
  file-upload-form.tsx         ← Upload form (client component)
  file-table.tsx               ← Files table
  file-actions.tsx             ← Download / Verify / Delete buttons
  storage-status-card.tsx      ← Storage health indicator
server/
  db/prisma.ts                 ← Prisma client singleton
  services/
    file.service.ts            ← File business logic
    storage/
      storage.interface.ts     ← StorageProvider contract
      storage.service.ts       ← Picks local or sia provider
      local.provider.ts        ← Files on disk
      sia-s3.provider.ts       ← Files on Sia via S3 API
  utils/
    hash.ts                    ← SHA-256 helper
    response.ts                ← JSON response helpers
  validators/
    file.schema.ts             ← Upload validation (size, type)
prisma/schema.prisma           ← FileObject model (SQLite)
storage/uploads/               ← Local mode file storage
.env.example                   ← Environment variable template
```

## The key idea to take away

The frontend and API routes never know *where* files are stored. They only talk to `FileService`, which talks to `StorageService`, which delegates to whichever `StorageProvider` is active. Swapping local disk for a decentralized network is a one-line config change — that is the power of a good abstraction.
