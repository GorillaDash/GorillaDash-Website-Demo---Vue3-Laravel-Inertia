<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

/**
 * A small modal confirmation. Cancel takes focus so Enter never confirms by accident,
 * and the confirm button carries the verb it performs.
 */
const props = defineProps<{ title: string; text: string; confirmLabel: string; cancelLabel?: string }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ confirm: [] }>()

const dialog = ref<HTMLDialogElement | null>(null)
const cancelButton = ref<HTMLButtonElement | null>(null)

watch(open, async (isOpen) => {
  if (isOpen) {
    dialog.value?.showModal()
    await nextTick()
    cancelButton.value?.focus()
  } else {
    dialog.value?.close()
  }
})

const confirm = () => {
  open.value = false
  emit('confirm')
}
</script>

<template>
  <dialog
    ref="dialog"
    class="m-auto w-[min(28rem,calc(100%-2rem))] rounded-card bg-white p-0 text-ink shadow-2xl backdrop:bg-black/40"
    @close="open = false"
  >
    <div class="p-6">
      <h2 class="heading-display text-2xl text-brand-primary">{{ props.title }}</h2>
      <p class="mt-3 leading-relaxed text-muted">{{ props.text }}</p>
      <div class="mt-6 flex justify-end gap-2">
        <button
          ref="cancelButton"
          type="button"
          class="rounded-full px-5 py-2.5 font-semibold text-brand-primary hover:bg-brand-tint"
          @click="open = false"
        >
          {{ props.cancelLabel ?? 'Cancel' }}
        </button>
        <button
          type="button"
          class="rounded-full bg-brand-accent px-5 py-2.5 font-semibold text-brand-on-accent hover:bg-brand-accent-600"
          @click="confirm"
        >
          {{ props.confirmLabel }}
        </button>
      </div>
    </div>
  </dialog>
</template>
