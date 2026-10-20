import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions
} from 'react-query'
import { AxiosResponse } from 'axios'
import useAxiosPrivate from '@utils/use-axios-private'
import { productKeys } from './queryKeys'

export interface ProductVariantInput {
  serviceType: string
  medicalPrice: number | null
  industrialPrice: number | null
  thirdPartyPrice: number | null
}

export interface ProductInput {
  name: string
  intervalText: string | null
  variants: ProductVariantInput[]
}

/** Catálogo de productos y servicios (GET /products). */
export const useProducts = <TProduct>(
  options?: Omit<
    UseQueryOptions<TProduct[], unknown, TProduct[]>,
    'queryKey' | 'queryFn'
  >
) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<TProduct[], unknown>(
    productKeys.list,
    async () => {
      const response = await axiosPrivate.get<TProduct[]>('/products', {})
      return response.data
    },
    options
  )
}

/**
 * Mutaciones del catálogo. Devuelven la respuesta de axios para que la
 * pantalla pueda revisar el status; al terminar bien se espera a que el
 * catálogo se recargue antes de resolver.
 */
export const useProductMutations = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  const options = {
    retry: false,
    onSuccess: () => queryClient.invalidateQueries(productKeys.all)
  }

  const createProduct = useMutation<AxiosResponse, unknown, ProductInput>(
    (product) => axiosPrivate.post('/products', product),
    options
  )
  const updateProduct = useMutation<
    AxiosResponse,
    unknown,
    { id: number } & ProductInput
  >(
    ({ id, ...product }) => axiosPrivate.put(`/products/${id}`, product),
    options
  )
  const deleteProduct = useMutation<AxiosResponse, unknown, number>(
    (id) => axiosPrivate.delete(`/products/${id}`),
    options
  )
  const updatePrices = useMutation<AxiosResponse, unknown, number>(
    (percentage) => axiosPrivate.put('/products/update-prices', { percentage }),
    options
  )
  const importProducts = useMutation<AxiosResponse, unknown, File>((file) => {
    const formData = new FormData()
    formData.append('file', file)
    return axiosPrivate.post('/products/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }, options)

  return {
    createProduct,
    updateProduct,
    deleteProduct,
    updatePrices,
    importProducts
  }
}
