<template>
  <div class="h-full overflow-y-auto p-8">
    <h1 class="text-2xl font-semibold text-zinc-900 mb-6">Dashboard</h1>
    <div class="grid grid-cols-4 gap-4 mb-8">
      <StatsCard label="Conversations" :value="stats?.conversations ?? 0" />
      <StatsCard label="Messages" :value="stats?.messages ?? 0" />
      <StatsCard label="Chunks" :value="stats?.chunks ?? 0" />
      <StatsCard label="Projects" :value="stats?.projects ?? 0" />
    </div>

    <div v-if="projects.length" class="mb-8">
      <h2 class="text-lg font-medium text-zinc-900 mb-4">Projects &amp; GPTs</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <div
          v-for="p in projects"
          :key="p.gizmo_id"
          class="rounded-lg border shadow-sm"
          :class="p.gizmo_type === 'snorlax'
            ? 'bg-violet-50 border-violet-200'
            : 'bg-amber-50 border-amber-200'"
        >
          <NuxtLink
            :to="`/?project=${p.gizmo_id}`"
            class="block px-4 py-3 transition-colors rounded-t-lg"
            :class="p.gizmo_type === 'snorlax' ? 'hover:bg-violet-100' : 'hover:bg-amber-100'"
          >
            <p
              class="text-sm font-medium truncate"
              :class="p.gizmo_type === 'snorlax' ? 'text-violet-700' : 'text-amber-700'"
            >
              {{ p.display_name }}
            </p>
            <p class="text-zinc-500 text-xs mt-1">{{ p.conversation_count }} conversations</p>
          </NuxtLink>
          <div class="px-4 pb-3">
            <details class="group">
              <summary class="text-xs text-zinc-500 cursor-pointer hover:text-zinc-700 select-none">
                Fabric AI actions
              </summary>
              <div class="mt-2">
                <FabricActions
                  type="project"
                  :target-id="p.gizmo_id"
                  :target-name="p.display_name"
                />
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>

    <div>
      <h2 class="text-lg font-medium text-zinc-900 mb-4">Recent conversations</h2>
      <div class="space-y-1">
        <NuxtLink
          v-for="conv in recent"
          :key="conv.id"
          :to="`/conversations/${conv.id}`"
          class="flex items-center justify-between px-4 py-3 rounded-lg bg-white border border-zinc-200 hover:border-zinc-300 shadow-sm transition-colors"
        >
          <div class="min-w-0">
            <p class="text-zinc-900 font-medium truncate">{{ conv.title || 'Untitled' }}</p>
            <p class="text-zinc-500 text-xs mt-0.5">{{ formatDate(conv.updated_at) }}</p>
          </div>
          <span class="text-zinc-400 text-xs font-mono ml-4 flex-shrink-0">{{ conv.message_count }} msgs</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Conversation, Project, Stats } from '~~/shared/types'

const { data: stats } = await useFetch<Stats>('/api/stats')
const { data: recent } = await useFetch<Conversation[]>('/api/conversations', {
  params: { limit: 10 },
})
const { data: projectsData } = await useFetch<Project[]>('/api/projects')
const projects = computed(() => projectsData.value ?? [])
</script>
