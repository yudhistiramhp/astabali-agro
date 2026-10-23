import { createHmac, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'

export const COOKIE = 'astabali_session'
const secret = () => process.env.SESSION_SECRET || ''
const sign = (v: string) => createHmac('sha256', secret()).update(v).digest('hex')

export function makeToken() {
  const exp = String(Date.now() + 30 * 24 * 3600 * 1000) // 30 hari
  return `${exp}.${sign(exp)}`
}

export function validToken(token?: string) {
  if (!token || !secret()) return false
  const [exp, sig] = token.split('.')
  if (!exp || !sig) return false
  const a = Buffer.from(sig)
  const b = Buffer.from(sign(exp))
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false
  return Number(exp) > Date.now()
}

export function requireAuth(event: H3Event) {
  if (!validToken(getCookie(event, COOKIE))) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}
