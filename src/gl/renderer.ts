// Единственный WebGL-контекст страницы: фиксированный canvas позади контента.
// Сцены переключаются по скроллу, рендер крутится в gsap.ticker и полностью
// останавливается в фоновой вкладке и когда ни одна сцена не видна.
import { ColorManagement, LinearSRGBColorSpace, WebGLRenderer } from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { $, bus, state, type QualityLevel } from '../state'
import { FpsMonitor, LEVELS, ORDER, detectLevel, gpuName } from './quality'
import { Particles, smoothstep } from './particles'
import { Eye, type EyeSlot } from './eye'

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

  renderer.autoClear = false

  // шейдер не собрался на этой видеокарте/драйвере — уходим на фолбэк вместо пустого места
  renderer.debug.onShaderError = () => fail()

  const particles = new Particles(LEVELS[level].particles)
  const eye = new Eye(LEVELS[level])
  const monitor = new FpsMonitor(() => {
    const i = ORDER.indexOf(level)
    if (i > 0) api.setLevel(ORDER[i - 1])
  })

  const hero = $('#hero')!
  const slotEl = $('#eye-slot')!
  const frame: Frame = { dt: 0, time: 0, width: 1, height: 1, scrollY: 0 }
  const slot: EyeSlot = { x: 0, y: 0, size: 1 }
  let heroH = 1
  let slotTop = 0
  let slotLeft = 0
  let needsResize = true
  let dirty = true
  let lost = false
  let shown = false
  let idle = false

  // offsetTop/offsetLeft не зависят от transform, которым анимируется появление слота
  const measure = () => {
    heroH = hero.offsetHeight || window.innerHeight
    let top = 0
    let left = 0
    for (let el: HTMLElement | null = slotEl; el; el = el.offsetParent as HTMLElement | null) {
      top += el.offsetTop
      left += el.offsetLeft
    }
    slotTop = top
    slotLeft = left
    slot.size = slotEl.offsetWidth || 1
  }

  const resize = () => {
    const w = canvas.clientWidth || window.innerWidth
    const h = canvas.clientHeight || window.innerHeight
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, LEVELS[level].maxDpr))
    renderer.setSize(w, h, false)
    frame.width = w
    frame.height = h
    particles.resize(w, h)
    eye.setSize(renderer.domElement.width, renderer.domElement.height)
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
    const top = slotTop - frame.scrollY
    const eyeVisible = top < frame.height + 60 && top + slot.size > -60
    if (!particlesVisible && !eyeVisible) {
      setIdle(true)
      return
    }
    setIdle(false)

    // reduced motion: поле статично, кадр перерисовывается только при изменениях; глаз двигается медленно
    if (state.reduced && !dirty && !eyeVisible) return
    renderer.clear()
    if (particlesVisible) {
      particles.update(frame, warp)
      particles.render(renderer)
    }
    if (eyeVisible) {
      slot.x = slotLeft + slot.size / 2
      slot.y = top + slot.size / 2
      const assemble = state.reduced ? 1 : smoothstep(0, 1, (frame.height - top) / (frame.height * 0.62))
      eye.update(frame, slot, assemble)
      renderer.clearDepth()
      eye.render(renderer)
    }
    dirty = false
    monitor.frame(dt)

    if (!shown && !lost) {
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

  function fail() {
    lost = true
    html.classList.remove('gl-on', 'gl-maybe')
    html.classList.add('no-gl')
  }

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault()
    fail()
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
      eye.setQuality(LEVELS[next])
      needsResize = true
      monitor.hold(2)
      bus.emit('quality', next)
    },
  }

  // компиляция заранее: без рывка при первом появлении глаза и с ранней проверкой шейдеров
  void renderer.compileAsync(particles.scene, particles.camera).catch(() => fail())
  void renderer.compileAsync(eye.scene, eye.camera).catch(() => fail())
  if (!document.hidden) start()
  return api
}
