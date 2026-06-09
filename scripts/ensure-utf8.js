/**
 * 确保小程序源文件为 UTF-8 无 BOM（微信编译器要求）
 * 用法: node scripts/ensure-utf8.js
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const exts = new Set(['.js', '.wxml', '.wxss', '.json', '.wxs'])

function walk(dir, changed) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) {
      if (name === 'node_modules' || name === '.git') continue
      walk(full, changed)
      continue
    }
    if (!exts.has(path.extname(name))) continue
    const buf = fs.readFileSync(full)
    let text
    if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
      text = buf.slice(3).toString('utf8')
      changed.push(full)
    } else {
      text = buf.toString('utf8')
    }
    fs.writeFileSync(full, text, { encoding: 'utf8' })
  }
}

const changed = []
walk(root, changed)
if (changed.length) {
  console.log('Removed BOM from:')
  changed.forEach((f) => console.log(path.relative(root, f)))
} else {
  console.log('All source files are UTF-8 without BOM.')
}
