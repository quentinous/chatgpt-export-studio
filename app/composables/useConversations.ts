import type { Conversation } from '~~/shared/types'

export function useConversations() {
  const route = useRoute()
  const conversations = ref<Conversation[]>([])
  const search = ref('')
  const gizmoId = ref((route.query.project as string) || '')
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
      const params: Record<string, string | number> = {
        limit: PAGE_SIZE,
        offset: offset.value,
        search: search.value,
      }
      if (gizmoId.value) {
        params.gizmo_id = gizmoId.value
      }
      const data = await $fetch<Conversation[]>('/api/conversations', { params })
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

  watch(gizmoId, () => {
    fetchConversations(true)
  })

  watch(() => route.query.project, (val) => {
    gizmoId.value = (val as string) || ''
  })

  // initial load
  fetchConversations(true)

  return { conversations, search, gizmoId, loading, hasMore, loadMore }
}
