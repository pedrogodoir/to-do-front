export const useApi = () => {
  const config = useRuntimeConfig()
  const { token } = useAuth()

  const authHeaders = computed(() => ({
    ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
  }))

  return {
    get: (endpoint: string) =>
      $fetch(`${config.public.apiBase}${endpoint}`, {
        headers: authHeaders.value,
      }),
    post: (endpoint: string, body: any) =>
      $fetch(`${config.public.apiBase}${endpoint}`, {
        method: 'POST',
        headers: authHeaders.value,
        body,
      }),
    del: (endpoint: string) =>
      $fetch(`${config.public.apiBase}${endpoint}`, {
        method: 'DELETE',
        headers: authHeaders.value,
      }),
    patch: (endpoint: string, body: any) =>
      $fetch(`${config.public.apiBase}${endpoint}`, {
        method: 'PATCH',
        headers: authHeaders.value,
        body,
      }),
  }
}