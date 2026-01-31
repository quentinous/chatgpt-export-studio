"""
Fabric AI worker — executes a job from the jobs table.

Usage:
    .venv/bin/python -m bandofy_export_studio.worker --job-id <uuid>

Flow (conversation):
    1. Export conversation → markdown
    2. Run fabric CLI with the pattern
    3. Convert fabric output (markdown) → HTML → PDF via wkhtmltopdf
    4. Save PDF to generated/conversations/{id}/{pattern}.pdf

Flow (project):
    1. List all conversations for the project
    2. Export each to markdown (updating progress)
    3. Concatenate all markdown
    4. Run fabric CLI
    5. Convert to PDF
    6. Save PDF to generated/projects/{gizmo_id}/{pattern}.pdf
"""
from __future__ import annotations

import argparse
import json
import os
import sqlite3
import subprocess
import sys
import time
import traceback
from pathlib import Path

import markdown as md_lib

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "bandofy_export_studio.sqlite3")

FABRIC_VENDOR = "GrokAI"
FABRIC_MODEL = "grok-4-1-fast-non-reasoning"
FABRIC_LANGUAGE = "fr"

# Strategy per pattern — pick the reasoning approach best suited to each task.
PATTERN_STRATEGIES: dict[str, str] = {
    "extract_wisdom": "cot",              # methodical structured extraction
    "summarize": "self-refine",           # iteratively improve the summary
    "analyze_debate": "cot",              # step-by-step debate analysis
    "rate_content": "self-consistent",    # reliable multi-pass rating
    "create_report_finding": "self-refine",  # polished formal report
    "analyze_paper": "cot",              # systematic academic analysis
}


# ─── DB helpers ───────────────────────────────────────────────────

def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def _update_status(conn: sqlite3.Connection, job_id: str, status: str, **kwargs):
    sets = ["status = ?"]
    vals: list = [status]
    if status == "running":
        sets.append("started_at = ?")
        vals.append(int(time.time()))
    if status in ("done", "failed"):
        sets.append("finished_at = ?")
        vals.append(int(time.time()))
    for k, v in kwargs.items():
        sets.append(f"{k} = ?")
        vals.append(v)
    vals.append(job_id)
    conn.execute(f"UPDATE jobs SET {', '.join(sets)} WHERE id = ?", vals)
    conn.commit()


def _update_progress(conn: sqlite3.Connection, job_id: str, current: int, total: int, message: str):
    progress_json = json.dumps({"current": current, "total": total, "message": message})
    conn.execute("UPDATE jobs SET progress = ? WHERE id = ?", (progress_json, job_id))
    conn.commit()


# ─── Markdown → PDF ──────────────────────────────────────────────

def markdown_to_pdf(md_text: str, output_path: str, title: str = "Report"):
    html = md_lib.markdown(md_text, extensions=["tables", "fenced_code"])
    full_html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>{title}</title>
<style>
  body {{ font-family: sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; }}
  pre {{ background: #f4f4f4; padding: 12px; border-radius: 4px; overflow-x: auto; }}
  code {{ font-size: 0.9em; }}
  h1,h2,h3 {{ color: #1a1a1a; }}
  blockquote {{ border-left: 3px solid #ccc; margin-left: 0; padding-left: 16px; color: #555; }}
  table {{ border-collapse: collapse; width: 100%; margin: 1em 0; }}
  th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
  th {{ background: #f4f4f4; }}
</style>
</head><body>{html}</body></html>"""

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    subprocess.run(
        ["wkhtmltopdf", "--quiet", "--enable-local-file-access", "-", output_path],
        input=full_html, text=True, check=True, timeout=120,
    )


# ─── Conversation markdown export (reuses DB directly) ───────────

def export_conversation_markdown(conn: sqlite3.Connection, conversation_id: str) -> str:
    row = conn.execute("SELECT title FROM conversations WHERE id = ?", (conversation_id,)).fetchone()
    title = row["title"] if row else "Untitled"
    msgs = conn.execute(
        "SELECT role, content_text FROM messages WHERE conversation_id = ? ORDER BY turn_index ASC",
        (conversation_id,),
    ).fetchall()
    lines = [f"# {title}", ""]
    for m in msgs:
        role = (m["role"] or "unknown").strip().lower()
        lines.append(f"## {role}")
        lines.append("")
        lines.append(m["content_text"] or "")
        lines.append("")
    return "\n".join(lines).strip() + "\n"


# ─── Fabric CLI ───────────────────────────────────────────────────


def run_fabric(pattern: str, input_text: str) -> str:
    cmd = ["fabric", "-p", pattern, "-V", FABRIC_VENDOR, "-m", FABRIC_MODEL,
           "-g", FABRIC_LANGUAGE]
    strategy = PATTERN_STRATEGIES.get(pattern)
    if strategy:
        cmd.extend(["--strategy", strategy])
    proc = subprocess.run(
        cmd,
        input=input_text,
        capture_output=True,
        text=True,
        timeout=300,
    )
    if proc.returncode != 0:
        stderr = proc.stderr.strip()
        raise RuntimeError(f"fabric exited {proc.returncode}: {stderr}")
    return proc.stdout.strip()


# ─── Job execution ────────────────────────────────────────────────

def run_conversation_job(conn: sqlite3.Connection, job_id: str, target_id: str, pattern: str, target_name: str):
    _update_progress(conn, job_id, 0, 3, "Exporting conversation to markdown...")
    md_text = export_conversation_markdown(conn, target_id)

    _update_progress(conn, job_id, 1, 3, f"Running fabric {pattern}...")
    fabric_output = run_fabric(pattern, md_text)

    _update_progress(conn, job_id, 2, 3, "Generating PDF...")
    pdf_path = f"generated/conversations/{target_id}/{pattern}.pdf"
    abs_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), pdf_path)
    markdown_to_pdf(fabric_output, abs_path, title=f"{target_name} — {pattern}")

    _update_progress(conn, job_id, 3, 3, "Done")
    _update_status(conn, job_id, "done", result_path=pdf_path)


def run_project_job(conn: sqlite3.Connection, job_id: str, target_id: str, pattern: str, target_name: str):
    # List conversations for this project
    rows = conn.execute(
        "SELECT id, title FROM conversations WHERE gizmo_id = ? ORDER BY updated_at DESC",
        (target_id,),
    ).fetchall()
    total_convs = len(rows)
    if total_convs == 0:
        raise RuntimeError("No conversations found for this project")

    # Export each conversation
    md_parts = []
    for i, row in enumerate(rows):
        _update_progress(conn, job_id, i, total_convs + 2, f"Exporting conversation {i + 1}/{total_convs}...")
        md_parts.append(export_conversation_markdown(conn, row["id"]))

    combined_md = "\n\n---\n\n".join(md_parts)

    _update_progress(conn, job_id, total_convs, total_convs + 2, f"Running fabric {pattern}...")
    fabric_output = run_fabric(pattern, combined_md)

    _update_progress(conn, job_id, total_convs + 1, total_convs + 2, "Generating PDF...")
    pdf_path = f"generated/projects/{target_id}/{pattern}.pdf"
    abs_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), pdf_path)
    markdown_to_pdf(fabric_output, abs_path, title=f"{target_name} — {pattern}")

    _update_progress(conn, job_id, total_convs + 2, total_convs + 2, "Done")
    _update_status(conn, job_id, "done", result_path=pdf_path)


def main():
    parser = argparse.ArgumentParser(description="Fabric AI worker")
    parser.add_argument("--job-id", required=True, help="Job UUID to execute")
    args = parser.parse_args()

    conn = _connect()
    job = conn.execute("SELECT * FROM jobs WHERE id = ?", (args.job_id,)).fetchone()
    if not job:
        print(f"Job {args.job_id} not found", file=sys.stderr)
        sys.exit(1)

    job_id = job["id"]
    job_type = job["type"]
    target_id = job["target_id"]
    target_name = job["target_name"]
    pattern = job["pattern"]

    try:
        _update_status(conn, job_id, "running")

        if job_type == "conversation":
            run_conversation_job(conn, job_id, target_id, pattern, target_name)
        elif job_type == "project":
            run_project_job(conn, job_id, target_id, pattern, target_name)
        else:
            raise ValueError(f"Unknown job type: {job_type}")

    except Exception as exc:
        tb = traceback.format_exc()
        _update_status(conn, job_id, "failed", error=str(exc))
        print(f"Job {job_id} failed:\n{tb}", file=sys.stderr)
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
