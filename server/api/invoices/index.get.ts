export default defineEventHandler(async (event) => {
  requireAuth(event)
  await ensureTable()
  const sql = useSql()
  const rows = (await sql`SELECT data FROM invoices ORDER BY updated_at DESC`) as { data: unknown }[]
  return rows.map((r) => r.data)
})
