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
    await sql`
      CREATE TABLE IF NOT EXISTS units (
        code text PRIMARY KEY,
        name text NOT NULL,
        factor numeric NOT NULL DEFAULT 1,
        sort integer NOT NULL DEFAULT 0
      )
    `
    // Isi satuan bawaan hanya kalau tabel masih kosong
    await sql`
      INSERT INTO units (code, name, factor, sort)
      SELECT * FROM (VALUES
        ('gr', 'Gram', 0.001, 1),
        ('kg', 'Kilogram', 1, 2),
        ('biji', 'Bijian', 1, 3),
        ('pax', 'Pax', 1, 4),
        ('sisir', 'Sisir', 1, 5)
      ) AS v(code, name, factor, sort)
      WHERE NOT EXISTS (SELECT 1 FROM units)
    `
  })().catch((e) => {
    ready = null
    throw e
  })
  return ready
}
