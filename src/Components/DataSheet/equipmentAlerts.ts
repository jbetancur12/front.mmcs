import { useEffect, useState } from 'react'
import { useQuery } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'

export type EquipmentData = {
  id: number
  internalCode: string
  equipmentName: string
  brand?: string
  model?: string
  location?: string
  isCalibrationDueSoon: boolean
  isInspectionDueSoon: boolean
  calibrationDueDate?: string
  inspectionDueDate?: string
  calibrationDaysRemaining?: number | null
  inspectionDaysRemaining?: number | null
  priority?: 'high' | 'medium' | 'low'
}

/** Equipo con los días de su alerta más atrasada, para ordenar y priorizar. */
export type AlertRow = EquipmentData & { worstDays: number }

export type PriorityTone = 'error' | 'warning' | 'idle'

export const ALERTS_QUERY_KEY = ['equipment-alerts'] as const
const REFRESH_MS = 5 * 60 * 1000

/**
 * Alertas de calibración e inspección de la hoja de vida. La campana del
 * encabezado y la página de alertas comparten esta misma consulta.
 */
export const useEquipmentAlerts = (enabled = true) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<EquipmentData[]>(
    ALERTS_QUERY_KEY,
    async () => {
      const response = await axiosPrivate('/dataSheet/alerts')
      return response.data || []
    },
    {
      enabled,
      refetchInterval: REFRESH_MS,
      staleTime: 60 * 1000
    }
  )
}

/** Alertas con los días de la más atrasada, de más a menos vencida. */
export const toAlertRows = (equipments: EquipmentData[]): AlertRow[] =>
  equipments
    .map((equipment) => {
      const days = [
        equipment.isCalibrationDueSoon
          ? equipment.calibrationDaysRemaining
          : null,
        equipment.isInspectionDueSoon ? equipment.inspectionDaysRemaining : null
      ].filter((value): value is number => typeof value === 'number')
      return {
        ...equipment,
        worstDays: days.length > 0 ? Math.min(...days) : 0
      }
    })
    .sort((a, b) => a.worstDays - b.worstDays)

/**
 * Prioridad por antigüedad: la que manda el servidor es "alta" para todos los
 * vencidos y no ayuda a decidir qué atender primero.
 */
export const priorityOf = (
  days: number
): {
  tone: PriorityTone | 'warning'
  label: string
  bucket: 'year' | 'months' | 'recent' | 'soon'
} => {
  if (days >= 0) return { tone: 'warning', label: 'Por vencer', bucket: 'soon' }
  if (days < -365)
    return { tone: 'error', label: 'Más de 1 año vencido', bucket: 'year' }
  if (days < -90)
    return { tone: 'warning', label: '3 a 12 meses vencido', bucket: 'months' }
  return { tone: 'idle', label: 'Menos de 3 meses', bucket: 'recent' }
}

export const daysText = (days?: number | null) => {
  if (days === null || days === undefined) return ''
  if (days === 0) return 'vence hoy'
  const abs = Math.abs(days).toLocaleString('es-CO')
  const unit = Math.abs(days) === 1 ? 'día' : 'días'
  return days < 0 ? `hace ${abs} ${unit}` : `en ${abs} ${unit}`
}

// ---- Alertas ya vistas: lo "nuevo" es lo que no estaba cuando se abrió la página ----

const SEEN_EVENT = 'equipment-alerts-seen'
const seenKey = (email?: string | null) => `equipmentAlertsSeen:${email ?? ''}`

/** Una marca por alerta: una calibración nueva en un equipo ya visto también cuenta. */
export const alertSignatures = (equipment: EquipmentData): string[] => [
  ...(equipment.isCalibrationDueSoon ? [`${equipment.id}:c`] : []),
  ...(equipment.isInspectionDueSoon ? [`${equipment.id}:i`] : [])
]

const readSeen = (email?: string | null): Set<string> | null => {
  try {
    const raw = localStorage.getItem(seenKey(email))
    return raw ? new Set<string>(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

/** Guarda las alertas actuales como vistas y avisa a la campana. */
export const markAlertsSeen = (
  email: string | null | undefined,
  equipments: EquipmentData[]
) => {
  try {
    localStorage.setItem(
      seenKey(email),
      JSON.stringify(equipments.flatMap(alertSignatures))
    )
    window.dispatchEvent(new Event(SEEN_EVENT))
  } catch {
    // Sin almacenamiento, todo se considera nuevo: la campana sigue avisando
  }
}

/** Equipos con alguna alerta que el usuario todavía no ha visto en la página. */
export const useNewAlerts = (
  email: string | null | undefined,
  equipments: EquipmentData[]
) => {
  const [seen, setSeen] = useState(() => readSeen(email))

  useEffect(() => {
    const refresh = () => setSeen(readSeen(email))
    refresh()
    window.addEventListener(SEEN_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(SEEN_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [email])

  return equipments.filter((equipment) =>
    alertSignatures(equipment).some((signature) => !seen?.has(signature))
  )
}
