export default defineEventHandler(async (event) => {
  requireAuth(event)
  await ensureTable()
  const code = getRouterParam(event, 'code') || ''
  const body = await readBody<{ code?: string; name?: string; factor?: number }>(event)
  const name = String(body?.name ?? '').trim()
  const factor = Number(body?.factor)

  if (!/^[A-Za-z0-9._-]{1,12}$/.test(code) || body?.code !== code) {
    throw createError({ statusCode: 400, statusMessage: 'Kode satuan tidak valid' })
  }
  if (!name || name.length > 40) {
    throw createError({ statusCode: 400, statusMessage: 'Nama satuan tidak valid' })
  }
  if (!Number.isFinite(factor) || factor <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Pengali harus lebih dari 0' })
  }

  const sql = useSql()
  await sql`
    INSERT INTO units (code, name, factor, sort)
    VALUES (${code}, ${name}, ${factor}, COALESCE((SELECT MAX(sort) FROM units), 0) + 1)
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, factor = EXCLUDED.factor
  `
  return { ok: true }
})
