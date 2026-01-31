# CLAUDE.md — ChatGPT Export Studio

## Project overview

Offline-first tool to ingest, browse, search, and analyze ChatGPT export ZIPs. Combines a **Python CLI** (ingestion, chunking, fabric AI) with a **Nuxt 3 web UI** (browse, search, export, fabric AI actions).

## Architecture

```
bandofy_export_studio/   Python package — CLI, ingestion, worker
  core.py                Parsing, SQLite DB class, export pipelines
  app.py                 CLI entrypoint (import, export-md, chunk, etc.)
  worker.py              Fabric AI async worker (job execution, MD→PDF)

app/                     Nuxt 3 frontend (SPA, no SSR)
  pages/                 File-based routing (index, conversations/[id], search)
  components/            Vue 3 SFCs (AppHeader, MessageBubble, FabricActions, etc.)
  composables/           Composition API hooks (useConversations, useJobs, etc.)
  layouts/               default.vue
  assets/css/            Tailwind CSS

server/                  Nitro server (API routes)
  api/                   REST endpoints
    conversations/       CRUD conversations + messages
    projects/            List projects
    jobs/                Fabric AI job management (POST, SSE stream, download)
    export/              Markdown, JSONL, Obsidian exports
  utils/
    db.ts                Read-only SQLite connection (conversations, messages, projects)
    jobsDb.ts            Read-write SQLite connection (jobs table)

shared/types/index.ts    Shared TypeScript interfaces and constants
```

## Tech stack

- **Frontend:** Nuxt 3 (SPA mode), Vue 3, Tailwind CSS, TypeScript
- **Backend:** Nitro (h3), better-sqlite3
- **Python:** stdlib + `markdown` lib
- **PDF generation:** `markdown` (Python) → HTML → `wkhtmltopdf`
- **AI:** `fabric` CLI with `GrokAI` vendor / `grok-4-1-fast-non-reasoning` model
- **Database:** SQLite3 with FTS5 full-text search, WAL mode

## Commands

```bash
# Install
npm install
.venv/bin/pip install markdown

# Dev server
npm run dev              # Nuxt dev (hot-reload)

# Build
npm run build            # Production build → .output/

# Python CLI
.venv/bin/python -m bandofy_export_studio.app --db bandofy_export_studio.sqlite3 import <zip>
.venv/bin/python -m bandofy_export_studio.app list
.venv/bin/python -m bandofy_export_studio.app chunk

# Fabric worker (called automatically by server, not manually)
.venv/bin/python -m bandofy_export_studio.worker --job-id <uuid>
```

## Database

Single SQLite file: `bandofy_export_studio.sqlite3`

- **Read-only** from `server/utils/db.ts` (conversations, messages, projects, chunks)
- **Read-write** from `server/utils/jobsDb.ts` (jobs table only)
- **Read-write** from Python (`core.py` for ingestion, `worker.py` for job status)
- WAL mode enabled everywhere

## Fabric AI jobs

Async job system: Nitro creates a job row → spawns Python worker → worker runs fabric CLI → converts to PDF → updates status. Frontend streams progress via SSE (`/api/jobs/:id/stream`).

Generated PDFs are cached in `generated/` (gitignored). Cache key: `(target_id, pattern)`.

**Conversation patterns:** extract_wisdom, summarize, analyze_debate, rate_content, create_report_finding
**Project patterns:** summarize, extract_wisdom, analyze_paper

Fabric output language: **French** (instruction prepended to input).

## Code conventions

- Vue components: SFCs with `<script setup lang="ts">`, Composition API
- Styling: Tailwind utility classes only, zinc/blue/emerald/violet/amber palette
- API routes: one file per route, named `verb.ts` (e.g., `index.get.ts`)
- Composables: `use*.ts`, auto-imported from `app/composables/`
- No SSR (`ssr: false` in nuxt.config.ts)
- Imports use `~~/shared/types` for shared types, `~/composables/` for composables
