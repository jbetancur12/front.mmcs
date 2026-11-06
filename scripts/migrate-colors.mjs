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
  EXCLUDED_FROM_AUTO,
  HEX_RE,
  PALETTE,
  RESERVED,
  WHITE_BACKGROUND_TOKEN,
  WHITE_HEX
} from './colors-palette.mjs'

const args = process.argv.slice(2)
const dry = args.includes('--dry')
const includeDataviz = args.includes('--include-dataviz')
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

const TEXT_COLOR_BEFORE_RE = /(?:^|[^A-Za-z])color\s*[:=]\s*['"{]?\s*$/

// Token de un hex según dónde está. El esmeralda (#10b981/#059669) solo se conserva como `detail` en los degradados
// del banner de las fichas; en cualquier otro sitio se unifica con el turquesa de la marca.
function tokenFor(hex, before, inner) {
  const low = hex.toLowerCase()
  if (PALETTE[low]) return PALETTE[low]
  if (!RESERVED[low]) return undefined
  if (/gradient/i.test(inner)) return RESERVED[low]
  if (low === '#10b981') return 'brand.main'
  return TEXT_COLOR_BEFORE_RE.test(before) ? 'brand.ink' : 'brand.hover'
}

// ¿La posición cae dentro de un comentario? (// en la misma línea, o /* ... */ abierto antes). Del lado seguro:
// ante la duda se omite.
function inComment(text, offset) {
  const lineStart = text.lastIndexOf('\n', offset - 1) + 1
  const line = text.slice(lineStart, offset)
  if (line.includes('//') || /^\s*\*/.test(line)) return true
  // Un bloque /* ... */ solo cuenta si abre al inicio de línea o tras `{` (JSX): un "/*" dentro de una cadena no
  const head = text.slice(0, offset)
  const opens = [...head.matchAll(/(?:^[ \t]*|\{[ \t]*)\/\*/gm)]
  const lastOpen = opens.length ? opens[opens.length - 1].index : -1
  return lastOpen > head.lastIndexOf('*/')
}

function transform(text) {
  const used = new Set()
  let count = 0
  const out = text.replace(STRING_RE, (literal, offset) => {
    // Valores arbitrarios de Tailwind (bg-[#fff]): una plantilla dinámica los rompería
    if (/\[#[0-9a-fA-F]{3,6}\]/.test(literal)) return literal
    if (inComment(text, offset)) return literal
    const quote = literal[0]
    const inner = literal.slice(1, -1)
    const hexes = inner.match(HEX_RE) ?? []
    const isWhiteBg =
      WHITE_HEX.includes(inner.toLowerCase()) &&
      BG_BEFORE_RE.test(text.slice(Math.max(0, offset - 40), offset))
    const beforeText = text.slice(Math.max(0, offset - 60), offset)
    if (!isWhiteBg && !hexes.some((h) => tokenFor(h, beforeText, inner)))
      return literal

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
      const token = tokenFor(hexes[0], beforeText, inner)
      note(token)
      return isJsxAttr ? `{${token}}` : token
    }
    // Hex dentro de un texto más largo: pasa a plantilla con ${token}
    let replaced = inner
    if (quote !== '`')
      replaced = replaced.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')
    replaced = replaced.replace(HEX_RE, (h) => {
      const token = tokenFor(h, '', inner)
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
  const names = ['brand', 'neutral', 'intent', 'detail'].filter((n) =>
    used.has(n)
  )
  if (!names.length) return text
  // Si ya importa tokens, se agregan los que falten al mismo import
  const existing = text.match(
    /import\s*\{([^}]*)\}\s*from\s*'src\/theme\/designTokens'/
  )
  if (existing) {
    const have = existing[1]
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean)
    const merged = [...new Set([...have, ...names])]
    if (merged.length === have.length) return text
    return text.replace(
      existing[0],
      `import { ${merged.join(', ')} } from 'src/theme/designTokens'`
    )
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

// Conflicto real: una variable, tipo o import ajeno con el nombre de un token. Un parámetro o variable que sombree
// el token lo detecta `npm run check` (el token ya no tendría la forma esperada).
function hasNameConflict(text) {
  const noTokenImport = text.replace(
    /import\s*\{[^}]*\}\s*from\s*'src\/theme\/designTokens'/g,
    ''
  )
  return (
    /(?:const|let|var|function|class|type|interface|enum)\s+(?:brand|neutral|intent)/.test(
      noTokenImport
    ) ||
    /import\s*\{[^}]*(?:brand|neutral|intent)[^}]*\}\s*from/.test(noTokenImport)
  )
}

let total = 0
for (const file of files) {
  const normalized = file.split(path.sep).join('/')
  // Donde se definen los tokens no se migra: quedarían definidos en términos de sí mismos
  if (/(^|\/)src\/theme(\/|\.tsx$)/.test(normalized)) continue
  if (
    !includeDataviz &&
    EXCLUDED_FROM_AUTO.some((x) => normalized.endsWith(x))
  ) {
    console.log(
      `OMITIDO ${file}: gráfico, mapa o PDF (revisar a mano; --include-dataviz para forzar)`
    )
    continue
  }
  const raw = fs.readFileSync(file, 'utf8')
  const crlf = raw.includes('\r\n')
  const text = crlf ? raw.replace(/\r\n/g, '\n') : raw
  if (hasNameConflict(text)) {
    console.log(
      `OMITIDO ${file}: declara o recibe algo llamado brand/neutral/intent; migrarlo a mano`
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
