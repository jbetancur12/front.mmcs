import { useHotkeys } from 'react-hotkeys-hook'
import { useCallback } from 'react'

interface KeyboardShortcutsOptions {
  onShowHelp?: () => void
  onEditTicket?: () => void
  onAddComment?: () => void
  onCloseModal?: () => void
  enabled?: boolean
}

export const useKeyboardShortcuts = ({
  onShowHelp,
  onEditTicket,
  onAddComment,
  onCloseModal,
  enabled = true
}: KeyboardShortcutsOptions) => {
  const options = { enabled }

  // Atajos globales (Ctrl+K/N/F/R se quitaron: chocan con la búsqueda rápida global y con el navegador)
  useHotkeys(
    'shift+/',
    useCallback(
      (e) => {
        e.preventDefault()
        onShowHelp?.()
      },
      [onShowHelp]
    ),
    options
  )

  useHotkeys(
    'escape',
    useCallback(
      (e) => {
        e.preventDefault()
        onCloseModal?.()
      },
      [onCloseModal]
    ),
    options
  )

  // Context-specific shortcuts (when viewing a ticket)
  useHotkeys(
    'e',
    useCallback(
      (e) => {
        // Only trigger if not in an input field
        if (
          e.target instanceof HTMLElement &&
          !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)
        ) {
          e.preventDefault()
          onEditTicket?.()
        }
      },
      [onEditTicket]
    ),
    options
  )

  useHotkeys(
    'c',
    useCallback(
      (e) => {
        // Only trigger if not in an input field
        if (
          e.target instanceof HTMLElement &&
          !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)
        ) {
          e.preventDefault()
          onAddComment?.()
        }
      },
      [onAddComment]
    ),
    options
  )
}

export const KEYBOARD_SHORTCUTS = {
  E: 'Editar ticket (en vista de ticket)',
  C: 'Agregar comentario (en vista de ticket)',
  Esc: 'Cerrar modal/diálogo',
  'Shift + ?': 'Mostrar ayuda de atajos'
} as const
