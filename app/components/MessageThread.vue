<template>
  <div ref="container" class="h-full overflow-y-auto px-6 py-4 space-y-4">
    <MessageBubble
      v-for="msg in messages"
      :key="msg.id"
      :message="msg"
    />
  </div>
</template>

<script setup lang="ts">
import type { Message } from '~~/shared/types'

const props = defineProps<{
  messages: Message[]
}>()

const container = ref<HTMLElement>()

watch(() => props.messages, () => {
  nextTick(() => {
    container.value?.scrollTo({ top: 0 })
  })
})
</script>
