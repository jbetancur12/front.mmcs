import { useState, useEffect, useMemo } from 'react'

interface ScreenSize {
  width: number
  height: number
}

interface GridCalculation {
  columns: number
  rows: number
  ticketsPerPage: number
  cardHeight: number
  cardSpacing: number
  containerHeight: number
}

/**
 * Hook para calcular automáticamente la disposición óptima de tickets
 * basada en el tamaño de pantalla disponible
 */
export const useResponsiveTicketGrid = () => {
  const [screenSize, setScreenSize] = useState<ScreenSize>({
    width: window.innerWidth,
    height: window.innerHeight
  })

  // Actualizar tamaño de pantalla cuando cambie
  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Calcular la disposición óptima del grid
  const gridCalculation = useMemo((): GridCalculation => {
    const { width, height } = screenSize

    // Espacios fijos optimizados para pantalla completa
    const headerHeight = 60 // Header con reloj
    const metricsHeight = 80 // Row de métricas compactas
    const titleHeight = 50 // Título "TICKETS ACTIVOS" más compacto
    const progressHeight = 30 // Barra de progreso más pequeña
    const padding = 16 // Padding mínimo del container (8px * 2)
    const verticalPadding = 16 // Padding vertical mínimo (8px * 2)
    const marginBetweenSections = 8 // Margen mínimo entre secciones

    // Altura disponible para tickets
    const availableHeight =
      height -
      headerHeight -
      metricsHeight -
      titleHeight -
      progressHeight -
      verticalPadding -
      marginBetweenSections

    // Ancho disponible (considerando padding del container)
    const availableWidth = width - padding

    // Configuraciones optimizadas para mostrar más tickets en pantalla completa
    let baseColumns: number
    let baseCardWidth: number
    let cardSpacing: number

    if (width >= 3840) {
      // 4K y superiores (3840x2160+) - Maximizar tickets
      baseColumns = 8
      baseCardWidth = 280
      cardSpacing = 16
    } else if (width >= 2560) {
      // 2K/QHD (2560x1440) - Más tickets
      baseColumns = 6
      baseCardWidth = 260
      cardSpacing = 16
    } else if (width >= 1920) {
      // Full HD (1920x1080) - Optimizado para TV
      baseColumns = 5
      baseCardWidth = 240
      cardSpacing = 12
    } else if (width >= 1366) {
      // Laptop común (1366x768)
      baseColumns = 4
      baseCardWidth = 220
      cardSpacing = 12
    } else if (width >= 1024) {
      // Tablet landscape (1024x768)
      baseColumns = 3
      baseCardWidth = 200
      cardSpacing = 10
    } else {
      // Pantallas pequeñas (768x1024 tablet portrait y menores)
      baseColumns = 2
      baseCardWidth = 180
      cardSpacing = 8
    }

    // Verificar si las columnas caben en el ancho disponible
    const totalCardWidth = baseColumns * baseCardWidth
    const totalSpacing = (baseColumns - 1) * cardSpacing
    const totalRequiredWidth = totalCardWidth + totalSpacing

    // Ajustar columnas si no caben
    let columns = baseColumns
    if (totalRequiredWidth > availableWidth) {
      // Reducir columnas hasta que quepan
      while (columns > 1) {
        columns--
        const newTotalCardWidth = columns * baseCardWidth
        const newTotalSpacing = (columns - 1) * cardSpacing
        const newTotalRequiredWidth = newTotalCardWidth + newTotalSpacing

        if (newTotalRequiredWidth <= availableWidth) {
          break
        }
      }
    }

    // Calcular altura de tarjeta optimizada para mostrar más tickets
    let cardHeight: number

    if (height >= 2160) {
      // 4K vertical - Más filas
      cardHeight = 220
    } else if (height >= 1440) {
      // 2K vertical - Más filas
      cardHeight = 200
    } else if (height >= 1080) {
      // Full HD vertical - Optimizado para TV
      cardHeight = 220
    } else if (height >= 768) {
      // Laptop/tablet común
      cardHeight = 200
    } else {
      // Pantallas muy pequeñas
      cardHeight = 160
    }

    // Calcular cuántas filas caben - Maximizar uso del espacio
    const totalRowSpacing = cardSpacing // Spacing entre filas
    let rows = Math.floor(
      (availableHeight + totalRowSpacing) / (cardHeight + totalRowSpacing)
    )

    // Maximizar filas según la pantalla
    rows = Math.max(
      1,
      Math.min(rows, height >= 2160 ? 6 : height >= 1440 ? 5 : height >= 1080 ? 4 : 3)
    )

    const ticketsPerPage = columns * rows

    return {
      columns,
      rows,
      ticketsPerPage,
      cardHeight,
      cardSpacing,
      containerHeight: rows * cardHeight + (rows - 1) * cardSpacing
    }
  }, [screenSize])

  // Información adicional sobre el breakpoint actual
  const breakpointInfo = useMemo(() => {
    const { width } = screenSize

    if (width >= 3840) {
      return { name: '4K+', size: 'xl4' }
    } else if (width >= 2560) {
      return { name: '2K', size: 'xl3' }
    } else if (width >= 1920) {
      return { name: 'Full HD', size: 'xl2' }
    } else if (width >= 1366) {
      return { name: 'Laptop', size: 'xl' }
    } else if (width >= 1024) {
      return { name: 'Tablet L', size: 'lg' }
    } else if (width >= 768) {
      return { name: 'Tablet', size: 'md' }
    } else {
      return { name: 'Mobile', size: 'sm' }
    }
  }, [screenSize])

  return {
    screenSize,
    gridCalculation,
    breakpointInfo
  }
}

export default useResponsiveTicketGrid
