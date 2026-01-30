import type { Stats } from '~~/shared/types'

export function useStats() {
  return useFetch<Stats>('/api/stats')
}
