import { defineConfig, type Plugin } from 'vite'
import { renderBody, renderHead } from './src/render/page.ts'

// Подставляет разметку из content.ts в index.html.
// content.ts импортируется конфигом, поэтому Vite перезапускает dev-сервер при его правке.
function contentHtml(): Plugin {
  return {
    name: 'content-html',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => html.replace('<!--head-->', renderHead()).replace('<!--app-->', renderBody()),
    },
  }
}

export default defineConfig({
  plugins: [contentHtml()],
  build: {
    target: 'es2020',
    cssMinify: true,
    modulePreload: { polyfill: false },
    reportCompressedSize: true,
  },
})
