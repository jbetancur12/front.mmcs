// components/DeviceIotMap/hooks/useMapSetup.ts
import { useRef, useState, useCallback } from 'react'
import { Map } from 'leaflet'

export const useMapSetup = () => {
  const mapRef = useRef<Map | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // Función para manejar la referencia del mapa
  const handleMapRef = useCallback((mapInstance: Map | null) => {
    mapRef.current = mapInstance
    if (mapInstance) {
      setTimeout(() => {
        mapInstance.invalidateSize()
      }, 300)
    }
  }, [])

  return {
    handleMapRef, // <-- Cambiar el nombre de la referencia
    isSidebarOpen,
    toggleSidebar: () => setIsSidebarOpen((prev) => !prev),
    mapRef
  }
}
