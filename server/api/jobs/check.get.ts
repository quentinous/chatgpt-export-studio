import { resolve } from 'path'
import { existsSync } from 'fs'
import { checkJobCache, findPendingOrRunning } from '~~/server/utils/jobsDb'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const targetId = query.target_id as string
  const pattern = query.pattern as string

  if (!targetId || !pattern) {
    throw createError({ statusCode: 400, statusMessage: 'Missing target_id or pattern' })
  }

  // Check for a running/pending job first
  const active = findPendingOrRunning(targetId, pattern)
  if (active) {
    return active
  }

  // Check cache
  const cached = checkJobCache(targetId, pattern)
  if (cached && cached.result_path) {
    const absPath = resolve(process.cwd(), cached.result_path)
    if (existsSync(absPath)) {
      return cached
    }
  }

  return null
})
