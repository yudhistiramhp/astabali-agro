export interface InvoiceItem {
  name: string
  unit: string
  qty: number | null
  price: number | null
}

export interface Invoice {
  id: string
  number: string
  customer: string
  date: string // YYYY-MM-DD
  dueDate: string // YYYY-MM-DD
  items: InvoiceItem[]
  taxRate: number // persen
  status: 'unpaid' | 'paid'
  paidAt: string | null
}

export const BUSINESS = {
  name: 'Astabali Agro',
  address: 'Bedugul, Bali',
  phone: '+62 858 0333 8888',
  email: 'astabaliagro@gmail.com',
  payment: 'BCA 0402515242 a.n I Wayan Agus Mertadana',
  contact: 'Agus',
}

export const UNITS = [
  { value: 'gr', label: 'Gram (gr)' },
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'biji', label: 'Bijian (biji)' },
  { value: 'pax', label: 'Pax' },
  { value: 'sisir', label: 'Sisir' },
]

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES']

const toISO = (dt: Date) =>
  `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`

export const todayISO = () => toISO(new Date())

export const addDaysISO = (iso: string, days: number) => {
  const [y, m, d] = iso.split('-').map(Number)
  return toISO(new Date(y!, m! - 1, d! + days))
}

const nf = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 })
const qf = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 3 })

export const fmtNum = (n: number) => nf.format(n)
export const fmtQty = (n: number) => qf.format(n)
export const fmtRp = (n: number) => 'Rp' + nf.format(n)

// 2026-10-19 -> 19/10/26
export const fmtDate = (iso: string) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y!.slice(2)}`
}

// 2026-10-19 -> 19 OKT 26
export const fmtFileDate = (iso: string) => {
  const [y, m, d] = iso.split('-')
  return `${d} ${MONTHS[Number(m) - 1]} ${y!.slice(2)}`
}

export const itemAmount = (i: InvoiceItem) => Math.round((i.qty || 0) * (i.price || 0))

export const totals = (inv: Invoice) => {
  const subtotal = inv.items.reduce((s, i) => s + itemAmount(i), 0)
  const tax = Math.round((subtotal * (inv.taxRate || 0)) / 100)
  return { subtotal, tax, total: subtotal + tax }
}

export const pdfFileName = (inv: Invoice) =>
  `${inv.number} ${(inv.customer || 'CUSTOMER').toUpperCase()} ${fmtFileDate(inv.date)}.pdf`
