<template>
  <aside class="h-full flex flex-col bg-zinc-50 border-r border-zinc-200">
    <div class="p-3 border-b border-zinc-200 space-y-2">
      <SearchInput v-model="search" placeholder="Search conversations..." />
      <ProjectFilter v-model="gizmoId" :projects="projects" />
    </div>
    <div ref="scrollContainer" class="flex-1 overflow-y-auto p-2 space-y-0.5" @scroll="onScroll">
      <ConversationListItem
        v-for="conv in conversations"
        :key="conv.id"
        :conversation="conv"
        :active="conv.id === activeId"
      />
      <div v-if="loading" class="py-4 text-center text-zinc-400 text-xs">Loading...</div>
      <div v-else-if="conversations.length === 0" class="py-8 text-center text-zinc-400 text-sm">
        No conversations found
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
const route = useRoute()
const activeId = computed(() => route.params.id as string || '')

const { conversations, search, gizmoId, loading, loadMore, hasMore } = useConversations()
const { projects } = useProjects()

const scrollContainer = ref<HTMLElement>()

function onScroll() {
  const el = scrollContainer.value
  if (!el || !hasMore.value || loading.value) return
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
    loadMore()
  }
}
</script>
