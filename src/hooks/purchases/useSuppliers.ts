import { useMemo } from 'react'
import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions
} from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import {
  Criterion,
  SelectionSupplier,
  Supplier
} from 'src/pages/Purchases/Types'
import { supplierKeys } from './queryKeys'

export interface SuppliersListResponse<TSupplier = Supplier> {
  totalItems: number
  suppliers: TSupplier[]
  totalPages: number
  currentPage: number
}

type QueryOptions<T> = Omit<
  UseQueryOptions<T, Error, T>,
  'queryKey' | 'queryFn'
>

/** Listado de proveedores (GET /suppliers, sin filtros). */
export const useSuppliers = <TResponse = SuppliersListResponse>(
  options?: QueryOptions<TResponse>
) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<TResponse, Error>(
    supplierKeys.list,
    async () => {
      const response = await axiosPrivate.get<TResponse>('/suppliers')
      return response.data
    },
    options
  )
}

/**
 * Búsqueda de proveedores por texto (GET /suppliers?search=...).
 * Solo consulta con 2 o más caracteres.
 */
export const useSupplierSearch = <TSupplier = Supplier>(
  searchTerm: string,
  purchaseType?: string | number | null
) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<TSupplier[], Error>(
    supplierKeys.search(searchTerm, purchaseType),
    async () => {
      if (!searchTerm.trim() || searchTerm.length < 2) return []
      const response = await axiosPrivate.get<
        SuppliersListResponse<TSupplier> | TSupplier[]
      >('/suppliers', {
        params: {
          search: searchTerm,
          limit: 15,
          purchaseType
        }
      })
      return Array.isArray(response.data)
        ? response.data
        : response.data.suppliers || []
    },
    { enabled: searchTerm.length >= 2, keepPreviousData: true }
  )
}

/** Detalle de un proveedor (GET /suppliers/:id). */
export const useSupplierDetails = <TSupplier = Supplier>(
  supplierId?: string,
  options?: QueryOptions<TSupplier>
) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<TSupplier, Error>(
    supplierKeys.details(supplierId),
    async () => {
      const response = await axiosPrivate.get<TSupplier>(
        `/suppliers/${supplierId}`
      )
      return response.data
    },
    { ...options, enabled: !!supplierId && (options?.enabled ?? true) }
  )
}

/** Resumen del estado de evaluación de un proveedor. */
export const useSupplierEvaluationStatusSummary = <TSummary>(
  supplierId?: string
) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<TSummary, Error>(
    supplierKeys.evaluationStatusSummary(supplierId),
    async () => {
      const response = await axiosPrivate.get<TSummary>(
        `/suppliers/${supplierId}/evaluation-status-summary`
      )
      return response.data
    },
    { enabled: !!supplierId }
  )
}

const EMPTY_CRITERIA: Criterion[] = []

/**
 * Criterios de selección de proveedores
 * (GET /suppliers/selection-supplier-sub-items) y sus categorías.
 * `criteria` y `categories` mantienen la misma referencia entre renders.
 */
export const useSupplierSelectionCriteria = (
  options?: QueryOptions<Criterion[]>
) => {
  const axiosPrivate = useAxiosPrivate()
  const query = useQuery<Criterion[], Error>(
    supplierKeys.selectionCriteria,
    async () => {
      const response = await axiosPrivate.get<Criterion[]>(
        '/suppliers/selection-supplier-sub-items'
      )
      return response.data.map((item) => ({
        ...item,
        requiresWhich: item.category === 'CALIDAD'
      })) as Criterion[]
    },
    options
  )
  const criteria = query.data ?? EMPTY_CRITERIA
  const categories = useMemo(
    () => [...new Set(criteria.map((item) => item.category))] as string[],
    [criteria]
  )
  return { ...query, criteria, categories }
}

/** Proveedores evaluados en la selección (GET /suppliers/selection-suppliers). */
export const useSupplierSelections = () => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<SelectionSupplier[], Error>(
    supplierKeys.selections,
    async () => {
      const response = await axiosPrivate.get<SelectionSupplier[]>(
        '/suppliers/selection-suppliers'
      )
      return response.data
    }
  )
}

interface SaveSupplierSelectionVars {
  /** true: edita la selección del proveedor `supplierId` (PUT). */
  isEdit?: boolean
  supplierId?: number | string | null
  payload: unknown
}

/**
 * Crea proveedor + evaluación de selección (POST /suppliers) o edita la
 * selección existente (PUT /suppliers/selection-suppliers/:supplierId).
 */
export const useSaveSupplierSelection = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  return useMutation<unknown, unknown, SaveSupplierSelectionVars>(
    async ({ isEdit, supplierId, payload }) => {
      if (isEdit) {
        await axiosPrivate.put(
          `/suppliers/selection-suppliers/${supplierId}`,
          payload
        )
      } else {
        await axiosPrivate.post('/suppliers', payload)
      }
    },
    {
      retry: false,
      onSuccess: () => {
        queryClient.invalidateQueries(supplierKeys.selections)
        queryClient.invalidateQueries(supplierKeys.list)
      }
    }
  )
}
