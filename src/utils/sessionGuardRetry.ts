const FIRST_RETRY_MS = 5_000
const MAX_FAST_RETRY_MS = 60_000
// Tras varios cierres seguidos sin llegar a abrir, reintentar cada minuto solo llena el log del servidor
const SLOW_RETRY_MS = 300_000
const FAST_FAILURES = 6

/**
 * Espera antes del siguiente intento del canal de sesión, según cuántos intentos seguidos se cerraron sin abrir:
 * 5 s, 10, 20, 40 y 60 s, y a partir del sexto fallo cada 5 minutos. Con `failures` en 0 (había abierto) vuelve a 5 s.
 */
export const nextRetryMs = (failures: number): number => {
  if (failures >= FAST_FAILURES) return SLOW_RETRY_MS
  return Math.min(
    FIRST_RETRY_MS * 2 ** Math.max(failures - 1, 0),
    MAX_FAST_RETRY_MS
  )
}
