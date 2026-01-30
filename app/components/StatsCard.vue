<template>
  <div class="rounded-xl bg-zinc-900 border border-zinc-800 px-5 py-4">
    <p class="text-zinc-400 text-xs font-medium uppercase tracking-wider">{{ label }}</p>
    <p class="text-2xl font-semibold text-zinc-50 mt-1 font-mono">{{ formatted }}</p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string
  value: number
}>()

const formatted = computed(() => props.value.toLocaleString())
</script>
