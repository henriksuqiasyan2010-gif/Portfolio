// Единственный WebGL-контекст страницы: фиксированный canvas позади контента.
// Сцены переключаются по скроллу, рендер крутится в gsap.ticker и полностью
// останавливается в фоновой вкладке и когда ни одна сцена не видна.
import { ColorManagement, LinearSRGBColorSpace, WebGLRenderer } from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { $, bus, state, type QualityLevel } from '../state'
import { FpsMonitor, LEVELS, ORDER, detectLevel, gpuName } from './quality'
import { Particles, smoothstep } from './particles'

export interface Frame {
  dt: number
  time: number
  width: number
  height: number
  scrollY: number
}

export interface GLApi {
  readonly level: QualityLevel
  readonly fps: number
  readonly gpu: string
  readonly particles: number
  readonly dpr: number
  setLevel(level: QualityLevel): void
}

const html = document.documentElement

export function startGL(canvas: HTMLCanvasElement): GLApi {
  ColorManagement.enabled = false
  const renderer = new WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    stencil: false,
    powerPreference: 'high-performance',
  })
  renderer.outputColorSpace = LinearSRGBColorSpace
  renderer.setClearColor(0x07070c, 1)

  const gpu = gpuName(renderer.getContext())
  let level = detectLevel(gpu, state.touch)
  state.quality = level

  const particles = new Particles(LEVELS[level].particles)
  const monitor = new FpsMonitor(() => {
    const i = ORDER.indexOf(level)
    if (i > 0) api.setLevel(ORDER[i - 1])
  })

  const hero = $('#hero')!
  const frame: Frame = { dt: 0, time: 0, width: 1, height: 1, scrollY: 0 }
  let heroH = 1
  let needsResize = true
  let dirty = true
  let lost = false
  let shown = false
  let idle = false

  const measure = () => {
    heroH = hero.offsetHeight || window.innerHeight
  }

  const resize = () => {
    const w = canvas.clientWidth || window.innerWidth
    const h = canvas.clientHeight || window.innerHeight
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, LEVELS[level].maxDpr))
    renderer.setSize(w, h, false)
    frame.width = w
    frame.height = h
    particles.resize(w, h)
    measure()
    needsResize = false
    dirty = true
  }

  const setIdle = (v: boolean) => {
    if (v === idle) return
    idle = v
    canvas.classList.toggle('is-idle', v)
  }

  const tick = (_time: number, deltaMS: number) => {
    if (lost) return
    if (needsResize) resize()
    const dt = Math.min(deltaMS / 1000, 0.1)
    frame.dt = dt
    frame.time += state.reduced ? 0 : dt
    frame.scrollY = window.scrollY

    const warp = state.reduced ? 0 : smoothstep(0.08, 0.9, frame.scrollY / heroH)
    const particlesVisible = frame.scrollY < heroH * 0.98
    if (!particlesVisible) {
      setIdle(true)
      return
    }
    setIdle(false)

    // reduced motion: поле статично, кадр перерисовывается только при изменениях
    if (state.reduced && !dirty) return
    particles.update(frame, warp)
    renderer.render(particles.scene, particles.camera)
    dirty = false
    monitor.frame(dt)

    if (!shown) {
      shown = true
      html.classList.add('gl-on')
      bus.emit('gl:shown')
    }
  }

  const start = () => {
    monitor.hold(1.5)
    gsap.ticker.add(tick)
  }
  const stop = () => gsap.ticker.remove(tick)

  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()))
  window.addEventListener('resize', () => (needsResize = true))
  ScrollTrigger.addEventListener('refresh', measure)

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault()
    lost = true
    html.classList.remove('gl-on', 'gl-maybe')
    html.classList.add('no-gl')
  })
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false
    html.classList.remove('no-gl')
    html.classList.add('gl-maybe', 'gl-on')
    needsResize = true
    monitor.hold(2)
  })

  const api: GLApi = {
    get level() {
      return level
    },
    get fps() {
      return monitor.fps
    },
    get particles() {
      return particles.count
    },
    get dpr() {
      return renderer.getPixelRatio()
    },
    gpu,
    setLevel(next) {
      if (next === level) return
      level = next
      state.quality = next
      particles.setCount(LEVELS[next].particles)
      needsResize = true
      monitor.hold(2)
      bus.emit('quality', next)
    },
  }

  if (!document.hidden) start()
  return api
}
