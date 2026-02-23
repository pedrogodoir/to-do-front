export const useApi = () => {
  const config = useRuntimeConfig()
  
  return {
    get: (endpoint: string) => $fetch(`${config.public.apiBase}${endpoint}`),
    post: (endpoint: string, body: any) => $fetch(`${config.public.apiBase}${endpoint}`, {
      method: 'POST',
      body
    }),
  }
}