import { AxiosInstance } from 'axios'
import {
  MRT_ColumnFiltersState,
  MRT_PaginationState,
  MRT_SortingState
} from 'material-react-table'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/**
 * Paginación en servidor de los listados (ver `api.mmcs/PAGINATION.md`).
 *
 * Con `page`/`limit` el backend responde `{ items, totalItems, totalPages,
 * currentPage, limit }`; sin ellos responde como siempre (array u objeto).
 */
export interface PaginatedResponse<T> {
  items: T[]
  totalItems: number
  totalPages: number
  currentPage: number
  limit: number
}

export type ServerListParams = {
  page: number
  limit: number
  search?: string
  sortBy?: string
  order?: 'ASC' | 'DESC'
} & Record<string, string | number | boolean | undefined>

/** Límite máximo que acepta el backend por página. */
export const MAX_PAGE_SIZE = 100

/** Opciones de filas por página válidas para el backend (máx. 100). */
export const SERVER_PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

/** Quita los parámetros vacíos para no mandar `search=` ni filtros sin valor. */
export const cleanListParams = (params: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  )

/** `GET url?page=&limit=...` y devuelve la respuesta paginada estándar. */
export const fetchPaginated = async <T>(
  axiosPrivate: AxiosInstance,
  url: string,
  params: ServerListParams
): Promise<PaginatedResponse<T>> => {
  const response = await axiosPrivate.get<PaginatedResponse<T>>(url, {
    params: cleanListParams(params)
  })
  return response.data
}

/**
 * Total de filas que cumplen `filters` sin bajar la lista (`limit=1` y se lee
 * `totalItems`). Sirve para indicadores/KPIs.
 */
export const fetchTotal = async (
  axiosPrivate: AxiosInstance,
  url: string,
  filters: Record<string, string | number | boolean | undefined> = {}
): Promise<number> => {
  const page = await fetchPaginated<unknown>(axiosPrivate, url, {
    ...filters,
    page: 1,
    limit: 1
  })
  return page.totalItems
}

/**
 * Todas las filas que cumplen `filters`, recorriendo las páginas de 100 en
 * 100. Solo para subconjuntos acotados (p. ej. un estado concreto) que una
 * pantalla necesita completos y que el endpoint no puede contar por sí mismo.
 */
export const fetchAllPages = async <T>(
  axiosPrivate: AxiosInstance,
  url: string,
  filters: Record<string, string | number | boolean | undefined> = {}
): Promise<T[]> => {
  const rows: T[] = []
  let page = 1
  let totalPages = 1
  do {
    const result = await fetchPaginated<T>(axiosPrivate, url, {
      ...filters,
      page,
      limit: MAX_PAGE_SIZE
    })
    rows.push(...result.items)
    totalPages = result.totalPages
    page += 1
  } while (page <= totalPages)
  return rows
}

type Updater<T> = T | ((old: T) => T)

const resolve = <T>(updater: Updater<T>, old: T): T =>
  typeof updater === 'function' ? (updater as (old: T) => T)(old) : updater

export interface UseServerTableStateOptions {
  /**
   * Columnas que el endpoint acepta en `sortBy`. La clave es el id de la
   * columna de MRT y el valor el campo del backend (si son iguales, basta con
   * pasar un arreglo).
   */
  sortableFields?: readonly string[] | Record<string, string>
  /**
   * Filtros de columna que se mandan como filtros exactos al backend. La clave
   * es el id de la columna y el valor el nombre del parámetro.
   */
  exactFilters?: readonly string[] | Record<string, string>
  pageSize?: number
  debounceMs?: number
  /** Estado controlado desde fuera (p. ej. `usePersistentTableState`). */
  pagination?: MRT_PaginationState
  onPaginationChange?: (updater: Updater<MRT_PaginationState>) => void
  sorting?: MRT_SortingState
  onSortingChange?: (updater: Updater<MRT_SortingState>) => void
  columnFilters?: MRT_ColumnFiltersState
  onColumnFiltersChange?: (updater: Updater<MRT_ColumnFiltersState>) => void
  initialGlobalFilter?: string
  initialSorting?: MRT_SortingState
}

const toMap = (value?: readonly string[] | Record<string, string>) => {
  if (!value) return {} as Record<string, string>
  if (Array.isArray(value)) {
    return Object.fromEntries(value.map((key) => [key, key])) as Record<
      string,
      string
    >
  }
  return value as Record<string, string>
}

/**
 * Estado de una tabla de Material React Table paginada en servidor:
 * paginación, búsqueda global (con debounce) → `search`, ordenamiento →
 * `sortBy`/`order` (solo columnas permitidas) y filtros de columna exactos.
 *
 * Devuelve `params` para la query y `tableProps` para esparcir en la tabla.
 */
export const useServerTableState = (options: UseServerTableStateOptions = {}) => {
  const {
    sortableFields,
    exactFilters,
    pageSize = 10,
    debounceMs = 400,
    initialGlobalFilter = '',
    initialSorting = []
  } = options

  const sortMap = useMemo(() => toMap(sortableFields), [sortableFields])
  const filterMap = useMemo(() => toMap(exactFilters), [exactFilters])

  const [innerPagination, setInnerPagination] = useState<MRT_PaginationState>(
    { pageIndex: 0, pageSize }
  )
  const [innerSorting, setInnerSorting] = useState<MRT_SortingState>(initialSorting)
  const [innerColumnFilters, setInnerColumnFilters] =
    useState<MRT_ColumnFiltersState>([])
  const [globalFilter, setGlobalFilterState] = useState(initialGlobalFilter)
  const [search, setSearch] = useState(initialGlobalFilter.trim())

  const rawPagination = options.pagination ?? innerPagination
  // El backend corta en 100: no pidas más filas de las que va a devolver.
  const pagination = useMemo<MRT_PaginationState>(
    () => ({
      pageIndex: rawPagination.pageIndex,
      pageSize: Math.min(rawPagination.pageSize, MAX_PAGE_SIZE)
    }),
    [rawPagination.pageIndex, rawPagination.pageSize]
  )
  const sorting = options.sorting ?? innerSorting
  const columnFilters = options.columnFilters ?? innerColumnFilters

  const externalPaginationChange = options.onPaginationChange
  const setPagination = useCallback(
    (updater: Updater<MRT_PaginationState>) => {
      if (externalPaginationChange) externalPaginationChange(updater)
      else setInnerPagination((old) => resolve(updater, old))
    },
    [externalPaginationChange]
  )

  const goToFirstPage = useCallback(() => {
    setPagination((old) =>
      old.pageIndex === 0 ? old : { ...old, pageIndex: 0 }
    )
  }, [setPagination])

  const externalSortingChange = options.onSortingChange
  const setSorting = useCallback(
    (updater: Updater<MRT_SortingState>) => {
      if (externalSortingChange) externalSortingChange(updater)
      else setInnerSorting((old) => resolve(updater, old))
      goToFirstPage()
    },
    [externalSortingChange, goToFirstPage]
  )

  const externalFiltersChange = options.onColumnFiltersChange
  const setColumnFilters = useCallback(
    (updater: Updater<MRT_ColumnFiltersState>) => {
      if (externalFiltersChange) externalFiltersChange(updater)
      else setInnerColumnFilters((old) => resolve(updater, old))
      goToFirstPage()
    },
    [externalFiltersChange, goToFirstPage]
  )

  const setGlobalFilter = useCallback((value: string | undefined) => {
    setGlobalFilterState(value ?? '')
  }, [])

  // Debounce de la búsqueda: solo se consulta cuando el usuario deja de escribir.
  const lastSearch = useRef(search)
  useEffect(() => {
    const handle = setTimeout(() => {
      const next = globalFilter.trim()
      if (next === lastSearch.current) return
      lastSearch.current = next
      setSearch(next)
      goToFirstPage()
    }, debounceMs)
    return () => clearTimeout(handle)
  }, [globalFilter, debounceMs, goToFirstPage])

  const params = useMemo<ServerListParams>(() => {
    const result: ServerListParams = {
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize
    }
    if (search) result.search = search
    const sort = sorting[0]
    if (sort && sortMap[sort.id]) {
      result.sortBy = sortMap[sort.id]
      result.order = sort.desc ? 'DESC' : 'ASC'
    }
    columnFilters.forEach(({ id, value }) => {
      const param = filterMap[id]
      if (!param) return
      if (typeof value === 'string' && value.trim()) {
        result[param] = value.trim()
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        result[param] = value
      }
    })
    return result
  }, [pagination, search, sorting, sortMap, columnFilters, filterMap])

  const tableProps = {
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    enableMultiSort: false,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    muiTablePaginationProps: {
      rowsPerPageOptions: SERVER_PAGE_SIZE_OPTIONS
    }
  }

  return {
    params,
    pagination,
    sorting,
    columnFilters,
    globalFilter,
    setPagination,
    setSorting,
    setColumnFilters,
    setGlobalFilter,
    goToFirstPage,
    tableProps,
    /** Estado para `state={{ ... }}` de la tabla. */
    tableState: { pagination, sorting, columnFilters, globalFilter }
  }
}

/**
 * Si la página actual dejó de existir (p. ej. tras borrar la última fila de la
 * última página), vuelve a la última página disponible.
 */
export const useKeepPageInRange = (
  totalPages: number | undefined,
  pageIndex: number,
  setPagination: (updater: Updater<MRT_PaginationState>) => void
) => {
  useEffect(() => {
    if (totalPages && pageIndex > totalPages - 1) {
      setPagination((old) => ({ ...old, pageIndex: totalPages - 1 }))
    }
  }, [totalPages, pageIndex, setPagination])
}
