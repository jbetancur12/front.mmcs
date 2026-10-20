import { useEffect, useRef, useState } from 'react'

/**
 * Posición de la barra de acciones fija: el layout de la app no permite 'sticky',
 * así que se alinea con el contenido del contenedor.
 */
const useWorkspaceActionBarBox = (isPageLoading: boolean, canAccessWorkspace: boolean) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [actionBarBox, setActionBarBox] = useState<{ left: number; width: number } | null>(null)
  useEffect(() => {
    const update = () => {
      const element = containerRef.current
      if (!element) return
      const rect = element.getBoundingClientRect()
      const styles = window.getComputedStyle(element)
      const paddingLeft = parseFloat(styles.paddingLeft) || 0
      const paddingRight = parseFloat(styles.paddingRight) || 0
      setActionBarBox({ left: rect.left + paddingLeft, width: rect.width - paddingLeft - paddingRight })
    }
    update()
    window.addEventListener('resize', update)
    const observer = new ResizeObserver(update)
    if (containerRef.current) observer.observe(containerRef.current)
    return () => {
      window.removeEventListener('resize', update)
      observer.disconnect()
    }
  }, [isPageLoading, canAccessWorkspace])

  return { containerRef, actionBarBox }
}

export default useWorkspaceActionBarBox
