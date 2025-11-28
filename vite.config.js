import { defineConfig } from 'vite'
import vituum from 'vituum'
import nunjucks from '@vituum/vite-plugin-nunjucks'

export default defineConfig({
  plugins: [
    vituum({
      pages: {
        dir: './src/pages'
      }
    }),
    nunjucks({
      root: './src'
    })
  ],
  css: {
    devSourcemap: true
  },
  build: {
    outDir: 'public',
    emptyOutDir: true
  }
})

