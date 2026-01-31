<template>
  <div class="flex flex-wrap gap-2">
    <FabricActionButton
      v-for="p in patterns"
      :key="p.id"
      :pattern="p"
      :type="type"
      :target-id="targetId"
      :target-name="targetName"
    />
  </div>
</template>

<script setup lang="ts">
import { CONVERSATION_PATTERNS, PROJECT_PATTERNS } from '~~/shared/types'

const props = defineProps<{
  type: 'conversation' | 'project'
  targetId: string
  targetName: string
}>()

const patterns = computed(() =>
  props.type === 'conversation' ? CONVERSATION_PATTERNS : PROJECT_PATTERNS,
)
</script>
