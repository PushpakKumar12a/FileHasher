# FileHasher 🔐

A fast, client-side file hashing web app built with **Vite + React**. Drag & drop one or more files, watch hashing progress, and export hash reports.

## Features ✨

- **Client-side hashing (no upload):** hashes are computed in your browser. 🧠
- **Algorithms:** MD5, SHA-1, SHA-256, SHA-512 🔎
- **Progress per file:** chunked hashing keeps the UI responsive. 📈
- **Multiple files:** process many files in a single session. 🗂️
- **Export reports:** 📄
  - Per-file: download **TXT** or **PDF** report
  - All completed files: download a combined **TXT** or **PDF** report

## Tech Stack 🧰

- React (Vite) ⚡
- Tailwind CSS 🎨
- `hash-wasm` for hashing 🧮
- `jspdf` for PDF generation 🧾
- `lucide-react` icons ✨

## Getting Started 🚀

### Prerequisites ✅

- Node.js (recommended: latest LTS) 🟢
- A package manager: npm / pnpm / yarn / bun 📦

### Install 📥

```bash
npm install
```

### Run locally ▶️

```bash
npm run dev
```
## Internal Working ⚙️

- Files are selected using drag & drop or a file picker.
- Each file is handled as a separate hashing job.
- Files are read in small chunks (1MB) to avoid high memory usage.
- Each chunk is passed to an incremental hasher (`hash-wasm`).
- Hashing progress updates after every chunk.
- After each chunk is processed, its data is released (discarded) to avoid buffering and keep memory usage low.
- After all chunks are processed, the final hash is generated.
- Hash results and file details are stored and can be exported as TXT or PDF.
- Errors in one file do not interrupt hashing of other files.

### Why Chunked Hashing? 🧩

- Prevents browser freezes on large files 🧊
- Uses less memory 🧠
- Allows real-time progress updates ⏱️
- Scales to very large file sizes 🚀