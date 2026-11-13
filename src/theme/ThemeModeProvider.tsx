import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ThemeProvider } from '@mui/material'
import { darkPalette, lightPalette, tokenVar } from './designTokens'
import { darkTheme, lightTheme } from '../theme'

export type ColorMode = 'light' | 'dark'

const STORAGE_KEY = 'mm-color-scheme'
const GROUPS = ['brand', 'neutral', 'intent', 'accent'] as const

const systemMode = (): ColorMode =>
  window.matchMedia?.('(prefers-color-scheme: dark)')?.matches
    ? 'dark'
    : 'light'

const storedMode = (): ColorMode => {
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' ? stored : systemMode()
}

/** Escribe los tokens del modo en <html>; CSS variables + clase `dark` para Tailwind. */
export const applyColorMode = (mode: ColorMode) => {
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
applyColorMode(initialMode)

type ColorModeContextValue = {
  mode: ColorMode
  setMode: (mode: ColorMode) => void
  toggleMode: () => void
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

  useEffect(() => {
    applyColorMode(mode)
  }, [mode])

  const value = useMemo<ColorModeContextValue>(
    () => ({
      mode,
      setMode: (next) => {
        window.localStorage.setItem(STORAGE_KEY, next)
        setModeState(next)
      },
      toggleMode: () => {
        const next = mode === 'dark' ? 'light' : 'dark'
        window.localStorage.setItem(STORAGE_KEY, next)
        setModeState(next)
      }
    }),
    [mode]
  )

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={mode === 'dark' ? darkTheme : lightTheme}>
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}
