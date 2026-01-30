import type { SearchHit } from '~~/shared/types'

export function useSearch() {
  const query = ref('')
  const results = ref<SearchHit[]>([])
  const loading = ref(false)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  async function search() {
    const q = query.value.trim()
    if (!q) {
      results.value = []
      return
    }
    loading.value = true
    try {
      results.value = await $fetch<SearchHit[]>('/api/search', {
        params: { q, limit: 50 },
      })
    } finally {
      loading.value = false
    }
  }

  watch(query, () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(search, 300)
  })

  return { query, results, loading }
}
