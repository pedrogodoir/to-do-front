<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const { clearToken } = useAuth()

const logout = () => {
  clearToken()
  navigateTo('/')
}
</script>

<template>
  <div class="flex flex-col min-h-screen bg-slate-900 text-white">
    <header class="flex items-center justify-between px-8 py-4 bg-slate-950 border-b border-slate-800">
      <h1 class="text-xl font-semibold">Dashboard</h1>
      <button
        class="text-sm text-slate-400 hover:text-white transition-colors"
        @click="logout"
      >
        Logout
      </button>
    </header>

    <main class="flex flex-1 flex-col items-center justify-center gap-4">
      <p class="text-slate-400 text-lg">Welcome! You are logged in.</p>
    </main>
  </div>
</template>
