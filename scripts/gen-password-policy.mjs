/**
 * Genera src/constants/passwordPolicy.ts desde la política del API (api.mmcs/services/passwordPolicy.js),
 * que es la única fuente: largo mínimo y lista de contraseñas comunes para el checklist en vivo.
 *
 * Uso: node scripts/gen-password-policy.mjs [--check]
 * NO pasar el archivo generado por Prettier.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(root, 'src', 'constants', 'passwordPolicy.ts')
const apiPolicy = path.resolve(root, '..', 'api.mmcs', 'services', 'passwordPolicy.js')

const { PASSWORD_MIN_LENGTH, COMMON_PASSWORDS } = await import(
  pathToFileURL(apiPolicy).href
)

const OUT_TEXT = `// GENERADO por scripts/gen-password-policy.mjs desde api.mmcs/services/passwordPolicy.js. No editar a mano.
// Regénéralo con: npm run password-policy

export const PASSWORD_MIN_LENGTH = ${PASSWORD_MIN_LENGTH}

export const COMMON_PASSWORDS: string[] = [
${COMMON_PASSWORDS.map((p) => `  ${JSON.stringify(p)}`).join(',\n')}
]
`

if (process.argv.includes('--check')) {
  const norm = (t) => t.split('\r\n').join('\n')
  const current = fs.existsSync(OUT) ? norm(fs.readFileSync(OUT, 'utf8')) : ''
  if (current !== norm(OUT_TEXT)) {
    console.error(
      'DESACTUALIZADO: ' + OUT + '. Regénéralo con: npm run password-policy'
    )
    process.exit(1)
  }
  console.log('ok: ' + OUT + ' está al día')
  process.exit(0)
}
fs.writeFileSync(OUT, OUT_TEXT)
console.log(`ok: ${COMMON_PASSWORDS.length} contraseñas comunes, mínimo ${PASSWORD_MIN_LENGTH}`)
