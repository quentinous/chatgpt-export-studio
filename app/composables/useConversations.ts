import type { Conversation } from '~~/shared/types'

export function useConversations() {
  const conversations = ref<Conversation[]>([])
  const search = ref('')
  const loading = ref(false)
  const hasMore = ref(true)
  const offset = ref(0)
  const PAGE_SIZE = 50

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  async function fetchConversations(reset = false) {
    if (reset) {
      offset.value = 0
      hasMore.value = true
    }
    if (!hasMore.value && !reset) return
    loading.value = true
    try {
      const data = await $fetch<Conversation[]>('/api/conversations', {
        params: { limit: PAGE_SIZE, offset: offset.value, search: search.value },
      })
      if (reset) {
        conversations.value = data
      } else {
        conversations.value = [...conversations.value, ...data]
      }
      hasMore.value = data.length === PAGE_SIZE
      offset.value += data.length
    } finally {
      loading.value = false
    }
  }

  function loadMore() {
    if (!loading.value && hasMore.value) {
      fetchConversations(false)
    }
  }

  watch(search, () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => fetchConversations(true), 300)
  })

  // initial load
  fetchConversations(true)

  return { conversations, search, loading, hasMore, loadMore }
}
