import type { Message } from '~~/shared/types'

export function useMessages(conversationId: Ref<string> | string) {
  const id = isRef(conversationId) ? conversationId : ref(conversationId)

  const { data: messages, status } = useFetch<Message[]>(
    () => `/api/conversations/${id.value}/messages`,
    { watch: [id] },
  )

  return {
    messages: computed(() => messages.value ?? []),
    loading: computed(() => status.value === 'pending'),
  }
}
