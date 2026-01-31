import { listJobsByTarget } from '~~/server/utils/jobsDb'

export default defineEventHandler((event) => {
  const targetId = getRouterParam(event, 'targetId')!
  return listJobsByTarget(targetId)
})
