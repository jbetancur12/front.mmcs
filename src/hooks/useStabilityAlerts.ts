import { useCallback, useEffect, useRef, useState } from 'react'
import { Chamber, CHAMBER_STATUS } from 'src/Components/LaboratoryMonitor/types'
import {
  evaluateStabilityAlerts,
  StabilityAlertState,
  StabilityEvent
} from 'src/Components/LaboratoryMonitor/stability'
import { useVoiceAnnouncer } from './useVoiceAnnouncer'
import { useDesktopNotifications } from './useDesktopNotifications'

type Alerts = Record<string, StabilityAlertState>

/**
 * Avisos de estabilidad de TODAS las cámaras que están calibrando, no solo
 * la que se está viendo. Devuelve los avisos por patrón (para mostrar el
 * cuadro "Reconocer") y el control de voz.
 */
export const useStabilityAlerts = (chambers: Chamber[]) => {
  const voice = useVoiceAnnouncer()
  const { announce } = voice
  const desktop = useDesktopNotifications()
  const { notify } = desktop
  const [alerts, setAlerts] = useState<Alerts>({})
  // Fuente de verdad síncrona: evita avisar dos veces el mismo patrón
  const alertsRef = useRef<Alerts>({})

  useEffect(() => {
    let next = alertsRef.current
    let changed = false
    const messages: string[] = []
    const events: StabilityEvent[] = []

    chambers.forEach((chamber) => {
      const patterns = chamber.patterns || []
      if (chamber.status !== CHAMBER_STATUS.CALIBRATING) {
        // Fuera de calibración se olvidan sus avisos
        patterns.forEach((pattern) => {
          if (next[pattern.id]) {
            if (!changed) next = { ...next }
            delete next[pattern.id]
            changed = true
          }
        })
        return
      }
      const result = evaluateStabilityAlerts(
        patterns,
        next,
        chamber.name,
        Date.now()
      )
      if (result.changed) {
        next = result.alerts
        changed = true
      }
      messages.push(...result.messages)
      events.push(...result.events)
    })

    if (changed) {
      alertsRef.current = next
      setAlerts(next)
    }
    messages.forEach(announce)
    events.forEach((event) =>
      notify(
        event.kind === 'stable' ? 'Patrón estable' : 'Patrón sigue estable',
        `${event.patternName} · ${event.chamberName}`,
        `lab-stable-${event.patternId}`
      )
    )
  }, [chambers, announce, notify])

  // Título de la pestaña: se ve aunque la pestaña esté oculta
  const originalTitle = useRef<string | null>(null)
  const pending = Object.values(alerts).filter((a) => !a.acknowledged).length
  useEffect(() => {
    if (originalTitle.current === null) originalTitle.current = document.title
    document.title =
      pending > 0
        ? `● ${pending === 1 ? 'Patrón estable' : `${pending} patrones estables`} · ${originalTitle.current}`
        : originalTitle.current
  }, [pending])
  useEffect(
    () => () => {
      if (originalTitle.current !== null) document.title = originalTitle.current
    },
    []
  )

  const acknowledge = useCallback((patternId: string | number) => {
    const next = {
      ...alertsRef.current,
      [patternId]: { ...alertsRef.current[patternId], acknowledged: true }
    }
    alertsRef.current = next
    setAlerts(next)
  }, [])

  return { alerts, acknowledge, voice, desktop }
}
