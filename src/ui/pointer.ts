import { state } from '../state'

const INTERACTIVE = 'a, button, summary, input, textarea, select, label, [role="button"], .card'

/** Позиция курсора и «наведён ли он на интерактив» — для частиц, глаза и прицела. */
export function initPointer() {
  const p = state.pointer
  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return
      p.x = e.clientX
      p.y = e.clientY
      p.inside = true
    },
    { passive: true },
  )
  document.documentElement.addEventListener('pointerleave', () => (p.inside = false))
  window.addEventListener('blur', () => (p.inside = false))
  window.addEventListener('pointerdown', () => (p.down = true), { passive: true })
  window.addEventListener('pointerup', () => (p.down = false), { passive: true })

  document.addEventListener('pointerover', (e) => {
    state.hoverInteractive = !!(e.target as Element).closest?.(INTERACTIVE)
  })
  document.addEventListener('focusin', (e) => {
    if ((e.target as Element).matches?.(INTERACTIVE)) state.hoverInteractive = true
  })
  document.addEventListener('focusout', () => (state.hoverInteractive = false))
}
