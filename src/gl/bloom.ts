import {
  AdditiveBlending,
  GLSL3,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  RawShaderMaterial,
  Scene,
  Vector2,
  WebGLRenderTarget,
  type Camera,
  type Texture,
  type WebGLRenderer,
} from 'three'
import quadVert from './shaders/quad.vert?raw'
import blurFrag from './shaders/blur.frag?raw'
import compositeFrag from './shaders/composite.frag?raw'

/**
 * Bloom в половинном разрешении (только High): сцена → порог + размытие H/V в два прохода
 * с растущим радиусом → аддитивное наложение на экран. Без EffectComposer — ~4 полноэкранных прохода.
 */
export class Bloom {
  private rtScene = new WebGLRenderTarget(1, 1)
  private rtA = new WebGLRenderTarget(1, 1, { depthBuffer: false })
  private rtB = new WebGLRenderTarget(1, 1, { depthBuffer: false })
  private scene = new Scene()
  private camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private quad: Mesh
  private texel = new Vector2()
  private blur = new RawShaderMaterial({
    glslVersion: GLSL3,
    vertexShader: quadVert,
    fragmentShader: blurFrag,
    depthTest: false,
    depthWrite: false,
    uniforms: { tMap: { value: null }, uDir: { value: new Vector2() }, uThreshold: { value: 0 } },
  })
  private composite = new RawShaderMaterial({
    glslVersion: GLSL3,
    vertexShader: quadVert,
    fragmentShader: compositeFrag,
    depthTest: false,
    depthWrite: false,
    transparent: true,
    blending: AdditiveBlending,
    uniforms: { tMap: { value: null }, uStrength: { value: 1.15 } },
  })

  constructor() {
    this.quad = new Mesh(new PlaneGeometry(2, 2), this.blur)
    this.quad.frustumCulled = false
    this.scene.add(this.quad)
  }

  setSize(bufferW: number, bufferH: number) {
    const w = Math.max(1, bufferW >> 1)
    const h = Math.max(1, bufferH >> 1)
    this.rtScene.setSize(w, h)
    this.rtA.setSize(w, h)
    this.rtB.setSize(w, h)
    this.texel.set(1 / w, 1 / h)
  }

  private pass(r: WebGLRenderer, src: Texture, dst: WebGLRenderTarget, dx: number, dy: number, threshold = 0) {
    const u = this.blur.uniforms
    u.tMap.value = src
    u.uDir.value.set(dx * this.texel.x, dy * this.texel.y)
    u.uThreshold.value = threshold
    r.setRenderTarget(dst)
    r.render(this.scene, this.camera)
  }

  render(r: WebGLRenderer, scene: Scene, camera: Camera, strength: number) {
    r.setRenderTarget(this.rtScene)
    r.clear()
    r.render(scene, camera)
    this.quad.material = this.blur
    this.pass(r, this.rtScene.texture, this.rtA, 1, 0, 0.7)
    this.pass(r, this.rtA.texture, this.rtB, 0, 1)
    this.pass(r, this.rtB.texture, this.rtA, 2.2, 0)
    this.pass(r, this.rtA.texture, this.rtB, 0, 2.2)
    r.setRenderTarget(null)
    this.quad.material = this.composite
    this.composite.uniforms.tMap.value = this.rtB.texture
    this.composite.uniforms.uStrength.value = strength
    r.render(this.scene, this.camera)
  }
}
