// Paleta del sistema de diseño: de hex a token. Compartida por migrate-colors.mjs y check-colors.mjs.
// Fuente de los valores: src/theme/designTokens.ts. Plan: plans/tema-de-colores/.
//
// Si un token cambia de valor en designTokens.ts NO hace falta tocar este archivo para el tema (React lee los
// tokens), pero sí para que el trinquete detecte el nuevo hex: agrégalo aquí.

/** Núcleo: los colores exactos del sistema de diseño. */
const CORE = {
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

/**
 * Unificación por familias (decisión del 2026-11-02: "unificar todo"). Cada color suelto que no era del sistema se
 * lleva al token de su familia (neutro, marca, éxito, peligro, aviso, información) según su claridad: claro -> *Soft,
 * oscuro -> *Ink, intermedio -> el tono medio. El número es cuántos usos tenía al generar la tabla.
 * Generada con una clasificación por matiz y claridad; revisar el diff después de migrar.
 */
const UNIFIED = {
  '#0f766e': 'brand.ink', // 9
  '#0d4a3b': 'brand.ink', // 4
  '#0b3532': 'brand.ink', // 2
  '#00a58e': 'brand.ink', // 1
  '#5eead4': 'brand.main', // 2
  '#0891b2': 'brand.main', // 2
  '#9de4f0': 'brand.main', // 1
  '#8fddd1': 'brand.main', // 1
  '#80cbc4': 'brand.main', // 1
  '#506f69': 'brand.main', // 1
  '#4dc8e0': 'brand.main', // 1
  '#26c6da': 'brand.main', // 1
  '#17a2b8': 'brand.main', // 1
  '#14b8a6': 'brand.main', // 1
  '#00c49f': 'brand.main', // 1
  '#e0f2f1': 'brand.soft', // 3
  '#b2ebe3': 'brand.soft', // 2
  '#e6f7f5': 'brand.soft', // 1
  '#e3f6f3': 'brand.soft', // 1
  '#cff3ee': 'brand.soft', // 1
  '#c9efe9': 'brand.soft', // 1
  '#c9eee8': 'brand.soft', // 1
  '#b2ebe2': 'brand.soft', // 1
  '#b2dfdb': 'brand.soft', // 1
  '#f0fbf9': 'brand.softer', // 5
  '#f4fcfa': 'brand.softer', // 2
  '#f3fbfa': 'brand.softer', // 1
  '#f44336': 'intent.danger', // 13
  '#ef4444': 'intent.danger', // 13
  '#d32f2f': 'intent.danger', // 9
  '#ff0000': 'intent.danger', // 3
  '#e65100': 'intent.danger', // 3
  '#c62828': 'intent.danger', // 3
  '#ff5722': 'intent.danger', // 2
  '#ff8042': 'intent.danger', // 1
  '#fb7185': 'intent.danger', // 1
  '#ef5350': 'intent.danger', // 1
  '#ea580c': 'intent.danger', // 1
  '#e53e3e': 'intent.danger', // 1
  '#dc3545': 'intent.danger', // 1
  '#d84315': 'intent.danger', // 1
  '#c2410c': 'intent.dangerInk', // 8
  '#be123c': 'intent.dangerInk', // 1
  '#7f1d1d': 'intent.dangerInk', // 1
  '#78350f': 'intent.dangerInk', // 1
  '#5d4037': 'intent.dangerInk', // 1
  '#fef2f2': 'intent.dangerSoft', // 17
  '#ffebee': 'intent.dangerSoft', // 3
  '#fecaca': 'intent.dangerSoft', // 2
  '#fca5a5': 'intent.dangerSoft', // 2
  '#ffe4e6': 'intent.dangerSoft', // 1
  '#fef0f0': 'intent.dangerSoft', // 1
  '#3b82f6': 'intent.info', // 26
  '#2196f3': 'intent.info', // 7
  '#8884d8': 'intent.info', // 5
  '#1976d2': 'intent.info', // 3
  '#0ea5e9': 'intent.info', // 3
  '#1d4ed8': 'intent.info', // 2
  '#6366f1': 'intent.info', // 1
  '#4f46e5': 'intent.info', // 1
  '#42a5f5': 'intent.info', // 1
  '#0088fe': 'intent.info', // 1
  '#1e40af': 'intent.infoInk', // 3
  '#0369a1': 'intent.infoInk', // 3
  '#0d47a1': 'intent.infoInk', // 2
  '#0284c7': 'intent.infoInk', // 2
  '#183153': 'intent.infoInk', // 1
  '#0b1f5c': 'intent.infoInk', // 1
  '#eff6ff': 'intent.infoSoft', // 11
  '#f0f9ff': 'intent.infoSoft', // 3
  '#bfdbfe': 'intent.infoSoft', // 3
  '#dbeafe': 'intent.infoSoft', // 2
  '#f5f3ff': 'intent.infoSoft', // 1
  '#eef6ff': 'intent.infoSoft', // 1
  '#4caf50': 'intent.success', // 6
  '#9cf08b': 'intent.success', // 3
  '#86c88a': 'intent.success', // 3
  '#7bff7f': 'intent.success', // 3
  '#bada55': 'intent.success', // 2
  '#82ca9d': 'intent.success', // 2
  '#6dc662': 'intent.success', // 2
  '#4a9642': 'intent.success', // 2
  '#a5d6a7': 'intent.success', // 1
  '#66bb6a': 'intent.success', // 1
  '#5ed65a': 'intent.success', // 1
  '#4ade80': 'intent.success', // 1
  '#3ab554': 'intent.success', // 1
  '#33cf4d': 'intent.success', // 1
  '#00a651': 'intent.successInk', // 34
  '#047857': 'intent.successInk', // 16
  '#0d4a1c': 'intent.successInk', // 14
  '#00bf75': 'intent.successInk', // 13
  '#1a6b2a': 'intent.successInk', // 11
  '#2d9e45': 'intent.successInk', // 10
  '#166534': 'intent.successInk', // 8
  '#008f4f': 'intent.successInk', // 7
  '#27672a': 'intent.successInk', // 6
  '#0d5a3d': 'intent.successInk', // 4
  '#065f46': 'intent.successInk', // 4
  '#2d4a27': 'intent.successInk', // 1
  '#28a745': 'intent.successInk', // 1
  '#1f2b24': 'intent.successInk', // 1
  '#17664a': 'intent.successInk', // 1
  '#15915d': 'intent.successInk', // 1
  '#15803d': 'intent.successInk', // 1
  '#102b22': 'intent.successInk', // 1
  '#0d6b49': 'intent.successInk', // 1
  '#e8f7ef': 'intent.successSoft', // 17
  '#f0fdf4': 'intent.successSoft', // 14
  '#ecfdf5': 'intent.successSoft', // 8
  '#dcfce7': 'intent.successSoft', // 6
  '#bbf7d0': 'intent.successSoft', // 5
  '#dbeedb': 'intent.successSoft', // 4
  '#d1fae5': 'intent.successSoft', // 2
  '#e8f5e8': 'intent.successSoft', // 1
  '#dbe4db': 'intent.successSoft', // 1
  '#a7f3d0': 'intent.successSoft', // 1
  '#d97706': 'intent.warning', // 23
  '#f59e0b': 'intent.warning', // 20
  '#ff9800': 'intent.warning', // 7
  '#fde68a': 'intent.warning', // 4
  '#ffb74d': 'intent.warning', // 3
  '#ffc107': 'intent.warning', // 2
  '#fcd34d': 'intent.warning', // 2
  '#ffbb28': 'intent.warning', // 1
  '#fdba74': 'intent.warning', // 1
  '#f5a623': 'intent.warning', // 1
  '#f57c00': 'intent.warning', // 1
  '#ef6c00': 'intent.warning', // 1
  '#ed6c02': 'intent.warning', // 1
  '#b8a87a': 'intent.warning', // 1
  '#92400e': 'intent.warningInk', // 9
  '#8a5a00': 'intent.warningInk', // 1
  '#fef3c7': 'intent.warningSoft', // 12
  '#fff7ed': 'intent.warningSoft', // 9
  '#fffbeb': 'intent.warningSoft', // 5
  '#fff8e1': 'intent.warningSoft', // 3
  '#fed7aa': 'intent.warningSoft', // 3
  '#fff8ec': 'intent.warningSoft', // 1
  '#fff7ea': 'intent.warningSoft', // 1
  '#f0eeea': 'intent.warningSoft', // 1
  '#e2e8f0': 'neutral.border', // 11
  '#e8eaed': 'neutral.border', // 2
  '#e9ecef': 'neutral.border', // 1
  '#e9e9ea': 'neutral.border', // 1
  '#dbe7f2': 'neutral.border', // 1
  '#dbe3ef': 'neutral.border', // 1
  '#d1d5db': 'neutral.borderStrong', // 47
  '#cbd5e1': 'neutral.borderStrong', // 12
  '#e0e0e0': 'neutral.borderStrong', // 11
  '#cccccc': 'neutral.borderStrong', // 1
  '#f8fafc': 'neutral.surfaceAlt', // 28
  '#fafafa': 'neutral.surfaceAlt', // 24
  '#f8fbff': 'neutral.surfaceAlt', // 4
  '#f8fafb': 'neutral.surfaceAlt', // 4
  '#f8f9fa': 'neutral.surfaceAlt', // 3
  '#fff7f7': 'neutral.surfaceAlt', // 1
  '#fdfcf7': 'neutral.surfaceAlt', // 1
  '#fcfcfd': 'neutral.surfaceAlt', // 1
  '#fbfffc': 'neutral.surfaceAlt', // 1
  '#fbfdfb': 'neutral.surfaceAlt', // 1
  '#faf5ff': 'neutral.surfaceAlt', // 1
  '#f8fbfc': 'neutral.surfaceAlt', // 1
  '#f8fbf9': 'neutral.surfaceAlt', // 1
  '#f5f5f5': 'neutral.surfaceHead', // 24
  '#f1f5f9': 'neutral.surfaceHead', // 8
  '#fdfaf4': 'neutral.surfaceHead', // 2
  '#f0f4f8': 'neutral.surfaceHead', // 2
  '#f0f2f5': 'neutral.surfaceHead', // 2
  '#f0f0f0': 'neutral.surfaceHead', // 2
  '#eef2f7': 'neutral.surfaceHead', // 2
  '#f4fbf7': 'neutral.surfaceHead', // 1
  '#f1f3f4': 'neutral.surfaceHead', // 1
  '#eef9f1': 'neutral.surfaceHead', // 1
  '#eef7f2': 'neutral.surfaceHead', // 1
  '#eef6f1': 'neutral.surfaceHead', // 1
  '#ecf6f5': 'neutral.surfaceHead', // 1
  '#0f172a': 'neutral.text', // 45
  '#1f2937': 'neutral.text', // 10
  '#0f1117': 'neutral.text', // 5
  '#1a1a18': 'neutral.text', // 3
  '#000000': 'neutral.text', // 3
  '#1a1a2e': 'neutral.text', // 2
  '#272727': 'neutral.text', // 1
  '#202020': 'neutral.text', // 1
  '#121212': 'neutral.text', // 1
  '#475569': 'neutral.textBody', // 15
  '#334155': 'neutral.textBody', // 13
  '#455a64': 'neutral.textBody', // 1
  '#424242': 'neutral.textBody', // 1
  '#39393d': 'neutral.textBody', // 1
  '#333333': 'neutral.textBody', // 1
  '#1f3958': 'neutral.textBody', // 1
  '#9ca3af': 'neutral.textFaint', // 44
  '#94a3b8': 'neutral.textFaint', // 8
  '#b0b7c3': 'neutral.textFaint', // 2
  '#bdbdbd': 'neutral.textFaint', // 1
  '#9e9e9e': 'neutral.textFaint', // 1
  '#64748b': 'neutral.textMuted', // 20
  '#6b6b72': 'neutral.textMuted', // 4
  '#808080': 'neutral.textMuted', // 2
  '#757575': 'neutral.textMuted', // 2
  '#666666': 'neutral.textMuted', // 1
  '#546e7a': 'neutral.textMuted' // 1
}

/** Violetas: familia propia `accent` (decisión 2026-11-06). Van después de UNIFIED para tener prioridad. */
const ACCENT = {
  '#7c3aed': 'accent.main',
  '#8b5cf6': 'accent.main',
  '#6d28d9': 'accent.ink',
  '#7e22ce': 'accent.ink',
  '#7b1fa2': 'accent.ink',
  '#6a1b9a': 'accent.ink',
  '#f3e8ff': 'accent.soft',
  '#e9d5ff': 'accent.soft',
  '#faf5ff': 'accent.soft'
}

/** Hex (en minúscula) que se migran solos a un token. */
export const PALETTE = { ...CORE, ...UNIFIED, ...ACCENT }

/**
 * Documentos impresos que NO se migran solos: tienen identidad propia (el verde claro de los formatos FOGMMCS en los
 * PDF) y hay una propuesta de diseño de PDF pendiente que los tratará juntos (plans/diseno-pdf). El trinquete sí los
 * cuenta. Las gráficas y los mapas SÍ se migran: sus series quedan en tokens distintos entre sí.
 */
export const EXCLUDED_FROM_AUTO = [
  'src/Components/DataSheet/DataSheetPDF.tsx',
  'src/Components/Fleet/VehicleDataSheetPreview.tsx'
]

/** Colores de documentos: el dorado del certificado de la Academia es contenido del documento, no de la interfaz. */
export const NO_FAMILY = ['#c9a84c', '#e8c96a']

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
