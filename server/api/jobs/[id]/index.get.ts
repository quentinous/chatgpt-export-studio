import { getJob } from '~~/server/utils/jobsDb'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')!
  const job = getJob(id)
  if (!job) {
    throw createError({ statusCode: 404, statusMessage: 'Job not found' })
  }
  return job
})
