import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { $, $$, state } from '../state'
import { prepareScramble } from '../fx/scramble'
import { glitchLoop } from '../fx/glitch'

/** Счётчик докручивается от 0 до значения за 1,2 с с ease-out; итоговое число лежит в DOM для скринридеров. */
function prepareCounter(el: HTMLElement) {
  const value = Number(el.dataset.count) || 0
  const suffix = el.dataset.suffix ?? ''
  const sr = document.createElement('span')
  sr.className = 'sr-only'
  sr.textContent = `${value}${suffix}`
  el.after(sr)
  el.setAttribute('aria-hidden', 'true')
  el.textContent = `0${suffix}`
  return () => {
    const o = { v: 0 }
    gsap.to(o, {
      v: value,
      duration: 1.2,
      ease: 'power3.out',
      onUpdate: () => (el.textContent = `${Math.round(o.v)}${suffix}`),
    })
  }
}

export function initHero() {
  const title = $('#hero-title')!
  const items = $$('.hero__kicker, .hero__sub, .stat, .hero__cta > *, .hero__scroll')
  let visible = true
  ScrollTrigger.create({
    trigger: '#hero',
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (s) => (visible = s.isActive),
  })

  if (state.reduced) return { reveal() {} }

  const scramble = prepareScramble(title)
  const counters = $$('.stat__num').map(prepareCounter)
  const fromIntro = document.documentElement.classList.contains('intro-on')
  if (fromIntro) gsap.set(items, { opacity: 0, y: 18 })

  return {
    reveal(afterIntro: boolean) {
      if (afterIntro) {
        gsap.to(items, { opacity: 1, y: 0, duration: 0.9, stagger: 0.07, ease: 'power3.out', delay: 0.25 })
      }
      scramble.play({ delay: afterIntro ? 0.1 : 0.05, stagger: 0.04, settle: 0.3 }).then(() => glitchLoop(title, () => visible))
      ScrollTrigger.create({
        trigger: '.stats',
        start: 'top 92%',
        once: true,
        onEnter: () => gsap.delayedCall(afterIntro ? 0.5 : 0.2, () => counters.forEach((run) => run())),
      })
    },
  }
}
