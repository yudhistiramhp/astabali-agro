<script setup lang="ts">
const { state, close } = useDialog()

function onKey(e: KeyboardEvent) {
  if (!state.value.open) return
  if (e.key === 'Escape') close(false)
  if (e.key === 'Enter') close(true)
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

const icon = computed(() => (state.value.tone === 'success' ? '✓' : state.value.tone === 'danger' ? '!' : '?'))
</script>

<template>
  <Transition name="dlg">
    <div v-if="state.open" class="overlay" @click.self="close(false)">
      <div class="dialog" role="dialog" aria-modal="true">
        <div class="icon" :class="state.tone">{{ icon }}</div>
        <h3>{{ state.title }}</h3>
        <p v-if="state.message">{{ state.message }}</p>
        <div class="btns">
          <button v-if="state.cancelText" class="b b-cancel" @click="close(false)">{{ state.cancelText }}</button>
          <button class="b b-ok" :class="state.tone" @click="close(true)">{{ state.confirmText }}</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.overlay {
  position: fixed; inset: 0; z-index: 1000; background: rgba(15, 23, 42, 0.5);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.dialog {
  width: 100%; max-width: 360px; background: #fff; border-radius: 16px; padding: 24px 20px 18px;
  text-align: center; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
}
.icon {
  width: 48px; height: 48px; border-radius: 50%; margin: 0 auto 12px; font-size: 24px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.icon.primary { background: #e3ecf6; color: #17426f; }
.icon.success { background: #def3e7; color: #1a7f4b; }
.icon.danger { background: #fde8e6; color: #b3261e; }
h3 { margin: 0 0 6px; font-size: 17px; color: #1b1f24; }
p { margin: 0 0 4px; font-size: 14px; color: #5a6472; line-height: 1.45; word-break: break-word; }
.btns { display: flex; gap: 10px; margin-top: 18px; }
.b { flex: 1; padding: 11px 12px; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; border: 1px solid transparent; }
.b-cancel { background: #fff; border-color: #d9dee6; color: #1b1f24; }
.b-ok { color: #fff; }
.b-ok.primary { background: #17426f; }
.b-ok.success { background: #1a7f4b; }
.b-ok.danger { background: #b3261e; }

.dlg-enter-active, .dlg-leave-active { transition: opacity 0.15s ease; }
.dlg-enter-active .dialog, .dlg-leave-active .dialog { transition: transform 0.15s ease; }
.dlg-enter-from, .dlg-leave-to { opacity: 0; }
.dlg-enter-from .dialog, .dlg-leave-to .dialog { transform: scale(0.95); }
</style>
