export const useAuth = () => {
  const token = useCookie('auth_token', {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'strict',
  })

  const setToken = (value: string) => {
    token.value = value
  }

  const clearToken = () => {
    token.value = null
  }

  const isAuthenticated = computed(() => !!token.value)

  return { token, setToken, clearToken, isAuthenticated }
}
