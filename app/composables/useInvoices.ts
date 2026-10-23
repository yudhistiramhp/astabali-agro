import type { Invoice } from '~/utils/invoice'

const LEGACY_KEY = 'astabali-invoices-v1' // data lama di localStorage

export function useInvoices() {
  const invoices = useState<Invoice[]>('invoices', () => [])
  const loaded = useState('invoices-loaded', () => false)
  const authed = useState<boolean | null>('authed', () => null)

  async function api<T>(url: string, opts: any = {}): Promise<T> {
    try {
      return await $fetch<T>(url, opts)
    } catch (e: any) {
      if (e?.statusCode === 401 || e?.response?.status === 401) {
        authed.value = false
        await navigateTo('/login')
      }
      throw e
    }
  }

  async function load(force = false) {
    if (loaded.value && !force) return
    const data = await api<unknown>('/api/invoices')
    if (!Array.isArray(data)) throw new Error('Respons server tidak valid (bukan daftar invoice)')
    invoices.value = data as Invoice[]
    loaded.value = true
  }

  const get = (id: string) => invoices.value.find((i) => i.id === id) || null

  const nextNumber = () => {
    const max = invoices.value.reduce((m, i) => {
      const n = parseInt(i.number.replace(/\D/g, ''), 10)
      return Number.isFinite(n) && n > m ? n : m
    }, 0)
    return 'INV' + String(max + 1).padStart(3, '0')
  }

  const blank = (): Invoice => {
    const date = todayISO()
    return {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      number: nextNumber(),
      customer: '',
      date,
      dueDate: addDaysISO(date, 7),
      items: [{ name: '', unit: 'kg', qty: null, price: null }],
      taxRate: 0,
      status: 'unpaid',
      paidAt: null,
    }
  }

  // Melempar error (409 = nomor sudah dipakai) kalau gagal
  async function upsert(inv: Invoice) {
    await api(`/api/invoices/${inv.id}`, { method: 'PUT', body: inv })
    const idx = invoices.value.findIndex((i) => i.id === inv.id)
    if (idx >= 0) invoices.value[idx] = inv
    else invoices.value.unshift(inv)
  }

  async function remove(id: string) {
    await api(`/api/invoices/${id}`, { method: 'DELETE' })
    invoices.value = invoices.value.filter((i) => i.id !== id)
  }

  async function setStatus(id: string, status: Invoice['status']) {
    const inv = get(id)
    if (!inv) return
    await upsert({ ...inv, status, paidAt: status === 'paid' ? todayISO() : null })
  }

  async function logout() {
    await $fetch('/api/logout', { method: 'POST' })
    authed.value = false
    loaded.value = false
    invoices.value = []
    await navigateTo('/login')
  }

  // ---- Pindahkan data lama dari localStorage ke database ----
  function legacy(): Invoice[] {
    if (!import.meta.client) return []
    try {
      const list = JSON.parse(localStorage.getItem(LEGACY_KEY) || '[]')
      return Array.isArray(list) ? list : []
    } catch {
      return []
    }
  }

  async function importLegacy() {
    const list = legacy()
    let ok = 0
    let skipped = 0
    for (const inv of list) {
      try {
        await api(`/api/invoices/${inv.id}`, { method: 'PUT', body: inv })
        ok++
      } catch {
        skipped++ // biasanya nomor kembar
      }
    }
    if (!skipped) localStorage.removeItem(LEGACY_KEY)
    await load(true)
    return { ok, skipped }
  }

  // Nama barang -> unit & harga terakhir (saran otomatis, harga tetap bisa diubah)
  const history = computed(() => {
    const map = new Map<string, { unit: string; price: number | null }>()
    const sorted = [...invoices.value].sort((a, b) => b.date.localeCompare(a.date))
    for (const inv of sorted) {
      for (const it of inv.items) {
        const key = it.name.trim().toLowerCase()
        if (key && !map.has(key)) map.set(key, { unit: it.unit, price: it.price })
      }
    }
    return map
  })

  const itemNames = computed(() => {
    const names = new Set<string>()
    for (const inv of invoices.value) for (const it of inv.items) if (it.name.trim()) names.add(it.name.trim())
    return [...names].sort()
  })

  const customers = computed(() =>
    [...new Set(invoices.value.map((i) => i.customer.trim()).filter(Boolean))].sort(),
  )

  return {
    invoices, load, get, blank, upsert, remove, setStatus, logout,
    legacy, importLegacy, history, itemNames, customers,
  }
}