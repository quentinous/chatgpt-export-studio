<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-3 border-b border-zinc-200 bg-white">
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <h1 class="text-lg font-semibold text-zinc-900 truncate">{{ conversation?.title || 'Untitled' }}</h1>
          <span
            v-if="conversation?.project_display_name"
            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium flex-shrink-0"
            :class="conversation.project_gizmo_type === 'snorlax'
              ? 'bg-violet-100 text-violet-700 border border-violet-200'
              : 'bg-amber-100 text-amber-700 border border-amber-200'"
          >
            {{ conversation.project_display_name }}
          </span>
        </div>
        <p class="text-zinc-500 text-xs mt-0.5">
          <span class="font-mono">{{ id.slice(0, 8) }}</span>
          <span v-if="conversation?.created_at"> &middot; {{ formatDate(conversation.created_at) }}</span>
          <span v-if="conversation?.message_count"> &middot; {{ conversation.message_count }} messages</span>
          <span
            v-if="conversation?.default_model_slug"
            class="inline-flex items-center ml-1.5 px-1.5 py-0 rounded bg-zinc-200 text-zinc-600 font-mono"
          >{{ conversation.default_model_slug }}</span>
        </p>
      </div>
      <ExportPanel :conversation-id="id" :title="conversation?.title" />
    </div>

    <!-- Fabric AI Actions -->
    <div v-if="conversation" class="px-6 py-2 border-b border-zinc-200 bg-zinc-50">
      <FabricActions
        type="conversation"
        :target-id="id"
        :target-name="conversation.title || 'Untitled'"
      />
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
