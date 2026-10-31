import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  GLSL3,
  Group,
  IcosahedronGeometry,
  LineLoop,
  Matrix3,
  Matrix4,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  RawShaderMaterial,
  Scene,
  SphereGeometry,
  Vector3,
  type IUniform,
  type WebGLRenderer,
} from 'three'
import { gsap } from 'gsap'
import { rand, state } from '../state'
import type { Frame } from './renderer'
import type { QualityParams } from './quality'
import { Bloom } from './bloom'
import eyeVert from './shaders/eye.vert?raw'
import eyeFrag from './shaders/eye.frag?raw'
import shellVert from './shaders/shell.vert?raw'
import shellFrag from './shaders/shell.frag?raw'
import ringVert from './shaders/ring.vert?raw'
import ringFrag from './shaders/ring.frag?raw'
import quadVert from './shaders/quad.vert?raw'
import glowFrag from './shaders/glow.frag?raw'

const FOV = 28
const CAM_Z = 7
const RING_R = 1.72
const SHELL_R = 1.32
const MAX_ANGLE = (35 * Math.PI) / 180
const PUPIL_OPEN = 0.34
const PUPIL_TIGHT = 0.16

/** Экранное положение слота глаза: центр и размер в CSS-пикселях. */
export interface EyeSlot {
  x: number
  y: number
  size: number
}

/** Панели оболочки: икосаэдр без индексов + центр грани и барицентрические координаты на каждую вершину. */
function shellGeometry(detail: number) {
  const ico = new IcosahedronGeometry(SHELL_R, detail)
  const pos = ico.getAttribute('position')
  const n = pos.count
  const center = new Float32Array(n * 3)
  const bary = new Float32Array(n * 3)
  const rnd = new Float32Array(n)
  const c = new Vector3()
  const v = new Vector3()
  for (let f = 0; f < n; f += 3) {
    c.set(0, 0, 0)
    for (let k = 0; k < 3; k++) c.add(v.fromBufferAttribute(pos, f + k))
    c.divideScalar(3)
    const r = Math.random()
    for (let k = 0; k < 3; k++) {
      c.toArray(center, (f + k) * 3)
      bary[(f + k) * 3 + k] = 1
      rnd[f + k] = r
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', pos)
  g.setAttribute('aCenter', new BufferAttribute(center, 3))
  g.setAttribute('aBary', new BufferAttribute(bary, 3))
  g.setAttribute('aRand', new BufferAttribute(rnd, 1))
  ico.dispose()
  return g
}

function ringGeometry(segments = 256) {
  const pos = new Float32Array(segments * 3)
  const t = new Float32Array(segments)
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2
    pos[i * 3] = Math.cos(a) * RING_R
    pos[i * 3 + 1] = Math.sin(a) * RING_R
    t[i] = i / segments
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(pos, 3))
  g.setAttribute('aT', new BufferAttribute(t, 1))
  return g
}

const raw = (vertexShader: string, fragmentShader: string, uniforms: Record<string, IUniform>, extra = {}) =>
  new RawShaderMaterial({ glslVersion: GLSL3, vertexShader, fragmentShader, uniforms, ...extra })

/**
 * Процедурный кибер-глаз: сфера с шейдерной радужкой, панельная оболочка с неоновыми рёбрами,
 * кольцо-шкала и ореол. Следит за курсором (на тач-устройствах — саккады), моргает,
 * зрачок сужается над ссылками и кнопками.
 */
export class Eye {
  readonly scene = new Scene()
  readonly camera = new PerspectiveCamera(FOV, 1, 0.1, 50)
  private root = new Group()
  private look = new Group()
  private ball: Mesh
  private ringPivot = new Group()
  private glow: Mesh
  private bloom: Bloom | null = null
  private time = { value: 0 }
  private pupil = { value: PUPIL_OPEN }
  private blink = { value: 0 }
  private assemble = { value: 0 }
  private bright = { value: 0 }
  private spinMat = { value: new Matrix3() }
  private m4 = new Matrix4()
  private m4b = new Matrix4()
  private yaw = 0
  private pitch = 0
  private tYaw = 0
  private tPitch = 0
  private spin = 0
  private saccadeIn = 0
  private params: QualityParams

  constructor(params: QualityParams) {
    this.params = params
    this.camera.position.set(0, 0, CAM_Z)
    this.look.rotation.order = 'YXZ'

    this.ball = new Mesh(
      new SphereGeometry(1, params.eyeSegments, params.eyeSegments),
      raw(eyeVert, eyeFrag, { uTime: this.time, uPupil: this.pupil, uBright: this.bright }),
    )
    const shell = new Mesh(
      shellGeometry(1),
      raw(shellVert, shellFrag, {
        uTime: this.time,
        uBright: this.bright,
        uSpin: this.spinMat,
        uBlink: this.blink,
        uAssemble: this.assemble,
      }),
    )
    shell.frustumCulled = false
    this.look.add(this.ball, shell)

    const ring = new LineLoop(
      ringGeometry(),
      raw(ringVert, ringFrag, { uTime: this.time, uBright: this.assemble, uColor: { value: new Vector3(0.18, 0.9, 1.0) } }, {
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    )
    this.ringPivot.rotation.set(1.18, 0.32, 0)
    this.ringPivot.add(ring)

    this.glow = new Mesh(
      new PlaneGeometry(1, 1),
      raw(quadVert, glowFrag, { uTime: this.time, uBright: this.bright }, {
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    )
    this.glow.scale.setScalar(5.6)
    this.glow.position.z = -1.4

    this.root.add(this.glow, this.ringPivot, this.look)
    this.scene.add(this.root)
    this.setQuality(params)
    if (!state.reduced) this.scheduleBlink()
  }

  setQuality(params: QualityParams) {
    if (params.eyeSegments !== this.params.eyeSegments) {
      this.ball.geometry.dispose()
      this.ball.geometry = new SphereGeometry(1, params.eyeSegments, params.eyeSegments)
    }
    this.params = params
    this.glow.visible = params.glowSprite
    if (params.bloom && !this.bloom) this.bloom = new Bloom()
  }

  setSize(bufferW: number, bufferH: number) {
    this.bloom?.setSize(bufferW, bufferH)
  }

  private scheduleBlink() {
    gsap.delayedCall(rand(3, 6), () => {
      const tl = gsap.timeline({ onComplete: () => this.scheduleBlink() })
      const once = () =>
        tl
          .to(this.blink, { value: 1, duration: 0.11, ease: 'power2.in' })
          .to(this.blink, { value: 0, duration: 0.22, ease: 'power2.out', delay: 0.06 })
      once()
      if (Math.random() < 0.18) once()
    })
  }

  /** assemble 0..1 — секция въезжает в экран, панели слетаются. */
  update(f: Frame, slot: EyeSlot, assemble: number) {
    const reduced = state.reduced
    this.time.value += f.dt
    this.assemble.value = assemble
    this.bright.value = Math.min(1, assemble * 1.6)

    // камера смещается так, чтобы глаз оказался в центре своего слота и смотрел прямо на зрителя
    this.camera.aspect = f.width / f.height
    this.camera.setViewOffset(f.width, f.height, f.width / 2 - slot.x, f.height / 2 - slot.y, f.width, f.height)
    const visibleH = 2 * CAM_Z * Math.tan((FOV * Math.PI) / 360)
    this.root.scale.setScalar(((slot.size / f.height) * visibleH * 0.96) / (2 * RING_R))

    // куда смотреть
    const p = state.pointer
    let k: number
    if (state.finePointer && p.inside && !reduced) {
      const d = Math.max(slot.size * 1.1, 380)
      this.tYaw = Math.atan2(p.x - slot.x, d)
      this.tPitch = Math.atan2(p.y - slot.y, d)
      k = 0.08
    } else {
      // тач-устройства и курсор вне окна: глаз сам оглядывается короткими саккадами
      this.saccadeIn -= f.dt
      if (this.saccadeIn <= 0) {
        const home = Math.random() < 0.3
        this.tYaw = home ? 0 : rand(-0.45, 0.45)
        this.tPitch = home ? 0 : rand(-0.3, 0.3)
        this.saccadeIn = rand(0.7, 2.6)
      }
      k = 0.22
    }
    if (reduced) k = 0.02
    const clamp = (v: number) => Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, v))
    const a = 1 - Math.pow(1 - k, f.dt * 60)
    this.yaw += (clamp(this.tYaw) - this.yaw) * a
    this.pitch += (clamp(this.tPitch) - this.pitch) * a
    this.look.rotation.set(this.pitch, this.yaw, 0)

    // зрачок: сужается над ссылками и кнопками, слегка «дышит»
    const target = (state.hoverInteractive ? PUPIL_TIGHT : PUPIL_OPEN) + Math.sin(this.time.value * 1.3) * 0.008
    this.pupil.value += (target - this.pupil.value) * (1 - Math.exp(-f.dt * 9))

    // оболочка медленно вращается вокруг оси взгляда с лёгким покачиванием
    this.spin += f.dt * (reduced ? 0.04 : 0.2)
    this.m4.makeRotationZ(this.spin).premultiply(this.m4b.makeRotationX(Math.sin(this.time.value * 0.35) * 0.07))
    this.spinMat.value.setFromMatrix4(this.m4)
    this.ringPivot.rotation.z = -this.spin * 0.6
  }

  render(r: WebGLRenderer) {
    r.render(this.scene, this.camera)
    if (this.params.bloom && this.bloom) this.bloom.render(r, this.scene, this.camera, 0.85 * this.bright.value)
  }
}
