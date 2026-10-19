import { AxiosResponse } from 'axios'
import { useMutation, useQuery, useQueryClient } from 'react-query'

import useAxiosPrivate from '@utils/use-axios-private'

import { DataSheetData } from './types'

export const dataSheetKeys = {
  all: ['dataSheets'] as const,
  list: () => [...dataSheetKeys.all, 'list'] as const
}

const EMPTY: DataSheetData[] = []

/** Lista de hojas de vida (`GET /dataSheet`). */
export const useDataSheetsQuery = () => {
  const axiosPrivate = useAxiosPrivate()

  const query = useQuery<DataSheetData[]>(
    dataSheetKeys.list(),
    async () => {
      const response = await axiosPrivate.get(`/dataSheet`)
      if (response.statusText !== 'OK') {
        throw new Error('Error fetching dataSheet data')
      }
      return response.data
    },
    {
      onError: (error) => {
        console.error('Error fetching dataSheet data:', error)
      }
    }
  )

  return { ...query, dataSheets: query.data ?? EMPTY }
}

/** Mutaciones de hojas de vida; todas invalidan la lista al terminar bien. */
export const useDataSheetMutations = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  const invalidate = () =>
    queryClient.invalidateQueries(dataSheetKeys.all)
  // Sin reintentos: el `retry: 1` global de mutaciones reenviaría POST/PUT/DELETE.
  const options = { onSuccess: invalidate, retry: 0 }

  const updateDataSheet = useMutation<
    AxiosResponse,
    unknown,
    { id: number; values: Record<string, unknown> }
  >(({ id, values }) => axiosPrivate.put(`/dataSheet/${id}`, values, {}), options)

  const deleteDataSheet = useMutation<AxiosResponse, unknown, number>(
    (id) => axiosPrivate.delete(`/dataSheet/${id}`),
    options
  )

  const uploadImage = useMutation<
    AxiosResponse,
    unknown,
    { id: number | undefined; image: File }
  >(
    ({ id, image }) => {
      const formData = new FormData()
      formData.append('picture', image)
      return axiosPrivate.put(`/dataSheet/${id}/update-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    },
    options
  )

  const uploadInvoice = useMutation<
    AxiosResponse,
    unknown,
    { id: number; pdfFile: File }
  >(
    ({ id, pdfFile }) => {
      const formData = new FormData()
      formData.append('invoice', pdfFile)
      return axiosPrivate.put(`/dataSheet/${id}/update-invoice`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    options
  )

  const createDataSheet = useMutation<AxiosResponse, unknown, FormData>(
    (formData) =>
      axiosPrivate.post(`/dataSheet`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }),
    options
  )

  return {
    updateDataSheet,
    deleteDataSheet,
    uploadImage,
    uploadInvoice,
    createDataSheet
  }
}

/** Descarga de la factura (blob): efecto imperativo, no es una query. */
export const useDownloadInvoice = () => {
  const axiosPrivate = useAxiosPrivate()
  return (id: number) =>
    axiosPrivate.get(`/dataSheet/download-invoice/${id}`, {
      responseType: 'blob' // Importante para manejar archivos binarios
    })
}
