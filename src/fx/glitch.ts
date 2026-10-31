import { gsap } from 'gsap'
import { rand, state } from '../state'

/** Короткая вспышка: два псевдо-слоя (маджента и циан) со сдвигом и clip-path. */
export function glitch(el: HTMLElement, duration = 0.2) {
  if (state.reduced || el.classList.contains('is-glitching')) return
  el.style.setProperty('--glitch-dur', `${duration}s`)
  el.classList.add('is-glitching')
  gsap.delayedCall(duration, () => el.classList.remove('is-glitching'))
}

/** Случайные вспышки раз в 4–7 с (на уровне Low — раз в 10 с), пока элемент виден. */
export function glitchLoop(el: HTMLElement, isVisible: () => boolean) {
  if (state.reduced) return
  const next = () => {
    const wait = state.quality === 'low' ? 10 : rand(4, 7)
    gsap.delayedCall(wait, () => {
      if (isVisible() && state.pageVisible) glitch(el, 0.2)
      next()
    })
  }
  next()
}
