<template>
  <div class="flex gap-3" :class="isUser ? 'flex-row-reverse' : ''">
    <div
      class="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-medium"
      :class="isUser ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'"
    >
      {{ isUser ? 'U' : 'A' }}
    </div>
    <div class="max-w-[75%] min-w-0">
      <div class="flex items-center gap-2 mb-1" :class="isUser ? 'justify-end' : ''">
        <span
          class="text-xs font-medium"
          :class="isUser ? 'text-blue-600' : 'text-emerald-600'"
        >
          {{ message.role }}
        </span>
        <span
          v-if="message.content_type && message.content_type !== 'text'"
          class="text-zinc-500 text-xs font-mono bg-zinc-200 px-1.5 py-0.5 rounded"
        >
          {{ message.content_type }}
        </span>
        <span v-if="message.created_at" class="text-zinc-400 text-xs">
          {{ formatDateTime(message.created_at) }}
        </span>
      </div>
      <div
        class="rounded-xl px-4 py-3 text-sm prose prose-sm prose-zinc max-w-none"
        :class="isUser ? 'bg-blue-50 border border-blue-200 prose-headings:text-blue-900 prose-code:text-blue-800' : 'bg-white border border-zinc-200 shadow-sm prose-headings:text-zinc-900'"
        v-html="renderedContent"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Message } from '~~/shared/types'

const props = defineProps<{
  message: Message
}>()

const isUser = computed(() => props.message.role === 'user')

const { parseMarkdown } = useMarkdown()
const renderedContent = computed(() => parseMarkdown(props.message.content_text || ''))
</script>
