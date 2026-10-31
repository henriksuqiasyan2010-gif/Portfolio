import { defineConfig, type Plugin } from 'vite'
import { renderBody, renderHead } from './src/render/page.ts'
import { content } from './src/content.ts'

// Подставляет разметку из content.ts в index.html.
// content.ts импортируется конфигом, поэтому Vite перезапускает dev-сервер при его правке.
function contentHtml(): Plugin {
  return {
    name: 'content-html',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) =>
        html
          .replace(/<html lang="[^"]*">/, `<html lang="${content.lang}">`)
          .replace('<!--head-->', renderHead())
          .replace('<!--app-->', renderBody()),
    },
  }
}

// В сборке весь CSS (~6 KB gzip) встраивается в <head>: на медленной сети это минус один
// блокирующий запрос перед первой отрисовкой.
function inlineCss(): Plugin {
  return {
    name: 'inline-css',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        for (const [file, asset] of Object.entries(ctx.bundle ?? {})) {
          if (asset.type !== 'asset' || !file.endsWith('.css')) continue
          const link = new RegExp(`<link rel="stylesheet"[^>]*href="/${file.replace(/[.]/g, '\\.')}"[^>]*>`)
          if (!link.test(html)) continue
          html = html.replace(link, () => `<style>${String(asset.source)}</style>`)
          delete ctx.bundle![file]
        }
        return html
      },
    },
  }
}

export default defineConfig({
  plugins: [contentHtml(), inlineCss()],
  build: {
    target: 'es2020',
    cssMinify: true,
    modulePreload: { polyfill: false },
    reportCompressedSize: true,
    // three.js — отдельный ленивый чанк ~135 KB gzip, это ожидаемо
    chunkSizeWarningLimit: 700,
  },
})
