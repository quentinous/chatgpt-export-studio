<template>
  <NuxtLink
    :to="`/conversations/${conversation.id}`"
    class="block px-3 py-2.5 rounded-lg transition-colors hover:bg-zinc-800"
    :class="{ 'bg-zinc-800': active }"
  >
    <div class="flex items-baseline justify-between gap-2">
      <p class="text-zinc-50 text-sm font-medium truncate">{{ conversation.title || 'Untitled' }}</p>
      <span class="text-zinc-500 text-xs flex-shrink-0 font-mono">{{ conversation.message_count }}</span>
    </div>
    <p class="text-zinc-400 text-xs mt-0.5">{{ formatDate(conversation.updated_at) }}</p>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Conversation } from '~~/shared/types'

defineProps<{
  conversation: Conversation
  active?: boolean
}>()
</script>
