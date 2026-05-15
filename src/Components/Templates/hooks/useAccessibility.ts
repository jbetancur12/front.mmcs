// Custom hook for accessibility features and keyboard navigation
import { useEffect, useRef, useCallback, useState } from 'react'

interface UseAccessibilityOptions {
  announceChanges?: boolean
  trapFocus?: boolean
  restoreFocus?: boolean
}

export const useAccessibility = (options: UseAccessibilityOptions = {}) => {
  const {
    announceChanges = true,
    trapFocus = false,
    restoreFocus = false
  } = options
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const [announcements, setAnnouncements] = useState<string[]>([])

  // Announce changes to screen readers
  const announce = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      if (!announceChanges) return

      setAnnouncements((prev) => [...prev, message])

      // Create temporary live region for announcement
      const liveRegion = document.createElement('div')
      liveRegion.setAttribute('aria-live', priority)
      liveRegion.setAttribute('aria-atomic', 'true')
      liveRegion.setAttribute('class', 'sr-only')
      liveRegion.style.position = 'absolute'
      liveRegion.style.left = '-10000px'
      liveRegion.style.width = '1px'
      liveRegion.style.height = '1px'
      liveRegion.style.overflow = 'hidden'

      document.body.appendChild(liveRegion)

      // Delay to ensure screen reader picks up the change
      setTimeout(() => {
        liveRegion.textContent = message
        setTimeout(() => {
          document.body.removeChild(liveRegion)
        }, 1000)
      }, 100)
    },
    [announceChanges]
  )

  // Store current focus for restoration
  const storeFocus = useCallback(() => {
    if (restoreFocus) {
      previousFocusRef.current = document.activeElement as HTMLElement
    }
  }, [restoreFocus])

  // Restore previously focused element
  const restorePreviousFocus = useCallback(() => {
    if (restoreFocus && previousFocusRef.current) {
      previousFocusRef.current.focus()
      previousFocusRef.current = null
    }
  }, [restoreFocus])

  // Focus trap for modals
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!trapFocus) return

      if (event.key === 'Tab') {
        const focusableElements = document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[
          focusableElements.length - 1
        ] as HTMLElement

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault()
            firstElement.focus()
          }
        }
      }

      if (event.key === 'Escape') {
        // Allow escape key handling by parent components
        const escapeEvent = new CustomEvent('accessibility-escape', {
          bubbles: true
        })
        document.activeElement?.dispatchEvent(escapeEvent)
      }
    },
    [trapFocus]
  )

  // Set up focus trap
  useEffect(() => {
    if (trapFocus) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [trapFocus, handleKeyDown])

  return {
    announce,
    storeFocus,
    restorePreviousFocus,
    announcements
  }
}

// Hook for keyboard navigation in tables and lists
export const useKeyboardNavigation = (
  itemCount: number,
  onSelect?: (index: number) => void
) => {
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const containerRef = useRef<HTMLElement>(null)

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setFocusedIndex((prev) => Math.min(prev + 1, itemCount - 1))
          break
        case 'ArrowUp':
          event.preventDefault()
          setFocusedIndex((prev) => Math.max(prev - 1, 0))
          break
        case 'Home':
          event.preventDefault()
          setFocusedIndex(0)
          break
        case 'End':
          event.preventDefault()
          setFocusedIndex(itemCount - 1)
          break
        case 'Enter':
        case ' ':
          event.preventDefault()
          if (focusedIndex >= 0 && onSelect) {
            onSelect(focusedIndex)
          }
          break
        case 'Escape':
          setFocusedIndex(-1)
          break
      }
    },
    [itemCount, focusedIndex, onSelect]
  )

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('keydown', handleKeyDown)
      return () => container.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  // Focus the appropriate item when focusedIndex changes
  useEffect(() => {
    if (focusedIndex >= 0 && containerRef.current) {
      const items = containerRef.current.querySelectorAll(
        '[data-keyboard-nav-item]'
      )
      const item = items[focusedIndex] as HTMLElement
      if (item) {
        item.focus()
      }
    }
  }, [focusedIndex])

  return {
    containerRef,
    focusedIndex,
    setFocusedIndex
  }
}

// Hook for managing reduced motion preferences
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

export default useAccessibility
