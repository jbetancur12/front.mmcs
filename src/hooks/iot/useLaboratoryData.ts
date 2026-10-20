import { useQuery } from 'react-query'
import { format } from 'date-fns'
import useAxiosPrivate from '@utils/use-axios-private'

/**
 * Claves del monitor de laboratorio. 'laboratoryDevices' se conserva porque
 * AddSensorModal, EditSensorModal y DeleteConfirmDialog actualizan esa caché.
 */
export const LABORATORY_QUERY_KEYS = {
  devices: ['laboratoryDevices'] as const,
  historical: (date: Date | null, sensorIds: number[]) =>
    [
      'laboratoryHistoricalData',
      date ? format(date, 'yyyy-MM-dd') : null,
      sensorIds.sort().join(',') // Ordenar IDs para consistencia de la key
    ] as const
}

/** Sensores del laboratorio (`/laboratory/devices`) */
export const useLaboratoryDevices = <T>() => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<T[], Error>({
    queryKey: LABORATORY_QUERY_KEYS.devices,
    queryFn: async () =>
      axiosPrivate.get('/laboratory/devices').then((res) => res.data)
  })
}

/** Datos históricos y estadísticas de los sensores seleccionados en una fecha */
export const useLaboratoryHistoricalData = <T>(
  selectedDate: Date | null,
  selectedSensorIds: number[],
  emptyValue: T
) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<T, Error>({
    queryKey: LABORATORY_QUERY_KEYS.historical(selectedDate, selectedSensorIds),
    queryFn: async () => {
      if (!selectedDate || selectedSensorIds.length === 0) {
        // Devolver una estructura válida vacía si no se debe fetchear
        return emptyValue
      }
      const dateString = format(selectedDate, 'yyyy-MM-dd')
      const sensorIdsString = selectedSensorIds.join(',')

      const response = await axiosPrivate.get(
        `/laboratory/historical-data?date=${dateString}&sensorIds=${sensorIdsString}`
      )
      return response.data
    },
    enabled: !!selectedDate && selectedSensorIds.length > 0,
    staleTime: 5 * 60 * 1000
  })
}
