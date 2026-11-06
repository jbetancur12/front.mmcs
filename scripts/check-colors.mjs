// Trinquete de colores: cuenta, por archivo, los hex de la paleta del sistema de diseño escritos a mano y los
// compara con scripts/colors-baseline.json.
//
//   npm run colors:check                       falla si algún archivo TIENE MÁS hex que su tope
//   npm run colors:check -- --update           baja los topes al estado actual (se niega si alguno subió)
//   npm run colors:check -- --update --force   crea o reinicia el baseline (solo la primera vez)
//
// Reglas:
//   - Archivo nuevo (no está en el baseline): tope 0. Usa los tokens de src/theme/designTokens.ts.
//   - Archivo viejo: no puede tener más que su tope. Si baja, pasa y se pide actualizar el baseline.
//   - src/theme/** (donde se definen los tokens) y los tests quedan fuera.
//
// Migrar un archivo: `node scripts/migrate-colors.mjs <archivo>` y luego `npm run colors:check -- --update`.
// Plan y motivos: plans/tema-de-colores/ (02-diseno.md §6.1).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { HEX_RE, WATCHED } from './colors-palette.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(ROOT, 'src')
const BASELINE = path.join(ROOT, 'scripts', 'colors-baseline.json')
const args = process.argv.slice(2)
const update = args.includes('--update')
const force = args.includes('--force')

const files = []
;(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (full === path.join(SRC, 'theme')) continue
      walk(full)
    } else if (
      /\.(tsx?|jsx?)$/.test(entry.name) &&
      !/\.test\./.test(entry.name)
    ) {
      files.push(full)
    }
  }
})(SRC)

// Además del hex de la paleta se vigilan: rgba() de cualquier color (negro y blanco incluidos: withAlpha(neutral.black, 0.1)) salvo el dorado del certificado
// (se escribe withAlpha(token, opacidad)), hex de 3 dígitos (salvo #fff y #F00 de ejemplo), colores CSS con nombre
// y clases de color de Tailwind (bg-gray-50, text-red-600...; se usan bg-neutral-alt, text-intent-danger...).
const RGBA_RE = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g
const RGBA_OK = new Set(['201,168,76'])
const HEX3_RE = /#[0-9a-fA-F]{3}(?![0-9a-fA-F])/g
const NAMED_RE =
  /(?:color|bgcolor|backgroundColor|borderColor|fill|stroke)['"]?\s*[:=]\s*\{?['"](?:red|blue|green|black|gray|grey|orange|yellow|purple|navy|pink|brown|cyan)['"]/g
const TW_RE =
  /(?:bg|text|border|ring|from|to|via|divide|outline|fill|stroke)-(?:gray|slate|zinc|neutral|red|green|blue|yellow|amber|emerald|teal|indigo|purple|orange)-\d{2,3}/g
const extras = (text) => {
  const rgba = [...text.matchAll(RGBA_RE)].filter(
    (m) => !RGBA_OK.has(`${m[1]},${m[2]},${m[3]}`)
  ).length
  const hex3 = (text.match(HEX3_RE) ?? []).filter(
    (h) => !['#fff', '#f00'].includes(h.toLowerCase())
  ).length
  return (
    rgba +
    hex3 +
    (text.match(NAMED_RE) ?? []).length +
    (text.match(TW_RE) ?? []).length
  )
}

const rel = (file) => path.relative(ROOT, file).split(path.sep).join('/')

const counts = {}
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8')
  const found = (text.match(HEX_RE) ?? []).filter(
    (hex) => WATCHED[hex.toLowerCase()]
  )
  const n = found.length + extras(text)
  if (n) counts[rel(file)] = n
}

const hasBaseline = fs.existsSync(BASELINE)
const baseline = hasBaseline
  ? JSON.parse(fs.readFileSync(BASELINE, 'utf8'))
  : {}
const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0)

const worse = Object.entries(counts).filter(
  ([file, n]) => n > (baseline[file] ?? 0)
)
const better = Object.entries(baseline).filter(
  ([file, n]) => (counts[file] ?? 0) < n
)

if (update) {
  if (hasBaseline && worse.length && !force) {
    console.error(
      'No se actualiza: hay archivos con MÁS colores que su tope (arréglalos primero):'
    )
    for (const [file, n] of worse)
      console.error(`  ${file}: ${n} (tope ${baseline[file] ?? 0})`)
    process.exit(1)
  }
  const sorted = Object.fromEntries(
    Object.entries(counts).sort(([a], [b]) => a.localeCompare(b))
  )
  fs.writeFileSync(BASELINE, JSON.stringify(sorted, null, 2) + '\n')
  console.log(
    `Baseline actualizado: ${Object.keys(sorted).length} archivos, ${sum(sorted)} colores tolerados.`
  )
  process.exit(0)
}

if (!hasBaseline) {
  console.error(
    'Falta scripts/colors-baseline.json. Créalo con: npm run colors:check -- --update --force'
  )
  process.exit(1)
}

if (worse.length) {
  console.error(
    'Colores de la paleta escritos a mano (usa los tokens de src/theme/designTokens.ts):\n'
  )
  for (const [file, n] of worse) {
    const tope = baseline[file] ?? 0
    console.error(
      `  ${file}: ${n} colores${tope ? ` (tope ${tope})` : ' (archivo nuevo: tope 0)'}`
    )
  }
  console.error(
    '\nEjemplos: brand.main, brand.hover, brand.ink, brand.soft, neutral.border, neutral.textBody, intent.danger.' +
      '\nEn sx: color: "brand.ink" o import { brand } from "src/theme/designTokens".' +
      '\nPara migrar un archivo entero: node scripts/migrate-colors.mjs <archivo>'
  )
  process.exit(1)
}

console.log(
  `Colores OK: ${sum(counts)} tolerados en ${Object.keys(counts).length} archivos (baseline ${sum(baseline)}).`
)
if (better.length) {
  console.log(
    `Bajaron en ${better.length} archivo(s): ejecuta "npm run colors:check -- --update" para bajar el tope.`
  )
}
