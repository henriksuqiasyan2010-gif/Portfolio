// Точка входа: один общий цикл анимаций — gsap.ticker (requestAnimationFrame).
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { state } from './state'
import { runIntro } from './intro/intro'
import { initHero } from './sections/hero'
import { initAbout } from './sections/about'
import { initReveals } from './sections/reveal'
import { initNav } from './ui/nav'

gsap.registerPlugin(ScrollTrigger)

document.addEventListener('visibilitychange', () => (state.pageVisible = !document.hidden))

initNav()
const hero = initHero()
initAbout()
initReveals()

void runIntro((afterIntro) => hero.reveal(afterIntro))
