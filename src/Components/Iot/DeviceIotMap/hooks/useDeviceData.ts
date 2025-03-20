// components/DeviceIotMap/hooks/useDeviceData.ts
import { useState, useMemo } from 'react'
import { Device, FilterState } from '../types'
import { DeviceIot } from '../../types'

export const useDeviceData = (devices: DeviceIot[]) => {
  const [filterState, setFilterState] = useState<FilterState>({
    searchQuery: '',
    statuses: new Set(['online']),
    powerSources: new Set(['main', 'bat'])
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

      return matchesSearch && matchesStatus && matchesPower
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
