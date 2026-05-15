import { useCallback, useRef, useState } from 'react'
import { FileData } from '../types/fileTypes'
import useAxiosPrivate from '@utils/use-axios-private'
import { MRT_SortingState } from 'material-react-table'

interface FetchFilesOptions {
  pageIndex?: number
  pageSize?: number
  globalFilter?: string
  sorting?: MRT_SortingState
  force?: boolean
}

interface FilesResponse {
  items: FileData[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

let sharedInFlightQueryKey: string | null = null
let sharedLastCompletedQuery: {
  key: string
  timestamp: number
} | null = null

export const useFileData = () => {
  const [tableData, setTableData] = useState<FileData[]>([])
  const [loading, setLoading] = useState(false)
  const [rowCount, setRowCount] = useState(0)
  const axiosPrivate = useAxiosPrivate()
  const requestIdRef = useRef(0)
  const lastQueryRef = useRef<FetchFilesOptions>({
    pageIndex: 0,
    pageSize: 15,
    globalFilter: '',
    sorting: [{ id: 'nextCalibrationDate', desc: false }]
  })

  const fetchFiles = useCallback(async (options?: FetchFilesOptions) => {
    const nextQuery = {
      ...lastQueryRef.current,
      ...options
    }
    const { force = false, ...queryOptions } = nextQuery
    const primarySort = queryOptions.sorting?.[0]
    const queryKey = JSON.stringify({
      pageIndex: queryOptions.pageIndex ?? 0,
      pageSize: queryOptions.pageSize ?? 15,
      globalFilter: queryOptions.globalFilter ?? '',
      sortId: primarySort?.id ?? 'nextCalibrationDate',
      sortDesc: primarySort?.desc ?? false
    })

    if (!force && sharedInFlightQueryKey === queryKey) {
      return
    }

    const lastCompleted = sharedLastCompletedQuery
    if (
      !force &&
      lastCompleted?.key === queryKey &&
      Date.now() - lastCompleted.timestamp < 1000
    ) {
      return
    }

    lastQueryRef.current = queryOptions
    sharedInFlightQueryKey = queryKey
    const requestId = ++requestIdRef.current
    setLoading(true)

    try {
      const response = await axiosPrivate.get<FilesResponse>('/files', {
        params: {
          page: (queryOptions.pageIndex || 0) + 1,
          limit: queryOptions.pageSize || 15,
          search: queryOptions.globalFilter || '',
          sortBy: primarySort?.id || 'nextCalibrationDate',
          sortDirection: primarySort?.desc ? 'DESC' : 'ASC'
        }
      })

      if (requestId !== requestIdRef.current) {
        return
      }

      if (response.status === 200 && Array.isArray(response.data.items)) {
        setTableData(response.data.items)
        setRowCount(response.data.total || 0)
        sharedLastCompletedQuery = {
          key: queryKey,
          timestamp: Date.now()
        }
      } else {
        console.error('Unexpected response:', response)
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    } finally {
      if (requestId === requestIdRef.current) {
        sharedInFlightQueryKey = null
        setLoading(false)
      }
    }
  }, [axiosPrivate])

  return { tableData, loading, rowCount, fetchFiles }
}
