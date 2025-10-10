import { MaterialReactTable, MRT_PaginationState, MRT_ColumnFiltersState, MRT_SortingState } from 'material-react-table'
import { FileData } from '../types/fileTypes'
import { createTableColumns } from './tableColumns'
import { useMemo, useState, useEffect } from 'react'
import { useValidation } from '../hooks/useValidation'
import { Link } from 'react-router-dom'
import { Box, Button, IconButton, Tooltip, Typography, Chip } from '@mui/material'
import { Delete, FileDownload, Visibility, Add, FilterAltOff } from '@mui/icons-material'
import { userStore } from '@stores/userStore'
import { useStore } from '@nanostores/react'
import { useFileActions } from '../hooks/useFileActions'
import useAxiosPrivate from '@utils/use-axios-private'
import { handleDownload } from '../utils/fileHandlers'
import PDFViewer from 'src/Components/PDFViewer'

// Key for sessionStorage
const TABLE_STATE_KEY = 'calibration-table-state'

interface TableViewProps {
  data: FileData[]
  fetchFiles: () => Promise<void>
  axiosPrivate: ReturnType<typeof useAxiosPrivate>
  openModal: React.Dispatch<React.SetStateAction<boolean>>
}

export const TableView = ({
  data,
  fetchFiles,
  axiosPrivate,
  openModal
}: TableViewProps) => {
  const $userStore = useStore(userStore)
  const { handleDeleteRow } = useFileActions(axiosPrivate, fetchFiles)
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string
  }>({})
  const { getCommonEditTextFieldProps } = useValidation(
    validationErrors,
    setValidationErrors
  )

  // Load saved state from sessionStorage
  const loadSavedState = () => {
    try {
      const saved = sessionStorage.getItem(TABLE_STATE_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error('Error loading table state:', error)
    }
    return null
  }

  const savedState = loadSavedState()

  // Table state
  const [pagination, setPagination] = useState<MRT_PaginationState>(
    savedState?.pagination || { pageSize: 15, pageIndex: 0 }
  )
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>(
    savedState?.columnFilters || []
  )
  const [sorting, setSorting] = useState<MRT_SortingState>(
    savedState?.sorting || []
  )
  const [globalFilter, setGlobalFilter] = useState<string>(
    savedState?.globalFilter || ''
  )

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    const state = {
      pagination,
      columnFilters,
      sorting,
      globalFilter
    }
    try {
      sessionStorage.setItem(TABLE_STATE_KEY, JSON.stringify(state))
    } catch (error) {
      console.error('Error saving table state:', error)
    }
  }, [pagination, columnFilters, sorting, globalFilter])

  // Function to clear all filters and reset state
  const handleClearFilters = () => {
    setPagination({ pageSize: 15, pageIndex: 0 })
    setColumnFilters([])
    setSorting([])
    setGlobalFilter('')
    sessionStorage.removeItem(TABLE_STATE_KEY)
  }

  // Check if any filters are active
  const hasActiveFilters = columnFilters.length > 0 || globalFilter !== '' || sorting.length > 0

  const columns = useMemo(
    () => createTableColumns(getCommonEditTextFieldProps),
    [getCommonEditTextFieldProps]
  )

  return (
    <MaterialReactTable
      columns={columns}
      data={data}
      positionActionsColumn='first'
      enableRowActions={true}
      enableColumnOrdering
      enableStickyHeader
      enablePagination
      // Controlled state
      state={{
        pagination,
        columnFilters,
        sorting,
        globalFilter
      }}
      onPaginationChange={setPagination}
      onColumnFiltersChange={setColumnFilters}
      onSortingChange={setSorting}
      onGlobalFilterChange={setGlobalFilter}
      initialState={{
        density: 'comfortable',
        columnVisibility: { filePath: false },
        showGlobalFilter: true
      }}
      enableRowVirtualization
      enableColumnResizing
      columnResizeMode="onChange"
      manualPagination={false}
      manualFiltering={false}
      manualSorting={false}
      muiTablePaperProps={{
        elevation: 0,
        sx: {
          borderRadius: '0',
          border: 'none',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
      muiTableContainerProps={{
        sx: {
          borderRadius: '12px',
          maxHeight: '100%',
          flex: 1,
          overflow: 'auto'
        }
      }}
      muiTableProps={{
        sx: {
          tableLayout: 'fixed',
          '& .MuiTableCell-root': {
            borderColor: '#f3f4f6'
          }
        }
      }}
      muiTableHeadCellProps={{
        sx: {
          backgroundColor: '#f9fafb',
          color: '#374151',
          fontWeight: 700,
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          borderBottom: '2px solid #e5e7eb',
          py: 2,
          px: 1.5,
          whiteSpace: 'normal',
          wordWrap: 'break-word',
          lineHeight: 1.3,
          '&:first-of-type': {
            borderTopLeftRadius: '12px'
          },
          '&:last-of-type': {
            borderTopRightRadius: '12px'
          },
          '& .Mui-TableHeadCell-Content': {
            whiteSpace: 'normal',
            overflow: 'visible'
          }
        }
      }}
      muiTableBodyProps={{
        sx: {
          '& tr:hover': {
            backgroundColor: '#f0fdf4 !important',
            transition: 'background-color 0.2s ease'
          }
        }
      }}
      muiTableBodyCellProps={{
        sx: {
          fontSize: '0.8125rem',
          color: '#1f2937',
          py: 1.5,
          px: 1.5,
          borderColor: '#f3f4f6',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }
      }}
      muiTableBodyRowProps={({ row }) => ({
        sx: {
          backgroundColor: row.index % 2 === 0 ? '#ffffff' : '#fafafa',
          '&:hover': {
            backgroundColor: '#f0fdf4 !important',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }
        }
      })}
      muiTopToolbarProps={{
        sx: {
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          py: 2
        }
      }}
      muiBottomToolbarProps={{
        sx: {
          backgroundColor: '#ffffff',
          borderTop: '1px solid #e5e7eb'
        }
      }}
      muiPaginationProps={{
        color: 'primary',
        shape: 'rounded',
        showRowsPerPage: true,
        variant: 'outlined',
        sx: {
          '& .MuiPaginationItem-root': {
            borderRadius: '8px',
            '&.Mui-selected': {
              backgroundColor: '#10b981',
              color: 'white',
              '&:hover': {
                backgroundColor: '#059669'
              }
            }
          }
        }
      }}
      renderRowActions={({ row }) => {
        return (
          <Box sx={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            {$userStore.rol.some((role) => ['admin'].includes(role)) && (
              <Tooltip arrow placement='top' title='Eliminar'>
                <IconButton
                  onClick={() => handleDeleteRow(Number(row.original.id))}
                  sx={{
                    color: '#ef4444',
                    '&:hover': {
                      backgroundColor: '#fee2e2',
                      color: '#dc2626'
                    }
                  }}
                >
                  <Delete />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip arrow placement='top' title='Descargar'>
              <IconButton
                onClick={() =>
                  handleDownload(row.original.filePath, axiosPrivate)
                }
                sx={{
                  color: '#10b981',
                  '&:hover': {
                    backgroundColor: '#d1fae5',
                    color: '#059669'
                  }
                }}
              >
                <FileDownload />
              </IconButton>
            </Tooltip>
            <Tooltip arrow placement='top' title='Ver archivo'>
              <Link to={`${row.original.id}`} style={{ textDecoration: 'none' }}>
                <IconButton
                  sx={{
                    color: '#3b82f6',
                    '&:hover': {
                      backgroundColor: '#dbeafe',
                      color: '#2563eb'
                    }
                  }}
                >
                  <Visibility />
                </IconButton>
              </Link>
            </Tooltip>
          </Box>
        )
      }}
      renderTopToolbarCustomActions={() => {
        return (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {hasActiveFilters && (
              <Chip
                label={`${columnFilters.length + (globalFilter ? 1 : 0)} filtro(s) activo(s)`}
                onDelete={handleClearFilters}
                deleteIcon={<FilterAltOff />}
                sx={{
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  fontWeight: 600,
                  '& .MuiChip-deleteIcon': {
                    color: '#92400e',
                    '&:hover': {
                      color: '#78350f'
                    }
                  }
                }}
              />
            )}

            {$userStore.rol.some((role) => ['admin', 'metrologist'].includes(role)) && (
              <Button
                onClick={() => openModal(true)}
                variant='contained'
                startIcon={<Add />}
                sx={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1.5,
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    boxShadow: '0 6px 16px rgba(16, 185, 129, 0.4)',
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Subir Nuevo Certificado
              </Button>
            )}
          </Box>
        )
      }}
      renderDetailPanel={({ row }) => {
        return (
          <Box
            sx={{
              p: 4,
              backgroundColor: '#f9fafb',
              borderRadius: '12px',
              m: 2
            }}
          >
            <Box
              sx={{
                mb: 3,
                pb: 2,
                borderBottom: '2px solid #e5e7eb'
              }}
            >
              <Typography
                variant='h6'
                sx={{
                  color: '#374151',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Visibility sx={{ color: '#10b981' }} />
                Vista Previa del Certificado
              </Typography>
              <Typography variant='body2' sx={{ color: '#6b7280', mt: 1 }}>
                {row.original.customer?.nombre} - {row.original.device?.name}
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                backgroundColor: 'white',
                borderRadius: '8px',
                p: 2,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
              }}
            >
              <PDFViewer path={row.original.filePath} />
            </Box>
          </Box>
        )
      }}
      displayColumnDefOptions={{
        'mrt-row-actions': {
          header: 'Acciones',
          muiTableHeadCellProps: {
            align: 'center',
            sx: {
              backgroundColor: '#f9fafb',
              color: '#374151',
              fontWeight: 700
            }
          },
          size: 150
        }
      }}
    />
  )
}
