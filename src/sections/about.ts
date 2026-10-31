import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { $, $$, state } from '../state'
import { prepareTyping } from '../fx/typing'

export function initAbout() {
  const typed = $<HTMLElement>('[data-typed]')
  const lines = $$('.skill')
  if (state.reduced || !typed) return

  const typer = prepareTyping(typed, 25)
  typed.addEventListener('click', () => typer.finish())
  ScrollTrigger.create({ trigger: typed, start: 'top 82%', once: true, onEnter: () => void typer.play() })

  // строки диагностики «проверяются» по очереди: сначала строка, потом статус
  const statuses = lines.map((l) => $('.skill__status', l)!)
  gsap.set(lines, { opacity: 0, x: -10 })
  gsap.set(statuses, { opacity: 0 })
  ScrollTrigger.create({
    trigger: '.skills',
    start: 'top 88%',
    once: true,
    onEnter() {
      gsap.to(lines, { opacity: 1, x: 0, duration: 0.35, stagger: 0.09, ease: 'power2.out' })
      gsap.to(statuses, { opacity: 1, duration: 0.01, stagger: 0.09, delay: 0.32 })
    },
  })
}
