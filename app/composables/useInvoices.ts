import type { Invoice } from '~/utils/invoice'

const KEY = 'astabali-invoices-v1'

export function useInvoices() {
  const invoices = useState<Invoice[]>('invoices', () => {
    if (import.meta.client) {
      try {
        return JSON.parse(localStorage.getItem(KEY) || '[]')
      } catch {
        return []
      }
    }
    return []
  })

  const persist = () => localStorage.setItem(KEY, JSON.stringify(invoices.value))

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

  const upsert = (inv: Invoice) => {
    const idx = invoices.value.findIndex((i) => i.id === inv.id)
    if (idx >= 0) invoices.value[idx] = inv
    else invoices.value.unshift(inv)
    persist()
  }

  const remove = (id: string) => {
    invoices.value = invoices.value.filter((i) => i.id !== id)
    persist()
  }

  const setStatus = (id: string, status: Invoice['status']) => {
    const inv = get(id)
    if (!inv) return
    inv.status = status
    inv.paidAt = status === 'paid' ? todayISO() : null
    persist()
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

  return { invoices, get, blank, upsert, remove, setStatus, history, itemNames, customers }
}
