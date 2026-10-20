import { useEffect, useState } from 'react'
import { DetailTab, getStoredDetailTab } from './calibrationServiceDetailUtils'

/** Pestaña activa del detalle, recordada por servicio durante la sesión. */
const useCalibrationServiceDetailTab = (serviceId?: string) => {
  const [activeTab, setActiveTab] = useState<DetailTab>(() =>
    getStoredDetailTab(serviceId)
  )

  useEffect(() => {
    setActiveTab(getStoredDetailTab(serviceId))
  }, [serviceId])

  useEffect(() => {
    if (!serviceId || typeof window === 'undefined') {
      return
    }

    window.sessionStorage.setItem(
      `calibration-service-detail-tab:${serviceId}`,
      activeTab
    )
  }, [activeTab, serviceId])

  return [activeTab, setActiveTab] as const
}

export default useCalibrationServiceDetailTab
