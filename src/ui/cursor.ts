import { gsap } from 'gsap'
import { $, state } from '../state'

/**
 * Прицел с отстающим кольцом — только для мыши. Системный курсор остаётся,
 * у прицела pointer-events: none, так что выделение текста и клики не страдают.
 */
export function initCursor() {
  const root = $('.reticle')
  if (!root || !state.finePointer) return
  const ring = $('.reticle__ring', root)!
  const dot = $('.reticle__dot', root)!
  document.documentElement.classList.add('has-reticle')

  const p = state.pointer
  let rx = p.x
  let ry = p.y
  let visible = false
  let locked = false
  let down = false

  gsap.ticker.add((_t, dtMS) => {
    if (p.inside !== visible) {
      visible = p.inside
      root.classList.toggle('is-visible', visible)
      if (visible) {
        rx = p.x
        ry = p.y
      }
    }
    if (!visible) return
    if (state.hoverInteractive !== locked) root.classList.toggle('is-locked', (locked = state.hoverInteractive))
    if (p.down !== down) root.classList.toggle('is-down', (down = p.down))

    const k = state.reduced ? 1 : 1 - Math.pow(1 - 0.2, dtMS / 16.67)
    rx += (p.x - rx) * k
    ry += (p.y - ry) * k
    dot.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`
    ring.style.transform = `translate3d(${rx.toFixed(2)}px, ${ry.toFixed(2)}px, 0)`
  })
}
