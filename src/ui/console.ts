// Консоль-оверлей по клавише ~ (грузится отдельным чанком при первом открытии).
import { gsap } from 'gsap'
import { content } from '../content'
import { $$, bus, state } from '../state'
import { glitch } from '../fx/glitch'

type Line = string | [text: string, cls: string]

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const esc = (s: string) => s.replace(/[&<>"']/g, (ch) => ESC[ch])

let dialog: HTMLDialogElement | null = null
let out: HTMLElement
let input: HTMLInputElement
const history: string[] = []
let cursor = 0
let opener: Element | null = null

function setTheme(name: 'amber' | 'green') {
  const html = document.documentElement
  if (name === 'green') html.setAttribute('data-theme', 'green')
  else html.removeAttribute('data-theme')
  try {
    localStorage.setItem('theme', name)
  } catch {
    /* без хранилища тема живёт до перезагрузки */
  }
}

function print(lines: Line[], instant = false) {
  const nodes = lines.map((l) => {
    const p = document.createElement('p')
    const [text, cls] = typeof l === 'string' ? [l, ''] : l
    if (cls) p.className = cls
    p.innerHTML = text
    return p
  })
  out.append(...nodes)
  if (!instant && !state.reduced) gsap.from(nodes, { opacity: 0, x: -6, duration: 0.25, stagger: 0.035, ease: 'power2.out' })
  out.scrollTop = out.scrollHeight
}

const t = content.console
const fill = (s: string, vars: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k) => esc(vars[k] ?? ''))

const COMMANDS: Record<string, { help?: string; run: (args: string[]) => Line[] | void }> = {
  help: {
    help: t.help.help,
    run: () => [
      [esc(t.commandsTitle), 'c-acc'],
      ...Object.entries(COMMANDS)
        .filter(([, c]) => c.help)
        .map(([name, c]) => `  ${name.padEnd(16, ' ')}<span class="c-mut">${esc(c.help!)}</span>`),
      [`  ${esc(t.secrets)}`, 'c-mut'],
    ],
  },
  about: {
    help: t.help.about,
    run: () => [
      esc(content.about.text),
      ['', ''],
      ...content.about.skills.map(
        (s) => `<span class="c-acc">&gt;</span> ${esc(s.name.padEnd(26, '.'))} <span class="${s.status === 'ok' ? 'c-ok' : 'c-acc'}">${s.status}</span>`,
      ),
    ],
  },
  projects: {
    help: t.help.projects,
    run: () => [
      ...content.projects.items.map(
        (p) =>
          `<span class="c-acc">${esc(p.id.padEnd(9, ' '))}</span> ${esc(p.title)} <span class="c-mut">[${esc(p.labels.slice(0, 2).join(', '))}] — ${esc(p.description)}</span>`,
      ),
      [`${esc(t.openHint)} ${esc(content.projects.items[0]?.id ?? '')}`, 'c-mut'],
    ],
  },
  open: {
    help: t.help.open,
    run: ([id]) => {
      const p = content.projects.items.find((x) => x.id === id)
      if (!p) return [[esc(t.noProject), 'c-err']]
      close(() => bus.emit('project:open', p.id))
    },
  },
  contact: {
    help: t.help.contact,
    run: () => [
      `email     <a class="link" href="mailto:${esc(content.contact.email)}">${esc(content.contact.email)}</a>`,
      ...content.contact.links.map(
        (l) => `${esc(l.label.toLowerCase().padEnd(9, ' '))} <a class="link" href="${esc(l.href)}" target="_blank" rel="noopener noreferrer">${esc(l.href)}</a>`,
      ),
    ],
  },
  theme: {
    help: t.help.theme,
    run: ([name]) => {
      const next = name === 'green' || name === 'amber' ? name : document.documentElement.dataset.theme === 'green' ? 'amber' : 'green'
      setTheme(next)
      return [[fill(t.themeSet, { name: next }), 'c-ok']]
    },
  },
  clear: { help: t.help.clear, run: () => void out.replaceChildren() },
  exit: { help: t.help.exit, run: () => close() },

  // пасхалки — в help не показываются
  sudo: { run: () => [esc(t.eggs.sudoPassword), [esc(t.eggs.sudo), 'c-err']] },
  rm: { run: () => [[esc(t.eggs.rm), 'c-err']] },
  hack: {
    run: () => {
      const steps = t.eggs.hackSteps
      steps.forEach((s, i) => gsap.delayedCall(0.35 * (i + 1), () => print([`${esc(s.padEnd(26, '.'))} <span class="c-ok">ok</span>`])))
      gsap.delayedCall(0.35 * (steps.length + 1), () => print([[esc(t.eggs.hackDone), 'c-acc'], [esc(t.eggs.hackJoke), 'c-mut']]))
      return [[esc(t.eggs.hackStart), 'c-mut']]
    },
  },
  coffee: { run: () => [[esc(t.eggs.coffee), 'c-acc'], [esc(t.eggs.coffeeNote), 'c-mut']] },
  whoami: { run: () => [esc(t.eggs.whoami), [esc(t.eggs.whoamiNote), 'c-mut']] },
  ls: { run: () => ['about.txt  projects/  contact.sh  <span class="c-err">secrets/</span>'] },
  cat: { run: ([f]) => [[f?.startsWith('secret') ? esc(t.eggs.catSecret) : fill(t.eggs.catOther, { file: f ?? '' }), 'c-err']] },
  glitch: {
    run: () => {
      $$('.glitch').forEach((el, i) => gsap.delayedCall(i * 0.05, () => glitch(el, 0.3)))
      return [['̷g̸l̷i̶t̵c̴h̷', 'c-acc']]
    },
  },
}

function run(raw: string) {
  const line = raw.trim()
  print([`<span class="c-acc">${esc(content.console.prompt)}</span> ${esc(line)}`], true)
  if (!line) return
  history.push(line)
  cursor = history.length
  const [name, ...args] = line.split(/\s+/)
  const cmd = COMMANDS[name.toLowerCase()]
  const res = cmd ? cmd.run(args) : [[fill(t.notFound, { cmd: name }), 'c-err'] as Line]
  if (res) print(res)
}

function build() {
  dialog = document.createElement('dialog')
  dialog.className = 'console'
  dialog.setAttribute('aria-label', content.console.title)
  dialog.innerHTML = `
    <div class="console__bar" aria-hidden="true"><span></span><span></span><span></span><b>${esc(content.console.title)}</b></div>
    <button class="console__close" type="button">[ esc ]</button>
    <div class="console__out" role="log" aria-live="polite"></div>
    <form class="console__line">
      <label class="console__prompt" for="console-in">${esc(content.console.prompt)}</label>
      <input id="console-in" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="send">
    </form>`
  document.body.append(dialog)
  out = dialog.querySelector('.console__out')!
  input = dialog.querySelector('input')!

  dialog.querySelector('form')!.addEventListener('submit', (e) => {
    e.preventDefault()
    run(input.value)
    input.value = ''
  })
  dialog.querySelector('.console__close')!.addEventListener('click', () => close())
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault()
    close()
  })
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close()
    else if (!(e.target as Element).closest('a, button')) input.focus()
  })
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      cursor = Math.max(0, Math.min(history.length, cursor + (e.key === 'ArrowUp' ? -1 : 1)))
      input.value = history[cursor] ?? ''
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const hit = Object.keys(COMMANDS).filter((c) => COMMANDS[c].help && c.startsWith(input.value.trim()))
      if (hit.length === 1) input.value = hit[0] + ' '
      else if (hit.length > 1) print([hit.join('  ')], true)
    } else if (e.key === '`' || e.key === '~' || e.code === 'Backquote') {
      e.preventDefault()
      close()
    } else if (e.key.length === 1) {
      bus.emit('type')
    }
  })
  print([[esc(content.console.motd), 'c-ok']], true)
}

function close(after?: () => void) {
  if (!dialog?.open) return
  const d = dialog
  const done = () => {
    d.close()
    gsap.set(d, { clearProps: 'all' })
    document.documentElement.classList.remove('is-locked')
    if (after) after()
    else if (opener instanceof HTMLElement) opener.focus({ preventScroll: true })
  }
  if (state.reduced) return done()
  gsap.to(d, { scaleY: 0.02, opacity: 0, duration: 0.2, ease: 'power3.in', onComplete: done })
}

export function toggleConsole() {
  if (!dialog) build()
  if (dialog!.open) return close()
  if (document.querySelector('dialog[open]')) return
  opener = document.activeElement
  dialog!.showModal()
  document.documentElement.classList.add('is-locked')
  input.focus()
  bus.emit('ui:open')
  if (!state.reduced) gsap.fromTo(dialog!, { scaleY: 0.02, opacity: 0 }, { scaleY: 1, opacity: 1, duration: 0.4, ease: 'expo.out' })
}
