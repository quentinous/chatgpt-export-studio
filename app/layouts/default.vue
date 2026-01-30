<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <AppHeader />
    <div class="flex flex-1 min-h-0">
      <ConversationSidebar class="w-80 flex-shrink-0" />
      <main class="flex-1 min-w-0 border-l border-zinc-700">
        <slot />
      </main>
    </div>
  </div>
</template>
