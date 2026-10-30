import { DEFAULT_UNITS, legacyFactor, type Unit } from '~/utils/invoice'

export function useUnits() {
  const units = useState<Unit[]>('units', () => DEFAULT_UNITS)
  const loaded = useState('units-loaded', () => false)
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

  async function loadUnits(force = false) {
    if (loaded.value && !force) return
    const data = await api<unknown>('/api/units')
    if (!Array.isArray(data)) throw new Error('Respons server tidak valid (bukan daftar satuan)')
    units.value = data as Unit[]
    loaded.value = true
  }

  async function saveUnit(u: Unit) {
    await api(`/api/units/${encodeURIComponent(u.code)}`, { method: 'PUT', body: u })
    await loadUnits(true)
  }

  async function removeUnit(code: string) {
    await api(`/api/units/${encodeURIComponent(code)}`, { method: 'DELETE' })
    await loadUnits(true)
  }

  const unitByCode = (code: string) => units.value.find((u) => u.code === code)
  const factorFor = (code: string) => unitByCode(code)?.factor ?? legacyFactor(code)

  return { units, loadUnits, saveUnit, removeUnit, unitByCode, factorFor }
}
