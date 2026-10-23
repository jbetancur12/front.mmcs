import {
  Add,
  DeleteOutline,
  Devices,
  Download,
  LocationOnOutlined,
  VisibilityOutlined
} from '@mui/icons-material'
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography
} from '@mui/material'
import {
  MRT_ColumnDef,
  MRT_PaginationState,
  MRT_ShowHideColumnsButton
} from 'material-react-table'
import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ROLE_GROUPS, hasAnyRole } from 'src/constants/roles'

import ConfirmDialog from '../Common/ConfirmDialog'
import DataTable from '../Common/DataTable'
import EmptyState from '../Common/EmptyState'
import StatusPill, { StatusPillTone } from '../Common/StatusPill'
import { notify } from 'src/utils/notify'

import { STATUS_LABELS } from './constants'
import EquipmentSedeDialog from './EquipmentSedeDialog'
import {
  Certificate,
  CertificatesApiResponse,
  DownloadFilter,
  StatusFilter
} from './types'

/** El servidor responde de a 9 equipos por página. */
const PAGE_SIZE = 9

interface EquipmentTableProps {
  apiResponse?: CertificatesApiResponse
  certificatesData: Certificate[]
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: StatusFilter | null
  onStatusFilter: (status: StatusFilter) => void
  matchedFields: string[]
  canCreateFile: boolean
  onOpenCreateModal: () => void
  isDownloading: boolean
  onDownload: (type: DownloadFilter) => void
  handleDelete: (certificateId: number) => Promise<void>
  onChanged: () => void
  sedes: string[]
  rol: string[]
  currentPage: number
  onPageChange: (page: number) => void
}

const getCalibrationStatus = (
  nextCalibrationDate?: string
): { tone: StatusPillTone; label: string } => {
  if (!nextCalibrationDate) return { tone: 'idle', label: 'Sin fecha' }
  const now = new Date()
  const next = new Date(nextCalibrationDate)
  const inThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  if (next < now) return { tone: 'error', label: 'Vencido' }
  if (next <= inThirtyDays)
    return { tone: 'warning', label: 'Próximo a vencer' }
  return { tone: 'success', label: 'Vigente' }
}

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString('es-CO') : '—'

const primaryButtonSx = {
  bgcolor: '#00BFA5',
  borderRadius: '10px',
  textTransform: 'none',
  fontWeight: 700,
  boxShadow: 'none',
  whiteSpace: 'nowrap',
  '&:hover': { bgcolor: '#00ACC1', boxShadow: 'none' }
} as const

const secondaryButtonSx = {
  borderRadius: '10px',
  textTransform: 'none',
  fontWeight: 600,
  borderColor: '#e5e7eb',
  color: '#374151',
  bgcolor: '#fff',
  whiteSpace: 'nowrap',
  '&:hover': {
    borderColor: '#00897B',
    color: '#00695C',
    bgcolor: '#E0F7F4'
  }
} as const

/**
 * Equipos del cliente en una tabla del sistema (`DataTable`): búsqueda en el
 * servidor con conteo, estado de calibración con color y texto, acciones
 * fijas a la derecha y paginación de a 9.
 */
const EquipmentTable: React.FC<EquipmentTableProps> = ({
  apiResponse,
  certificatesData,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilter,
  matchedFields,
  canCreateFile,
  onOpenCreateModal,
  isDownloading,
  onDownload,
  handleDelete,
  onChanged,
  sedes,
  rol,
  currentPage,
  onPageChange
}) => {
  const navigate = useNavigate()
  const isStaff = hasAnyRole(rol, ROLE_GROUPS.METROLOGY_STAFF)
  const [downloadAnchor, setDownloadAnchor] = useState<null | HTMLElement>(null)
  const [sedeTarget, setSedeTarget] = useState<Certificate | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Certificate | null>(null)
  const [deleting, setDeleting] = useState(false)

  const columns = useMemo<MRT_ColumnDef<Certificate>[]>(
    () => [
      {
        id: 'equipo',
        header: 'Equipo',
        size: 320,
        accessorFn: (row) => row.device?.name || 'Equipo sin nombre',
        Cell: ({ row }) => {
          const name = row.original.device?.name || 'Equipo sin nombre'
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: '#00BFA5',
                  fontSize: 14,
                  fontWeight: 700
                }}
              >
                {name.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant='body2' fontWeight={600}>
                  {name}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  Serie {row.original.serie || '—'} · Activo{' '}
                  {row.original.activoFijo || '—'}
                </Typography>
              </Box>
            </Box>
          )
        }
      },
      {
        accessorKey: 'headquarter',
        header: 'Sede',
        size: 140,
        Cell: ({ cell }) => {
          const sede = cell.getValue<string>()
          return sede ? (
            <Chip label={sede} size='small' variant='outlined' />
          ) : (
            <Typography variant='body2' color='text.secondary'>
              Sin sede
            </Typography>
          )
        }
      },
      {
        accessorKey: 'calibrationDate',
        header: 'Última calibración',
        size: 150,
        Cell: ({ cell }) => formatDate(cell.getValue<string>())
      },
      {
        accessorKey: 'nextCalibrationDate',
        header: 'Próxima calibración',
        size: 150,
        Cell: ({ cell }) => formatDate(cell.getValue<string>())
      },
      {
        id: 'estado',
        header: 'Estado',
        size: 160,
        accessorFn: (row) =>
          getCalibrationStatus(row.nextCalibrationDate).label,
        Cell: ({ row }) => {
          const status = getCalibrationStatus(row.original.nextCalibrationDate)
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StatusPill
                size='small'
                tone={status.tone}
                label={status.label}
              />
              {!row.original.filePath ? (
                <Tooltip title='No hay certificado disponible'>
                  <Chip
                    size='small'
                    variant='outlined'
                    color='error'
                    label='Sin cert.'
                  />
                </Tooltip>
              ) : null}
            </Box>
          )
        }
      }
    ],
    []
  )

  const pagination: MRT_PaginationState = {
    pageIndex: currentPage - 1,
    pageSize: PAGE_SIZE
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await handleDelete(deleteTarget.id)
      notify.success('Equipo eliminado exitosamente')
      setDeleteTarget(null)
    } catch (error) {
      notify.error('Error al eliminar el equipo')
      console.error('Error deleting equipment:', error)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <DataTable<Certificate>
        columns={columns}
        data={certificatesData}
        itemLabel={['equipo', 'equipos']}
        searchPlaceholder='Buscar por nombre, serie o activo fijo'
        // Búsqueda y paginación las hace el servidor
        manualFiltering
        manualPagination
        enableSorting={false}
        enableColumnFilters={false}
        rowCount={apiResponse?.totalFiles ?? 0}
        state={{
          globalFilter: searchTerm,
          pagination,
          isLoading: !apiResponse
        }}
        onGlobalFilterChange={(value) => onSearchChange(value ?? '')}
        onPaginationChange={(updater) => {
          const next =
            typeof updater === 'function' ? updater(pagination) : updater
          onPageChange(next.pageIndex + 1)
        }}
        muiTablePaginationProps={{
          rowsPerPageOptions: [PAGE_SIZE],
          showFirstButton: false,
          showLastButton: false
        }}
        muiTableBodyRowProps={({ row }) => ({
          onClick: () =>
            navigate(`/calibraciones/certificados/${row.original.id}`),
          sx: { cursor: 'pointer' }
        })}
        muiTableContainerProps={{ sx: { maxHeight: 'none' } }}
        enableRowActions
        positionActionsColumn='last'
        renderRowActions={({ row }) => (
          <Box
            sx={{ display: 'flex', gap: 0.5 }}
            onClick={(event) => event.stopPropagation()}
          >
            <Tooltip title='Ver certificado'>
              <IconButton
                size='small'
                aria-label='Ver certificado'
                sx={{ color: '#00695C' }}
                onClick={() =>
                  navigate(`/calibraciones/certificados/${row.original.id}`)
                }
              >
                <VisibilityOutlined fontSize='small' />
              </IconButton>
            </Tooltip>
            {isStaff ? (
              <>
                <Tooltip title='Cambiar sede'>
                  <IconButton
                    size='small'
                    aria-label='Cambiar sede del equipo'
                    sx={{ color: '#2563eb' }}
                    onClick={() => setSedeTarget(row.original)}
                  >
                    <LocationOnOutlined fontSize='small' />
                  </IconButton>
                </Tooltip>
                <Tooltip title='Eliminar'>
                  <IconButton
                    size='small'
                    aria-label='Eliminar equipo'
                    color='error'
                    onClick={() => setDeleteTarget(row.original)}
                  >
                    <DeleteOutline fontSize='small' />
                  </IconButton>
                </Tooltip>
              </>
            ) : null}
          </Box>
        )}
        renderTopToolbarCustomActions={() => (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              flexWrap: 'wrap'
            }}
          >
            {statusFilter ? (
              <Chip
                label={`Mostrando: ${STATUS_LABELS[statusFilter]}`}
                onDelete={() => onStatusFilter(statusFilter)}
                sx={{ fontWeight: 600, bgcolor: '#E0F7F4', color: '#00695C' }}
              />
            ) : null}
            {searchTerm && matchedFields.length > 0 ? (
              <Typography variant='caption' color='text.secondary'>
                Coincidencias en: {matchedFields.join(', ')}
              </Typography>
            ) : null}
          </Box>
        )}
        renderToolbarInternalActions={({ table }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant='outlined'
              startIcon={
                isDownloading ? (
                  <CircularProgress size={16} color='inherit' />
                ) : (
                  <Download />
                )
              }
              onClick={(event) => setDownloadAnchor(event.currentTarget)}
              disabled={isDownloading}
              sx={secondaryButtonSx}
            >
              {isDownloading ? 'Descargando…' : 'Exportar Excel'}
            </Button>
            {canCreateFile ? (
              <Button
                variant='contained'
                startIcon={<Add />}
                onClick={onOpenCreateModal}
                sx={primaryButtonSx}
              >
                Subir certificado
              </Button>
            ) : null}
            <MRT_ShowHideColumnsButton table={table} />
          </Box>
        )}
        renderEmptyRowsFallback={() => (
          <EmptyState
            icon={<Devices />}
            title={
              searchTerm || statusFilter
                ? 'No se encontraron equipos'
                : 'No hay equipos registrados'
            }
            hint={
              searchTerm || statusFilter
                ? 'Prueba con otros términos o quita los filtros.'
                : 'Este cliente aún no tiene equipos en el sistema.'
            }
            action={
              searchTerm ? (
                <Button
                  variant='outlined'
                  onClick={() => onSearchChange('')}
                  sx={secondaryButtonSx}
                >
                  Limpiar búsqueda
                </Button>
              ) : undefined
            }
          />
        )}
      />

      <Menu
        anchorEl={downloadAnchor}
        open={Boolean(downloadAnchor)}
        onClose={() => setDownloadAnchor(null)}
        slotProps={{ paper: { sx: { borderRadius: '12px', mt: 1 } } }}
      >
        <MenuItem
          onClick={() => {
            setDownloadAnchor(null)
            onDownload('all')
          }}
        >
          Todos los equipos
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDownloadAnchor(null)
            onDownload('nextOrExpired')
          }}
        >
          Próximos a vencer y vencidos
        </MenuItem>
      </Menu>

      <EquipmentSedeDialog
        certificate={sedeTarget}
        sedes={sedes}
        onClose={() => setSedeTarget(null)}
        onChanged={onChanged}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title='Eliminar equipo'
        tone='danger'
        message={
          <>
            Vas a eliminar <strong>{deleteTarget?.device?.name}</strong> (serie{' '}
            {deleteTarget?.serie || 'sin especificar'}) y su certificado. Esta
            acción no se puede deshacer.
          </>
        }
        confirmLabel='Eliminar'
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  )
}

export default EquipmentTable
