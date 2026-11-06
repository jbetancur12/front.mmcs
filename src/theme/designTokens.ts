// Colores de la marca y neutros del sistema de diseño: ÚNICA fuente de verdad.
// Los leen el tema de MUI (src/theme.tsx) y Tailwind (tailwind.config.js).
// Los nombres dicen la intención, no el valor: si la marca cambia, se cambia el
// valor aquí y los nombres siguen siendo ciertos.
// Plan y decisiones: plans/tema-de-colores/ (README, 02-diseno).

/** Turquesa de la marca: botones, encabezados, íconos activos y estados. */
export const brand = {
  /** Botón principal, encabezados, íconos activos. */
  main: '#00BFA5',
  /** Texto sobre `main`. Contraste 2,33:1; se mantiene por decisión de marca (ver README). */
  onMain: '#ffffff',
  /** Hover del botón principal, foco y borde activo. Como texto sobre blanco da 4,32:1: para texto usa `ink`. */
  hover: '#00897B',
  /** Texto e íconos turquesa sobre blanco (6,61:1). */
  ink: '#00695C',
  /** Fondo suave: chips, filtros activos. */
  soft: '#E0F7F4',
  /** Hover de fila de tabla (turquesa al 4 %). */
  softer: '#f6fcfb'
} as const

/** Grises y superficies. */
export const neutral = {
  /** Títulos y texto fuerte (17,74:1 sobre blanco). */
  text: '#111827',
  /** Texto de cuerpo y de apoyo (10,31:1). Absorbe el antiguo #4b5563. */
  textBody: '#374151',
  /** Pistas y leyendas (4,83:1 sobre blanco). NO sobre `surfaceHead` (4,39:1). */
  textMuted: '#6b7280',
  /** Íconos y texto desactivado o decorativo (2,5:1: no usar para texto que haya que leer). */
  textFaint: '#9ca3af',
  /** Bordes de tarjetas y tablas. */
  border: '#e5e7eb',
  /** Bordes y divisores más marcados (controles, zonas de arrastre). */
  borderStrong: '#d1d5db',
  /** Tarjetas y diálogos. */
  surface: '#ffffff',
  /** Fondo de página y barras de herramientas. */
  surfaceAlt: '#f9fafb',
  /** Encabezados de tabla. */
  surfaceHead: '#f3f4f6'
} as const

/** Colores por significado (no decoración): acción, peligro, aviso, éxito, información. */
export const intent = {
  /** Acción "editar". */
  action: '#2563eb',
  /** Tonos medios por significado: íconos, bordes de acento y rellenos. Para texto usa los `*Ink`. */
  success: '#22c55e',
  warning: '#f59e0b',
  info: '#3b82f6',
  danger: '#dc2626',
  dangerInk: '#b91c1c',
  dangerSoft: '#fee2e2',
  warningInk: '#b45309',
  warningSoft: '#fff3e0',
  successInk: '#2e7d32',
  successSoft: '#e8f5e9',
  infoInk: '#1565c0',
  infoSoft: '#e3f2fd'
} as const

/** RESERVADO: degradado del banner de las fichas de detalle (esmeralda). No usar en otras pantallas. */
export const detail = {
  from: '#10b981',
  to: '#059669'
} as const
