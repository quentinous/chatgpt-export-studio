<template>
  <div class="inline-flex items-center">
    <!-- Idle: Run button -->
    <button
      v-if="state.status === 'idle'"
      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
             bg-zinc-100 text-zinc-700 border border-zinc-200
             hover:bg-zinc-200 hover:border-zinc-300 transition-colors"
      :title="pattern.description"
      @click="run"
    >
      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 3l14 9-14 9V3z" />
      </svg>
      {{ pattern.label }}
    </button>

    <!-- Running: spinner + progress -->
    <span
      v-else-if="state.status === 'running'"
      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
             bg-blue-50 text-blue-700 border border-blue-200"
    >
      <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span v-if="state.progress" class="truncate max-w-[160px]">{{ state.progress.message }}</span>
      <span v-else>{{ pattern.label }}...</span>
    </span>

    <!-- Ready: download + reset buttons -->
    <template v-else-if="state.status === 'ready'">
      <button
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-l-md text-xs font-medium
               bg-emerald-50 text-emerald-700 border border-emerald-200
               hover:bg-emerald-100 hover:border-emerald-300 transition-colors"
        :title="`Download ${pattern.label} PDF`"
        @click="download"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {{ pattern.label }}
      </button>
      <button
        class="inline-flex items-center px-1.5 py-1.5 rounded-r-md text-xs font-medium
               bg-zinc-50 text-zinc-500 border border-l-0 border-zinc-200
               hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
        title="Reset and regenerate"
        @click="reset"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </template>

    <!-- Failed: retry button -->
    <button
      v-else-if="state.status === 'failed'"
      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
             bg-red-50 text-red-700 border border-red-200
             hover:bg-red-100 hover:border-red-300 transition-colors"
      :title="state.error || 'Retry'"
      @click="run"
    >
      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      Retry
    </button>
  </div>
</template>

<script setup lang="ts">
import type { PatternInfo } from '~~/shared/types'
import type { JobState } from '~/composables/useJobs'

const props = defineProps<{
  pattern: PatternInfo
  type: 'conversation' | 'project'
  targetId: string
  targetName: string
}>()

const { checkCache, runAction, downloadPdf, resetJob } = useJobs()

const state = ref<JobState>({
  job: null,
  status: 'idle',
  progress: null,
  error: null,
})

// Check cache on mount
onMounted(async () => {
  try {
    const cached = await checkCache(props.targetId, props.pattern.id)
    if (cached) {
      state.value.job = cached
      if (cached.status === 'done') {
        state.value.status = 'ready'
      } else if (cached.status === 'running' || cached.status === 'pending') {
        // Reconnect to running job
        reconnectStream(cached.id)
      }
    }
  } catch {
    // ignore check errors
  }
})

function reconnectStream(jobId: string) {
  const { streamJob } = useJobs()
  state.value.status = 'running'
  streamJob(jobId, {
    onProgress(_status, progress) {
      state.value.progress = progress
    },
    onDone(resultPath) {
      state.value.status = 'ready'
      state.value.job = { ...state.value.job!, status: 'done', result_path: resultPath }
    },
    onFailed(error) {
      state.value.status = 'failed'
      state.value.error = error
    },
  })
}

function run() {
  runAction(
    {
      type: props.type,
      target_id: props.targetId,
      target_name: props.targetName,
      pattern: props.pattern.id,
    },
    state,
  )
}

function download() {
  if (state.value.job?.id) {
    downloadPdf(state.value.job.id)
  }
}

async function reset() {
  if (state.value.job?.id) {
    await resetJob(state.value.job.id)
  }
  state.value = { job: null, status: 'idle', progress: null, error: null }
}
</script>
