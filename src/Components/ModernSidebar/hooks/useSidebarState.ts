import { useState, useEffect, useCallback } from 'react'
import { SidebarState } from '../types/sidebar.types'

const STORAGE_KEY = 'modern-sidebar-state'

const defaultState: SidebarState = {
  isMinimized: false,
  isMobileOpen: false,
  searchTerm: '',
  favorites: [],
  recentItems: [],
  theme: 'light',
  notifications: {}
}

export const useSidebarState = () => {
  const [state, setState] = useState<SidebarState>(defaultState)

  // Cargar estado desde localStorage al inicializar
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY)
      if (savedState) {
        const parsedState = JSON.parse(savedState)
        setState(prevState => ({
          ...prevState,
          ...parsedState,
          // No persistir estados temporales
          isMobileOpen: false,
          searchTerm: ''
        }))
      }
    } catch (error) {
      console.warn('Error loading sidebar state from localStorage:', error)
    }
  }, [])

  // Guardar estado en localStorage cuando cambie
  const saveState = useCallback((newState: Partial<SidebarState>) => {
    setState(prevState => {
      const updatedState = { ...prevState, ...newState }
      
      try {
        // Solo guardar estados que queremos persistir
        const stateToSave = {
          isMinimized: updatedState.isMinimized,
          favorites: updatedState.favorites,
          recentItems: updatedState.recentItems,
          theme: updatedState.theme,
          notifications: updatedState.notifications
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
      } catch (error) {
        console.warn('Error saving sidebar state to localStorage:', error)
      }
      
      return updatedState
    })
  }, [])

  // Funciones de utilidad
  const toggleMinimized = useCallback(() => {
    saveState({ isMinimized: !state.isMinimized })
  }, [state.isMinimized, saveState])

  const toggleMobile = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      isMobileOpen: !prevState.isMobileOpen
    }))
  }, [])

  const setSearchTerm = useCallback((searchTerm: string) => {
    setState(prevState => ({
      ...prevState,
      searchTerm
    }))
  }, [])

  const addToFavorites = useCallback((itemId: string) => {
    saveState({
      favorites: [...state.favorites.filter(id => id !== itemId), itemId].slice(-5) // Máximo 5 favoritos
    })
  }, [state.favorites, saveState])

  const removeFromFavorites = useCallback((itemId: string) => {
    saveState({
      favorites: state.favorites.filter(id => id !== itemId)
    })
  }, [state.favorites, saveState])

  const addToRecent = useCallback((itemId: string) => {
    saveState({
      recentItems: [itemId, ...state.recentItems.filter(id => id !== itemId)].slice(0, 10) // Máximo 10 recientes
    })
  }, [state.recentItems, saveState])

  const setTheme = useCallback((theme: 'light' | 'dark') => {
    saveState({ theme })
  }, [saveState])

  const updateNotifications = useCallback((notifications: Record<string, number>) => {
    saveState({ notifications })
  }, [saveState])

  const clearSearch = useCallback(() => {
    setSearchTerm('')
  }, [setSearchTerm])

  return {
    state,
    actions: {
      toggleMinimized,
      toggleMobile,
      closeMobile: () => saveState({ isMobileOpen: false }),
      setSearchTerm,
      clearSearch,
      addToFavorites,
      removeFromFavorites,
      addToRecent,
      setTheme,
      toggleTheme: () => setTheme(state.theme === 'light' ? 'dark' : 'light'),
      updateNotifications,
      clearNotification: (itemId: string) => {
        const newNotifications = { ...state.notifications }
        delete newNotifications[itemId]
        saveState({ notifications: newNotifications })
      }
    }
  }
}