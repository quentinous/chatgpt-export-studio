import { searchMessages } from '~~/server/utils/db'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const q = String(query.q || '')
  const limit = Math.min(Number(query.limit) || 50, 200)
  return searchMessages(q, limit)
})
