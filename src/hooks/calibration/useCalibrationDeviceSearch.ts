import { useEffect, useState } from 'react'
import { useQuery } from 'react-query'
import { axiosPrivate } from '@utils/api'

export interface CalibrationDeviceOption {
  id: number
  name: string
}

const MIN_QUERY_LENGTH = 2
const DEBOUNCE_MS = 300

/**
 * Búsqueda de equipos del catálogo (`/devices?q=`) con espera de 300 ms y
 * mínimo 2 caracteres. Se usa en el control logístico y en la vista móvil.
 */
export const useCalibrationDeviceSearch = (query: string) => {
  const trimmed = query.trim()
  const [debounced, setDebounced] = useState(trimmed)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(trimmed), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [trimmed])

  const isSearchable = trimmed.length >= MIN_QUERY_LENGTH
  const enabled = isSearchable && debounced.length >= MIN_QUERY_LENGTH

  const result = useQuery<CalibrationDeviceOption[]>(
    ['calibration-device-search', debounced],
    async () => {
      const res = await axiosPrivate.get<CalibrationDeviceOption[] | null>('/devices', {
        params: { q: debounced }
      })
      return (res.data || []).map((d) => ({ id: d.id, name: d.name }))
    },
    {
      enabled,
      keepPreviousData: true,
      retry: false,
      refetchOnWindowFocus: false
    }
  )

  return {
    options: isSearchable && !result.isError ? result.data ?? [] : [],
    loading: isSearchable && result.isFetching
  }
}

export default useCalibrationDeviceSearch
