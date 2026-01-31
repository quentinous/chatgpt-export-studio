import { getJob } from '~~/server/utils/jobsDb'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const job = getJob(id)
  if (!job) {
    throw createError({ statusCode: 404, statusMessage: 'Job not found' })
  }

  setResponseHeader(event, 'Content-Type', 'text/event-stream')
  setResponseHeader(event, 'Cache-Control', 'no-cache')
  setResponseHeader(event, 'Connection', 'keep-alive')

  const stream = createEventStream(event)
  let lastProgressJson = ''

  const interval = setInterval(async () => {
    const current = getJob(id)
    if (!current) {
      await stream.push({ event: 'failed', data: JSON.stringify({ status: 'failed', error: 'Job disappeared' }) })
      clearInterval(interval)
      await stream.close()
      return
    }

    const progressJson = JSON.stringify(current.progress)
    if (progressJson !== lastProgressJson || current.status === 'running') {
      lastProgressJson = progressJson
      await stream.push({
        event: 'progress',
        data: JSON.stringify({ status: current.status, progress: current.progress }),
      })
    }

    if (current.status === 'done') {
      await stream.push({
        event: 'done',
        data: JSON.stringify({ status: 'done', result_path: current.result_path }),
      })
      clearInterval(interval)
      await stream.close()
    } else if (current.status === 'failed') {
      await stream.push({
        event: 'failed',
        data: JSON.stringify({ status: 'failed', error: current.error }),
      })
      clearInterval(interval)
      await stream.close()
    }
  }, 500)

  stream.onClosed(() => {
    clearInterval(interval)
  })

  return stream.send()
})
