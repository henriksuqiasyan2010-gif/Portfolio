import { $, bus } from '../state'

const typingTarget = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))

/** Консоль по ~ (и кнопкой в футере для тач-устройств); модуль грузится при первом открытии. */
export function initConsoleTrigger() {
  const open = () => import('./console').then((m) => m.toggleConsole())

  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Backquote' && e.key !== '~' && e.key !== '`') return
    if (typingTarget(e.target) || e.ctrlKey || e.metaKey || e.altKey) return
    if (document.querySelector('dialog[open]:not(.console)')) return
    e.preventDefault()
    void open()
  })

  const kbd = $('.footer__hint kbd')
  if (kbd) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'kbd-btn'
    btn.textContent = '~'
    btn.setAttribute('aria-label', 'Открыть консоль')
    btn.addEventListener('click', () => void open())
    kbd.replaceWith(btn)
  }
}

/** Переключатель звука: по умолчанию выключен, модуль и файлы грузятся только после включения. */
export function initSound() {
  const btn = $<HTMLButtonElement>('.nav__sound')
  if (!btn) return
  btn.hidden = false
  let on = false
  try {
    on = localStorage.getItem('sound') === 'on'
  } catch {
    /* нет хранилища — звук просто выключен */
  }

  const render = () => {
    btn.setAttribute('aria-pressed', String(on))
    btn.textContent = (on ? btn.dataset.on : btn.dataset.off) ?? ''
  }
  const apply = () =>
    import('./sound').then((m) => (on ? m.enableSound() : m.disableSound())).catch(() => {
      on = false
      render()
    })

  btn.addEventListener('click', () => {
    on = !on
    render()
    try {
      localStorage.setItem('sound', on ? 'on' : 'off')
    } catch {
      /* ок */
    }
    void apply()
  })

  // звук был включён в прошлый раз: AudioContext можно запустить только после жеста пользователя
  if (on) {
    const resume = (e: Event) => {
      if (e.target === btn) return
      window.removeEventListener('pointerdown', resume)
      window.removeEventListener('keydown', resume)
      void apply()
    }
    window.addEventListener('pointerdown', resume)
    window.addEventListener('keydown', resume)
  }
  render()

  document.addEventListener('click', (e) => {
    if ((e.target as Element).closest?.('a, button, summary')) bus.emit('ui:click')
  })
}
