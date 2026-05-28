import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = fileURLToPath(new URL('.', import.meta.url))
const tscPath = resolve(dir, '..', 'node_modules', 'typescript', 'bin', 'tsc')
const vitePath = resolve(dir, '..', 'node_modules', 'vite', 'bin', 'vite.js')

const maxMem = '--max-old-space-size=8192'

const tsc = spawnSync('node', [maxMem, tscPath], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true
})

const output = (tsc.stdout?.toString() || '') + (tsc.stderr?.toString() || '')

const nonCasingErrors = output
  .split('\n')
  .filter((line) => line.includes('error') && !line.includes('TS1261'))

if (tsc.status !== 0 && nonCasingErrors.length > 0) {
  process.stderr.write(output)
  process.exit(tsc.status || 1)
}

if (output.includes('TS1261')) {
  console.warn('[build] Ignorando errores de casing (TS1261) - errores preexistentes en el proyecto')
}

const vite = spawnSync('node', [maxMem, vitePath, 'build'], {
  stdio: 'inherit',
  shell: true
})

process.exit(vite.status || 0)
