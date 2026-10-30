export default defineEventHandler(async (event) => {
  requireAuth(event)
  await ensureTable()
  const code = getRouterParam(event, 'code') || ''
  const sql = useSql()
  await sql`DELETE FROM units WHERE code = ${code}`
  return { ok: true }
})
