<template>
  <div class="flex gap-3" :class="isUser ? 'flex-row-reverse' : ''">
    <div
      class="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-medium"
      :class="isUser ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'"
    >
      {{ isUser ? 'U' : 'A' }}
    </div>
    <div class="max-w-[75%] min-w-0">
      <div class="flex items-center gap-2 mb-1" :class="isUser ? 'justify-end' : ''">
        <span
          class="text-xs font-medium"
          :class="isUser ? 'text-blue-400' : 'text-emerald-400'"
        >
          {{ message.role }}
        </span>
        <span v-if="message.created_at" class="text-zinc-500 text-xs">
          {{ formatDateTime(message.created_at) }}
        </span>
      </div>
      <div
        class="rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words"
        :class="isUser ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-zinc-800 border border-zinc-700'"
      >
        {{ message.content_text }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Message } from '~~/shared/types'

const props = defineProps<{
  message: Message
}>()

const isUser = computed(() => props.message.role === 'user')
</script>
