import { useMutation, useQuery, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import {
  fetchPaginated,
  fetchTotal,
  type PaginatedResponse,
  type ServerListParams
} from 'src/hooks/useServerTable'
import { notify } from 'src/utils/notify'
import type {
  AssetInterventionFormValues,
  AssetLifeSheet
} from 'src/types/assetLifeSheet'

import { logger } from 'src/utils/logger'
export const ASSET_LIFE_SHEETS_QUERY_KEYS = {
  all: ['assetLifeSheets'] as const,
  list: ['assetLifeSheets', 'list'] as const,
  paginated: (params: ServerListParams) =>
    ['assetLifeSheets', 'paginated', params] as const,
  counts: ['assetLifeSheets', 'counts'] as const
}

/** Columnas que `GET /asset-life-sheets` acepta en `sortBy`. */
export const ASSET_LIFE_SHEET_SORTABLE_FIELDS = [
  'assetCode',
  'name',
  'assetCategory',
  'status',
  'location',
  'receivedDate',
  'createdAt'
] as const

/** Filtros exactos de `GET /asset-life-sheets` (id de columna = parámetro). */
export const ASSET_LIFE_SHEET_EXACT_FILTERS = [
  'status',
  'assetCategory',
  'assetType',
  'area'
] as const

export const fetchAllAssetLifeSheets = async (
  axiosPrivate: ReturnType<typeof useAxiosPrivate>
): Promise<AssetLifeSheet[]> => {
  const response = await axiosPrivate.get<AssetLifeSheet[]>('/asset-life-sheets')
  return response.data
}

/**
 * Todas las hojas de vida de activos (sin paginar). Para la exportación y las
 * sugerencias de los formularios; la tabla usa `useAssetLifeSheetsPaginated`.
 */
export const useAssetLifeSheets = (options: { enabled?: boolean } = {}) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery(
    ASSET_LIFE_SHEETS_QUERY_KEYS.list,
    () => fetchAllAssetLifeSheets(axiosPrivate),
    {
      enabled: options.enabled ?? true,
      onError: (error) => {
        logger.error(error)
        notify.error('No se pudieron cargar los activos')
      }
    }
  )
}

/** Página de hojas de vida de activos (`?page=&limit=...`). */
export const useAssetLifeSheetsPaginated = (params: ServerListParams) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<PaginatedResponse<AssetLifeSheet>>(
    ASSET_LIFE_SHEETS_QUERY_KEYS.paginated(params),
    () =>
      fetchPaginated<AssetLifeSheet>(
        axiosPrivate,
        '/asset-life-sheets',
        params
      ),
    {
      keepPreviousData: true,
      onError: (error) => {
        logger.error(error)
        notify.error('No se pudieron cargar los activos')
      }
    }
  )
}

/** Indicadores: total y activos en uso, vía `totalItems` con `limit=1`. */
export const useAssetLifeSheetCounts = () => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery(ASSET_LIFE_SHEETS_QUERY_KEYS.counts, async () => {
    const [total, active] = await Promise.all([
      fetchTotal(axiosPrivate, '/asset-life-sheets'),
      fetchTotal(axiosPrivate, '/asset-life-sheets', { status: 'active' })
    ])
    return { total, active }
  })
}

/** Crear/editar/eliminar activos y registrar intervenciones; recargan el listado */
export const useAssetLifeSheetMutations = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  // Prefijo común: lista completa, páginas e indicadores.
  const invalidateList = () =>
    queryClient.invalidateQueries(ASSET_LIFE_SHEETS_QUERY_KEYS.all)

  const saveAsset = useMutation(
    async ({ id, formData }: { id: number | null; formData: FormData }) => {
      if (id) {
        await axiosPrivate.put(`/asset-life-sheets/${id}`, formData)
      } else {
        await axiosPrivate.post('/asset-life-sheets', formData)
      }
    },
    { retry: false, onSuccess: invalidateList }
  )

  const deleteAsset = useMutation(
    async (assetId: number) => {
      await axiosPrivate.delete(`/asset-life-sheets/${assetId}`)
    },
    { retry: false, onSuccess: invalidateList }
  )

  const createIntervention = useMutation(
    async ({
      assetId,
      values
    }: {
      assetId: number
      values: AssetInterventionFormValues
    }) => {
      await axiosPrivate.post(
        `/asset-life-sheets/${assetId}/interventions`,
        values
      )
    },
    { retry: false, onSuccess: invalidateList }
  )

  return { saveAsset, deleteAsset, createIntervention }
}
