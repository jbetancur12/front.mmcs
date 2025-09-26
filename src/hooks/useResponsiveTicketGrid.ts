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

    // Espacios fijos que debemos considerar
    const headerHeight = 60 // Header con reloj
    const metricsHeight = 120 // Row de métricas principales
    const titleHeight = 80 // Título "TICKETS ACTIVOS"
    const progressHeight = 40 // Barra de progreso
    const padding = 48 // Padding del container (24px * 2)
    const verticalPadding = 48 // Padding vertical del container (24px * 2)
    const marginBetweenSections = 48 // Margen entre métricas y tickets (aumentado)

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

    // Configuraciones base dependiendo del ancho de pantalla
    let baseColumns: number
    let baseCardWidth: number
    let cardSpacing: number

    if (width >= 3840) {
      // 4K y superiores (3840x2160+)
      baseColumns = 6
      baseCardWidth = 300
      cardSpacing = 24
    } else if (width >= 2560) {
      // 2K/QHD (2560x1440)
      baseColumns = 5
      baseCardWidth = 280
      cardSpacing = 20
    } else if (width >= 1920) {
      // Full HD (1920x1080)
      baseColumns = 4
      baseCardWidth = 260
      cardSpacing = 16
    } else if (width >= 1366) {
      // Laptop común (1366x768)
      baseColumns = 3
      baseCardWidth = 240
      cardSpacing = 12
    } else if (width >= 1024) {
      // Tablet landscape (1024x768)
      baseColumns = 3
      baseCardWidth = 220
      cardSpacing = 12
    } else {
      // Pantallas pequeñas (768x1024 tablet portrait y menores)
      baseColumns = 2
      baseCardWidth = 200
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

    // Calcular altura de tarjeta óptima
    let cardHeight: number

    if (height >= 2160) {
      // 4K vertical
      cardHeight = 220
    } else if (height >= 1440) {
      // 2K vertical
      cardHeight = 200
    } else if (height >= 1080) {
      // Full HD vertical
      cardHeight = 180
    } else if (height >= 768) {
      // Laptop/tablet común
      cardHeight = 160
    } else {
      // Pantallas muy pequeñas
      cardHeight = 140
    }

    // Calcular cuántas filas caben
    const totalRowSpacing = cardSpacing // Spacing entre filas
    let rows = Math.floor(
      (availableHeight + totalRowSpacing) / (cardHeight + totalRowSpacing)
    )

    // Mínimo 1 fila, máximo razonable dependiendo de la pantalla
    rows = Math.max(
      1,
      Math.min(rows, height >= 1440 ? 4 : height >= 1080 ? 3 : 2)
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
