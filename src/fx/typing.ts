import { gsap } from 'gsap'
import { bus } from '../state'

export interface Typer {
  play(): Promise<void>
  finish(): void
}

/**
 * Печать как в терминале: 25 мс на символ, мигающий курсор.
 * Ненапечатанный хвост лежит прозрачным текстом — абзац сразу занимает итоговую высоту.
 */
export function prepareTyping(el: HTMLElement, msPerChar = 25): Typer {
  const text = el.textContent?.replace(/\s+/g, ' ').trim() ?? ''
  const sr = document.createElement('span')
  sr.className = 'sr-only'
  sr.textContent = text

  const vis = document.createElement('span')
  vis.setAttribute('aria-hidden', 'true')
  const done = document.createElement('span')
  const cursor = document.createElement('span')
  cursor.className = 'typed__cursor'
  const rest = document.createElement('span')
  rest.className = 'typed__rest'
  rest.textContent = text
  vis.append(done, cursor, rest)
  el.replaceChildren(sr, vis)

  let shown = 0
  let tick: ((t: number, dt: number) => void) | null = null
  let resolveFn: (() => void) | null = null

  const render = (n: number) => {
    if (n === shown) return
    if (n - shown >= 2 || n === text.length) bus.emit('type')
    shown = n
    done.textContent = text.slice(0, n)
    rest.textContent = text.slice(n)
  }

  const finish = () => {
    if (tick) gsap.ticker.remove(tick)
    tick = null
    render(text.length)
    resolveFn?.()
    resolveFn = null
  }

  return {
    play() {
      return new Promise<void>((resolve) => {
        resolveFn = resolve
        let t = 0
        tick = (_time, dt) => {
          t += dt
          const n = Math.min(text.length, Math.floor(t / msPerChar))
          render(n)
          if (n >= text.length) finish()
        }
        gsap.ticker.add(tick)
      })
    },
    finish,
  }
}
