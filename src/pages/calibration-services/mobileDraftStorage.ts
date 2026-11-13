/**
 * Borrador del avance que el metrólogo captura en el celular (estado, notas y cantidad de cada ítem).
 *
 * Android cierra las pestañas en segundo plano y, con ellas, lo que no se guardó. El borrador se
 * conserva en el teléfono y solo se recupera si lo guardado en el servidor no cambió desde entonces
 * (`savedKey`): si otra persona o este mismo teléfono guardó, el borrador viejo se descarta.
 * Al cerrar sesión `clearLocalSession` vacía `localStorage`, así que no sobrevive a otra cuenta.
 */
import type { CalibrationServiceOperationalItemStatus } from 'src/types/calibrationService'

export type MobileDraft = {
  items: Record<number, CalibrationServiceOperationalItemStatus>
  notes: Record<number, string>
  executed: Record<number, number>
}

type StoredDraft = MobileDraft & { savedKey: string; savedAt: number }

const PREFIX = 'mm:calibration-mobile-draft:'
export const DRAFT_MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000

const storageKey = (serviceId: string | number) => `${PREFIX}${serviceId}`

export const saveMobileDraft = (
  serviceId: string | number,
  savedKey: string,
  draft: MobileDraft,
  now = Date.now()
) => {
  try {
    const value: StoredDraft = { ...draft, savedKey, savedAt: now }
    localStorage.setItem(storageKey(serviceId), JSON.stringify(value))
  } catch {
    // almacenamiento lleno o bloqueado: el borrador es una comodidad, no un requisito
  }
}

export const clearMobileDraft = (serviceId: string | number) => {
  try {
    localStorage.removeItem(storageKey(serviceId))
  } catch {
    // ver saveMobileDraft
  }
}

/** Devuelve el borrador solo si es de lo guardado actual y no está vencido; si no, lo borra. */
export const loadMobileDraft = (
  serviceId: string | number,
  savedKey: string,
  now = Date.now()
): MobileDraft | null => {
  try {
    const raw = localStorage.getItem(storageKey(serviceId))
    if (!raw) return null
    const stored = JSON.parse(raw) as Partial<StoredDraft>
    const valid =
      stored.savedKey === savedKey &&
      typeof stored.savedAt === 'number' &&
      now - stored.savedAt <= DRAFT_MAX_AGE_MS &&
      stored.items &&
      stored.notes &&
      stored.executed
    if (!valid) {
      clearMobileDraft(serviceId)
      return null
    }
    return {
      items: stored.items!,
      notes: stored.notes!,
      executed: stored.executed!
    }
  } catch {
    clearMobileDraft(serviceId)
    return null
  }
}
