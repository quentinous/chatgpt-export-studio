import { listProjects } from '~~/server/utils/db'

export default defineEventHandler(() => {
  return listProjects()
})
