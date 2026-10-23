import { neon } from '@neondatabase/serverless'

let _sql: ReturnType<typeof neon> | null = null

export function useSql() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL
  if (!url) throw createError({ statusCode: 500, statusMessage: 'DATABASE_URL belum diatur' })
  _sql ??= neon(url)
  return _sql
}

let ready: Promise<void> | null = null

// Buat tabel otomatis saat pertama kali dipakai
export function ensureTable() {
  ready ??= (async () => {
    const sql = useSql()
    await sql`
      CREATE TABLE IF NOT EXISTS invoices (
        id text PRIMARY KEY,
        number text UNIQUE NOT NULL,
        data jsonb NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `
  })().catch((e) => {
    ready = null
    throw e
  })
  return ready
}
