import { gsap } from 'gsap'
import { $, bus } from '../state'
import { prepareScramble } from '../fx/scramble'

const html = document.documentElement

/**
 * Интро на чистом DOM/CSS, пока грузится three.js:
 * линия из центра → имя скрамблом → экран схлопывается в полосу → «включение» CRT.
 * ~2,05 с, пропуск кликом, Esc или Enter, раз за сессию (флаг intro-on ставит inline-скрипт в index.html).
 * `onReveal` вызывается, когда шторки начинают расходиться и hero становится виден.
 */
export function runIntro(onReveal: (fromIntro: boolean) => void): Promise<void> {
  const root = $('#intro')
  if (!html.classList.contains('intro-on') || !root) {
    onReveal(false)
    return Promise.resolve()
  }

  try {
    sessionStorage.setItem('intro-seen', '1')
  } catch {
    /* приватный режим — интро просто покажется снова */
  }

  // скролл блокируется событиями: overflow:hidden на корне убрал бы полосу прокрутки,
  // и после интро вся страница сдвинулась бы на её ширину
  const block = (e: Event) => e.preventDefault()
  const blockKeys = (e: KeyboardEvent) => {
    if ([' ', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) e.preventDefault()
  }
  const lockOpts: AddEventListenerOptions = { passive: false }
  window.addEventListener('wheel', block, lockOpts)
  window.addEventListener('touchmove', block, lockOpts)
  window.addEventListener('keydown', blockKeys)
  window.scrollTo(0, 0)

  const screen = $('.intro__screen', root)!
  const line = $('.intro__line', root)!
  const boot = $('.intro__boot', root)!
  const name = $('.intro__name', root)!
  const flash = $('.intro__flash', root)!
  const skip = $('.intro__skip', root)!
  const [top, bottom] = [$('.intro__shutter--top', root)!, $('.intro__shutter--bottom', root)!]
  const scramble = prepareScramble(name)
  const OPEN = 1.42

  gsap.set(name, { opacity: 0 })
  bus.emit('intro:start')

  return new Promise((resolve) => {
    let revealed = false
    const reveal = () => {
      if (revealed) return
      revealed = true
      onReveal(true)
    }

    const tl = gsap.timeline({
      onComplete() {
        html.classList.remove('intro-on')
        window.removeEventListener('wheel', block)
        window.removeEventListener('touchmove', block)
        window.removeEventListener('keydown', blockKeys)
        window.removeEventListener('keydown', onKey)
        root.removeEventListener('click', doSkip)
        resolve()
      },
    })

    tl.to(line, { scaleX: 1, duration: 0.4, ease: 'power3.out' }, 0)
      .from(boot, { opacity: 0, y: 6, duration: 0.3 }, 0.05)
      .from(skip, { opacity: 0, duration: 0.4 }, 0.3)
      .set(name, { opacity: 1 }, 0.3)
      .add(() => void scramble.play({ stagger: 0.04, settle: 0.22 }), 0.3)
      // схлопывание в тонкую яркую полосу
      .to(screen, { scaleY: 0.006, scaleX: 1.08, duration: 0.24, ease: 'power4.in' }, 1.16)
      .to(skip, { opacity: 0, duration: 0.15 }, 1.16)
      .to(flash, { opacity: 1, duration: 0.1 }, 1.3)
      .set(screen, { opacity: 0 }, OPEN)
      .add(reveal, OPEN)
      // полоса раскрывается уже в hero
      .to(top, { yPercent: -100, duration: 0.6, ease: 'power3.inOut' }, OPEN)
      .to(bottom, { yPercent: 100, duration: 0.6, ease: 'power3.inOut' }, OPEN)
      .to(flash, { scaleY: 40, opacity: 0, duration: 0.45, ease: 'power2.out' }, OPEN)

    function doSkip() {
      if (tl.time() < OPEN) tl.seek(OPEN - 0.01)
      tl.timeScale(1.8)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' || e.key === 'Enter') doSkip()
    }
    root.addEventListener('click', doSkip)
    window.addEventListener('keydown', onKey)
  })
}
