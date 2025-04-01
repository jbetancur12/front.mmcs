// components/DeviceIotMap/hooks/useDeviceData.ts
import { useState, useMemo } from 'react'
import { FilterState } from '../types'
import { DeviceIot } from '../../types'

export const useDeviceData = (devices: DeviceIot[]) => {
  const [filterState, setFilterState] = useState<FilterState>({
    searchQuery: '',
    statuses: new Set(['online']),
    powerSources: new Set(['main', 'bat']),
    alarmSeverities: new Set(),
    withAnyAlarm: false
  })

  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const matchesSearch = device.name
        .toLowerCase()
        .includes(filterState.searchQuery.toLowerCase())

      const matchesStatus = filterState.statuses.has(
        device.isOnline ? 'online' : 'offline'
      )

      const matchesPower = filterState.powerSources.has(device.src)

      const activeAlarms =
        device.alarms?.filter((alarm) => alarm.active && alarm.enabled) || []

      if (!filterState.withAnyAlarm && filterState.alarmSeverities.size === 0) {
        return true // Mostrar siempre
      }

      const matchesAlarms = filterState.withAnyAlarm
        ? activeAlarms.length > 0
        : activeAlarms.some((alarm) =>
            filterState.alarmSeverities.has(alarm.severity)
          )

      return matchesSearch && matchesStatus && matchesPower && matchesAlarms
    })
  }, [devices, filterState])

  const handleFilterChange = (
    type: keyof FilterState,
    value: string | Set<string>
  ) => {
    setFilterState((prev) => {
      if (type === 'searchQuery') {
        return { ...prev, searchQuery: value as string }
      }
      return { ...prev, [type]: new Set(value as Iterable<string>) }
    })
  }

  return { filteredDevices, filterState, handleFilterChange }
}
