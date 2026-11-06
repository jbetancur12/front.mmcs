// Migra los hex de la paleta a tokens de src/theme/designTokens.ts en los archivos indicados.
//
//   node scripts/migrate-colors.mjs src/Components/Foo.tsx src/pages/Bar.tsx
//   node scripts/migrate-colors.mjs --dry src/Components/Foo.tsx      (solo informa)
//   node scripts/migrate-colors.mjs --dir src/pages/calibration-services   (todos los .tsx/.ts de la carpeta)
//
// Qué hace: '#00BFA5' -> brand.main; "1px solid #e5e7eb" -> `1px solid ${neutral.border}`; fill='#fff' queda igual.
// Agrega el import de los tokens que use. NO migra el esmeralda (#10b981/#059669: reservado) ni los colores que no
// son de la paleta. Después: revisar `git diff`, `npm run check`, y bajar el baseline con
// `npm run colors:check -- --update`. Plan: plans/tema-de-colores/.
import fs from 'node:fs'
import path from 'node:path'
import {
  HEX_RE,
  PALETTE,
  WHITE_BACKGROUND_TOKEN,
  WHITE_HEX
} from './colors-palette.mjs'

const args = process.argv.slice(2)
const dry = args.includes('--dry')
const dirIndex = args.indexOf('--dir')
let files = args.filter(
  (a, i) => !a.startsWith('--') && args[i - 1] !== '--dir'
)
if (dirIndex !== -1) files = files.concat(walk(args[dirIndex + 1]))

function walk(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (/\.(tsx?|jsx?)$/.test(entry.name) && !/\.test\./.test(entry.name))
      out.push(full)
  }
  return out
}

// Cadenas: '...', "..." y `...` (sin entender comentarios ni regex; se revisa con tsc y git diff)
const STRING_RE = /'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g
const BG_BEFORE_RE = /(?:bgcolor|backgroundColor|background|bg)['"]?\s*:\s*$/

const tokenOf = (hex) => PALETTE[hex.toLowerCase()]

function transform(text) {
  const used = new Set()
  let count = 0
  const out = text.replace(STRING_RE, (literal, offset) => {
    const quote = literal[0]
    const inner = literal.slice(1, -1)
    const hexes = inner.match(HEX_RE) ?? []
    const isWhiteBg =
      WHITE_HEX.includes(inner.toLowerCase()) &&
      BG_BEFORE_RE.test(text.slice(Math.max(0, offset - 40), offset))
    if (!isWhiteBg && !hexes.some((h) => tokenOf(h))) return literal

    const before = text[offset - 1]
    const isJsxAttr = before === '='
    const note = (token) => {
      used.add(token.split('.')[0])
      count += 1
    }

    // Cadena que es solo un blanco de fondo
    if (isWhiteBg) {
      note(WHITE_BACKGROUND_TOKEN)
      return isJsxAttr ? `{${WHITE_BACKGROUND_TOKEN}}` : WHITE_BACKGROUND_TOKEN
    }
    // Cadena que es solo un hex
    if (hexes.length === 1 && inner.toLowerCase() === hexes[0].toLowerCase()) {
      const token = tokenOf(hexes[0])
      note(token)
      return isJsxAttr ? `{${token}}` : token
    }
    // Hex dentro de un texto más largo: pasa a plantilla con ${token}
    let replaced = inner
    if (quote !== '`')
      replaced = replaced.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')
    replaced = replaced.replace(HEX_RE, (h) => {
      const token = tokenOf(h)
      if (!token) return h
      note(token)
      return '${' + token + '}'
    })
    const template = '`' + replaced + '`'
    return quote !== '`' && isJsxAttr ? `{${template}}` : template
  })
  return { out, used, count }
}

function addImport(text, used) {
  const names = ['brand', 'neutral', 'intent'].filter((n) => used.has(n))
  if (!names.length) return text
  if (
    text.includes("from 'src/theme/designTokens'") ||
    text.includes("from './designTokens'")
  ) {
    return text
  }
  const line = `import { ${names.join(', ')} } from 'src/theme/designTokens'\n`
  const imports = [
    ...text.matchAll(/^import[\s\S]*?from\s+['"][^'"]+['"];?[ \t]*$/gm)
  ]
  if (!imports.length) return line + text
  const last = imports[imports.length - 1]
  const end = last.index + last[0].length
  return text.slice(0, end) + '\n' + line.trimEnd() + text.slice(end)
}

let total = 0
for (const file of files) {
  const raw = fs.readFileSync(file, 'utf8')
  const crlf = raw.includes('\r\n')
  const text = crlf ? raw.replace(/\r\n/g, '\n') : raw
  if (
    /\b(?:brand|neutral|intent)\b/.test(
      text.replace(/\b(?:brand|neutral|intent)\.\w+/g, '')
    )
  ) {
    console.log(
      `OMITIDO ${file}: ya usa un identificador brand/neutral/intent; migrarlo a mano`
    )
    continue
  }
  const { out, used, count } = transform(text)
  if (!count) {
    console.log(`sin cambios ${file}`)
    continue
  }
  const final = addImport(out, used)
  total += count
  console.log(
    `${dry ? '[dry] ' : ''}${file}: ${count} colores -> ${[...used].join(', ')}`
  )
  if (!dry) fs.writeFileSync(file, crlf ? final.replace(/\n/g, '\r\n') : final)
}
console.log(`\nTotal: ${total} colores${dry ? ' (simulación)' : ''}`)
