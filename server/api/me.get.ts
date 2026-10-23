export default defineEventHandler((event) => {
  requireAuth(event)
  return { ok: true }
})
