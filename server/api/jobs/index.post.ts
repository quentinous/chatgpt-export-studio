import { randomUUID } from 'crypto'
import { spawn } from 'child_process'
import { resolve } from 'path'
import { createJob, findPendingOrRunning, checkJobCache } from '~~/server/utils/jobsDb'
import { CONVERSATION_PATTERNS, PROJECT_PATTERNS } from '~~/shared/types'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { type, target_id, target_name, pattern } = body

  if (!type || !target_id || !pattern) {
    throw createError({ statusCode: 400, statusMessage: 'Missing type, target_id, or pattern' })
  }

  const validPatterns = type === 'conversation' ? CONVERSATION_PATTERNS : PROJECT_PATTERNS
  if (!validPatterns.find(p => p.id === pattern)) {
    throw createError({ statusCode: 400, statusMessage: `Invalid pattern: ${pattern}` })
  }

  // Check cache: already done with PDF on disk?
  const cached = checkJobCache(target_id, pattern)
  if (cached && cached.result_path) {
    const absPath = resolve(process.cwd(), cached.result_path)
    const fs = await import('fs')
    if (fs.existsSync(absPath)) {
      return cached
    }
  }

  // Check if already running
  const existing = findPendingOrRunning(target_id, pattern)
  if (existing) {
    return existing
  }

  const job = createJob({
    id: randomUUID(),
    type,
    target_id,
    target_name: target_name || '',
    pattern,
  })

  // Spawn Python worker in background
  const venvPython = resolve(process.cwd(), '.venv/bin/python')
  const child = spawn(venvPython, ['-m', 'bandofy_export_studio.worker', '--job-id', job.id], {
    cwd: process.cwd(),
    stdio: 'ignore',
    detached: true,
  })
  child.unref()

  return job
})
