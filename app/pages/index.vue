<script setup lang="ts">
import type { Invoice } from '~/utils/invoice'

const { invoices, setStatus, customers } = useInvoices()
const { confirm } = useDialog()

const status = ref<'all' | 'unpaid' | 'paid'>('all')
const month = ref('') // YYYY-MM
const customer = ref('')

const base = computed(() =>
  invoices.value
    .filter((i) => (!month.value || i.date.startsWith(month.value)) && (!customer.value || i.customer === customer.value))
    .sort((a, b) => b.date.localeCompare(a.date) || b.number.localeCompare(a.number)),
)
const list = computed(() => base.value.filter((i) => status.value === 'all' || i.status === status.value))
const sumOf = (s: Invoice['status']) =>
  base.value.filter((i) => i.status === s).reduce((n, i) => n + totals(i).total, 0)

const itemCount = (i: Invoice) => i.items.filter((it) => it.name.trim()).length

async function toggle(i: Invoice) {
  const next = i.status === 'paid' ? 'unpaid' : 'paid'
  const ok = await confirm({
    title: next === 'paid' ? 'Tandai sebagai lunas?' : 'Ubah ke belum bayar?',
    message: `${i.number} · ${i.customer || '-'} · ${fmtRp(totals(i).total)}`,
    confirmText: next === 'paid' ? 'Ya, Lunas' : 'Ya, Belum Bayar',
    tone: next === 'paid' ? 'success' : 'primary',
  })
  if (ok) setStatus(i.id, next)
}

const toDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y!, m! - 1, d!)
}

async function exportXlsx() {
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Rekap Invoice', { views: [{ state: 'frozen', ySplit: 1 }] })

  ws.columns = [
    { header: 'No Invoice', key: 'number', width: 12 },
    { header: 'Tanggal', key: 'date', width: 12, style: { numFmt: 'dd/mm/yy' } },
    { header: 'Jatuh Tempo', key: 'due', width: 12, style: { numFmt: 'dd/mm/yy' } },
    { header: 'Customer', key: 'customer', width: 26 },
    { header: 'Jumlah Item', key: 'count', width: 12 },
    { header: 'Subtotal', key: 'subtotal', width: 14, style: { numFmt: '#,##0' } },
    { header: 'Pajak', key: 'tax', width: 12, style: { numFmt: '#,##0' } },
    { header: 'Total', key: 'total', width: 14, style: { numFmt: '#,##0' } },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Tgl Bayar', key: 'paidAt', width: 12, style: { numFmt: 'dd/mm/yy' } },
  ]

  const head = ws.getRow(1)
  head.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF17426F' } }

  const rows = [...list.value].reverse() // paling lama di atas
  for (const i of rows) {
    const t = totals(i)
    const row = ws.addRow({
      number: i.number,
      date: toDate(i.date),
      due: toDate(i.dueDate),
      customer: i.customer,
      count: itemCount(i),
      subtotal: t.subtotal,
      tax: t.tax,
      total: t.total,
      status: i.status === 'paid' ? 'Lunas' : 'Belum bayar',
      paidAt: i.paidAt ? toDate(i.paidAt) : null,
    })
    row.getCell('status').font = { bold: true, color: { argb: i.status === 'paid' ? 'FF1A7F4B' : 'FFB3261E' } }
  }

  if (rows.length) {
    const last = rows.length + 1
    const sum = ws.addRow({ customer: 'TOTAL', total: { formula: `SUM(H2:H${last})` } })
    sum.font = { bold: true }
    sum.getCell('total').numFmt = '#,##0'
  }

  const buf = await wb.xlsx.writeBuffer()
  const a = document.createElement('a')
  a.href = URL.createObjectURL(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
  )
  a.download = 'rekap-invoice.xlsx'
  a.click()
  URL.revokeObjectURL(a.href)
}
</script>

<template>
  <div class="wrap">
    <div class="topbar">
      <h1>Astabali Agro · Invoice</h1>
      <NuxtLink to="/invoice/new" class="btn btn-primary">+ Invoice Baru</NuxtLink>
    </div>

    <div class="summary">
      <div class="sum unpaid"><small>Belum bayar</small><b>{{ fmtRp(sumOf('unpaid')) }}</b></div>
      <div class="sum paid"><small>Sudah bayar</small><b>{{ fmtRp(sumOf('paid')) }}</b></div>
    </div>

    <div class="card">
      <div class="grid2" style="margin-bottom: 10px">
        <div>
          <label>Bulan</label>
          <input v-model="month" type="month" />
        </div>
        <div>
          <label>Customer</label>
          <select v-model="customer">
            <option value="">Semua</option>
            <option v-for="c in customers" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
      </div>
      <div class="row">
        <button class="btn" :class="{ 'btn-primary': status === 'all' }" @click="status = 'all'">Semua</button>
        <button class="btn" :class="{ 'btn-primary': status === 'unpaid' }" @click="status = 'unpaid'">Belum bayar</button>
        <button class="btn" :class="{ 'btn-primary': status === 'paid' }" @click="status = 'paid'">Lunas</button>
        <button class="btn" style="margin-left: auto" :disabled="!list.length" @click="exportXlsx">Export Excel (.xlsx)</button>
      </div>
    </div>

    <div class="card">
      <div v-if="!list.length" class="empty">Belum ada invoice.</div>
      <div v-for="i in list" :key="i.id" class="inv">
        <NuxtLink :to="`/invoice/${i.id}`" class="main">
          <div class="no">{{ i.number }} · {{ i.customer || '-' }}</div>
          <div class="sub">{{ fmtDate(i.date) }} · {{ itemCount(i) }} item · {{ fmtRp(totals(i).total) }}</div>
        </NuxtLink>
        <button class="badge" :class="i.status" @click="toggle(i)">
          {{ i.status === 'paid' ? 'Lunas' : 'Belum bayar' }}
        </button>
      </div>
    </div>
  </div>
</template>