/**
 * Registro de depuración del navegador: escribe en la consola solo en desarrollo (`npm run dev`), así
 * producción queda sin ruido ni datos internos en la consola de quien usa la app.
 *
 * No sustituye al reporte de errores: lo que debe llegar al backend (errores no capturados y respuestas 5xx)
 * lo recoge `services/errorReportingService.ts`.
 */
const isDev = import.meta.env.DEV

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDev) console.debug(...args)
  },
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args)
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info(...args)
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args)
  },
  error: (...args: unknown[]) => {
    if (isDev) console.error(...args)
  }
}

export default logger
