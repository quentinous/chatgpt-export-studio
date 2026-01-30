<template>
  <NuxtLink
    :to="`/conversations/${hit.conversation_id}`"
    class="block px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
  >
    <div class="flex items-center gap-2 mb-1">
      <span
        class="text-xs font-medium px-1.5 py-0.5 rounded"
        :class="hit.role === 'user' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'"
      >
        {{ hit.role }}
      </span>
      <span class="text-zinc-500 text-xs font-mono">{{ hit.conversation_id.slice(0, 8) }}</span>
      <span v-if="hit.created_at" class="text-zinc-500 text-xs">{{ formatDate(hit.created_at) }}</span>
    </div>
    <p class="text-zinc-300 text-sm leading-relaxed">{{ truncate(hit.content_text, 200) }}</p>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { SearchHit } from '~~/shared/types'

defineProps<{
  hit: SearchHit
}>()
</script>
