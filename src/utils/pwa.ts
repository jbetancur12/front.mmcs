import { useSyncExternalStore } from 'react'
import { registerSW } from 'virtual:pwa-register'

/**
 * Registro del service worker (PWA). La app se guarda en el teléfono para abrir rápido y
 * sobrevivir a un corte de señal; los datos de la API NO se guardan (siempre van a la red).
 *
 * Una versión nueva se instala en segundo plano y espera: no recarga sola para no perder
 * lo que la persona esté capturando. `NewVersionBanner` ofrece "Actualizar" (`applyUpdate`).
 */
type Listener = () => void

let needRefresh = false
let registration: ServiceWorkerRegistration | undefined
let updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined
const listeners = new Set<Listener>()

const emit = () => listeners.forEach((l) => l())

export const initPwa = () => {
  // En desarrollo no hay service worker: cachearía módulos de Vite y estorbaría al recargar
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      needRefresh = true
      emit()
    },
    onRegisteredSW(_url, reg) {
      registration = reg
    }
  })
}

/** Pide al navegador buscar un service worker nuevo (se llama cuando `version.json` cambió). */
export const checkForPwaUpdate = async () => {
  try {
    await registration?.update()
  } catch {
    // sin red: se reintenta en el siguiente aviso
  }
}

/** Activa la versión nueva y recarga. Sin service worker (dev), recarga normal. */
export const applyUpdate = async () => {
  if (updateSW && needRefresh) {
    await updateSW(true)
    return
  }
  await checkForPwaUpdate()
  if (updateSW && needRefresh) {
    await updateSW(true)
    return
  }
  window.location.reload()
}

const subscribe = (l: Listener) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

/** true cuando hay una versión nueva ya descargada, esperando a activarse. */
export const usePwaNeedRefresh = () =>
  useSyncExternalStore(subscribe, () => needRefresh)
