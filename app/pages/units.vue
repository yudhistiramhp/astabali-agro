<script setup lang="ts">
const { units, loadUnits, saveUnit, removeUnit } = useUnits()
const { confirm, notify } = useDialog()

const loading = ref(true)
const editing = ref(false) // true = ubah satuan yang sudah ada (kode tidak bisa diganti)
const form = reactive({ code: '', name: '', factor: 1 as number | null })
const busy = ref(false)

onMounted(async () => {
  try {
    await loadUnits(true)
  } catch (e: any) {
    await notify({ title: 'Gagal memuat satuan', message: String(e?.data?.statusMessage || e?.message || ''), tone: 'danger' })
  } finally {
    loading.value = false
  }
})

function resetForm() {
  editing.value = false
  form.code = ''
  form.name = ''
  form.factor = 1
}

function edit(u: { code: string; name: string; factor: number }) {
  editing.value = true
  form.code = u.code
  form.name = u.name
  form.factor = u.factor
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function submit() {
  const code = form.code.trim()
  const name = form.name.trim()
  const factor = Number(form.factor)
  if (!/^[A-Za-z0-9._-]{1,12}$/.test(code)) {
    return notify({ title: 'Kode tidak valid', message: 'Kode 1–12 karakter, hanya huruf, angka, titik, strip, atau garis bawah (tanpa spasi). Contoh: ons, ikat, pcs.', tone: 'danger' })
  }
  if (!name) return notify({ title: 'Nama belum diisi', message: 'Isi nama satuan, misalnya "Ons".', tone: 'danger' })
  if (!Number.isFinite(factor) || factor <= 0) {
    return notify({ title: 'Pengali tidak valid', message: 'Pengali harus angka lebih dari 0.', tone: 'danger' })
  }
  if (!editing.value && units.value.some((u) => u.code.toLowerCase() === code.toLowerCase())) {
    return notify({ title: 'Kode sudah ada', message: `Satuan dengan kode "${code}" sudah ada.`, tone: 'danger' })
  }
  busy.value = true
  try {
    await saveUnit({ code, name, factor })
    resetForm()
  } catch (e: any) {
    if (e?.statusCode !== 401) await notify({ title: 'Gagal menyimpan', message: String(e?.data?.statusMessage || 'Periksa koneksi internet lalu coba lagi.'), tone: 'danger' })
  } finally {
    busy.value = false
  }
}

async function del(u: { code: string; name: string }) {
  const ok = await confirm({
    title: 'Hapus satuan?',
    message: `${u.name} (${u.code}) akan dihapus dari daftar pilihan. Invoice lama yang sudah memakainya tidak berubah.`,
    confirmText: 'Ya, Hapus',
    tone: 'danger',
  })
  if (!ok) return
  try {
    await removeUnit(u.code)
    if (editing.value && form.code === u.code) resetForm()
  } catch {
    await notify({ title: 'Gagal menghapus', message: 'Periksa koneksi internet lalu coba lagi.', tone: 'danger' })
  }
}
</script>

<template>
  <div class="wrap">
    <div class="topbar">
      <NuxtLink to="/" class="btn">← Kembali</NuxtLink>
      <h1>Data Master Satuan</h1>
    </div>

    <div class="card">
      <h2>{{ editing ? 'Ubah satuan' : 'Tambah satuan' }}</h2>
      <div class="grid2" style="margin-bottom: 10px">
        <div>
          <label>Kode (tampil di invoice)</label>
          <input v-model="form.code" :disabled="editing" placeholder="ons" maxlength="12" />
        </div>
        <div>
          <label>Nama</label>
          <input v-model="form.name" placeholder="Ons" />
        </div>
      </div>
      <div style="margin-bottom: 10px">
        <label>Setara berapa kg (pengali)</label>
        <input v-model.number="form.factor" type="number" inputmode="decimal" step="any" min="0" />
      </div>
      <div class="row">
        <button class="btn btn-primary" :disabled="busy" @click="submit">{{ editing ? 'Simpan perubahan' : 'Tambah' }}</button>
        <button v-if="editing" class="btn" :disabled="busy" @click="resetForm">Batal</button>
      </div>
    </div>

    <div class="card">
      <h2>Daftar satuan</h2>
      <div v-if="loading" class="empty">Memuat…</div>
      <div v-else-if="!units.length" class="empty">Belum ada satuan.</div>
      <div v-for="u in units" :key="u.code" class="inv">
        <div style="flex: 1; min-width: 0">
          <div class="no">{{ u.name }} ({{ u.code }})</div>
          <div class="sub">1 {{ u.code }} = {{ fmtQty(u.factor) }} kg</div>
        </div>
        <div class="row">
          <button class="btn" @click="edit(u)">Ubah</button>
          <button class="btn btn-danger" @click="del(u)">Hapus</button>
        </div>
      </div>
    </div>
  </div>
</template>
