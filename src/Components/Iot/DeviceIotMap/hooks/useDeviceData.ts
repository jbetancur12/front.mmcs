// components/DeviceIotMap/hooks/useDeviceData.ts
import { useState, useMemo } from 'react'
import { FilterState } from '../types'
import { DeviceIot } from '../../types'

export const useDeviceData = (devices: DeviceIot[]) => {
  const [filterState, setFilterState] = useState<FilterState>({
    searchQuery: '',
    statuses: new Set(['online']), // Inicializar como vacío
    powerSources: new Set(), // Inicializar como vacío
    alarmSeverities: new Set(),
    withAnyAlarm: false,
    customerId: null // Valor inicial
  })

  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const matchesCustomer =
        !filterState.customerId || device.customerId === filterState.customerId

      const matchesSearch = device.name
        .toLowerCase()
        .includes(filterState.searchQuery.toLowerCase())

      const matchesStatus =
        filterState.statuses.size === 0 ||
        filterState.statuses.has(device.isOnline ? 'online' : 'offline')

      const matchesPower =
        filterState.powerSources.size === 0 ||
        filterState.powerSources.has(device.src)

      const activeAlarms =
        device.alarms?.filter((alarm) => alarm.active && alarm.enabled) || []

      // Lógica de alarmas corregida
      let matchesAlarms = true
      if (filterState.withAnyAlarm) {
        matchesAlarms = activeAlarms.length > 0 // Cualquier alarma activa
      } else if (filterState.alarmSeverities.size > 0) {
        matchesAlarms = activeAlarms.some((a) =>
          filterState.alarmSeverities.has(a.severity)
        )
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPower &&
        matchesAlarms &&
        matchesCustomer
      )
    })
  }, [devices, filterState])

  const handleFilterChange = (
    type: keyof FilterState,
    value: string | Set<string> | boolean | number | null
  ) => {
    setFilterState((prev) => ({
      ...prev,
      [type]: value instanceof Set ? new Set(value) : value
    }))
  }

  return { filteredDevices, filterState, handleFilterChange }
}
