<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import draggable from 'vuedraggable'

definePageMeta({
  middleware: 'auth',
})

const { clearToken, token } = useAuth()
const { get, post, del, patch } = useApi()

const deletingId = ref<number | null>(null)
const updatingId = ref<number | null>(null)

const onColumnChange = async (event: any, columnId: string) => {
  if (!event.added) return
  const game: Game = event.added.element
  if (game.status === columnId) return

  updatingId.value = game.id
  const previousStatus = game.status
  game.status = columnId

  try {
    await patch(`/games/${game.id}/status`, { status: columnId })
  } catch {
    game.status = previousStatus
    const targetCol = columns.value.find(c => c.id === columnId)
    const sourceCol = columns.value.find(c => c.id === previousStatus)
    if (targetCol && sourceCol) {
      const idx = targetCol.items.findIndex(i => i.id === game.id)
      if (idx !== -1) {
        targetCol.items.splice(idx, 1)
        sourceCol.items.unshift(game)
      }
    }
  } finally {
    updatingId.value = null
  }
}

const logout = () => {
  clearToken()
  navigateTo('/')
}

// Decode JWT to get user_id
const getUserIdFromToken = (): number | null => {
  if (!token.value) return null
  try {
    const payload = token.value.split('.')[1]
    if (!payload) return null
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return decoded.sub ?? decoded.user_id ?? decoded.id ?? null
  } catch {
    return null
  }
}

interface Game {
  id: number
  name: string
  status: string
  created_at?: string
}

const isLoading = ref(true)
const fetchError = ref('')

const columns = ref([
  { id: 'to-play',  label: 'To Play',  color: 'bg-slate-500', items: [] as Game[] },
  { id: 'playing',  label: 'Playing',  color: 'bg-blue-500',  items: [] as Game[] },
  { id: 'finished', label: 'Finished', color: 'bg-green-500', items: [] as Game[] },
  { id: 'dropped',  label: 'Dropped',  color: 'bg-red-500',   items: [] as Game[] },
])

const distributeGames = (games: Game[]) => {
  columns.value.forEach(col => (col.items = []))
  games.forEach(game => {
    const col = columns.value.find(c => c.id === game.status)
    col?.items.push(game)
  })
}

const fetchGames = async () => {
  isLoading.value = true
  fetchError.value = ''
  try {
    const res = await get('/games') as { games: Game[] }
    distributeGames(res.games)
  } catch (e: any) {
    fetchError.value = e?.data?.message ?? 'Failed to load games.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => fetchGames())

// Modal state
const isModalOpen = ref(false)
const activeColumnId = ref<string>('')
const newGameName = ref('')
const isSubmitting = ref(false)
const submitError = ref('')

const openModal = (columnId: string) => {
  activeColumnId.value = columnId
  newGameName.value = ''
  submitError.value = ''
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const activeColumnLabel = computed(
  () => columns.value.find(c => c.id === activeColumnId.value)?.label ?? ''
)

const deleteGame = async (gameId: number) => {
  deletingId.value = gameId
  try {
    await del(`/games/${gameId}`)
    columns.value.forEach(col => {
      col.items = col.items.filter(i => i.id !== gameId)
    })
  } catch (e: any) {
    // silently ignore or handle if needed
  } finally {
    deletingId.value = null
  }
}

const createGame = async () => {
  if (!newGameName.value.trim()) return

  isSubmitting.value = true
  submitError.value = ''

  try {
    const userId = getUserIdFromToken()
    const res = await post('/games', {
      name: newGameName.value.trim(),
      status: activeColumnId.value,
      ...(userId !== null ? { user_id: userId } : {}),
    }) as { game: Game } | Game

    const game: Game = 'game' in res ? res.game : res

    const column = columns.value.find(c => c.id === activeColumnId.value)
    column?.items.unshift(game)
    closeModal()
  } catch (e: any) {
    submitError.value = e?.data?.message ?? 'Failed to create game. Try again.'
  } finally {
    isSubmitting.value = false
  }
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

    <main class="flex flex-1 gap-4 p-6 overflow-hidden">
      <!-- Global error -->
      <div
        v-if="fetchError"
        class="absolute top-20 left-1/2 -translate-x-1/2 bg-red-900/80 border border-red-700 text-red-200 text-sm px-4 py-2 rounded-lg"
      >
        {{ fetchError }}
      </div>

      <div
        v-for="column in columns"
        :key="column.id"
        class="flex flex-col flex-1 min-w-0 bg-slate-800 rounded-xl border border-slate-700"
      >
        <!-- Column Header -->
        <div class="flex items-center gap-2 px-4 py-3 border-b border-slate-700">
          <span :class="['w-2.5 h-2.5 rounded-full', column.color]" />

          <h2 class="font-semibold text-sm text-slate-100">{{ column.label }}</h2>

          <span class="ml-auto text-xs text-slate-400 bg-slate-700 rounded-full px-2 py-0.5">
            {{ column.items.length }}
          </span>
        </div>

        <!-- Column Body -->
        <div class="relative flex-1 min-h-0">

          <!-- Loading skeletons -->
          <div v-if="isLoading" class="flex flex-col gap-3 px-3 py-3">
            <div
              v-for="n in 3"
              :key="n"
              class="h-16 rounded-xl bg-slate-700/50 animate-pulse"
            />
          </div>

          <draggable
            v-else
            v-model="column.items"
            group="games"
            item-key="id"
            ghost-class="drag-ghost"
            drag-class="drag-active"
            class="absolute inset-0 overflow-y-auto flex flex-col gap-3 px-3 py-3"
            @change="onColumnChange($event, column.id)"
          >
            <template #item="{ element: item }">
              <Card
                :class="[
                  'border-slate-600 text-white py-3 transition-colors select-none',
                  updatingId === item.id
                    ? 'bg-slate-700/50 opacity-60 cursor-wait'
                    : 'bg-slate-700 hover:bg-slate-600 cursor-grab active:cursor-grabbing',
                ]"
              >
                <CardHeader class="px-4 pb-0 pt-0">
                  <div class="flex items-start justify-between gap-2">
                    <CardTitle class="text-sm font-semibold leading-snug">{{ item.name }}</CardTitle>
                    <button
                      class="shrink-0 text-slate-500 hover:text-red-400 transition-colors disabled:opacity-40"
                      :disabled="deletingId === item.id || updatingId === item.id"
                      @click.stop="deleteGame(item.id)"
                      title="Delete game"
                    >
                      <svg v-if="deletingId !== item.id" xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M9 6V4h6v2" />
                      </svg>
                      <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    </button>
                  </div>
                </CardHeader>
                <CardContent class="px-4 pb-0 pt-1.5">
                  <div class="flex items-center justify-between">
                    <span
                      :class="[
                        'text-xs font-medium px-2 py-0.5 rounded-full capitalize',
                        {
                          'bg-slate-600 text-slate-300': item.status === 'to-play',
                          'bg-blue-500/20 text-blue-300': item.status === 'playing',
                          'bg-green-500/20 text-green-300': item.status === 'finished',
                          'bg-red-500/20 text-red-300': item.status === 'dropped',
                        }
                      ]"
                    >{{ (item.status ?? '').replace('-', ' ') }}</span>
                    <div class="flex items-center gap-1.5">
                      <svg v-if="updatingId === item.id" xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 animate-spin text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      <span v-if="item.created_at" class="text-xs text-slate-500">
                        {{ new Date(item.created_at).toLocaleDateString() }}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </template>

            <template #footer>
              <button
                class="mt-0 flex flex-col items-center justify-center py-6 w-full text-slate-500 hover:text-slate-300 text-sm gap-1 rounded-lg border border-dashed border-slate-700 hover:border-slate-500 transition-colors"
                @click="openModal(column.id)"
              >
                <span class="text-2xl leading-none">+</span>
                <span>Add game</span>
              </button>
            </template>
          </draggable>

        </div>
      </div>
    </main>

    <!-- Create Game Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="isModalOpen"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          @click.self="closeModal"
        >
          <div class="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h3 class="text-lg font-semibold text-white mb-1">Add game</h3>
            <p class="text-sm text-slate-400 mb-5">
              Adding to <span class="text-white font-medium">{{ activeColumnLabel }}</span>
            </p>

            <form @submit.prevent="createGame" class="flex flex-col gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-sm text-slate-300" for="game-name">Game name</label>
                <input
                  id="game-name"
                  v-model="newGameName"
                  type="text"
                  placeholder="e.g. Elden Ring"
                  autofocus
                  class="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-slate-400 transition-colors"
                />
              </div>

              <p v-if="submitError" class="text-xs text-red-400">{{ submitError }}</p>

              <div class="flex gap-3 justify-end pt-1">
                <button
                  type="button"
                  class="px-4 py-2 text-sm rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                  @click="closeModal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="isSubmitting || !newGameName.trim()"
                  class="px-4 py-2 text-sm rounded-lg bg-white text-slate-900 font-medium hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {{ isSubmitting ? 'Adding...' : 'Add game' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.card-enter-active {
  transition: all 0.25s ease;
}
.card-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

:deep(.drag-ghost) {
  opacity: 0.3;
  background: #475569;
  border: 2px dashed #94a3b8;
  border-radius: 0.75rem;
}

:deep(.drag-active) {
  opacity: 0.95;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  transform: rotate(1.5deg) scale(1.02);
}
</style>
