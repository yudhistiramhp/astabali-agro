import { timingSafeEqual } from 'node:crypto'

export default defineEventHandler(async (event) => {
  const real = process.env.APP_PASSWORD
  if (!real || !process.env.SESSION_SECRET) {
    throw createError({ statusCode: 500, statusMessage: 'APP_PASSWORD / SESSION_SECRET belum diatur' })
  }
  const body = await readBody<{ password?: string }>(event)
  const a = Buffer.from(String(body?.password ?? ''))
  const b = Buffer.from(real)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw createError({ statusCode: 401, statusMessage: 'Password salah' })
  }
  setCookie(event, COOKIE, makeToken(), {
    httpOnly: true,
    secure: !import.meta.dev,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  return { ok: true }
})
