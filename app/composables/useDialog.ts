export type DialogTone = 'primary' | 'success' | 'danger'

export interface DialogOptions {
  title: string
  message?: string
  confirmText?: string
  cancelText?: string | null // null = tombol batal disembunyikan
  tone?: DialogTone
}

interface DialogState extends Required<Omit<DialogOptions, 'message'>> {
  open: boolean
  message: string
}

let resolver: ((v: boolean) => void) | null = null

export function useDialog() {
  const state = useState<DialogState>('app-dialog', () => ({
    open: false,
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Batal',
    tone: 'primary',
  }))

  function open(opts: DialogOptions): Promise<boolean> {
    resolver?.(false)
    state.value = {
      open: true,
      title: opts.title,
      message: opts.message ?? '',
      confirmText: opts.confirmText ?? 'OK',
      cancelText: opts.cancelText === undefined ? 'Batal' : opts.cancelText,
      tone: opts.tone ?? 'primary',
    }
    return new Promise<boolean>((resolve) => {
      resolver = resolve
    })
  }

  function close(result: boolean) {
    state.value.open = false
    resolver?.(result)
    resolver = null
  }

  const confirm = (opts: DialogOptions) => open(opts)
  const notify = (opts: Omit<DialogOptions, 'cancelText'>) => open({ ...opts, cancelText: null })

  return { state, confirm, notify, close }
}
