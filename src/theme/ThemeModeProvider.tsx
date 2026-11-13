import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ThemeProvider } from '@mui/material'
import { darkPalette, lightPalette, tokenVar } from './designTokens'
import { darkTheme, lightTheme } from '../theme'

/** Preferencia elegida; `system` sigue el tema del sistema operativo. */
export type ColorMode = 'light' | 'dark' | 'system'
export type ResolvedColorMode = 'light' | 'dark'

const STORAGE_KEY = 'mm-color-scheme'
const GROUPS = ['brand', 'neutral', 'intent', 'accent'] as const
const DARK_QUERY = '(prefers-color-scheme: dark)'

const systemPrefersDark = () =>
  window.matchMedia?.(DARK_QUERY)?.matches ?? false

const resolveMode = (mode: ColorMode): ResolvedColorMode =>
  mode === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : mode

const storedMode = (): ColorMode => {
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'dark' || stored === 'system' ? stored : 'light'
}

/** Escribe los tokens del modo en <html>; CSS variables + clase `dark` para Tailwind. */
export const applyColorMode = (mode: ResolvedColorMode) => {
  const palette = mode === 'dark' ? darkPalette : lightPalette
  const root = document.documentElement
  for (const group of GROUPS) {
    for (const [key, value] of Object.entries(palette[group])) {
      root.style.setProperty(tokenVar(group, key), value)
    }
  }
  root.classList.toggle('dark', mode === 'dark')
  root.style.colorScheme = mode
}

// Antes del primer render: evita el destello blanco si el modo guardado es oscuro.
const initialMode = storedMode()
applyColorMode(resolveMode(initialMode))

type ColorModeContextValue = {
  /** Preferencia elegida (incluye `system`). */
  mode: ColorMode
  /** Modo realmente aplicado (`light` o `dark`). */
  resolvedMode: ResolvedColorMode
  setMode: (mode: ColorMode) => void
}

const ColorModeContext = createContext<ColorModeContextValue | null>(null)

export const useColorMode = (): ColorModeContextValue => {
  const context = useContext(ColorModeContext)
  if (!context) {
    throw new Error('useColorMode debe usarse dentro de ThemeModeProvider')
  }
  return context
}

export const ThemeModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<ColorMode>(initialMode)
  const [systemDark, setSystemDark] = useState(systemPrefersDark)

  const resolvedMode: ResolvedColorMode =
    mode === 'system' ? (systemDark ? 'dark' : 'light') : mode

  useEffect(() => {
    applyColorMode(resolvedMode)
  }, [resolvedMode])

  // Con `system`, seguir en vivo los cambios del tema del sistema operativo.
  useEffect(() => {
    if (mode !== 'system') return
    const media = window.matchMedia?.(DARK_QUERY)
    if (!media) return
    const onChange = (event: MediaQueryListEvent) =>
      setSystemDark(event.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [mode])

  const value = useMemo<ColorModeContextValue>(
    () => ({
      mode,
      resolvedMode,
      setMode: (next) => {
        window.localStorage.setItem(STORAGE_KEY, next)
        setModeState(next)
      }
    }),
    [mode, resolvedMode]
  )

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={resolvedMode === 'dark' ? darkTheme : lightTheme}>
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}
