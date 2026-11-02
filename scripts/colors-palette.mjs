// Paleta del sistema de diseño: de hex a token. Compartida por migrate-colors.mjs y check-colors.mjs.
// Fuente de los valores: src/theme/designTokens.ts. Plan: plans/tema-de-colores/.
//
// Si un token cambia de valor en designTokens.ts NO hace falta tocar este archivo para el tema (React lee los
// tokens), pero sí para que el trinquete detecte el nuevo hex: agrégalo aquí.

/** Hex (en minúscula) que se migran solos a un token. */
export const PALETTE = {
  // Marca
  '#00bfa5': 'brand.main',
  '#00897b': 'brand.hover',
  '#00acc1': 'brand.hover', // antes otro hover (cian); decisión 2026-11-02: un solo hover
  '#00695c': 'brand.ink',
  '#e0f7f4': 'brand.soft',
  '#f6fcfb': 'brand.softer',
  // Neutros
  '#111827': 'neutral.text',
  '#374151': 'neutral.textBody',
  '#4b5563': 'neutral.textBody', // antes un gris más claro; decisión 2026-11-02: se unifica
  '#6b7280': 'neutral.textMuted',
  '#e5e7eb': 'neutral.border',
  '#f9fafb': 'neutral.surfaceAlt',
  '#f3f4f6': 'neutral.surfaceHead',
  // Por significado
  '#2563eb': 'intent.action',
  '#dc2626': 'intent.danger',
  '#b91c1c': 'intent.dangerInk',
  '#fee2e2': 'intent.dangerSoft',
  '#b45309': 'intent.warningInk',
  '#fff3e0': 'intent.warningSoft',
  '#2e7d32': 'intent.successInk',
  '#e8f5e9': 'intent.successSoft',
  '#1565c0': 'intent.infoInk',
  '#e3f2fd': 'intent.infoSoft'
}

/** Hex reservados: el trinquete los cuenta, pero se migran a mano (dependen del contexto). */
export const RESERVED = {
  '#10b981': 'detail.from', // esmeralda: solo banner de fichas de detalle
  '#059669': 'detail.to'
}

/** Blanco: solo se migra como fondo (bgcolor / backgroundColor / background), donde equivale a neutral.surface. */
export const WHITE_BACKGROUND_TOKEN = 'neutral.surface'
export const WHITE_HEX = ['#ffffff', '#fff']

/** Hex que el trinquete vigila (los de la paleta y los reservados). */
export const WATCHED = { ...PALETTE, ...RESERVED }

export const HEX_RE = /#[0-9a-fA-F]{6}\b/g
