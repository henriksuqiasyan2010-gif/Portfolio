// Звуки интерфейса. Модуль и файлы грузятся только после того, как пользователь включил звук.
import { bus } from '../state'

const FILES = { click: '/sounds/click.wav', type: '/sounds/type.wav', boot: '/sounds/boot.wav' } as const
type Name = keyof typeof FILES

let ctx: AudioContext | null = null
let master: GainNode
const buffers = new Map<Name, AudioBuffer>()
const offs: Array<() => void> = []
let lastType = 0

function play(name: Name, volume = 1, detune = 0) {
  const buf = buffers.get(name)
  if (!ctx || !buf || ctx.state !== 'running') return
  const src = ctx.createBufferSource()
  src.buffer = buf
  src.detune.value = detune
  const g = ctx.createGain()
  g.gain.value = volume
  src.connect(g).connect(master)
  src.start()
}

async function load() {
  await Promise.all(
    (Object.keys(FILES) as Name[]).map(async (name) => {
      if (buffers.has(name)) return
      const res = await fetch(FILES[name])
      buffers.set(name, await ctx!.decodeAudioData(await res.arrayBuffer()))
    }),
  )
}

export async function enableSound() {
  if (!ctx) {
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = 0.5
    master.connect(ctx.destination)
  }
  // resume() не ждём: без устройства вывода он может не завершиться, а файлы декодируются и так
  void ctx.resume()
  offs.splice(0).forEach((off) => off())
  offs.push(
    bus.on('ui:click', () => play('click', 0.7, Math.random() * 200 - 100)),
    bus.on('ui:open', () => play('click', 0.9, -300)),
    bus.on('type', () => {
      const now = performance.now()
      if (now - lastType < 35) return
      lastType = now
      play('type', 0.35, Math.random() * 400 - 200)
    }),
  )
  await load()
  play('boot', 0.8)
}

export function disableSound() {
  offs.splice(0).forEach((off) => off())
  void ctx?.suspend()
}
