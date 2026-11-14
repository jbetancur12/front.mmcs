// Colores de la marca y neutros del sistema de diseño: ÚNICA fuente de verdad.
// Los leen el tema de MUI (src/theme.tsx) y Tailwind (tailwind.config.js).
// Los nombres dicen la intención, no el valor: si la marca cambia, se cambia el
// valor aquí y los nombres siguen siendo ciertos.
//
// Los tokens de abajo son CSS variables (--mm-*) que ThemeModeProvider escribe
// en <html> según `lightPalette` o `darkPalette`. Así MUI, Tailwind y los
// estilos en línea cambian de modo sin recompilar nada.
// Plan y decisiones: plans/tema-de-colores/ (README, 02-diseno).

/** Turquesa de la marca: botones, encabezados, íconos activos y estados. */
export const lightPalette = {
  brand: {
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
    softer: '#f6fcfb',
    /** Panel de marca con texto encima (login y portadas). */
    panel: '#00695C',
    /** Texto e íconos sobre `panel`. */
    onPanel: '#E0F7F4'
  },
  /** Grises y superficies. */
  neutral: {
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
    surfaceHead: '#f3f4f6',
    /** Negro puro SOLO para sombras y velos: `withAlpha(neutral.black, 0.12)`. No es un color de texto (usa `text`). */
    black: '#000000'
  },
  /** Colores por significado (no decoración): acción, peligro, aviso, éxito, información. */
  intent: {
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
  },
  /** Violeta: categorías y estados que deben distinguirse de los azules (p. ej. "asignado", "subcontratado"). */
  accent: {
    main: '#7c3aed',
    /** Texto e íconos violeta sobre blanco. */
    ink: '#6d28d9',
    soft: '#f3e8ff'
  }
} as const

type Palette = {
  [G in keyof typeof lightPalette]: {
    [K in keyof (typeof lightPalette)[G]]: string
  }
}

/**
 * Modo oscuro: mismos nombres y misma intención, valores con contraste
 * suficiente sobre las superficies oscuras (mínimo AA para texto normal).
 */
export const darkPalette: Palette = {
  brand: {
    main: '#00BFA5',
    onMain: '#ffffff',
    hover: '#26C6B2',
    ink: '#5EEAD4',
    soft: '#123A36',
    softer: '#0F2A27',
    panel: '#0B3B36',
    onPanel: '#CCFBF1'
  },
  neutral: {
    text: '#F9FAFB',
    textBody: '#D1D5DB',
    textMuted: '#9CA3AF',
    textFaint: '#6B7280',
    border: '#374151',
    borderStrong: '#4B5563',
    surface: '#1F2937',
    surfaceAlt: '#111827',
    surfaceHead: '#263244',
    black: '#000000'
  },
  intent: {
    action: '#60A5FA',
    success: '#22C55E',
    warning: '#F59E0B',
    info: '#3B82F6',
    danger: '#DC2626',
    dangerInk: '#FCA5A5',
    dangerSoft: '#3B1414',
    warningInk: '#FCD34D',
    warningSoft: '#3A2A0A',
    successInk: '#86EFAC',
    successSoft: '#123420',
    infoInk: '#93C5FD',
    infoSoft: '#12233F'
  },
  accent: {
    main: '#A78BFA',
    ink: '#C4B5FD',
    soft: '#2A1F45'
  }
}

const kebab = (key: string) =>
  key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)

const toVars = <T extends Record<string, string>>(group: string, palette: T) =>
  Object.fromEntries(
    Object.keys(palette).map((key) => [key, `var(--mm-${group}-${kebab(key)})`])
  ) as { [K in keyof T]: string }

/** Tokens con los que se escribe el resto de la app (apuntan a CSS variables). */
export const brand = toVars('brand', lightPalette.brand)
export const neutral = toVars('neutral', lightPalette.neutral)
export const intent = toVars('intent', lightPalette.intent)
export const accent = toVars('accent', lightPalette.accent)

/** Nombre de la CSS var de un color, para escribirla en <html> desde el provider. */
export const tokenVar = (group: string, key: string) =>
  `--mm-${group}-${kebab(key)}`

/**
 * Un color de token con transparencia: `withAlpha(brand.main, 0.12)`.
 * Usa `color-mix` para aceptar tanto CSS variables (tokens) como hex sueltos.
 */
export const withAlpha = (color: string, opacity: number): string =>
  `color-mix(in srgb, ${color} ${opacity * 100}%, transparent)`

/**
 * Colores propios del certificado de la Academia (documento que se entrega al cliente): dorado de marcos y sellos
 * y grises de texto del diseño. No se usan en la interfaz; cambiarlos cambia el certificado.
 */
export const certificate = {
  gold: '#c9a84c',
  goldLight: '#e8c96a',
  text: '#222222',
  textBody: '#444444',
  textMuted: '#555555',
  textSoft: '#777777',
  textFaint: '#888888'
} as const

/** RESERVADO: degradado del banner de las fichas de detalle (esmeralda). No usar en otras pantallas. */
export const detail = {
  from: '#10b981',
  to: '#059669'
} as const
