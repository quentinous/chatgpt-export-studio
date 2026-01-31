import type { Project } from '~~/shared/types'

export function useProjects() {
  const { data } = useFetch<Project[]>('/api/projects')
  const projects = computed(() => data.value ?? [])
  return { projects }
}
