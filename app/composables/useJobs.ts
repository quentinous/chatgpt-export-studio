import type { Job, JobProgress } from '~~/shared/types'

export interface JobState {
  job: Job | null
  status: 'idle' | 'running' | 'ready' | 'failed'
  progress: JobProgress | null
  error: string | null
}

// Global notification state
const notifications = ref<{ id: string; message: string; type: 'success' | 'error' }[]>([])

export function useJobNotifications() {
  function addNotification(message: string, type: 'success' | 'error' = 'success') {
    const id = Math.random().toString(36).slice(2)
    notifications.value.push({ id, message, type })
    setTimeout(() => {
      notifications.value = notifications.value.filter(n => n.id !== id)
    }, 5000)
  }

  function removeNotification(id: string) {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  return { notifications: readonly(notifications), addNotification, removeNotification }
}

export function useJobs() {
  const { addNotification } = useJobNotifications()

  async function checkCache(targetId: string, pattern: string): Promise<Job | null> {
    const data = await $fetch<Job | null>('/api/jobs/check', {
      params: { target_id: targetId, pattern },
    })
    return data
  }

  async function submitJob(opts: {
    type: 'conversation' | 'project'
    target_id: string
    target_name: string
    pattern: string
  }): Promise<Job> {
    const job = await $fetch<Job>('/api/jobs', {
      method: 'POST',
      body: opts,
    })
    return job
  }

  function streamJob(
    jobId: string,
    callbacks: {
      onProgress?: (status: string, progress: JobProgress | null) => void
      onDone?: (resultPath: string) => void
      onFailed?: (error: string) => void
    },
  ): () => void {
    const es = new EventSource(`/api/jobs/${jobId}/stream`)

    es.addEventListener('progress', (e: MessageEvent) => {
      const data = JSON.parse(e.data)
      callbacks.onProgress?.(data.status, data.progress)
    })

    es.addEventListener('done', (e: MessageEvent) => {
      const data = JSON.parse(e.data)
      callbacks.onDone?.(data.result_path)
      es.close()
    })

    es.addEventListener('failed', (e: MessageEvent) => {
      const data = JSON.parse(e.data)
      callbacks.onFailed?.(data.error)
      es.close()
    })

    es.onerror = () => {
      callbacks.onFailed?.('Connection lost')
      es.close()
    }

    return () => es.close()
  }

  function downloadPdf(jobId: string) {
    window.open(`/api/jobs/${jobId}/download`, '_blank')
  }

  async function runAction(
    opts: {
      type: 'conversation' | 'project'
      target_id: string
      target_name: string
      pattern: string
    },
    state: Ref<JobState>,
  ) {
    state.value = { job: null, status: 'running', progress: null, error: null }

    try {
      const job = await submitJob(opts)
      state.value.job = job

      // If already done (cache hit), go directly to ready
      if (job.status === 'done') {
        state.value.status = 'ready'
        return
      }

      // Stream progress
      streamJob(job.id, {
        onProgress(status, progress) {
          state.value.progress = progress
          state.value.status = 'running'
        },
        onDone(resultPath) {
          state.value.status = 'ready'
          state.value.job = { ...state.value.job!, status: 'done', result_path: resultPath }
          addNotification(`${opts.target_name} — ${opts.pattern} is ready!`)
        },
        onFailed(error) {
          state.value.status = 'failed'
          state.value.error = error
          addNotification(`${opts.pattern} failed: ${error}`, 'error')
        },
      })
    } catch (err: any) {
      state.value.status = 'failed'
      state.value.error = err.message || 'Unknown error'
      addNotification(`${opts.pattern} failed: ${state.value.error}`, 'error')
    }
  }

  async function resetJob(jobId: string): Promise<void> {
    await $fetch(`/api/jobs/${jobId}`, { method: 'DELETE' })
  }

  return { checkCache, submitJob, streamJob, downloadPdf, runAction, resetJob }
}
