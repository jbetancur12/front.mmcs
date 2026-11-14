import { map } from 'nanostores'

/**
 * Interruptores de funciones (panel de desarrollador, Ajustes › Funciones). La fuente de verdad es el backend
 * (`api.mmcs/services/featureFlags.service.js`); este store guarda el último estado conocido para decidir menús y
 * rutas. Las claves y los valores por defecto deben coincidir con el catálogo del backend.
 */
export type FeatureFlagKey = 'release_certificates' | 'library'

export const FEATURE_FLAG_DEFAULTS: Record<FeatureFlagKey, boolean> = {
  release_certificates: false,
  library: true
}

const STORAGE_KEY = 'featureFlags'

const readStored = (): Partial<Record<FeatureFlagKey, boolean>> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw
      ? (JSON.parse(raw) as Partial<Record<FeatureFlagKey, boolean>>)
      : {}
  } catch {
    return {}
  }
}

/** Arranca con el último estado conocido (evita que el menú parpadee al recargar) y se corrige al llegar el del API. */
export const featureFlagsStore = map<Record<FeatureFlagKey, boolean>>({
  ...FEATURE_FLAG_DEFAULTS,
  ...readStored()
})

/** `true` cuando el estado ya llegó del API en esta sesión de la página. */
export const featureFlagsLoaded = map<{ loaded: boolean }>({ loaded: false })

export const setFeatureFlags = (
  flags: Partial<Record<FeatureFlagKey, boolean>>
) => {
  const next = { ...featureFlagsStore.get(), ...flags }
  featureFlagsStore.set(next)
  featureFlagsLoaded.set({ loaded: true })
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // sin almacenamiento: el estado sigue en memoria
  }
}

/** Lectura puntual para código que no es un componente. En componentes usa `useFeature`. */
export const isFeatureOn = (key: FeatureFlagKey) => featureFlagsStore.get()[key]
