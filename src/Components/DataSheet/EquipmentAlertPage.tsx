import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Avatar,
  Box,
  Container,
  Grid,
  IconButton,
  Skeleton,
  Tooltip,
  Typography
} from '@mui/material'
import {
  Build as BuildIcon,
  Engineering as EngineeringIcon,
  NotificationsActive as NotificationsActiveIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  TaskAltOutlined,
  VisibilityOutlined
} from '@mui/icons-material'
import { type MRT_ColumnDef } from 'material-react-table'
import { useNavigate } from 'react-router-dom'
import useAxiosPrivate from '@utils/use-axios-private'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import DataTable from '../Common/DataTable'
import EmptyState from '../Common/EmptyState'
import StatusPill, { StatusPillTone } from '../Common/StatusPill'
import { bigToast } from '../ExcelManipulation/Utils'

export type EquipmentData = {
  id: number
  internalCode: string
  equipmentName: string
  brand?: string
  model?: string
  location?: string
  isCalibrationDueSoon: boolean
  isInspectionDueSoon: boolean
  calibrationDueDate?: string
  inspectionDueDate?: string
  calibrationDaysRemaining?: number | null
  inspectionDaysRemaining?: number | null
  priority?: 'high' | 'medium' | 'low'
}

type AlertFilter = 'all' | 'calibration' | 'inspection'

/** Equipo con los días de su alerta más atrasada, para ordenar y priorizar. */
type AlertRow = EquipmentData & { worstDays: number }

/**
 * Prioridad por antigüedad: la que manda el servidor es "alta" para todos y
 * no ayuda a decidir qué atender primero.
 */
const priorityOf = (days: number): { tone: StatusPillTone; label: string } => {
  if (days >= 0) return { tone: 'warning', label: 'Por vencer' }
  if (days < -365) return { tone: 'error', label: 'Más de 1 año vencido' }
  if (days < -90) return { tone: 'warning', label: '3 a 12 meses vencido' }
  return { tone: 'idle', label: 'Menos de 3 meses' }
}

const daysText = (days?: number | null) => {
  if (days === null || days === undefined) return ''
  if (days === 0) return 'vence hoy'
  const abs = Math.abs(days).toLocaleString('es-CO')
  const unit = Math.abs(days) === 1 ? 'día' : 'días'
  return days < 0 ? `hace ${abs} ${unit}` : `en ${abs} ${unit}`
}

const formatDate = (value?: string) =>
  value ? new Date(`${value}T00:00:00`).toLocaleDateString('es-CO') : '—'

/**
 * Alertas de la hoja de vida: equipos con calibración o inspección vencida
 * o por vencer. La tabla arranca con lo más atrasado arriba.
 */
const EquipmentAlertsPage: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const navigate = useNavigate()
  const [equipments, setEquipments] = useState<EquipmentData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<AlertFilter>('all')

  const fetchEquipmentData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await axiosPrivate('/dataSheet/alerts')
      setEquipments(response.data)
      return true
    } catch (error) {
      console.error('Error fetching equipment data:', error)
      bigToast('No se pudieron cargar las alertas de equipos', 'error')
      return false
    } finally {
      setLoading(false)
    }
  }, [axiosPrivate])

  useEffect(() => {
    fetchEquipmentData()
  }, [fetchEquipmentData])

  const handleRefresh = async () => {
    setRefreshing(true)
    const success = await fetchEquipmentData()
    setRefreshing(false)
    if (success) bigToast('Alertas actualizadas', 'success')
  }

  const rows = useMemo<AlertRow[]>(
    () =>
      equipments
        .map((equipment) => {
          const days = [
            equipment.isCalibrationDueSoon
              ? equipment.calibrationDaysRemaining
              : null,
            equipment.isInspectionDueSoon
              ? equipment.inspectionDaysRemaining
              : null
          ].filter((value): value is number => typeof value === 'number')
          return {
            ...equipment,
            worstDays: days.length > 0 ? Math.min(...days) : 0
          }
        })
        .sort((a, b) => a.worstDays - b.worstDays),
    [equipments]
  )

  const counts = useMemo(
    () => ({
      all: rows.length,
      calibration: rows.filter((row) => row.isCalibrationDueSoon).length,
      inspection: rows.filter((row) => row.isInspectionDueSoon).length
    }),
    [rows]
  )

  const visibleRows = useMemo(
    () =>
      filter === 'calibration'
        ? rows.filter((row) => row.isCalibrationDueSoon)
        : filter === 'inspection'
          ? rows.filter((row) => row.isInspectionDueSoon)
          : rows,
    [rows, filter]
  )

  const toggleFilter = (next: Exclude<AlertFilter, 'all'>) =>
    setFilter((current) => (current === next ? 'all' : next))

  const columns = useMemo<MRT_ColumnDef<AlertRow>[]>(
    () => [
      {
        id: 'equipo',
        header: 'Equipo',
        size: 280,
        accessorFn: (row) => `${row.equipmentName} ${row.internalCode}`,
        Cell: ({ row }) => (
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
              {row.original.equipmentName.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant='body2' fontWeight={600}>
                {row.original.equipmentName}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {row.original.internalCode}
              </Typography>
            </Box>
          </Box>
        )
      },
      {
        id: 'ubicacion',
        header: 'Marca y ubicación',
        size: 230,
        accessorFn: (row) => `${row.brand ?? ''} ${row.location ?? ''}`,
        Cell: ({ row }) => (
          <Box>
            <Typography variant='body2'>{row.original.brand || '—'}</Typography>
            <Typography variant='caption' color='text.secondary'>
              {row.original.location || 'Sin ubicación'}
            </Typography>
          </Box>
        )
      },
      {
        id: 'alertas',
        header: 'Pendiente',
        size: 300,
        enableSorting: false,
        accessorFn: (row) =>
          [
            row.isCalibrationDueSoon ? 'calibración' : '',
            row.isInspectionDueSoon ? 'inspección' : ''
          ].join(' '),
        Cell: ({ row }) => (
          <Box sx={{ display: 'grid', gap: 0.5 }}>
            {row.original.isCalibrationDueSoon ? (
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography
                  variant='body2'
                  fontWeight={600}
                  sx={{ minWidth: 86 }}
                >
                  Calibración
                </Typography>
                <Typography variant='body2'>
                  {formatDate(row.original.calibrationDueDate)}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {daysText(row.original.calibrationDaysRemaining)}
                </Typography>
              </Box>
            ) : null}
            {row.original.isInspectionDueSoon ? (
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography
                  variant='body2'
                  fontWeight={600}
                  sx={{ minWidth: 86 }}
                >
                  Inspección
                </Typography>
                <Typography variant='body2'>
                  {formatDate(row.original.inspectionDueDate)}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {daysText(row.original.inspectionDaysRemaining)}
                </Typography>
              </Box>
            ) : null}
          </Box>
        )
      },
      {
        id: 'prioridad',
        header: 'Prioridad',
        size: 200,
        // Se ordena por los días de la alerta más atrasada
        accessorFn: (row) => row.worstDays,
        Cell: ({ row }) => {
          const priority = priorityOf(row.original.worstDays)
          return (
            <StatusPill
              size='small'
              tone={priority.tone}
              label={priority.label}
            />
          )
        }
      }
    ],
    []
  )

  if (loading && equipments.length === 0) {
    return (
      <Container maxWidth='xl' sx={{ py: 3 }}>
        <Skeleton variant='text' width={360} height={48} sx={{ mb: 3 }} />
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {[0, 1, 2].map((key) => (
            <Grid item xs={12} sm={4} key={key}>
              <Skeleton
                variant='rectangular'
                height={78}
                sx={{ borderRadius: '16px' }}
              />
            </Grid>
          ))}
        </Grid>
        <Skeleton
          variant='rectangular'
          height={400}
          sx={{ borderRadius: '16px' }}
        />
      </Container>
    )
  }

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Alertas de equipos'
        subtitle='Calibraciones e inspecciones vencidas o por vencer, las más atrasadas primero'
        icon={<NotificationsActiveIcon />}
        actions={
          <Tooltip title='Actualizar alertas'>
            <span>
              <IconButton
                aria-label='Actualizar alertas'
                onClick={handleRefresh}
                disabled={refreshing}
                sx={{ border: '1px solid #e5e7eb', borderRadius: '10px' }}
              >
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        }
      />

      {/* Los indicadores filtran la tabla; un segundo clic quita el filtro */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <LmsStatCard
            label='Equipos con alertas'
            value={counts.all}
            icon={<EngineeringIcon />}
            tone='red'
            caption={
              filter === 'all' ? 'Mostrando todos' : 'Clic para ver todos'
            }
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <LmsStatCard
            label='Calibraciones'
            value={counts.calibration}
            icon={<BuildIcon />}
            tone='orange'
            caption={
              filter === 'calibration' ? 'Filtro activo' : 'Clic para filtrar'
            }
            active={filter === 'calibration'}
            onClick={() => toggleFilter('calibration')}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <LmsStatCard
            label='Inspecciones'
            value={counts.inspection}
            icon={<ScheduleIcon />}
            tone='blue'
            caption={
              filter === 'inspection' ? 'Filtro activo' : 'Clic para filtrar'
            }
            active={filter === 'inspection'}
            onClick={() => toggleFilter('inspection')}
          />
        </Grid>
      </Grid>

      <DataTable<AlertRow>
        columns={columns}
        data={visibleRows}
        itemLabel={['equipo', 'equipos']}
        searchPlaceholder='Buscar por equipo, código, marca o ubicación'
        state={{ isLoading: loading }}
        enableRowActions
        initialState={{
          sorting: [{ id: 'prioridad', desc: false }],
          pagination: { pageIndex: 0, pageSize: 25 }
        }}
        muiTablePaginationProps={{ rowsPerPageOptions: [10, 25, 50, 100] }}
        muiTableContainerProps={{ sx: { maxHeight: 'none' } }}
        muiTableBodyRowProps={({ row }) => ({
          onClick: () => navigate(`/datasheets/${row.original.id}`),
          sx: { cursor: 'pointer' }
        })}
        renderRowActions={({ row }) => (
          <Tooltip title='Ver hoja de vida'>
            <IconButton
              size='small'
              aria-label={`Ver hoja de vida de ${row.original.equipmentName}`}
              sx={{ color: '#00695C' }}
              onClick={(event) => {
                event.stopPropagation()
                navigate(`/datasheets/${row.original.id}`)
              }}
            >
              <VisibilityOutlined fontSize='small' />
            </IconButton>
          </Tooltip>
        )}
        renderEmptyRowsFallback={() => (
          <EmptyState
            icon={<TaskAltOutlined />}
            title={
              equipments.length === 0 ? 'Sin alertas' : 'Ningún equipo coincide'
            }
            hint={
              equipments.length === 0
                ? 'Todas las calibraciones e inspecciones están al día.'
                : 'Prueba con otra búsqueda o quita el filtro de los indicadores.'
            }
          />
        )}
      />
    </Container>
  )
}

export default EquipmentAlertsPage
