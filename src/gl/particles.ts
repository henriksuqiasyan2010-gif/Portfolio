import {
  AdditiveBlending,
  BufferAttribute,
  DoubleSide,
  GLSL3,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  PerspectiveCamera,
  RawShaderMaterial,
  Scene,
  Vector2,
  Vector4,
  type WebGLRenderer,
} from 'three'
import vert from './shaders/particles.vert?raw'
import frag from './shaders/particles.frag?raw'
import { state } from '../state'
import type { Frame } from './renderer'

const MAX = 4000
const POKES = 24
const POKE_DT = 0.05
// неподвижный курсор: сумма откликов ≈ ∫h dt / POKE_DT = FREQ / (DAMP² + FREQ²) / POKE_DT
const STEADY = 10.5 / (3.4 * 3.4 + 10.5 * 10.5) / POKE_DT
const PUSH_PX = 105
const FOV = 60

/** Звёздное поле с глубиной: отталкивание от курсора и варп считаются в вершинном шейдере. */
export class Particles {
  readonly scene = new Scene()
  readonly camera = new PerspectiveCamera(FOV, 1, 0.1, 200)
  private geometry = new InstancedBufferGeometry()
  private material: RawShaderMaterial
  private pokes = Array.from({ length: POKES }, () => new Vector4())
  private pokeIdx = 0
  private pokeAcc = 0
  private travel = 0
  private camX = 0
  private camY = 0

  constructor(count: number) {
    const g = this.geometry
    g.setAttribute('position', new BufferAttribute(new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0]), 3))
    g.setIndex([0, 1, 2, 0, 2, 3])
    const pos = new Float32Array(MAX * 3)
    const seed = new Float32Array(MAX * 4)
    for (let i = 0; i < MAX; i++) {
      pos[i * 3] = Math.random() * 2 - 1
      pos[i * 3 + 1] = Math.random() * 2 - 1
      pos[i * 3 + 2] = 2 + Math.random() * 98
      for (let k = 0; k < 4; k++) seed[i * 4 + k] = Math.random()
    }
    g.setAttribute('aPos', new InstancedBufferAttribute(pos, 3))
    g.setAttribute('aSeed', new InstancedBufferAttribute(seed, 4))
    this.setCount(count)

    this.material = new RawShaderMaterial({
      glslVersion: GLSL3,
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: AdditiveBlending,
      // квад строится в пикселях с осью Y вниз — обход вершин зеркалится
      side: DoubleSide,
      uniforms: {
        uRes: { value: new Vector2(1, 1) },
        uTime: { value: 0 },
        uTravel: { value: 0 },
        uSpeed: { value: 0 },
        uTanHalf: { value: Math.tan(((FOV / 2) * Math.PI) / 180) },
        uAspect: { value: 1 },
        uFade: { value: 1 },
        uPush: { value: PUSH_PX / STEADY },
        uWarp: { value: 0 },
        uPokes: { value: this.pokes },
      },
    })
    const mesh = new Mesh(g, this.material)
    mesh.frustumCulled = false
    this.scene.add(mesh)
  }

  setCount(n: number) {
    this.geometry.instanceCount = Math.min(n, MAX)
  }

  get count() {
    return this.geometry.instanceCount
  }

  resize(w: number, h: number) {
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.material.uniforms.uRes.value.set(w, h)
    this.material.uniforms.uAspect.value = w / h
  }

  /** warp 0..1 — прогресс ухода со сцены hero. */
  update(f: Frame, warp: number) {
    const u = this.material.uniforms
    const p = state.pointer
    const live = !state.reduced

    // толчок курсора раз в 50 мс; при варпе отталкивание затухает
    this.pokeAcc += f.dt
    if (this.pokeAcc >= POKE_DT) {
      this.pokeAcc %= POKE_DT
      const strength = live && state.finePointer && p.inside ? 1 - warp : 0
      this.pokes[this.pokeIdx].set(p.x, p.y, f.time, strength)
      this.pokeIdx = (this.pokeIdx + 1) % POKES
    }

    const speed = live ? 0.7 + warp * warp * 150 : 0
    this.travel += speed * f.dt

    // параллакс: от мыши на десктопе, от скролла и лёгкого покачивания на тач-устройствах
    let tx = 0
    let ty = 0
    if (live && state.finePointer && p.inside) {
      tx = (p.x / f.width - 0.5) * 2.2
      ty = -(p.y / f.height - 0.5) * 1.4
    } else if (live) {
      tx = Math.sin(f.time * 0.13) * 0.6
      ty = Math.cos(f.time * 0.11) * 0.4 - (f.scrollY / f.height) * 1.2
    }
    const k = 1 - Math.exp(-f.dt * 2.5)
    this.camX += (tx - this.camX) * k
    this.camY += (ty - this.camY) * k
    this.camera.position.set(this.camX, this.camY, 0)
    this.camera.updateMatrixWorld()

    u.uTime.value = f.time
    u.uTravel.value = this.travel
    u.uSpeed.value = speed
    u.uWarp.value = warp
    u.uFade.value = 1 - smoothstep(0.72, 1, warp)
  }

  render(renderer: WebGLRenderer) {
    renderer.render(this.scene, this.camera)
  }
}

export const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
