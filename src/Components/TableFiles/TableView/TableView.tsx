import { MRT_PaginationState, MRT_SortingState } from 'material-react-table'
import DataTable from 'src/Components/Common/DataTable'
import { FileData } from '../types/fileTypes'
import { createTableColumns } from './tableColumns'
import { useMemo, useState, useEffect } from 'react'
import { useValidation } from '../hooks/useValidation'
import { useNavigate } from 'react-router-dom'
import { Box, Button, IconButton, Tooltip, Chip } from '@mui/material'
import {
  Add,
  DeleteOutline,
  FileDownloadOutlined,
  FilterAltOff,
  VisibilityOutlined
} from '@mui/icons-material'
import { useFileActions } from '../hooks/useFileActions'
import useAxiosPrivate from '@utils/use-axios-private'
import { handleDownload } from '../utils/fileHandlers'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'
import { logger } from 'src/utils/logger'

// Key for sessionStorage
const TABLE_STATE_KEY = 'calibration-table-state'

interface TableViewProps {
  data: FileData[]
  rowCount: number
  loading: boolean
  fetchFiles: (options?: {
    pageIndex?: number
    pageSize?: number
    globalFilter?: string
    sorting?: MRT_SortingState
    force?: boolean
  }) => Promise<void>
  axiosPrivate: ReturnType<typeof useAxiosPrivate>
  openModal: React.Dispatch<React.SetStateAction<boolean>>
}

export const TableView = ({
  data,
  rowCount,
  loading,
  fetchFiles,
  axiosPrivate,
  openModal
}: TableViewProps) => {
  const navigate = useNavigate()
  const canDeleteFile = useCan(PERMISSIONS.CALIBRATION_FILE_DELETE)
  const canCreateFile = useCan(PERMISSIONS.CALIBRATION_FILE_CREATE)
  const { handleDeleteRow } = useFileActions(axiosPrivate, fetchFiles)
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string
  }>({})
  const { getCommonEditTextFieldProps } = useValidation(
    validationErrors,
    setValidationErrors
  )

  // Load saved state from localStorage
  const loadSavedState = () => {
    try {
      const saved = localStorage.getItem(TABLE_STATE_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      logger.error('Error loading table state:', error)
    }
    return null
  }

  const savedState = loadSavedState()

  // Table state
  const [pagination, setPagination] = useState<MRT_PaginationState>(
    savedState?.pagination || { pageSize: 15, pageIndex: 0 }
  )
  const [sorting, setSorting] = useState<MRT_SortingState>(
    savedState?.sorting || [{ id: 'nextCalibrationDate', desc: false }]
  )
  const [globalFilter, setGlobalFilter] = useState<string>(
    savedState?.globalFilter || ''
  )
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState(
    savedState?.globalFilter || ''
  )

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const state = {
      pagination,
      sorting,
      globalFilter
    }
    try {
      localStorage.setItem(TABLE_STATE_KEY, JSON.stringify(state))
    } catch (error) {
      logger.error('Error saving table state:', error)
    }
  }, [pagination, sorting, globalFilter])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedGlobalFilter(globalFilter)
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [globalFilter])

  useEffect(() => {
    fetchFiles({
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      globalFilter: debouncedGlobalFilter,
      sorting
    })
  }, [
    fetchFiles,
    pagination.pageIndex,
    pagination.pageSize,
    debouncedGlobalFilter,
    sorting
  ])

  // Function to clear all filters and reset state
  const handleClearFilters = () => {
    setPagination({ pageSize: 15, pageIndex: 0 })
    setSorting([])
    setGlobalFilter('')
    localStorage.removeItem(TABLE_STATE_KEY)
  }

  // Check if any filters are active
  const hasActiveFilters = globalFilter !== '' || sorting.length > 0

  const handlePaginationChange = (
    updater:
      | MRT_PaginationState
      | ((prevState: MRT_PaginationState) => MRT_PaginationState)
  ) => {
    setPagination((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater

      if (
        next.pageIndex === prev.pageIndex &&
        next.pageSize === prev.pageSize
      ) {
        return prev
      }

      return next
    })
  }

  const columns = useMemo(
    () => createTableColumns(getCommonEditTextFieldProps),
    [getCommonEditTextFieldProps]
  )

  return (
    <DataTable<FileData>
      columns={columns}
      data={data}
      itemLabel={['certificado', 'certificados']}
      searchPlaceholder='Buscar certificados'
      enableColumnFilters={false}
      // Búsqueda, orden y paginación las hace el servidor
      manualPagination
      manualFiltering
      manualSorting
      rowCount={rowCount}
      autoResetPageIndex={false}
      state={{
        isLoading: loading,
        pagination,
        sorting,
        globalFilter
      }}
      onPaginationChange={handlePaginationChange}
      onSortingChange={(updater) => {
        const nextSorting =
          typeof updater === 'function' ? updater(sorting) : updater
        setPagination((prev) => ({ ...prev, pageIndex: 0 }))
        setSorting(nextSorting)
      }}
      onGlobalFilterChange={(value) => {
        setPagination((prev) => ({ ...prev, pageIndex: 0 }))
        setGlobalFilter(value ?? '')
      }}
      // La columna del enlace del archivo (id 13) solo alimenta la descarga
      initialState={{ columnVisibility: { '13': false } }}
      muiTableContainerProps={{
        sx: { maxHeight: 'calc(100vh - 360px)', minHeight: 320 }
      }}
      muiTableBodyRowProps={({ row }) => ({
        onClick: () => navigate(`${row.original.id}`),
        sx: { cursor: 'pointer' }
      })}
      enableRowActions
      renderRowActions={({ row }) => (
        <Box
          sx={{ display: 'flex', gap: 0.5 }}
          onClick={(event) => event.stopPropagation()}
        >
          <Tooltip arrow placement='top' title='Ver certificado'>
            <IconButton
              size='small'
              aria-label='Ver certificado'
              sx={{ color: '#00695C' }}
              onClick={() => navigate(`${row.original.id}`)}
            >
              <VisibilityOutlined fontSize='small' />
            </IconButton>
          </Tooltip>
          <Tooltip arrow placement='top' title='Descargar'>
            <IconButton
              size='small'
              aria-label='Descargar certificado'
              sx={{ color: '#2563eb' }}
              onClick={() =>
                handleDownload(row.original.filePath, axiosPrivate)
              }
            >
              <FileDownloadOutlined fontSize='small' />
            </IconButton>
          </Tooltip>
          {canDeleteFile && (
            <Tooltip arrow placement='top' title='Eliminar'>
              <IconButton
                size='small'
                color='error'
                aria-label='Eliminar certificado'
                onClick={() =>
                  handleDeleteRow(
                    Number(row.original.id),
                    row.original.filePath
                  )
                }
              >
                <DeleteOutline fontSize='small' />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}
      renderTopToolbarCustomActions={() => (
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            flexWrap: 'wrap'
          }}
        >
          {hasActiveFilters && (
            <Chip
              variant='outlined'
              label={`${(globalFilter ? 1 : 0) + (sorting.length > 0 ? 1 : 0)} filtro(s) activo(s)`}
              onDelete={handleClearFilters}
              deleteIcon={<FilterAltOff />}
              sx={{ fontWeight: 600, color: '#00695C', borderColor: '#b2ebe3' }}
            />
          )}
          {canCreateFile && (
            <Button
              onClick={() => openModal(true)}
              variant='contained'
              startIcon={<Add />}
              sx={{
                bgcolor: '#00BFA5',
                whiteSpace: 'nowrap',
                '&:hover': { bgcolor: '#00ACC1' }
              }}
            >
              Subir nuevo certificado
            </Button>
          )}
        </Box>
      )}
    />
  )
}
