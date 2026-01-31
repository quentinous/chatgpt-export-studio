<template>
  <div class="flex items-center gap-1.5">
    <select
      :value="modelValue"
      class="flex-1 bg-white text-zinc-700 text-xs rounded-lg border border-zinc-300 px-2.5 py-1.5 focus:outline-none focus:border-zinc-400 appearance-none cursor-pointer"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option value="">All conversations</option>
      <optgroup v-if="projectItems.length" label="Projects">
        <option v-for="p in projectItems" :key="p.gizmo_id" :value="p.gizmo_id">
          {{ p.display_name }} ({{ p.conversation_count }})
        </option>
      </optgroup>
      <optgroup v-if="gptItems.length" label="Custom GPTs">
        <option v-for="p in gptItems" :key="p.gizmo_id" :value="p.gizmo_id">
          {{ p.display_name }} ({{ p.conversation_count }})
        </option>
      </optgroup>
    </select>
    <button
      v-if="modelValue"
      class="text-zinc-400 hover:text-zinc-700 text-xs px-1.5 py-1 rounded hover:bg-zinc-200 transition-colors"
      title="Clear filter"
      @click="$emit('update:modelValue', '')"
    >
      &times;
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Project } from '~~/shared/types'

const props = defineProps<{
  modelValue: string
  projects: Project[]
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()

const projectItems = computed(() => props.projects.filter(p => p.gizmo_type === 'snorlax'))
const gptItems = computed(() => props.projects.filter(p => p.gizmo_type === 'gpt'))
</script>
