import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { content, type Project } from '../content'
import { $, $$, bus, state } from '../state'
import { glitch } from '../fx/glitch'

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const esc = (s: string) => s.replace(/[&<>"']/g, (ch) => ESC[ch])
const ext = (href: string) => (/^https?:/.test(href) ? ' target="_blank" rel="noopener noreferrer"' : '')

/** Фильтр по тегам с FLIP-перестройкой сетки и модальное окно с подробностями проекта. */
export function initProjects() {
  const filters = $('.filters')
  const cards = $$('.card')
  const modal = $<HTMLDialogElement>('#project-modal')
  if (!filters || !modal) return

  filters.hidden = false
  ScrollTrigger.refresh()

  // ---------- фильтр ----------
  let current = 'all'
  let busy = false

  const matches = (card: HTMLElement, tag: string) => tag === 'all' || (card.dataset.tags ?? '').split(' ').includes(tag)

  const apply = (tag: string) => {
    for (const card of cards) card.classList.toggle('is-hidden', !matches(card, tag))
  }

  const setFilter = (tag: string) => {
    if (tag === current || busy) return
    current = tag
    $$('.chip', filters).forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.filter === tag)))
    gsap.set(cards, { opacity: 1, y: 0 }) // карточки, ещё не доехавшие при скролле, участвуют в перестройке уже видимыми

    if (state.reduced) {
      apply(tag)
      ScrollTrigger.refresh()
      return
    }

    busy = true
    const leaving = cards.filter((c) => !c.classList.contains('is-hidden') && !matches(c, tag))
    const rebuild = () => {
      // FLIP: запомнить → перестроить → инвертировать → проиграть
      const first = new Map(cards.filter((c) => !c.classList.contains('is-hidden')).map((c) => [c, c.getBoundingClientRect()]))
      apply(tag)
      if (leaving.length) gsap.set(leaving, { clearProps: 'opacity,scale' })
      const visible = cards.filter((c) => !c.classList.contains('is-hidden'))
      const entering: HTMLElement[] = []
      for (const card of visible) {
        const a = first.get(card)
        if (!a) {
          entering.push(card)
          continue
        }
        const b = card.getBoundingClientRect()
        gsap.fromTo(card, { x: a.left - b.left, y: a.top - b.top }, { x: 0, y: 0, duration: 0.6, ease: 'power3.out' })
      }
      if (entering.length) {
        gsap.fromTo(
          entering,
          { opacity: 0, scale: 0.92 },
          { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out', stagger: 0.06, delay: 0.1 },
        )
      }
      gsap.delayedCall(0.65, () => {
        busy = false
        ScrollTrigger.refresh()
      })
    }
    if (leaving.length) gsap.to(leaving, { opacity: 0, scale: 0.94, duration: 0.2, ease: 'power2.in', onComplete: rebuild })
    else rebuild()
  }

  filters.addEventListener('click', (e) => {
    const chip = (e.target as Element).closest<HTMLElement>('.chip')
    if (chip?.dataset.filter) setFilter(chip.dataset.filter)
  })

  // ---------- глитч заголовка при наведении ----------
  for (const card of cards) {
    const title = $('.card__title', card)
    if (title) card.addEventListener('pointerenter', () => glitch(title, 0.15))
  }

  // ---------- модальное окно ----------
  const body = $('.modal__content', modal)!
  const panel = $('.modal__panel', modal)!
  let opener: HTMLElement | null = null
  let closing = false

  const render = (p: Project) => {
    const links = [
      p.demo && `<a class="link" href="${esc(p.demo)}"${ext(p.demo)}>${esc(content.projects.demo)} <span aria-hidden="true">↗</span></a>`,
      p.github && `<a class="link" href="${esc(p.github)}"${ext(p.github)}>${esc(content.projects.github)} <span aria-hidden="true">↗</span></a>`,
    ]
      .filter(Boolean)
      .join('')
    body.innerHTML = `
      <div class="modal__media"><img src="${esc(p.image)}" width="800" height="500" alt="${esc(p.imageAlt)}"></div>
      <div class="modal__body">
        <p class="modal__meta">${esc(p.tags.join(' / '))} · ${esc(p.year)}</p>
        <h2 class="modal__title glitch" id="modal-title" data-text="${esc(p.title)}">${esc(p.title)}</h2>
        ${p.details.map((d) => `<p>${esc(d)}</p>`).join('')}
        <ul class="modal__highlights">${p.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>
        <ul class="modal__stack" aria-label="Стек">${p.stack.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
        <div class="modal__links">${links}</div>
      </div>`
  }

  const open = (id: string, from: HTMLElement | null) => {
    const project = content.projects.items.find((p) => p.id === id)
    if (!project || modal.open) return
    opener = from
    render(project)
    modal.showModal()
    document.documentElement.classList.add('is-locked')
    bus.emit('ui:open')
    if (!state.reduced) {
      // окно «включается» как CRT: из тонкой полосы в полный размер
      gsap.fromTo(panel, { scaleY: 0.02, opacity: 0 }, { scaleY: 1, opacity: 1, duration: 0.45, ease: 'expo.out' })
      gsap.delayedCall(0.3, () => {
        const t = $('.modal__title', modal)
        if (t) glitch(t, 0.18)
      })
    }
  }

  const close = () => {
    if (!modal.open || closing) return
    const done = () => {
      closing = false
      modal.close()
      gsap.set(panel, { clearProps: 'all' })
      document.documentElement.classList.remove('is-locked')
      opener?.focus({ preventScroll: true })
    }
    if (state.reduced) return done()
    closing = true
    gsap.to(panel, { scaleY: 0.02, opacity: 0, duration: 0.22, ease: 'power3.in', onComplete: done })
  }

  modal.addEventListener('cancel', (e) => {
    e.preventDefault()
    close()
  })
  modal.addEventListener('click', (e) => {
    if (e.target === modal || (e.target as Element).closest('[data-close]')) close()
  })

  bus.on('project:open', (id) => open(String(id), null))

  for (const card of cards) {
    const id = card.dataset.id!
    const summary = $('summary', card)
    summary?.addEventListener('click', (e) => {
      e.preventDefault()
      open(id, summary)
    })
    card.addEventListener('click', (e) => {
      if ((e.target as Element).closest('a, summary, button')) return
      open(id, summary)
    })
  }
}
