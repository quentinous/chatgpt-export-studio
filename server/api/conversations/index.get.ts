import { listConversations } from '~~/server/utils/db'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 50, 500)
  const offset = Math.max(Number(query.offset) || 0, 0)
  const search = String(query.search || '')
  const gizmoId = String(query.gizmo_id || '')
  return listConversations(limit, offset, search, gizmoId)
})
