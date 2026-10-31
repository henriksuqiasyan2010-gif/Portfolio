// Собирает статичную разметку страницы из content.ts.
// Выполняется в Node во время сборки и dev-сервера (см. vite.config.ts):
// весь текст попадает в HTML, а JS только накладывает анимации поверх.

import { content as defaultContent, type Content, type Project } from '../content.ts'

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const esc = (s: string) => s.replace(/[&<>"']/g, (ch) => ESC[ch])
const attrLines = (lines: string[]) => lines.map(esc).join('&#10;')
const ext = (href: string) => (/^https?:/.test(href) ? ' target="_blank" rel="noopener noreferrer"' : '')
const btnInner = (label: string) =>
  `<span class="btn__fill" aria-hidden="true"></span><span class="btn__glow" aria-hidden="true"></span><span class="btn__label">${esc(label)}</span>`

export function renderHead(c: Content = defaultContent): string {
  return [
    `<title>${esc(c.meta.title)}</title>`,
    `<meta name="description" content="${esc(c.meta.description)}">`,
    `<meta name="theme-color" content="${esc(c.meta.themeColor)}">`,
    `<meta property="og:title" content="${esc(c.meta.title)}">`,
    `<meta property="og:description" content="${esc(c.meta.description)}">`,
    `<meta property="og:type" content="website">`,
  ].join('\n    ')
}

function nav(c: Content) {
  const links = c.nav.links.map((l) => `<li><a href="${esc(l.href)}">${esc(l.label)}</a></li>`).join('')
  return `
  <header class="nav">
    <div class="nav__inner">
      <a class="nav__logo" href="#hero" aria-label="${esc(c.name)} — в начало">${esc(c.nav.logo)}<span class="caret" aria-hidden="true">_</span></a>
      <nav class="nav__links" aria-label="Разделы"><ul>${links}</ul></nav>
      <button class="nav__sound" type="button" aria-pressed="false" data-on="${esc(c.nav.soundOn)}" data-off="${esc(c.nav.soundOff)}" hidden>${esc(c.nav.soundOff)}</button>
    </div>
  </header>`
}

function intro(c: Content) {
  return `
  <div class="intro" id="intro" aria-hidden="true">
    <div class="intro__screen">
      <p class="intro__boot">${esc(c.intro.boot)}</p>
      <p class="intro__name" data-text="${esc(c.name)}">${esc(c.name)}</p>
      <div class="intro__line"></div>
    </div>
    <div class="intro__shutter intro__shutter--top"></div>
    <div class="intro__shutter intro__shutter--bottom"></div>
    <div class="intro__flash"></div>
    <p class="intro__skip">click / esc — skip</p>
  </div>`
}

function hero(c: Content) {
  const h = c.hero
  const stats = h.stats
    .map(
      (s) => `
          <li class="stat">
            <span class="stat__num" data-count="${s.value}" data-suffix="${esc(s.suffix ?? '')}">${s.value}${esc(s.suffix ?? '')}</span>
            <span class="stat__label">${esc(s.label)}</span>
          </li>`,
    )
    .join('')
  return `
    <section class="hero" id="hero" aria-labelledby="hero-title">
      <div class="container hero__inner">
        <p class="hero__kicker"><span class="prompt" aria-hidden="true">&gt;</span> ${esc(h.kicker)}</p>
        <h1 class="hero__title glitch" id="hero-title" data-text="${attrLines(h.title)}">${h.title
          .map((l) => `<span class="line">${esc(l)}</span>`)
          .join('<br>')}</h1>
        <p class="hero__sub">${h.subtitle.map(esc).join(' <br>')}</p>
        <ul class="stats" aria-label="Цифры">${stats}
        </ul>
        <div class="hero__cta">
          <a class="btn btn--primary" href="#projects">${btnInner(h.ctaProjects)}</a>
          <a class="btn btn--ghost" href="#contact">${btnInner(h.ctaContact)}</a>
        </div>
      </div>
      <a class="hero__scroll" href="#about" aria-hidden="true" tabindex="-1">${esc(h.scrollHint)}<span class="hero__scroll-bar"></span></a>
    </section>`
}

function about(c: Content) {
  const a = c.about
  const skills = a.skills
    .map(
      (s) => `
            <li class="skill skill--${s.status}"><span class="skill__prompt" aria-hidden="true">&gt;</span><span class="skill__name">${esc(
              s.name,
            )}</span><span class="skill__dots" aria-hidden="true"></span><span class="skill__status">${s.status}</span></li>`,
    )
    .join('')
  return `
    <section class="about section" id="about" aria-labelledby="about-title">
      <div class="container grid">
        <div class="about__text">
          <p class="section-label">${esc(a.label)}</p>
          <h2 class="section-title glitch" id="about-title" data-text="${esc(a.title)}">${esc(a.title)}</h2>
          <p class="about__typed" data-typed>${esc(a.text)}</p>
          <p class="skills__label"><span aria-hidden="true">$ </span>${esc(a.skillsLabel)}</p>
          <ul class="skills">${skills}
          </ul>
        </div>
        <div class="about__eye">
          <div class="eye-slot" id="eye-slot">
            <span class="eye-slot__hud" aria-hidden="true"></span>
            <img class="eye-fallback" src="/fallback/eye.webp" width="720" height="720" alt="${esc(a.eyeAlt)}" loading="lazy" decoding="async">
          </div>
        </div>
      </div>
    </section>`
}

function card(c: Content, p: Project, i: number) {
  const pr = c.projects
  const links = [
    p.demo && `<a class="link" href="${esc(p.demo)}"${ext(p.demo)}>${esc(pr.demo)} <span aria-hidden="true">↗</span></a>`,
    p.github && `<a class="link" href="${esc(p.github)}"${ext(p.github)}>${esc(pr.github)} <span aria-hidden="true">↗</span></a>`,
  ]
    .filter(Boolean)
    .join('')
  return `
          <li class="card" data-id="${esc(p.id)}" data-tags="${esc(p.tags.join(' '))}">
            <article class="card__inner" aria-labelledby="card-${esc(p.id)}">
              <div class="card__media">
                <img src="${esc(p.image)}" width="800" height="500" alt="${esc(p.imageAlt)}" loading="lazy" decoding="async">
                <span class="card__index" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
              </div>
              <div class="card__body">
                <p class="card__meta"><span>${esc(p.tags.join(' / '))}</span><span>${esc(p.year)}</span></p>
                <h3 class="card__title glitch" id="card-${esc(p.id)}" data-text="${esc(p.title)}">${esc(p.title)}</h3>
                <p class="card__desc">${esc(p.description)}</p>
                <ul class="card__stack" aria-label="Стек">${p.stack.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
                <div class="card__links">${links}</div>
                <details class="card__more">
                  <summary>${esc(pr.more)}</summary>
                  <div class="card__details">
                    ${p.details.map((d) => `<p>${esc(d)}</p>`).join('')}
                    <ul class="card__highlights">${p.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>
                  </div>
                </details>
              </div>
            </article>
          </li>`
}

function projects(c: Content) {
  const pr = c.projects
  const tags = Array.from(new Set(pr.items.flatMap((p) => p.tags)))
  const chips = [`<button class="chip" type="button" data-filter="all" aria-pressed="true">${esc(pr.filterAll)}</button>`]
    .concat(tags.map((t) => `<button class="chip" type="button" data-filter="${esc(t)}" aria-pressed="false">${esc(t)}</button>`))
    .join('')
  return `
    <section class="projects section" id="projects" aria-labelledby="projects-title">
      <div class="container">
        <div class="section-head">
          <div>
            <p class="section-label">${esc(pr.label)}</p>
            <h2 class="section-title glitch" id="projects-title" data-text="${esc(pr.title)}">${esc(pr.title)}</h2>
          </div>
          <div class="filters" role="group" aria-label="${esc(pr.filterLabel)}" hidden>${chips}</div>
        </div>
        <ul class="cards">${pr.items.map((p, i) => card(c, p, i)).join('')}
        </ul>
      </div>
    </section>`
}

function contact(c: Content) {
  const ct = c.contact
  const links = ct.links
    .map((l) => `<li><a class="link" href="${esc(l.href)}"${ext(l.href)}>${esc(l.label)} <span aria-hidden="true">↗</span></a></li>`)
    .concat(`<li><a class="link" href="mailto:${esc(ct.email)}">${esc(ct.email)}</a></li>`)
    .join('')
  const action = ct.formEndpoint || `mailto:${ct.email}`
  const enctype = ct.formEndpoint ? '' : ' enctype="text/plain"'
  return `
    <section class="contact section" id="contact" aria-labelledby="contact-title">
      <div class="container grid">
        <div class="contact__intro">
          <p class="section-label">${esc(ct.label)}</p>
          <h2 class="section-title glitch" id="contact-title" data-text="${esc(ct.title)}">${esc(ct.title)}</h2>
          <p class="contact__text">${esc(ct.text)}</p>
          <ul class="contact__links">${links}</ul>
        </div>
        <form class="term" action="${esc(action)}" method="post"${enctype} data-endpoint="${esc(ct.formEndpoint)}" data-email="${esc(ct.email)}">
          <div class="term__bar" aria-hidden="true"><span></span><span></span><span></span><b>${esc(ct.formTitle)}</b></div>
          <div class="term__body">
            <label class="term__line" for="f-name"><span class="term__prompt">&gt; ${esc(ct.fields.name)}:</span>
              <input id="f-name" name="name" type="text" autocomplete="name" required maxlength="80" spellcheck="false"></label>
            <label class="term__line" for="f-email"><span class="term__prompt">&gt; ${esc(ct.fields.email)}:</span>
              <input id="f-email" name="email" type="email" autocomplete="email" maxlength="120" spellcheck="false"></label>
            <label class="term__line term__line--area" for="f-message"><span class="term__prompt">&gt; ${esc(ct.fields.message)}:</span>
              <textarea id="f-message" name="message" rows="4" required maxlength="2000"></textarea></label>
            <div class="term__actions">
              <button class="btn btn--primary term__submit" type="submit">${btnInner(ct.submit)}</button>
              <p class="term__status" role="status" aria-live="polite" data-sending="${esc(ct.sending)}" data-done="${esc(
                ct.done,
              )}" data-mailto="${esc(ct.mailtoDone)}" data-error="${esc(ct.error)}"></p>
            </div>
          </div>
        </form>
      </div>
    </section>`
}

function footer(c: Content) {
  return `
  <footer class="footer">
    <div class="container footer__inner">
      <p>© ${new Date().getFullYear()} ${esc(c.name)}</p>
      <p class="footer__hint">${esc(c.footer.hint).replace('~', '<kbd>~</kbd>')}</p>
      <a class="link" href="#top">${esc(c.footer.top)} <span aria-hidden="true">↑</span></a>
    </div>
  </footer>`
}

function modal(c: Content) {
  return `
  <dialog class="modal" id="project-modal">
    <div class="modal__panel">
      <button class="modal__close" type="button" data-close autofocus>[ ${esc(c.projects.close)} ]</button>
      <div class="modal__content"></div>
    </div>
  </dialog>`
}

export function renderBody(c: Content = defaultContent): string {
  return `
  <a class="skip-link" href="#main">${esc(c.nav.skip)}</a>
  <canvas class="gl" id="gl" aria-hidden="true"></canvas>
  <div class="stars" aria-hidden="true"></div>${intro(c)}${nav(c)}
  <main id="main">${hero(c)}${about(c)}${projects(c)}${contact(c)}
  </main>${footer(c)}${modal(c)}
  <div class="crt" aria-hidden="true"></div>
  <div class="reticle" aria-hidden="true"><span class="reticle__ring"></span><span class="reticle__dot"></span></div>`
}
