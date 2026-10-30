export default defineEventHandler(async (event) => {
  requireAuth(event)
  await ensureTable()
  const sql = useSql()
  const rows = (await sql`SELECT code, name, factor FROM units ORDER BY sort, code`) as {
    code: string
    name: string
    factor: string
  }[]
  return rows.map((r) => ({ code: r.code, name: r.name, factor: Number(r.factor) }))
})
