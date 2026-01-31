import { listJobs } from '~~/server/utils/jobsDb'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 50, 200)
  const offset = Number(query.offset) || 0
  return listJobs(limit, offset)
})
