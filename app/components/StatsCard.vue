<template>
  <div class="rounded-xl bg-white border border-zinc-200 px-5 py-4 shadow-sm">
    <p class="text-zinc-500 text-xs font-medium uppercase tracking-wider">{{ label }}</p>
    <p class="text-2xl font-semibold text-zinc-900 mt-1 font-mono">{{ formatted }}</p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string
  value: number
}>()

const formatted = computed(() => props.value.toLocaleString())
</script>
