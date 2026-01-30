<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-3 border-b border-zinc-700 bg-zinc-900/50">
      <div class="min-w-0">
        <h1 class="text-lg font-semibold text-zinc-50 truncate">{{ conversation?.title || 'Untitled' }}</h1>
        <p class="text-zinc-400 text-xs mt-0.5">
          <span class="font-mono">{{ id.slice(0, 8) }}</span>
          <span v-if="conversation?.created_at"> &middot; {{ formatDate(conversation.created_at) }}</span>
          <span v-if="conversation?.message_count"> &middot; {{ conversation.message_count }} messages</span>
        </p>
      </div>
      <ExportPanel :conversation-id="id" :title="conversation?.title" />
    </div>

    <!-- Messages -->
    <MessageThread v-if="messages.length" :messages="messages" class="flex-1 min-h-0" />
    <EmptyState v-else-if="loading" message="Loading messages..." class="flex-1" />
    <EmptyState v-else message="No messages in this conversation" class="flex-1" />
  </div>
</template>

<script setup lang="ts">
import type { Conversation } from '~~/shared/types'

const route = useRoute()
const id = computed(() => route.params.id as string)

const { data: conversation } = useFetch<Conversation>(() => `/api/conversations/${id.value}`, { watch: [id] })
const { messages, loading } = useMessages(id)
</script>
