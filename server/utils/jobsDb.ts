import Database from 'better-sqlite3'
import { resolve } from 'path'
import type { Job, JobProgress } from '~~/shared/types'

const DB_PATH = resolve(process.cwd(), 'bandofy_export_studio.sqlite3')

let _db: Database.Database | null = null

function getJobsDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH)
    _db.pragma('journal_mode = WAL')
    _db.exec(`
      CREATE TABLE IF NOT EXISTS jobs (
        id          TEXT PRIMARY KEY,
        type        TEXT NOT NULL,
        target_id   TEXT NOT NULL,
        target_name TEXT NOT NULL DEFAULT '',
        pattern     TEXT NOT NULL,
        status      TEXT NOT NULL DEFAULT 'pending',
        progress    TEXT DEFAULT NULL,
        result_path TEXT DEFAULT NULL,
        error       TEXT DEFAULT NULL,
        created_at  INTEGER NOT NULL,
        started_at  INTEGER DEFAULT NULL,
        finished_at INTEGER DEFAULT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
      CREATE INDEX IF NOT EXISTS idx_jobs_target ON jobs(target_id, pattern);
    `)
  }
  return _db
}

function rowToJob(row: any): Job {
  return {
    ...row,
    progress: row.progress ? JSON.parse(row.progress) : null,
  }
}

export function createJob(job: {
  id: string
  type: 'conversation' | 'project'
  target_id: string
  target_name: string
  pattern: string
}): Job {
  const db = getJobsDb()
  const now = Math.floor(Date.now() / 1000)
  db.prepare(`
    INSERT INTO jobs (id, type, target_id, target_name, pattern, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'pending', ?)
  `).run(job.id, job.type, job.target_id, job.target_name, job.pattern, now)
  return getJob(job.id)!
}

export function getJob(id: string): Job | null {
  const db = getJobsDb()
  const row = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id)
  return row ? rowToJob(row) : null
}

export function listJobs(limit = 50, offset = 0): Job[] {
  const db = getJobsDb()
  const rows = db.prepare('SELECT * FROM jobs ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset)
  return rows.map(rowToJob)
}

export function listJobsByTarget(targetId: string): Job[] {
  const db = getJobsDb()
  const rows = db.prepare('SELECT * FROM jobs WHERE target_id = ? ORDER BY created_at DESC').all(targetId)
  return rows.map(rowToJob)
}

export function checkJobCache(targetId: string, pattern: string): Job | null {
  const db = getJobsDb()
  const row = db.prepare(`
    SELECT * FROM jobs
    WHERE target_id = ? AND pattern = ? AND status = 'done'
    ORDER BY created_at DESC LIMIT 1
  `).get(targetId, pattern)
  return row ? rowToJob(row) : null
}

export function deleteJob(id: string): Job | null {
  const db = getJobsDb()
  const job = getJob(id)
  if (!job) return null
  db.prepare('DELETE FROM jobs WHERE id = ?').run(id)
  return job
}

export function findPendingOrRunning(targetId: string, pattern: string): Job | null {
  const db = getJobsDb()
  const row = db.prepare(`
    SELECT * FROM jobs
    WHERE target_id = ? AND pattern = ? AND status IN ('pending', 'running')
    ORDER BY created_at DESC LIMIT 1
  `).get(targetId, pattern)
  return row ? rowToJob(row) : null
}
