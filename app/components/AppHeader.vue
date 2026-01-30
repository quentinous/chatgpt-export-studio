<template>
  <header class="flex items-center justify-between px-4 py-2.5 border-b border-zinc-700 bg-zinc-900">
    <NuxtLink to="/" class="flex items-center gap-2.5">
      <div class="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
        <svg class="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <span class="text-sm font-semibold text-zinc-50">Export Studio</span>
    </NuxtLink>

    <div class="flex items-center gap-3">
      <NuxtLink
        to="/search"
        class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs hover:text-zinc-300 transition-colors"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        Search
        <kbd class="ml-1 text-zinc-500 font-mono">Ctrl+K</kbd>
      </NuxtLink>
      <div v-if="stats" class="text-zinc-500 text-xs font-mono">
        {{ stats.conversations.toLocaleString() }} convs
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import type { Stats } from '~~/shared/types'

const { data: stats } = useFetch<Stats>('/api/stats')
</script>
