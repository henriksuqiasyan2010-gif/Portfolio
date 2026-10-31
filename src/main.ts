// Точка входа: один общий цикл анимаций — gsap.ticker (requestAnimationFrame).
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { $, state } from './state'
import { runIntro } from './intro/intro'
import { initHero } from './sections/hero'
import { initAbout } from './sections/about'
import { initReveals } from './sections/reveal'
import { initProjects } from './sections/projects'
import { initContact } from './sections/contact'
import { initNav } from './ui/nav'
import { initPointer } from './ui/pointer'
import { initCursor } from './ui/cursor'
import { initConsoleTrigger, initSound } from './ui/controls'
import type { GLApi } from './gl/renderer'

gsap.registerPlugin(ScrollTrigger)

const html = document.documentElement
html.classList.add('booted')
const debug = new URLSearchParams(location.search).has('debug')

document.addEventListener('visibilitychange', () => (state.pageVisible = !document.hidden))

initPointer()
initNav()
const hero = initHero()
initAbout()
initProjects()
initContact()
initReveals()
initCursor()
initSound()
initConsoleTrigger()

void runIntro((afterIntro) => hero.reveal(afterIntro))

// ---------- WebGL: three.js отдельным чанком, грузится пока идёт интро ----------

const noGL = () => {
  html.classList.remove('gl-maybe', 'gl-on')
  html.classList.add('no-gl')
}

async function loadGL(): Promise<GLApi | null> {
  const canvas = $<HTMLCanvasElement>('#gl')
  if (!canvas || !('WebGL2RenderingContext' in window)) return noGL(), null
  try {
    const { startGL } = await import('./gl/renderer')
    return startGL(canvas)
  } catch {
    noGL()
    return null
  }
}

// на телефонах three.js ждёт первого касания или скролла: главный поток свободен для первой загрузки,
// а до тех пор фоном служат CSS-звёзды
const glReady: Promise<GLApi | null> = state.touch
  ? new Promise((resolve) => {
      const go = () => {
        ;['touchstart', 'scroll', 'pointerdown', 'keydown'].forEach((t) => window.removeEventListener(t, go))
        resolve(loadGL())
      }
      ;['touchstart', 'scroll', 'pointerdown', 'keydown'].forEach((t) => window.addEventListener(t, go, { passive: true, once: true }))
    })
  : new Promise((resolve) => requestAnimationFrame(() => resolve(loadGL())))

if (debug) void glReady.then((gl) => import('./ui/debug').then((m) => m.initDebug(gl)))
