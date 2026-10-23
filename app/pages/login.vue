<script setup lang="ts">
const password = ref('')
const error = ref('')
const busy = ref(false)
const authed = useState<boolean | null>('authed', () => null)

async function submit() {
  if (!password.value) return
  busy.value = true
  error.value = ''
  try {
    await $fetch('/api/login', { method: 'POST', body: { password: password.value } })
    authed.value = true
    await navigateTo('/')
  } catch (e: any) {
    error.value = e?.statusCode === 401 ? 'Password salah.' : e?.data?.statusMessage || 'Gagal masuk. Coba lagi.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="wrap" style="max-width: 380px; padding-top: 60px">
    <div class="card" style="text-align: center">
      <img src="/logo.png" alt="Astabali Agro" style="width: 72px; margin-bottom: 8px" />
      <h1 style="margin-bottom: 14px">Astabali Agro · Invoice</h1>
      <div style="text-align: left; margin-bottom: 12px">
        <label>Password</label>
        <input v-model="password" type="password" autocomplete="current-password" @keyup.enter="submit" />
        <small v-if="error" style="color: var(--red)">{{ error }}</small>
      </div>
      <button class="btn btn-primary" style="width: 100%" :disabled="busy || !password" @click="submit">
        {{ busy ? 'Memproses…' : 'Masuk' }}
      </button>
    </div>
  </div>
</template>
