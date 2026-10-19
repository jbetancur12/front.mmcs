import { useQuery } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import { Trip } from 'src/Components/Fleet/types'
import {
  fetchPaginated,
  type PaginatedResponse,
  type ServerListParams
} from 'src/hooks/useServerTable'

type TripsPage = PaginatedResponse<Trip> & { lastTrip: Trip | null }

// Cuelgan de 'trips': las mutaciones de viajes invalidan ese prefijo.
export const tripKeys = {
  paginated: (vehicleId: string | undefined, params: ServerListParams) =>
    ['trips', vehicleId, 'paginated', params] as const,
  last: (vehicleId: string | undefined) =>
    ['trips', vehicleId, 'last'] as const
}

/** Columnas que `GET /trip` acepta en `sortBy`. */
export const TRIP_SORTABLE_FIELDS = [
  'id',
  'startDate',
  'endDate',
  'driver',
  'startMileage'
] as const

/** Página de viajes de un vehículo (`GET /trip?vehicleId=&page=&limit=...`). */
export const useTripsPaginated = (
  vehicleId: string | undefined,
  params: ServerListParams
) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<TripsPage>(
    tripKeys.paginated(vehicleId, params),
    () =>
      fetchPaginated<Trip>(axiosPrivate, '/trip', {
        ...params,
        vehicleId: Number(vehicleId)
      }) as Promise<TripsPage>,
    { enabled: !!vehicleId, keepPreviousData: true }
  )
}

/**
 * Último viaje del vehículo, sin la búsqueda de la tabla (el `lastTrip` de la
 * respuesta paginada respeta `search`, y aquí se necesita el último real).
 */
export const useLastTrip = (vehicleId: string | undefined) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<Trip | null>(
    tripKeys.last(vehicleId),
    async () => {
      const page = (await fetchPaginated<Trip>(axiosPrivate, '/trip', {
        page: 1,
        limit: 1,
        vehicleId: Number(vehicleId)
      })) as TripsPage
      return page.lastTrip ?? null
    },
    { enabled: !!vehicleId }
  )
}
