import type { QualityLevel } from '../state'

export interface QualityParams {
  particles: number
  maxDpr: number
  bloom: boolean
  /** Medium: свечение глаза спрайтом вместо bloom */
  glowSprite: boolean
  eyeSegments: number
}

export const LEVELS: Record<QualityLevel, QualityParams> = {
  high: { particles: 4000, maxDpr: 1.5, bloom: true, glowSprite: false, eyeSegments: 64 },
  medium: { particles: 2000, maxDpr: 1.25, bloom: false, glowSprite: true, eyeSegments: 32 },
  low: { particles: 800, maxDpr: 1, bloom: false, glowSprite: false, eyeSegments: 24 },
}

export const ORDER: QualityLevel[] = ['low', 'medium', 'high']
const cap = (a: QualityLevel, b: QualityLevel) => ORDER[Math.min(ORDER.indexOf(a), ORDER.indexOf(b))]

/** Строка видеокарты из уже созданного контекста рендерера — второй контекст не нужен. */
export function gpuName(gl: WebGLRenderingContext | WebGL2RenderingContext): string {
  const ext = gl.getExtension('WEBGL_debug_renderer_info')
  return String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER))
}

/** Стартовый уровень по ядрам, памяти и видеокарте; мобильные — не выше Medium. */
export function detectLevel(renderer: string, mobile: boolean): QualityLevel {
  const forced = new URLSearchParams(location.search).get('quality')
  if (forced === 'high' || forced === 'medium' || forced === 'low') return forced

  const r = renderer.toLowerCase()
  const nav = navigator as Navigator & { deviceMemory?: number }
  const cores = nav.hardwareConcurrency || 4
  const mem = nav.deviceMemory || 8

  if (/swiftshader|llvmpipe|softpipe|software|basic render/.test(r)) return 'low'

  let level: QualityLevel = 'medium'
  if (/nvidia|geforce|rtx|gtx|quadro|radeon (rx|pro)|radeon\(tm\) rx|apple m\d|apple gpu|iris\(r\) xe|iris xe|intel.*arc/.test(r)) level = 'high'
  if (/mali-[gt]?[1-6]\d?\b|adreno.*\b[1-5]\d\d\b|powervr|intel.*hd graphics [1-5]\d\d\b/.test(r)) level = 'low'

  if (cores <= 2 || mem <= 2) level = 'low'
  else if (cores <= 4 || mem <= 4) level = cap(level, 'medium')
  if (mobile) level = cap(level, 'medium')
  return level
}

/**
 * Если средний FPS ниже 50 дольше 2 секунд — уровень понижается на ступень.
 * Обратно сам не поднимается, чтобы не было «качелей».
 */
export class FpsMonitor {
  fps = 60
  private acc = 0
  private frames = 0
  private lowFor = 0
  private grace = 2.5

  constructor(private onDrop: () => void) {}

  /** Пауза после смены уровня, компиляции шейдеров или возврата во вкладку. */
  hold(seconds = 2) {
    this.grace = Math.max(this.grace, seconds)
    this.lowFor = 0
    this.acc = 0
    this.frames = 0
  }

  frame(dt: number) {
    if (dt > 0.25) return this.hold(1)
    if (this.grace > 0) {
      this.grace -= dt
      return
    }
    this.acc += dt
    this.frames++
    if (this.acc < 0.5) return
    this.fps = this.frames / this.acc
    this.lowFor = this.fps < 50 ? this.lowFor + this.acc : 0
    this.acc = 0
    this.frames = 0
    if (this.lowFor >= 2) {
      this.lowFor = 0
      this.onDrop()
    }
  }
}
