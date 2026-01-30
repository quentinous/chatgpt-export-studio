<template>
  <div class="flex items-center gap-2">
    <button
      class="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs hover:bg-zinc-700 transition-colors"
      @click="exportMarkdown"
    >
      Export .md
    </button>
    <div class="relative" ref="menuRef">
      <button
        class="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs hover:bg-zinc-700 transition-colors"
        @click="menuOpen = !menuOpen"
      >
        More exports
      </button>
      <div
        v-if="menuOpen"
        class="absolute right-0 top-full mt-1 w-52 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 py-1"
      >
        <button
          v-for="action in bulkActions"
          :key="action.label"
          class="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
          :disabled="action.loading"
          @click="action.handler"
        >
          {{ action.loading ? 'Exporting...' : action.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  conversationId: string
  title?: string | null
}>()

const menuOpen = ref(false)
const menuRef = ref<HTMLElement>()
const jsonlLoading = ref(false)
const pairsLoading = ref(false)
const obsidianLoading = ref(false)

function exportMarkdown() {
  window.open(`/api/export/markdown?id=${encodeURIComponent(props.conversationId)}`, '_blank')
}

async function exportBulk(endpoint: string, filename: string, loading: Ref<boolean>) {
  loading.value = true
  menuOpen.value = false
  try {
    const data = await $fetch<Blob>(`/api/export/${endpoint}`, {
      method: 'POST',
      body: { redact: false },
      responseType: 'blob',
    })
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  } finally {
    loading.value = false
  }
}

const bulkActions = computed(() => [
  { label: 'Export all messages (JSONL)', loading: jsonlLoading.value, handler: () => exportBulk('jsonl', 'messages.jsonl', jsonlLoading) },
  { label: 'Export training pairs (JSONL)', loading: pairsLoading.value, handler: () => exportBulk('pairs', 'pairs.jsonl', pairsLoading) },
  { label: 'Export Obsidian vault (.tar.gz)', loading: obsidianLoading.value, handler: () => exportBulk('obsidian', 'obsidian_vault.tar.gz', obsidianLoading) },
])

// Close menu on outside click
onMounted(() => {
  document.addEventListener('click', (e) => {
    if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
      menuOpen.value = false
    }
  })
})
</script>
