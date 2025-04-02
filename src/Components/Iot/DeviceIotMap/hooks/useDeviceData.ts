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
    withAnyAlarm: false
  })

  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
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

      return matchesSearch && matchesStatus && matchesPower && matchesAlarms
    })
  }, [devices, filterState])

  const handleFilterChange = (
    type: keyof FilterState,
    value: string | Set<string> | boolean // Añadir boolean como tipo posible
  ) => {
    setFilterState((prev) => {
      if (type === 'searchQuery') {
        return { ...prev, searchQuery: value as string }
      }
      if (type === 'withAnyAlarm') {
        return { ...prev, withAnyAlarm: value as boolean }
      }
      // Solo crear Set para tipos que son conjuntos
      return {
        ...prev,
        [type]: new Set(value as Iterable<string>)
      }
    })
  }

  return { filteredDevices, filterState, handleFilterChange }
}
