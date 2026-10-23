export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login') return
  const authed = useState<boolean | null>('authed', () => null)
  if (authed.value === null) {
    try {
      const r = await $fetch<{ ok?: boolean }>('/api/me')
      authed.value = r?.ok === true
    } catch {
      authed.value = false
    }
  }
  if (!authed.value) return navigateTo('/login')
})