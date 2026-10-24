// Comprueba que cada pantalla con ruta fija se pueda encontrar con la búsqueda
// rápida (Ctrl+K): tiene ítem en el menú (SideBar.tsx), está en
// src/constants/quickSearchPages.ts o está en IGNORED con su motivo.
// También avisa de lo contrario: un ítem del menú o del registro cuya ruta no existe.
//
//   npm run quick-search:check
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const routesDir = join(root, 'src', 'routes')

// Rutas que a propósito no se buscan. Cada una dice por qué.
const IGNORED = {
  '/welcome': 'pantalla de bienvenida, no se navega a ella',
  '/users': 'ruta heredada, la gestión de usuarios está en /settings',
  '/iot': 'IoT está desactivado en producción',
  '/iot/email-settings': 'IoT está desactivado en producción',
  '/iot/customers-management': 'IoT está desactivado en producción',
  '/map': 'IoT está desactivado en producción (hija de /iot)',
  '/lms/admin': 'es el "Panel de Academia" (/lms)',
  '/lms/admin/jobs': 'redirección a /lms/admin',
  '/lms/admin/dashboard': 'redirección a /lms/admin/courses',
  '/lms/admin/question-bank': 'redirección a quiz-management',
  '/lms/admin/quiz-validator': 'redirección a quiz-management',
  '/lms/admin/quiz-analytics': 'redirección a /lms/admin/analytics',
  '/lms/admin/reports': 'alias de /lms/admin/reporting'
}

const norm = (path) => {
  const withSlash = `/${path.replace(/^\/+/, '')}`
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, '') : withSlash
}

const read = (...parts) => readFileSync(join(root, ...parts), 'utf8')

// Rutas fijas: sin parámetros, salvo el opcional final (`inventory/:id?`).
const routes = new Set()
for (const file of readdirSync(routesDir)) {
  if (!file.endsWith('.tsx') || file === 'PublicRoutes.tsx') continue
  const source = readFileSync(join(routesDir, file), 'utf8')
  for (const match of source.matchAll(/<Route\b[^>]*?\bpath=(['"])(.*?)\1/gs)) {
    let path = match[2]
    if (!path || path === '*') continue
    path = path.replace(/\/:[\w]+\?$/, '')
    if (path.includes(':') || path.includes('*')) continue
    routes.add(norm(path))
  }
}

const menu = new Set()
// Sin comentarios: hay ítems del menú comentados (p. ej. Telemetría).
const sidebar = read('src', 'Components', 'SideBar.tsx')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '')
for (const match of sidebar.matchAll(/\b(?:url|to):\s*'([^'$`]*)'/g)) {
  menu.add(norm(match[1]))
}

const registry = new Set()
const pages = read('src', 'constants', 'quickSearchPages.ts')
for (const match of pages.matchAll(/\bpath:\s*'([^']+)'/g)) {
  registry.add(norm(match[1]))
}

const problems = []

for (const route of [...routes].sort()) {
  if (menu.has(route) || registry.has(route) || route in IGNORED) continue
  problems.push(
    `Sin buscador: ${route}\n    Agrégala a src/constants/quickSearchPages.ts o, si no debe buscarse, a IGNORED en scripts/check-quick-search.mjs con su motivo.`
  )
}

for (const [origin, paths] of [
  ['el menú (SideBar.tsx)', menu],
  ['quickSearchPages.ts', registry]
]) {
  for (const path of [...paths].sort()) {
    // `customers/` + id y la raíz se arman en tiempo de ejecución.
    if (path === '/' || path === '/customers') continue
    if (!routes.has(path)) {
      problems.push(`Ruta inexistente en ${origin}: ${path}`)
    }
  }
}

for (const path of Object.keys(IGNORED)) {
  if (menu.has(path) || registry.has(path)) {
    problems.push(
      `IGNORED tiene ${path}, pero ya se puede buscar: quítala de la lista.`
    )
  }
  if (!routes.has(path)) {
    problems.push(`IGNORED tiene ${path}, pero esa ruta ya no existe.`)
  }
}

if (problems.length > 0) {
  console.error(`Búsqueda rápida: ${problems.length} problema(s)\n`)
  for (const problem of problems) console.error(`- ${problem}`)
  process.exit(1)
}

console.log(
  `Búsqueda rápida al día: ${routes.size} rutas fijas, ${menu.size} en el menú, ${registry.size} en el registro, ${Object.keys(IGNORED).length} ignoradas.`
)
