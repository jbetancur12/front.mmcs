// src/Components/LaboratoryMonitor/stability.ts
import { Pattern, Sensor } from './types'

export interface StabilityAlertState {
  count: number // Cuántas veces se ha notificado por voz
  timestamp: number // Cuándo fue la última notificación
  acknowledged: boolean // Si el usuario ya la reconoció
}

export const MAX_VOICE_ALERTS = 2 // Máximo de avisos de voz por patrón
export const REMINDER_INTERVAL_MS = 60 * 1000

const MIN_SILENCE_SECONDS = 120 // Silencio mínimo para marcar "sin señal"
const SILENCE_INTERVALS = 3 // ...o 3 intervalos de muestreo, lo que sea mayor

const seenAt = (sensor: Sensor): number | null => {
  if (!sensor.lastSeen) return null
  const time = new Date(sensor.lastSeen).getTime()
  return Number.isNaN(time) ? null : time
}

/**
 * Sensores del patrón que llevan mucho más callados que el más reciente.
 * Se compara contra el sensor más reciente del patrón (no contra el reloj
 * del navegador) para que un reloj desajustado no marque todo sin señal.
 */
export const getStaleSensorIds = (pattern: Pattern): Set<string> => {
  const stale = new Set<string>()
  const sensors = pattern?.sensors || []
  const times = sensors.map(seenAt)
  const newest = Math.max(...times.map((t) => t ?? -Infinity))
  if (!Number.isFinite(newest)) return stale // Ninguno ha reportado todavía
  const limitMs =
    Math.max(
      (pattern.samplingRateSeconds || 60) * SILENCE_INTERVALS,
      MIN_SILENCE_SECONDS
    ) * 1000
  sensors.forEach((sensor, index) => {
    const time = times[index]
    if (time === null || newest - time > limitMs) stale.add(sensor.id)
  })
  return stale
}

export const isPatternStable = (pattern: Pattern): boolean => {
  if (!pattern || !pattern.sensors || pattern.sensors.length === 0) {
    return false // No es estable si no tiene sensores
  }
  // Un sensor sin señal conserva su último estado: no cuenta como estable
  const stale = getStaleSensorIds(pattern)
  // 'every' se asegura de que TODOS los sensores del patrón cumplan la condición
  return pattern.sensors.every((sensor) => {
    if (stale.has(sensor.id)) return false
    const status = sensor.stabilityStatus || {
      temperatureStable: false,
      humidityStable: false
    }
    if (sensor.type === 'temperature_humidity') {
      return status.temperatureStable && status.humidityStable
    }
    if (sensor.type === 'temperature_only') {
      return status.temperatureStable
    }
    if (sensor.type === 'humidity_only') {
      return status.humidityStable
    }
    return false // Por defecto, si el tipo no es conocido, no es estable
  })
}

export interface StabilityEvaluation {
  alerts: Record<string, StabilityAlertState>
  messages: string[]
  changed: boolean
}

/**
 * Decide qué avisar según el estado actual de los patrones.
 * - Patrón estable sin aviso previo: avisa (también al abrir la pantalla
 *   con el patrón ya estable, no solo al cambiar de estado).
 * - Sigue estable y sin reconocer: repite cada minuto, hasta MAX_VOICE_ALERTS.
 * - Deja de ser estable: borra su aviso para que vuelva a avisar la próxima vez.
 */
export const evaluateStabilityAlerts = (
  patterns: Pattern[],
  current: Record<string, StabilityAlertState>,
  chamberName: string,
  now: number
): StabilityEvaluation => {
  const alerts = { ...current }
  const messages: string[] = []
  let changed = false

  patterns.forEach((pattern) => {
    const existing = alerts[pattern.id]
    if (!isPatternStable(pattern)) {
      if (existing) {
        delete alerts[pattern.id]
        changed = true
      }
      return
    }
    if (!existing) {
      messages.push(
        `Atención. El patrón ${pattern.name} en la cámara ${chamberName} ha alcanzado la estabilidad.`
      )
      alerts[pattern.id] = { count: 1, timestamp: now, acknowledged: false }
      changed = true
      return
    }
    if (
      !existing.acknowledged &&
      existing.count < MAX_VOICE_ALERTS &&
      now - existing.timestamp > REMINDER_INTERVAL_MS
    ) {
      messages.push(
        `Recordatorio: El patrón ${pattern.name} se mantiene estable.`
      )
      alerts[pattern.id] = {
        ...existing,
        count: existing.count + 1,
        timestamp: now
      }
      changed = true
    }
  })

  return { alerts: changed ? alerts : current, messages, changed }
}
