export default defineEventHandler(async (event) => {
  requireAuth(event)
  await ensureTable()
  const id = getRouterParam(event, 'id')!
  const inv = await readBody<any>(event)

  if (!inv || inv.id !== id || typeof inv.number !== 'string' || !inv.number.trim() || !Array.isArray(inv.items)) {
    throw createError({ statusCode: 400, statusMessage: 'Data invoice tidak valid' })
  }

  const sql = useSql()
  try {
    await sql`
      INSERT INTO invoices (id, number, data)
      VALUES (${id}, ${inv.number.trim()}, ${JSON.stringify(inv)}::jsonb)
      ON CONFLICT (id) DO UPDATE
        SET number = EXCLUDED.number, data = EXCLUDED.data, updated_at = now()
    `
  } catch (e: any) {
    if (e?.code === '23505') {
      throw createError({ statusCode: 409, statusMessage: 'Nomor invoice sudah dipakai' })
    }
    throw e
  }
  return { ok: true }
})
