/**
 * Uso de las pantallas por persona, para que la búsqueda rápida (Ctrl+K)
 * muestre primero lo que más abre y lo último que abrió. Se guarda en el
 * navegador, por usuario; si no hay almacenamiento, simplemente no hay sugerencias.
 */
interface Visit {
  count: number
  last: number
}

type Usage = Record<string, Visit>

const KEY_PREFIX = 'quick-search-usage:'
const MAX_TRACKED = 60
const DAY_MS = 24 * 60 * 60 * 1000
/** Cada 14 días una visita vale la mitad: gana lo que se usa ahora. */
const HALF_LIFE_DAYS = 14
/** Una sola visita no hace "más usada" a una pantalla. */
const MIN_VISITS_FREQUENT = 2

const storageKey = (userKey: string) => `${KEY_PREFIX}${userKey}`

const read = (userKey: string): Usage => {
  try {
    const raw = window.localStorage.getItem(storageKey(userKey))
    const parsed: unknown = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? (parsed as Usage) : {}
  } catch {
    return {}
  }
}

const weight = (visit: Visit, now: number) =>
  visit.count * Math.pow(0.5, (now - visit.last) / DAY_MS / HALF_LIFE_DAYS)

export const recordVisit = (
  userKey: string,
  path: string,
  now = Date.now()
) => {
  try {
    const usage = read(userKey)
    const previous = usage[path]
    usage[path] = { count: (previous?.count ?? 0) + 1, last: now }

    const kept = Object.entries(usage)
      .sort(([, a], [, b]) => weight(b, now) - weight(a, now))
      .slice(0, MAX_TRACKED)
    window.localStorage.setItem(
      storageKey(userKey),
      JSON.stringify(Object.fromEntries(kept))
    )
  } catch {
    // Sin almacenamiento no se registra el uso.
  }
}

/** Las pantallas que más abre, de más a menos, sin las de `exclude`. */
export const frequentPaths = (
  userKey: string,
  limit: number,
  exclude: string[] = [],
  now = Date.now()
) =>
  Object.entries(read(userKey))
    .filter(
      ([path, visit]) =>
        visit.count >= MIN_VISITS_FREQUENT && !exclude.includes(path)
    )
    .sort(([, a], [, b]) => weight(b, now) - weight(a, now))
    .slice(0, limit)
    .map(([path]) => path)

/** Las últimas que abrió, de la más nueva a la más vieja, sin las de `exclude`. */
export const recentPaths = (
  userKey: string,
  limit: number,
  exclude: string[] = []
) =>
  Object.entries(read(userKey))
    .filter(([path]) => !exclude.includes(path))
    .sort(([, a], [, b]) => b.last - a.last)
    .slice(0, limit)
    .map(([path]) => path)
