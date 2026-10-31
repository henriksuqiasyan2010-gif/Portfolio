import { gsap } from 'gsap'

const GLYPHS = '!<>-_\\/[]{}=+*^?#%$&@0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const pick = () => GLYPHS[(Math.random() * GLYPHS.length) | 0]

export interface Scrambler {
  play(opts?: { delay?: number; stagger?: number; settle?: number }): Promise<void>
}

/**
 * Делит текст элемента на буквы. Настоящий текст остаётся в DOM для скринридеров
 * (.sr-only), анимируется только визуальная копия с aria-hidden.
 * Каждая буква держит свою ширину, случайный символ рисуется поверх через ::after,
 * поэтому вёрстка не прыгает.
 */
export function prepareScramble(el: HTMLElement): Scrambler {
  const chars: HTMLElement[] = []
  const sr = document.createElement('span')
  sr.className = 'sr-only'
  sr.textContent = el.textContent?.replace(/\s+/g, ' ').trim() ?? ''

  const vis = document.createElement('span')
  vis.className = 'scr'
  vis.setAttribute('aria-hidden', 'true')

  const build = (from: Node, to: Node) => {
    from.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        for (const part of (node.textContent ?? '').split(/(\s+)/)) {
          if (!part) continue
          if (/^\s+$/.test(part)) {
            to.appendChild(document.createTextNode(' '))
            continue
          }
          const w = document.createElement('span')
          w.className = 'w'
          for (const ch of part) {
            const c = document.createElement('span')
            c.className = 'c'
            c.textContent = ch
            w.appendChild(c)
            chars.push(c)
          }
          to.appendChild(w)
        }
      } else if (node instanceof HTMLElement) {
        const copy = node.cloneNode(false) as HTMLElement
        copy.removeAttribute('id')
        build(node, copy)
        to.appendChild(copy)
      }
    })
  }
  build(el, vis)
  el.replaceChildren(sr, vis)

  return {
    play({ delay = 0, stagger = 0.04, settle = 0.24 } = {}) {
      return new Promise((resolve) => {
        let t = -delay
        let frame = 0
        const tick = (_time: number, dt: number) => {
          t += dt / 1000
          if (t < 0) return
          // перебор ~30 раз в секунду: по-ретро ступенчато и дешевле
          const swap = frame++ % 2 === 0
          let done = true
          for (let i = 0; i < chars.length; i++) {
            const c = chars[i]
            if (t >= settle + i * stagger) {
              if (c.dataset.s !== undefined) delete c.dataset.s
            } else {
              done = false
              if (swap) c.dataset.s = pick()
            }
          }
          if (done) {
            gsap.ticker.remove(tick)
            resolve()
          }
        }
        chars.forEach((c) => (c.dataset.s = pick()))
        gsap.ticker.add(tick)
      })
    },
  }
}
