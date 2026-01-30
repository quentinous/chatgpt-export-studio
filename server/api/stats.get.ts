import { getStats } from '~~/server/utils/db'

export default defineEventHandler(() => {
  return getStats()
})
