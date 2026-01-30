import { getMessages } from '~~/server/utils/db'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')!
  return getMessages(id)
})
