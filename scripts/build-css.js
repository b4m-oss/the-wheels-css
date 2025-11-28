/**
 * CSS Build Script
 * 
 * 個別のCSSファイルをdistディレクトリに出力します
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs'
import { resolve, dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '..')
const srcCssDir = resolve(rootDir, 'src/css')
const distDir = resolve(rootDir, 'dist')

// distディレクトリを作成
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true })
}

/**
 * CSSファイルの内容を再帰的に読み込んで結合
 */
function resolveCssImports(filePath, processedFiles = new Set()) {
  if (processedFiles.has(filePath)) {
    return ''
  }
  processedFiles.add(filePath)

  if (!existsSync(filePath)) {
    console.warn(`Warning: File not found: ${filePath}`)
    return ''
  }

  let content = readFileSync(filePath, 'utf-8')
  const dir = dirname(filePath)

  // @import文を解決
  const importRegex = /@import\s+['"]([^'"]+)['"]\s*;?/g
  let match
  const imports = []

  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1]
    
    // node_modules からのインポートを解決（reset-cssなど）
    if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
      try {
        // まず直接パスを試す
        let nodeModulePath = resolve(rootDir, 'node_modules', importPath)
        
        if (existsSync(nodeModulePath) && nodeModulePath.endsWith('.css')) {
          const importedContent = readFileSync(nodeModulePath, 'utf-8')
          imports.push({ original: match[0], content: importedContent })
        } else {
          // パッケージ名のみの場合、reset.cssやindex.cssを探す
          const possiblePaths = [
            resolve(rootDir, 'node_modules', importPath, 'reset.css'),
            resolve(rootDir, 'node_modules', importPath, 'index.css'),
            resolve(rootDir, 'node_modules', importPath, `${importPath}.css`)
          ]
          
          let found = false
          for (const path of possiblePaths) {
            if (existsSync(path)) {
              const importedContent = readFileSync(path, 'utf-8')
              imports.push({ original: match[0], content: importedContent })
              found = true
              break
            }
          }
          
          if (!found) {
            console.warn(`Warning: Could not resolve import: ${importPath}`)
          }
        }
      } catch (e) {
        console.warn(`Warning: Could not resolve import: ${importPath}`)
      }
      continue
    }

    const absoluteImportPath = resolve(dir, importPath)
    const importedContent = resolveCssImports(absoluteImportPath, processedFiles)
    imports.push({ original: match[0], content: importedContent })
  }

  // インポートを解決した内容で置換
  for (const { original, content: importedContent } of imports) {
    content = content.replace(original, importedContent)
  }

  return content
}

/**
 * レイヤー別のCSSファイルをビルド
 */
function buildLayerCss(layer) {
  const indexPath = resolve(srcCssDir, layer, '_index.css')
  if (!existsSync(indexPath)) {
    console.warn(`Warning: ${layer}/_index.css not found`)
    return
  }

  const content = resolveCssImports(indexPath)
  const outputPath = resolve(distDir, `${layer}.css`)
  writeFileSync(outputPath, content)
  console.log(`Built: ${layer}.css`)
}

/**
 * 全体のindex.cssをビルド
 */
function buildIndexCss() {
  const indexPath = resolve(srcCssDir, 'index.css')
  const content = resolveCssImports(indexPath)
  const outputPath = resolve(distDir, 'index.css')
  writeFileSync(outputPath, content)
  console.log('Built: index.css')
}

// ビルド実行
console.log('Building CSS files...\n')

const layers = ['tokens', 'base', 'layout', 'components', 'utilities']
layers.forEach(buildLayerCss)
buildIndexCss()

console.log('\nCSS build complete!')

