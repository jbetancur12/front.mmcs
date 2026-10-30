import { TypeAliasEntry } from 'src/types/customerIndicators'

const STOPWORDS = new Set([
  'de',
  'del',
  'la',
  'el',
  'los',
  'las',
  'y',
  'e',
  'o',
  'con',
  'para',
  'en',
  'a',
  'por'
])

const stripAccents = (value: string) =>
  value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Palabras comparables de un nombre: sin tildes, sin "calibración de", sin conectores y en singular. */
export const tokenize = (name: string): Set<string> => {
  const words = stripAccents(name)
    .replace(/^calibracion (de |del )/, '')
    .split(/[^a-z0-9]+/)
    .filter((word) => word && !STOPWORDS.has(word))
    .map((word) =>
      word.length > 3 && word.endsWith('s') ? word.slice(0, -1) : word
    )
  return new Set(words)
}

/** 0 a 1: qué tanto se parecen dos nombres. Si uno contiene al otro, cuenta casi como igual. */
export const similarity = (a: string, b: string): number => {
  const setA = tokenize(a)
  const setB = tokenize(b)
  if (!setA.size || !setB.size) return 0
  let shared = 0
  setA.forEach((word) => {
    if (setB.has(word)) shared += 1
  })
  if (!shared) return 0
  const smallest = Math.min(setA.size, setB.size)
  const jaccard = shared / (setA.size + setB.size - shared)
  const containment = (shared / smallest) * (smallest >= 2 ? 0.9 : 0.7)
  return Math.max(jaccard, containment)
}

export interface SuggestionOption {
  key: string
  label: string
}

export interface TypeSuggestion<T extends SuggestionOption> {
  option: T
  /** `alias`: se parece a un nombre ya asociado antes; `texto`: se parece al nombre del equipo con certificados. */
  reason: 'alias' | 'texto'
}

// Parecido mínimo para proponer algo: más vale no sugerir que sugerir un tipo equivocado, porque una asociación
// vale para todos los clientes.
const ALIAS_MIN = 0.8
const TEXT_MIN = 0.75
const TIE_MARGIN = 0.05

/**
 * Propone el tipo de certificado al que equivale un nombre de la ODS. Primero mira las asociaciones ya hechas y
 * después el parecido con los equipos que tienen certificados. Sin un candidato claro devuelve `null`.
 */
export const suggestType = <T extends SuggestionOption>(
  sourceLabel: string,
  options: T[],
  aliases: TypeAliasEntry[]
): TypeSuggestion<T> | null => {
  let bestAlias: { option: T; score: number } | null = null
  for (const alias of aliases) {
    if (alias.notMetrological || !alias.targetName) continue
    const score = similarity(sourceLabel, alias.sourceName)
    if (score < ALIAS_MIN || (bestAlias && score <= bestAlias.score)) continue
    const option = options.find((item) => item.key === alias.targetName)
    if (option) bestAlias = { option, score }
  }
  if (bestAlias) return { option: bestAlias.option, reason: 'alias' }

  const ranked = options
    .map((option) => ({ option, score: similarity(sourceLabel, option.label) }))
    .filter((entry) => entry.score >= TEXT_MIN)
    .sort((a, b) => b.score - a.score)
  if (!ranked.length) return null
  // Dos candidatos casi iguales: es ambiguo, que decida la persona
  if (ranked[1] && ranked[0].score - ranked[1].score < TIE_MARGIN) return null
  return { option: ranked[0].option, reason: 'texto' }
}
