import { gsap } from 'gsap'
import type { GLApi } from '../gl/renderer'
import type { QualityLevel } from '../state'

/** Панель ?debug: FPS, текущий уровень и ручное переключение уровней. */
export function initDebug(gl: GLApi | null) {
  const el = document.createElement('div')
  el.className = 'debug'
  el.setAttribute('aria-hidden', 'true')
  el.innerHTML = `<pre class="debug__stats"></pre><div class="debug__levels">${(['low', 'medium', 'high'] as QualityLevel[])
    .map((l) => `<button type="button" data-level="${l}" tabindex="-1">${l}</button>`)
    .join('')}</div>`
  document.body.append(el)
  const stats = el.querySelector('pre')!
  el.addEventListener('click', (e) => {
    const l = (e.target as HTMLElement).dataset.level as QualityLevel | undefined
    if (l) gl?.setLevel(l)
  })

  let acc = 0
  let frames = 0
  gsap.ticker.add((_t, dt) => {
    acc += dt
    frames++
    if (acc < 250) return
    const fps = (frames * 1000) / acc
    acc = 0
    frames = 0
    stats.textContent = gl
      ? `fps   ${fps.toFixed(0).padStart(3)}  (gl avg ${gl.fps.toFixed(0)})\nlevel ${gl.level}\npart  ${gl.particles}\ndpr   ${gl.dpr}\ngpu   ${gl.gpu.slice(0, 42)}`
      : `fps   ${fps.toFixed(0)}\nwebgl off (fallback)`
    el.querySelectorAll<HTMLButtonElement>('button').forEach((b) => b.classList.toggle('is-on', b.dataset.level === gl?.level))
  })
}
