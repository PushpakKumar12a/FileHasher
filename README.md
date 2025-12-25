# FileHasher (Hashner) 🔐

A fast, client-side file hashing web app built with **Vite + React**. Drag & drop one or more files, watch hashing progress, export hash reports 🧾, and compare against an older report to check integrity ✅.

## Features ✨

- **Client-side hashing (no upload):** hashes are computed in your browser.
- **Algorithms:** MD5, SHA-1, SHA-256, SHA-512 
- **Progress per file:** chunked hashing keeps the UI responsive 
- **Multiple files:** process many files in a single session 
- **Export reports:**
  - Per-file: download **TXT** or **PDF** report
  - All completed files: download a combined **TXT** or **PDF** report
- **Integrity check / tamper detection:**
  - Load a **previously exported report** and compare it with the currently generated hashes 
  - Flags files that **match** ✅ vs **changed** (tampered) ⚠️ and highlights files that are **new** 🆕

## Why this matters 🛡️

Hashes act like a file “fingerprint”. If the file contents change, the hash changes. That makes hashing useful for:
- verifying downloads or deliverables
- audit trails and evidence handling
- detecting accidental edits or corruption 
- validating build artifacts and backups

## Tech Stack 🧰

- React (Vite) 
- Tailwind CSS 
- `hash-wasm` for hashing 
- `jspdf` for PDF generation 
- `lucide-react` icons 

## Getting Started 🚀

### Prerequisites ✅

- Node.js (recommended: latest LTS) 
- A package manager: npm / pnpm / yarn / bun 

### Install 📥

```bash
npm install
```

### Run locally ▶️

```bash
npm run dev
```

## How to use 🧭

### Generate hashes 🔑
1. Drag & drop files (or use the file picker).
2. Choose the algorithm.
3. Wait for hashing to finish (progress shown per file) .
4. Export a report (TXT/PDF) for record keeping .

### Verify integrity (compare with an older report) 🧪
1. Hash the files again (same files you want to verify).
2. Click **Load Previous Report** and select a previously exported report (TXT/PDF).
3. Review the status for each file:
   - **Verified / Match:** hash is identical to the old report
   - **Tampered / Changed:** hash differs from the old report
   - **New:** file exists in the current session but wasn’t present in the old report

## Internal Working ⚙️

- Files are selected using drag & drop or a file picker.
- Each file is handled as a separate hashing job.
- Files are read in small chunks (1MB) to avoid high memory usage .
- Each chunk is passed to an incremental hasher (`hash-wasm`).
- Hashing progress updates after every chunk.
- After each chunk is processed, its data is released (discarded) to avoid buffering and keep memory usage low.
- After all chunks are processed, the final hash is generated.
- Hash results and file details are stored and can be exported as TXT or PDF.
- Errors in one file do not interrupt hashing of other files.

### Why Chunked Hashing? 🧩

- Prevents browser freezes on large files
- Uses less memory
- Allows real-time progress updates
- Scales to very large file sizes