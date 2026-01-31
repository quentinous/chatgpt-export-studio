import { resolve } from 'path'
import { createReadStream, existsSync } from 'fs'
import { getJob } from '~~/server/utils/jobsDb'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')!
  const job = getJob(id)

  if (!job) {
    throw createError({ statusCode: 404, statusMessage: 'Job not found' })
  }
  if (job.status !== 'done' || !job.result_path) {
    throw createError({ statusCode: 400, statusMessage: 'Job not complete' })
  }

  const absPath = resolve(process.cwd(), job.result_path)
  if (!existsSync(absPath)) {
    throw createError({ statusCode: 404, statusMessage: 'PDF file not found on disk' })
  }

  const filename = `${job.target_name || job.target_id}_${job.pattern}.pdf`.replace(/[^a-zA-Z0-9_\-.]/g, '_')

  setResponseHeader(event, 'Content-Type', 'application/pdf')
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)

  return sendStream(event, createReadStream(absPath))
})
