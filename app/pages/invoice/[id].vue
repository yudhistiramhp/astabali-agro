<script setup lang="ts">
import type { Invoice, InvoiceItem } from '~/utils/invoice'

const route = useRoute()
const { confirm, notify } = useDialog()
const { invoices, load, get, blank, upsert, remove, history, itemNames, customers } = useInvoices()

const id = route.params.id as string
try {
  await load(true) // ambil data terbaru dari database (nomor invoice berikutnya, saran barang)
} catch {}
const existing = id === 'new' ? null : get(id)
if (id !== 'new' && !existing) navigateTo('/')
const draft = ref<Invoice>(existing ? JSON.parse(JSON.stringify(existing)) : blank())

const t = computed(() => totals(draft.value))

const isDuplicate = computed(() => {
  const n = draft.value.number.trim().toLowerCase()
  return !!n && invoices.value.some((i) => i.id !== draft.value.id && i.number.trim().toLowerCase() === n)
})

function addItem() {
  draft.value.items.push({ name: '', unit: 'kg', qty: null, price: null })
}
function removeItem(idx: number) {
  draft.value.items.splice(idx, 1)
  if (!draft.value.items.length) addItem()
}
// Isi unit & harga terakhir saat memilih barang lama (harga tetap bisa diubah manual)
function onNameChange(it: InvoiceItem) {
  const h = history.value.get(it.name.trim().toLowerCase())
  if (h && it.price == null) {
    it.unit = h.unit
    it.price = h.price
  }
}
function onStatusChange() {
  draft.value.paidAt = draft.value.status === 'paid' ? todayISO() : null
}

async function save(goHome = true) {
  if (!draft.value.customer.trim()) {
    await notify({ title: 'Customer belum diisi', message: 'Isi nama customer (Bill To) dulu.', tone: 'danger' })
    return false
  }
  draft.value.number = draft.value.number.trim()
  if (!draft.value.number) {
    await notify({ title: 'No. Invoice kosong', message: 'Isi nomor invoice dulu.', tone: 'danger' })
    return false
  }
  if (isDuplicate.value) {
    await notify({ title: 'Nomor sudah dipakai', message: `${draft.value.number} sudah dipakai invoice lain. Ganti dengan nomor yang berbeda.`, tone: 'danger' })
    return false
  }
  draft.value.items = draft.value.items.filter((i) => i.name.trim() || i.qty || i.price)
  if (!draft.value.items.length) addItem()
  try {
    await upsert(JSON.parse(JSON.stringify(draft.value)))
  } catch (e: any) {
    if (e?.statusCode === 409 || e?.response?.status === 409) {
      await notify({ title: 'Nomor sudah dipakai', message: `${draft.value.number} sudah dipakai invoice lain. Ganti dengan nomor yang berbeda.`, tone: 'danger' })
    } else if (e?.statusCode !== 401 && e?.response?.status !== 401) {
      await notify({ title: 'Gagal menyimpan', message: 'Periksa koneksi internet lalu coba lagi.', tone: 'danger' })
    }
    return false
  }
  if (goHome) navigateTo('/')
  return true
}

async function del() {
  const ok = await confirm({
    title: 'Hapus invoice?',
    message: `${draft.value.number} · ${draft.value.customer || '-'} akan dihapus permanen.`,
    confirmText: 'Ya, Hapus',
    tone: 'danger',
  })
  if (!ok) return
  try {
    await remove(draft.value.id)
    navigateTo('/')
  } catch {
    await notify({ title: 'Gagal menghapus', message: 'Periksa koneksi internet lalu coba lagi.', tone: 'danger' })
  }
}

// ---- Preview & PDF ----
const paperRef = ref<{ $el: HTMLElement } | null>(null)
const exporting = ref(false)
const busy = ref(false)
const scale = ref(1)
const previewBox = ref<HTMLElement | null>(null)
const updateScale = () => {
  const w = previewBox.value?.clientWidth ?? window.innerWidth - 32
  scale.value = Math.min(1, (w - 16) / 794)
}
const paperH = ref(1120)
let ro: ResizeObserver | null = null
onMounted(() => {
  updateScale()
  window.addEventListener('resize', updateScale)
  const el = paperRef.value?.$el
  if (el) {
    paperH.value = el.offsetHeight
    ro = new ResizeObserver(() => (paperH.value = el.offsetHeight))
    ro.observe(el)
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScale)
  ro?.disconnect()
})
// Pakai transform (bukan zoom) supaya render di Safari iPhone konsisten
const frameStyle = computed(() =>
  exporting.value
    ? {}
    : { width: 794 * scale.value + 'px', height: paperH.value * scale.value + 'px', overflow: 'hidden', margin: '0 auto' },
)
const paperStyle = computed(() =>
  exporting.value ? {} : { width: '794px', transform: `scale(${scale.value})`, transformOrigin: 'top left' },
)

async function makePdf(): Promise<File> {
  // @ts-ignore html2pdf.js tidak punya type
  const html2pdf = (await import('html2pdf.js')).default
  exporting.value = true // lepas zoom supaya hasil PDF ukurannya pas
  await nextTick()
  const filename = pdfFileName(draft.value)
  const blob: Blob = await html2pdf()
    .set({
      margin: 0,
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, scrollX: 0, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    .from(paperRef.value!.$el)
    .outputPdf('blob')
  exporting.value = false
  return new File([blob], filename, { type: 'application/pdf' })
}

function download(file: File) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(file)
  a.download = file.name
  a.click()
  URL.revokeObjectURL(a.href)
}

async function exportPdf(share: boolean) {
  if (!(await save(false))) return
  busy.value = true
  try {
    const file = await makePdf()
    if (share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: file.name })
    } else {
      download(file)
    }
  } catch (e: any) {
    if (e?.name !== 'AbortError') await notify({ title: 'Gagal membuat PDF', message: String(e?.message || e), tone: 'danger' })
  } finally {
    exporting.value = false
    busy.value = false
  }
}
</script>

<template>
  <div class="wrap">
    <div class="topbar">
      <NuxtLink to="/" class="btn">← Kembali</NuxtLink>
      <h1>{{ existing ? 'Edit' : 'Buat' }} Invoice</h1>
    </div>

    <datalist id="item-names"><option v-for="n in itemNames" :key="n" :value="n" /></datalist>
    <datalist id="customer-names"><option v-for="c in customers" :key="c" :value="c" /></datalist>

    <div class="card">
      <div style="margin-bottom: 10px">
        <label>Bill To (Customer)</label>
        <input v-model="draft.customer" list="customer-names" placeholder="Customer" />
      </div>
      <div class="grid2" style="margin-bottom: 10px">
        <div>
          <label>No. Invoice</label>
          <input v-model="draft.number" />
          <small v-if="isDuplicate" style="color: var(--red)">Nomor ini sudah dipakai.</small>
        </div>
        <div>
          <label>Status</label>
          <select v-model="draft.status" @change="onStatusChange">
            <option value="unpaid">Belum bayar</option>
            <option value="paid">Lunas</option>
          </select>
        </div>
      </div>
      <div class="grid2">
        <div>
          <label>Tanggal</label>
          <input v-model="draft.date" type="date" />
        </div>
        <div>
          <label>Jatuh tempo</label>
          <input v-model="draft.dueDate" type="date" />
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Barang</h2>
      <div v-for="(it, idx) in draft.items" :key="idx" class="item">
        <div class="item-head">
          <input v-model="it.name" list="item-names" placeholder="Nama barang" @change="onNameChange(it)" />
          <button class="btn btn-danger" @click="removeItem(idx)">✕</button>
        </div>
        <div class="grid3">
          <div>
            <label>Qty</label>
            <input v-model.number="it.qty" type="number" inputmode="decimal" step="any" min="0" />
          </div>
          <div>
            <label>Satuan</label>
            <select v-model="it.unit">
              <option v-for="u in UNITS" :key="u.value" :value="u.value">{{ u.label }}</option>
            </select>
          </div>
          <div>
            <label>Harga satuan (Rp)</label>
            <input v-model.number="it.price" type="number" inputmode="numeric" step="any" min="0" />
          </div>
        </div>
        <div class="item-amt">{{ fmtRp(itemAmount(it)) }}</div>
      </div>
      <button class="btn" style="width: 100%" @click="addItem">+ Tambah barang</button>
    </div>

    <div class="card">
      <div class="grid2">
        <div>
          <label>Pajak (%)</label>
          <input v-model.number="draft.taxRate" type="number" inputmode="decimal" step="any" min="0" />
        </div>
        <div>
          <label>Total</label>
          <div style="font-size: 20px; font-weight: 700; color: var(--navy); padding-top: 6px">{{ fmtRp(t.total) }}</div>
        </div>
      </div>
    </div>

    <h2>Preview</h2>
    <div ref="previewBox" class="preview-box">
      <div class="paper-shadow" :style="frameStyle">
        <div :style="paperStyle">
          <InvoicePaper ref="paperRef" :invoice="draft" />
        </div>
      </div>
    </div>

    <div class="actions">
      <button class="btn btn-primary" :disabled="busy" @click="save()">Simpan</button>
      <button class="btn" :disabled="busy" @click="exportPdf(false)">{{ busy ? 'Memproses…' : 'Download PDF' }}</button>
      <button class="btn" :disabled="busy" @click="exportPdf(true)">Kirim (WhatsApp)</button>
      <button v-if="existing" class="btn btn-danger" :disabled="busy" @click="del">Hapus</button>
    </div>
  </div>
</template>
