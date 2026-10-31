import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { $, $$, state } from '../state'
import { prepareScramble } from '../fx/scramble'

/** Появление секций по скроллу: подписи выезжают, заголовки скрамблятся, карточки идут лесенкой. */
export function initReveals() {
  if (state.reduced) return

  for (const section of $$('.section')) {
    const label = $('.section-label', section)
    const title = $('.section-title', section)
    if (!label || !title) continue
    const scramble = prepareScramble(title)
    gsap.set(label, { opacity: 0, x: -14 })
    ScrollTrigger.create({
      trigger: title,
      start: 'top 85%',
      once: true,
      onEnter() {
        gsap.to(label, { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' })
        void scramble.play({ delay: 0.08, stagger: 0.045, settle: 0.25 })
      },
    })
  }

  const fadeUp = (targets: HTMLElement[], start = 'top 88%', stagger = 0.08) => {
    if (!targets.length) return
    gsap.set(targets, { opacity: 0, y: 24 })
    ScrollTrigger.batch(targets, {
      start,
      once: true,
      onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.7, stagger, ease: 'power3.out' }),
    })
  }

  fadeUp($$('.card'), 'top 90%', 0.08)
  fadeUp($$('.filters, .contact__text, .contact__links li, .skills__label'), 'top 90%', 0.06)

  // форма «включается» как маленький CRT
  const form = $('.term')
  if (form) {
    gsap.set(form, { opacity: 0, scaleY: 0.02 })
    ScrollTrigger.create({
      trigger: form,
      start: 'top 85%',
      once: true,
      onEnter: () =>
        gsap
          .timeline()
          .to(form, { opacity: 1, duration: 0.12 })
          .to(form, { scaleY: 1, duration: 0.55, ease: 'expo.out' }),
    })
  }

  const hud = $('.eye-slot')
  if (hud) {
    gsap.set(hud, { opacity: 0, scale: 0.94 })
    ScrollTrigger.create({
      trigger: hud,
      start: 'top 85%',
      once: true,
      onEnter: () => gsap.to(hud, { opacity: 1, scale: 1, duration: 1, ease: 'power3.out' }),
    })
  }
}
