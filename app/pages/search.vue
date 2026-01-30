<template>
  <div class="h-full flex flex-col">
    <div class="px-6 py-4 border-b border-zinc-700">
      <h1 class="text-lg font-semibold text-zinc-50 mb-3">Full-text search</h1>
      <SearchInput v-model="query" placeholder="Search across all messages..." />
    </div>
    <div class="flex-1 overflow-y-auto p-6 space-y-2">
      <div v-if="loading" class="text-center text-zinc-500 text-sm py-8">Searching...</div>
      <template v-else-if="results.length">
        <p class="text-zinc-400 text-xs mb-3">{{ results.length }} results</p>
        <SearchResultItem v-for="hit in results" :key="hit.id" :hit="hit" />
      </template>
      <EmptyState v-else-if="query" message="No results found" />
      <EmptyState v-else message="Type to search across all messages" />
    </div>
  </div>
</template>

<script setup lang="ts">
const { query, results, loading } = useSearch()
</script>
