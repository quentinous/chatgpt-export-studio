<template>
  <div class="h-full overflow-y-auto p-8">
    <h1 class="text-2xl font-semibold text-zinc-50 mb-6">Dashboard</h1>
    <div class="grid grid-cols-3 gap-4 mb-8">
      <StatsCard label="Conversations" :value="stats?.conversations ?? 0" />
      <StatsCard label="Messages" :value="stats?.messages ?? 0" />
      <StatsCard label="Chunks" :value="stats?.chunks ?? 0" />
    </div>
    <div>
      <h2 class="text-lg font-medium text-zinc-50 mb-4">Recent conversations</h2>
      <div class="space-y-1">
        <NuxtLink
          v-for="conv in recent"
          :key="conv.id"
          :to="`/conversations/${conv.id}`"
          class="flex items-center justify-between px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
        >
          <div class="min-w-0">
            <p class="text-zinc-50 font-medium truncate">{{ conv.title || 'Untitled' }}</p>
            <p class="text-zinc-400 text-xs mt-0.5">{{ formatDate(conv.updated_at) }}</p>
          </div>
          <span class="text-zinc-500 text-xs font-mono ml-4 flex-shrink-0">{{ conv.message_count }} msgs</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Conversation, Stats } from '~~/shared/types'

const { data: stats } = await useFetch<Stats>('/api/stats')
const { data: recent } = await useFetch<Conversation[]>('/api/conversations', {
  params: { limit: 10 },
})
</script>
