import { exportConversationMarkdown, getConversation } from '~~/server/utils/db'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const id = String(query.id || '')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing conversation id' })
  }
  const conv = getConversation(id)
  if (!conv) {
    throw createError({ statusCode: 404, statusMessage: 'Conversation not found' })
  }
  const md = exportConversationMarkdown(id)
  const safeName = (conv.title || 'conversation').replace(/[^a-zA-Z0-9 _\-]/g, '').trim().replace(/\s+/g, '_').slice(0, 80) || 'conversation'
  setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="${safeName}.md"`)
  return md
})
