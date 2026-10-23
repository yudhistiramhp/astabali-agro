export default defineEventHandler(async (event) => {
  requireAuth(event)
  await ensureTable()
  const id = getRouterParam(event, 'id')!
  const sql = useSql()
  await sql`DELETE FROM invoices WHERE id = ${id}`
  return { ok: true }
})
