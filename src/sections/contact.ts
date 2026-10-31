import { gsap } from 'gsap'
import { content } from '../content'
import { $, bus, state } from '../state'

const BLOCKS = 10

/**
 * Форма без своего бэкенда: если в content.ts задан formEndpoint — POST в сервис форм,
 * иначе письмо собирается в mailto:. Вместо кнопки печатается transmitting... [#####-----].
 */
export function initContact() {
  const form = $<HTMLFormElement>('form.term')
  if (!form) return
  const submit = $<HTMLButtonElement>('.term__submit', form)!
  const status = $('.term__status', form)!
  const endpoint = form.dataset.endpoint ?? ''
  const email = form.dataset.email ?? ''
  let sending = false

  const bar = (n: number) => `${status.dataset.sending} [${'#'.repeat(n)}${'-'.repeat(BLOCKS - n)}]`

  const progress = (seconds: number) =>
    new Promise<void>((resolve) => {
      if (state.reduced) return resolve()
      const o = { v: 0 }
      gsap.to(o, {
        v: BLOCKS,
        duration: seconds,
        ease: 'none',
        onUpdate: () => {
          const n = Math.floor(o.v)
          const text = bar(n)
          if (status.textContent !== text) {
            status.textContent = text
            bus.emit('type')
          }
        },
        onComplete: resolve,
      })
    })

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (sending || !form.reportValidity()) return
    sending = true
    const data = new FormData(form)
    const name = String(data.get('name') ?? '').trim()
    const from = String(data.get('email') ?? '').trim()
    const message = String(data.get('message') ?? '').trim()

    submit.hidden = true
    status.classList.remove('is-error')
    status.textContent = bar(0)

    let ok = true
    let doneText = status.dataset.done ?? 'ok'
    if (endpoint) {
      const [res] = await Promise.all([
        fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } }).then(
          (r) => r.ok,
          () => false,
        ),
        progress(1.4),
      ])
      ok = res
    } else {
      // mailto открывается сразу, пока жест пользователя ещё «свежий»
      const subject = encodeURIComponent(`${content.contact.mailSubject} ${name}`)
      const body = encodeURIComponent(`${message}\n\n— ${name}${from ? ` <${from}>` : ''}`)
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
      doneText = status.dataset.mailto ?? doneText
      await progress(1.2)
    }

    status.textContent = ok ? `${bar(BLOCKS)}\n${doneText}` : status.dataset.error ?? 'error'
    status.classList.toggle('is-error', !ok)
    if (ok) form.reset()
    gsap.delayedCall(6, () => {
      submit.hidden = false
      status.textContent = ''
      sending = false
    })
  })
}
