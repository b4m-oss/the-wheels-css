/**
 * Vite Library Build Configuration
 * 
 * CSSをnpmパッケージとしてビルドするための設定
 */

import { defineConfig } from 'vite'
import { resolve } from 'path'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'

// CSSファイルを結合するプラグイン
function cssBundle() {
  return {
    name: 'css-bundle',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist')
      
      if (!existsSync(distDir)) {
        mkdirSync(distDir, { recursive: true })
      }

      // 各レイヤーのCSSを個別に出力
      const layers = ['tokens', 'base', 'layout', 'components', 'utilities']
      
      layers.forEach(layer => {
        const indexPath = resolve(__dirname, `src/css/${layer}/_index.css`)
        if (existsSync(indexPath)) {
          const content = readFileSync(indexPath, 'utf-8')
          writeFileSync(resolve(distDir, `${layer}.css`), content)
        }
      })

      console.log('CSS bundle created successfully!')
    }
  }
}

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssMinify: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'src/css/index.css')
      },
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'index.css') {
            return 'index.css'
          }
          return '[name].[ext]'
        }
      }
    }
  },
  plugins: [cssBundle()]
})
