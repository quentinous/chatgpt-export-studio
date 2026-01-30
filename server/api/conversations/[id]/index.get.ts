import { getConversation } from '~~/server/utils/db'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')!
  const conv = getConversation(id)
  if (!conv) {
    throw createError({ statusCode: 404, statusMessage: 'Conversation not found' })
  }
  return conv
})
