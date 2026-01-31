# ChatGPT Export Studio

Offline-first tool to ingest, browse, search, and analyze ChatGPT export ZIPs. Combines a **Python CLI** (ingestion, chunking, fabric AI) with a **Nuxt 3 web UI** (browse, search, export, fabric AI actions).

## Prerequisites

- **Node.js** 18+
- **Python** 3.10+
- **wkhtmltopdf** (for PDF generation via fabric actions)

## Quick start

```bash
git clone git@git.pelerin.lan:quentin/chatgpt-export-studio.git
cd chatgpt-export-studio

# Install dependencies
npm install
python -m venv .venv
.venv/bin/pip install markdown

# Import a ChatGPT export ZIP
.venv/bin/python -m bandofy_export_studio.app --db bandofy_export_studio.sqlite3 import <path/to/export.zip>

# Start the web UI
npm run dev
```

The app opens at `http://localhost:3000`.

## Production build

```bash
npm run build
node .output/server/index.mjs
```

## CLI commands

```bash
# Import a ChatGPT export ZIP
.venv/bin/python -m bandofy_export_studio.app import <path/to/export.zip>

# List conversations
.venv/bin/python -m bandofy_export_studio.app list --limit 50

# Export a conversation as Markdown
.venv/bin/python -m bandofy_export_studio.app export-md <conversation_id> --out out.md --redact

# Export all messages as JSONL
.venv/bin/python -m bandofy_export_studio.app export-messages-jsonl --out messages.jsonl

# Export training pairs (user → assistant) as JSONL
.venv/bin/python -m bandofy_export_studio.app export-pairs-jsonl --out pairs.jsonl

# Export as Obsidian vault
.venv/bin/python -m bandofy_export_studio.app export-obsidian --out-dir vault_dir

# Chunk conversations for RAG
.venv/bin/python -m bandofy_export_studio.app chunk --max-chars 2500 --overlap-chars 250
```

## Fabric AI actions

The web UI integrates with [fabric](https://github.com/danielmiessler/fabric) to run AI patterns on conversations and projects (extract_wisdom, summarize, analyze_debate, etc.). Results are generated as PDFs and cached in `generated/`.

Requires `fabric` CLI installed and configured with a vendor/model.

## Notes

- **No network calls** for core features — import, browse, search, and export all run fully offline.
- Fabric AI actions require network access to reach the configured LLM provider.
- The parser supports the typical official ChatGPT export structure; if your export differs, open an issue.
