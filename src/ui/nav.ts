import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { $$, state } from '../state'

/** Плавный переход по якорям с переносом фокуса и подсветка текущего раздела в навигации. */
export function initNav() {
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest?.('a[href^="#"]') as HTMLAnchorElement | null
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return
    const id = a.getAttribute('href')!.slice(1)
    const target = id === 'top' ? document.body : document.getElementById(id)
    if (!target) return
    e.preventDefault()
    const behavior: ScrollBehavior = state.reduced ? 'auto' : 'smooth'
    if (id === 'top' || id === 'hero') window.scrollTo({ top: 0, behavior })
    else target.scrollIntoView({ behavior, block: 'start' })
    if (id !== 'top') {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
      target.focus({ preventScroll: true })
    }
    history.replaceState(null, '', id === 'top' ? location.pathname + location.search : `#${id}`)
  })

  const links = $$<HTMLAnchorElement>('.nav__links a')
  for (const link of links) {
    const section = document.querySelector(link.getAttribute('href')!)
    if (!section) continue
    ScrollTrigger.create({
      trigger: section,
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: (s) => (s.isActive ? link.setAttribute('aria-current', 'true') : link.removeAttribute('aria-current')),
    })
  }
}
