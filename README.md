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

1. Complete the full **renterd setup** in section 9 below (download, configure, start, fund wallet, wait for contracts).
2. Edit `.env.local`:

```env
STORAGE_PROVIDER="sia"
SIA_S3_ENDPOINT="http://127.0.0.1:8080"
SIA_S3_REGION="us-east-1"
SIA_S3_ACCESS_KEY="your-access-key-from-wizard"
SIA_S3_SECRET_KEY="your-secret-key-from-wizard"
SIA_S3_BUCKET="siabox-mini"
SIA_S3_FORCE_PATH_STYLE="true"
```

3. Restart the Next.js dev server (`npm run dev`).
4. Open the home page — the status card should say **Storage: sia — Online**.

New uploads will go to Sia. In this simple app, downloads always use the *current* provider, so switch back to `STORAGE_PROVIDER=local` if you need to retrieve files that were uploaded in local mode.

---

## 9. Full renterd setup (Windows step-by-step)

### 9.1 What is renterd?

`renterd` is the official Sia **renter** software from the Sia Foundation. A "renter" is someone who rents storage space from Sia hosts. renterd:

- manages your Siacoin wallet,
- forms contracts with storage hosts,
- encrypts, uploads, and repairs your data,
- and exposes two APIs: its own Web UI / REST API (**port 9980**) and an **S3-compatible API** (**port 8080**).

The S3-compatible API is the magic piece: any app that speaks the AWS S3 protocol (including SiaBox Mini via `@aws-sdk/client-s3`) can use Sia as a drop-in storage backend.

> **Note:** The main [Sia software downloads](https://sia.tech/software-downloads) page currently lists **indexd**, **hostd**, and **walletd** — not renterd. For SiaBox Mini you need **renterd**, which you download from GitHub (see below). You do **not** need Docker or `docker-compose.yml` for this Windows demo.

### 9.2 Download the correct Windows binary

1. Open the GitHub releases page:  
   **https://github.com/SiaFoundation/renterd/releases**
2. Download **`renterd_windows_amd64.zip`** (latest stable release, e.g. v2.9.2).

   | File | Platform | Use? |
   |---|---|---|
   | `renterd_windows_amd64.zip` | Windows | **Yes — use this** |
   | `renterd_darwin_amd64.zip` | macOS Intel | No |
   | `renterd_linux_amd64.zip` | Linux | No |

3. Extract the zip to a folder such as `C:\renterd\`.
4. Confirm you see **`renterd.exe`** (not a file named `renterd` without `.exe` — that usually means you downloaded the macOS/Linux build by mistake).

```powershell
cd C:\renterd
dir
# Expected: renterd.exe, LICENSE, README.md
```

### 9.3 Run the configuration wizard

```powershell
cd C:\renterd
.\renterd.exe config
```

Answer the prompts like this:

| Prompt | What to enter |
|---|---|
| Change data directory? | `no` (or press Enter for default) |
| Seed phrase | Type `seed` to generate a **new** recovery phrase |
| Recovery phrase | **Copy and save it somewhere safe** — this controls your wallet |
| Admin / API password | e.g. `Test1234` (used for the Web UI) |
| Configure S3? | `yes` |
| S3 address | Press Enter (default: `localhost:8080`) |
| Generate key pair? | Type `auto` |
| Access key + secret key | **Write them down** — you will put them in `.env.local` |
| Advanced settings? | `no` |

Config is saved to:

```
C:\Users\<YourUsername>\AppData\Roaming\renterd\renterd.yml
```

Typical S3-related settings in that file:

```yaml
http:
  address: localhost:9980
  password: Test1234
s3:
  address: localhost:8080
  enabled: true
  # keypairs / credentials come from the wizard
```

### 9.4 Start renterd (with instant sync)

On first start, renterd must sync with the Sia blockchain. A full sync from genesis can take a very long time. For a **new wallet**, use **instant sync**:

```powershell
cd C:\renterd
.\renterd.exe --instant
```

Keep this terminal open. You should see messages like:

- `api: Listening on 127.0.0.1:9980`
- `s3: Listening on 127.0.0.1:8080`
- (with `--instant`) `synced to checkpoint ...`

If you already started without `--instant` and sync is stuck at very old blocks, stop renterd, rename the old consensus DB, then start with instant sync:

```powershell
Stop-Process -Name renterd -Force -ErrorAction SilentlyContinue
Rename-Item "$env:APPDATA\renterd\consensus.db" "consensus.db.old-sync" -Force
cd C:\renterd
.\renterd.exe --instant
```

> Instant sync only works cleanly on wallets without old v1 history. For a brand-new seed from the wizard, it is the recommended path.

Allow renterd through Windows Firewall if Windows asks (ports **9980**, **8080**, and peer traffic on **9981**).

### 9.5 Open the renterd Web UI

1. Browser: **http://127.0.0.1:9980**
2. Log in with the password you set in the wizard (e.g. `Test1234`).
3. Confirm the node is **synced** (consensus synced).

Quick PowerShell check (replace `Test1234` with your password):

```powershell
$headers = @{
  Authorization = "Basic " + [Convert]::ToBase64String(
    [Text.Encoding]::ASCII.GetBytes(":Test1234")
  )
}
Invoke-RestMethod -Uri "http://127.0.0.1:9980/api/bus/consensus/state" -Headers $headers
# Expect: "synced": true
```

| Service | URL / Port |
|---|---|
| Web UI + REST API | http://127.0.0.1:9980 |
| S3-compatible API | http://127.0.0.1:8080 |
| Peer / gateway | :9981 |

### 9.6 Fund the wallet with Siacoin (SC)

Uploads on mainnet need **Siacoin** so autopilot can form contracts with hosts.

1. In the renterd Web UI, open the **Wallet** section.
2. Copy your wallet address.
3. Send Siacoin (SC) to that address from an exchange or another wallet.
4. Wait for the balance to appear as **confirmed / spendable**.

Without SC, you may see logs like `contract formations skipped, wallet is empty` and uploads will fail with "not enough hosts".

### 9.7 Wait for storage contracts (important)

By default, Sia redundancy needs about **30 host contracts** before uploads succeed (10 data shards + 20 parity).

1. Leave renterd running so **autopilot** can scan hosts and form contracts (often every ~30 minutes).
2. In the Web UI, open **Contracts** — watch active contracts grow (e.g. 5 → 10 → 30).
3. Open your bucket (`siabox-mini`). When you see progress like **30/30**, uploads are ready.

Until then, you may see:

```text
not enough hosts to support requested upload redundancy
```

or in the UI:

```text
There are not enough contracts to upload data yet. ... 10/30
```

**Optional (learning / demos only):** lower redundancy in the renterd **Configuration** UI (for example Min Shards `4`, Total Shards `10`) so you can test with fewer contracts. For production-like storage, prefer waiting for ~30 contracts.

### 9.8 Connect SiaBox Mini to renterd

1. Put the S3 access key and secret from the config wizard into `.env.local` (see section 8).
2. Restart Next.js: `npm run dev`.
3. Check SiaBox Mini health:

```powershell
Invoke-WebRequest http://localhost:3000/api/storage/health -UseBasicParsing
```

Expected response shape:

```json
{
  "success": true,
  "data": {
    "provider": "sia",
    "healthy": true,
    "message": "Connected to Sia S3 bucket \"siabox-mini\""
  }
}
```

4. Upload a file from http://localhost:3000/upload and confirm it appears under **Files**.

### 9.9 renterd checklist

Use this before switching SiaBox Mini to `STORAGE_PROVIDER=sia`:

- [ ] Downloaded **Windows** zip (`renterd_windows_amd64.zip`)
- [ ] `C:\renterd\renterd.exe` exists
- [ ] Ran `.\renterd.exe config` and saved seed + S3 keys
- [ ] Started with `.\renterd.exe --instant`
- [ ] Web UI works at http://127.0.0.1:9980
- [ ] Consensus **synced: true**
- [ ] Wallet has spendable Siacoin
- [ ] Active contracts ≥ required redundancy (usually ~30)
- [ ] S3 listening on port **8080**
- [ ] `.env.local` has matching S3 keys and `STORAGE_PROVIDER=sia`
- [ ] SiaBox Mini health card shows **sia / Online**

### 9.10 Do you need Docker or docker-compose?

**No.** For this beginner project on Windows:

- Run **renterd.exe** directly.
- Run **SiaBox Mini** with `npm run dev`.
- Use SQLite (no separate database container).

`docker-compose.yml` is optional and only useful if you later want a multi-container / Linux server deployment. It is **not required** for SiaBox Mini.

---

## 10. Common errors and fixes

| Error | Cause | Fix |
|---|---|---|
| `Environment variable not found: DATABASE_URL` when running Prisma | Prisma CLI reads `.env`, not `.env.local` | Create a `.env` file containing `DATABASE_URL="file:./dev.db"` |
| `Table main.FileObject does not exist` | Migration never ran | Run `npx prisma migrate dev --name init` |
| `.\renterd.exe` is not recognized | Wrong folder, or macOS/Linux binary extracted | Use `renterd_windows_amd64.zip` and run from `C:\renterd` |
| Status card shows "Sia S3 health check failed... Is renterd running?" | renterd is not running or wrong endpoint | Start renterd, confirm `SIA_S3_ENDPOINT=http://127.0.0.1:8080` |
| `consensus is not synced` | Blockchain sync not finished | Start with `.\renterd.exe --instant`; wait until `synced: true` in Web UI / API |
| `not enough hosts to support requested upload redundancy` | Fewer contracts than required shards (e.g. 10 &lt; 30) | Wait for autopilot to form more contracts, or lower redundancy in renterd Configuration |
| `403 Forbidden` / `InvalidAccessKeyId` from Sia | Wrong S3 credentials | Match `SIA_S3_ACCESS_KEY` / `SIA_S3_SECRET_KEY` to the keys from `renterd.exe config` |
| Upload rejected: "File type not allowed" | Extension not in whitelist | Add the extension to `ALLOWED_FILE_TYPES` in `.env.local` and restart |
| Upload rejected: "File is too large" | File exceeds limit | Raise `MAX_UPLOAD_SIZE_MB` in `.env.local` and restart |
| "File exists in database but not in storage" | You switched providers, or deleted the file manually from disk | Switch back to the original provider, or delete the record from the Files page |
| Uploads to Sia fail with `NoSuchBucket` | Bucket doesn't exist in renterd | Health check may auto-create it; otherwise create bucket `siabox-mini` in the renterd UI |
| Autopilot still shows 0 contracts after funding | Autopilot loop last ran before deposit | Keep renterd running, or restart renterd and wait for the next contract formation cycle |

---

## Project structure

The project is split into **frontend/** and **backend/** folders.
Next.js still needs a thin **app/** folder for routing (required by the App Router).
Those `app/` files only re-export from `frontend/` and `backend/`.

```
frontend/                          ← All UI code
  pages/
    home-page.tsx                  ← Home page UI
    upload-page.tsx                ← Upload page UI
    files-page.tsx                 ← Files list page UI
  components/
    app-shell.tsx                  ← Header / nav / footer
    file-upload-form.tsx           ← Upload form
    file-table.tsx                 ← Files table
    file-actions.tsx               ← Download / Verify / Delete
    storage-status-card.tsx        ← Storage health indicator
  styles/
    globals.css                    ← Tailwind + base styles

backend/                           ← All server / business logic
  api/
    files/
      list.ts                      ← List files handler
      upload.ts                    ← Upload handler
      delete.ts                    ← Delete handler
      download.ts                  ← Download handler
      verify.ts                    ← Verify (SHA-256) handler
    storage/
      health.ts                    ← Storage health handler
  db/prisma.ts                     ← Prisma client singleton
  services/
    file.service.ts                ← File business logic
    storage/
      storage.interface.ts         ← StorageProvider contract
      storage.service.ts           ← Picks local or sia provider
      local.provider.ts            ← Files on disk
      sia-s3.provider.ts           ← Files on Sia via S3 API
  utils/
    hash.ts                        ← SHA-256 helper
    response.ts                    ← JSON response helpers
  validators/
    file.schema.ts                 ← Upload validation (size, type)

app/                               ← Thin Next.js routing only (required)
  layout.tsx                       ← Wires AppShell
  page.tsx                         ← Re-exports HomePage
  upload/page.tsx                  ← Re-exports UploadPage
  files/page.tsx                   ← Re-exports FilesPage
  api/...                          ← Re-exports backend API handlers

prisma/schema.prisma               ← FileObject model (SQLite)
storage/uploads/                   ← Local mode file storage
.env.example                       ← Environment variable template
```

## The key idea to take away

The frontend and API routes never know *where* files are stored. They only talk to `FileService`, which talks to `StorageService`, which delegates to whichever `StorageProvider` is active. Swapping local disk for a decentralized network is a one-line config change — that is the power of a good abstraction.
