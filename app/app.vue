<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const router = useRouter()

onMounted(() => {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      router.push('/search')
    }
    if (e.key === 'Escape') {
      const active = document.activeElement as HTMLElement | null
      active?.blur()
    }
  })
})
</script>
