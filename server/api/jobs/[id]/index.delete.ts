import { resolve } from 'path'
import { unlinkSync, existsSync } from 'fs'
import { deleteJob } from '~~/server/utils/jobsDb'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')!
  const job = deleteJob(id)

  if (!job) {
    throw createError({ statusCode: 404, statusMessage: 'Job not found' })
  }

  if (job.result_path) {
    const absPath = resolve(process.cwd(), job.result_path)
    if (existsSync(absPath)) {
      unlinkSync(absPath)
    }
  }

  return { ok: true }
})
