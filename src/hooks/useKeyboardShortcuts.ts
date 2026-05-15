import { useHotkeys } from 'react-hotkeys-hook'
import { useCallback } from 'react'

interface KeyboardShortcutsOptions {
  onNewTicket?: () => void
  onToggleFilters?: () => void
  onRefreshData?: () => void
  onFocusSearch?: () => void
  onShowHelp?: () => void
  onEditTicket?: () => void
  onAddComment?: () => void
  onCloseModal?: () => void
  enabled?: boolean
}

export const useKeyboardShortcuts = ({
  onNewTicket,
  onToggleFilters,
  onRefreshData,
  onFocusSearch,
  onShowHelp,
  onEditTicket,
  onAddComment,
  onCloseModal,
  enabled = true
}: KeyboardShortcutsOptions) => {
  const options = { enabled }

  // Global shortcuts
  useHotkeys('ctrl+k',
    useCallback((e) => {
      e.preventDefault()
      onFocusSearch?.()
    }, [onFocusSearch]),
    options
  )

  useHotkeys('ctrl+n',
    useCallback((e) => {
      e.preventDefault()
      onNewTicket?.()
    }, [onNewTicket]),
    options
  )

  useHotkeys('ctrl+f',
    useCallback((e) => {
      e.preventDefault()
      onToggleFilters?.()
    }, [onToggleFilters]),
    options
  )

  useHotkeys('ctrl+r',
    useCallback((e) => {
      e.preventDefault()
      onRefreshData?.()
    }, [onRefreshData]),
    options
  )

  useHotkeys('shift+/',
    useCallback((e) => {
      e.preventDefault()
      onShowHelp?.()
    }, [onShowHelp]),
    options
  )

  useHotkeys('escape',
    useCallback((e) => {
      e.preventDefault()
      onCloseModal?.()
    }, [onCloseModal]),
    options
  )

  // Context-specific shortcuts (when viewing a ticket)
  useHotkeys('e',
    useCallback((e) => {
      // Only trigger if not in an input field
      if (e.target instanceof HTMLElement &&
          !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        e.preventDefault()
        onEditTicket?.()
      }
    }, [onEditTicket]),
    options
  )

  useHotkeys('c',
    useCallback((e) => {
      // Only trigger if not in an input field
      if (e.target instanceof HTMLElement &&
          !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        e.preventDefault()
        onAddComment?.()
      }
    }, [onAddComment]),
    options
  )
}

export const KEYBOARD_SHORTCUTS = {
  'Ctrl + K': 'Enfocar búsqueda',
  'Ctrl + N': 'Nuevo ticket',
  'Ctrl + F': 'Alternar filtros',
  'Ctrl + R': 'Actualizar datos',
  'E': 'Editar ticket (en vista de ticket)',
  'C': 'Agregar comentario (en vista de ticket)',
  'Esc': 'Cerrar modal/diálogo',
  'Shift + ?': 'Mostrar ayuda de atajos'
} as const