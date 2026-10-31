// Общее состояние, которое читают DOM-модули и WebGL-сцены каждый кадр.

const mq = (q: string) => typeof matchMedia === 'function' && matchMedia(q).matches

export type QualityLevel = 'high' | 'medium' | 'low'

export const state = {
  reduced: mq('(prefers-reduced-motion: reduce)'),
  /** мышь или тачпад: кастомный прицел, слежение глазом, отталкивание частиц */
  finePointer: mq('(hover: hover) and (pointer: fine)'),
  touch: mq('(pointer: coarse)') || navigator.maxTouchPoints > 0,
  pointer: { x: -1e4, y: -1e4, inside: false, down: false },
  /** курсор над ссылкой или кнопкой — зрачок сужается */
  hoverInteractive: false,
  quality: 'medium' as QualityLevel,
  pageVisible: !document.hidden,
}

type Handler = (detail?: unknown) => void
const handlers = new Map<string, Set<Handler>>()

/** Крошечная шина событий между модулями (звук, GL, консоль). */
export const bus = {
  on(type: string, fn: Handler) {
    if (!handlers.has(type)) handlers.set(type, new Set())
    handlers.get(type)!.add(fn)
    return () => handlers.get(type)!.delete(fn)
  },
  emit(type: string, detail?: unknown) {
    handlers.get(type)?.forEach((fn) => fn(detail))
  },
}

export const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel)
export const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel))

export const rand = (a: number, b: number) => a + Math.random() * (b - a)
