import { useCallback, useEffect, useState } from 'react'

interface WakeLockSentinelLike {
  release: () => Promise<void>
}

/**
 * Modo TV: pantalla completa (tecla F o botón) y pantalla siempre encendida.
 * El bloqueo de apagado se pide al abrir y se renueva si la pestaña vuelve a verse.
 */
export const useTvKiosk = () => {
  const [isFullscreen, setIsFullscreen] = useState(
    Boolean(document.fullscreenElement)
  )

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen?.()
    } else {
      void document.documentElement.requestFullscreen?.().catch(() => {
        // El navegador puede negarlo sin un gesto de la persona: no pasa nada
      })
    }
  }, [])

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'f' && !event.ctrlKey && !event.metaKey) {
        toggleFullscreen()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleFullscreen])

  useEffect(() => {
    const wakeLock = (
      navigator as Navigator & {
        wakeLock?: {
          request: (type: 'screen') => Promise<WakeLockSentinelLike>
        }
      }
    ).wakeLock
    if (!wakeLock) return

    let sentinel: WakeLockSentinelLike | null = null
    let cancelled = false

    const acquire = async () => {
      try {
        const lock = await wakeLock.request('screen')
        if (cancelled) void lock.release()
        else sentinel = lock
      } catch {
        // Sin permiso o sin soporte: la pantalla sigue funcionando
      }
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') void acquire()
    }

    void acquire()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      void sentinel?.release()
    }
  }, [])

  return { isFullscreen, toggleFullscreen }
}
