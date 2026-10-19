import { useMutation, useQuery, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import { bigToast } from 'src/Components/ExcelManipulation/Utils'
import type {
  AssetInterventionFormValues,
  AssetLifeSheet
} from 'src/types/assetLifeSheet'

export const ASSET_LIFE_SHEETS_QUERY_KEYS = {
  all: ['assetLifeSheets'] as const,
  list: ['assetLifeSheets', 'list'] as const
}

/** Hojas de vida de activos */
export const useAssetLifeSheets = () => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery(
    ASSET_LIFE_SHEETS_QUERY_KEYS.list,
    async (): Promise<AssetLifeSheet[]> => {
      const response =
        await axiosPrivate.get<AssetLifeSheet[]>('/asset-life-sheets')
      return response.data
    },
    {
      onError: (error) => {
        console.error(error)
        bigToast('No se pudieron cargar los activos', 'error')
      }
    }
  )
}

/** Crear/editar/eliminar activos y registrar intervenciones; recargan el listado */
export const useAssetLifeSheetMutations = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  const invalidateList = () =>
    queryClient.invalidateQueries(ASSET_LIFE_SHEETS_QUERY_KEYS.list)

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
