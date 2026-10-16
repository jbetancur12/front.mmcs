import React, { useEffect, useState, useMemo } from 'react'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'
import {
  Box,
  Button,
  IconButton,
  Chip,
  Grid,
  Tooltip,
  Paper
} from '@mui/material'
import MaterialReactTable, { type MRT_ColumnDef } from 'material-react-table'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import { purchaseTableStyle } from 'src/Components/Purchases/purchaseTableStyle'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { Add, CheckCircle, FolderOpen, ListAlt, NotificationsActive, ReportProblemOutlined } from '@mui/icons-material'
import useAxiosPrivate from '@utils/use-axios-private'
import { NonConformWorkReport } from './NonConformWorkReport.types'
import { format } from 'date-fns'
import Swal from 'sweetalert2'
import { NonConformWorkReportAlert } from './NonConformWorkReport.types'

// Traducciones y mapeos
const impactMap: Record<string, string> = {
  High: 'Alta',
  Medium: 'Media',
  Low: 'Baja'
}
const probabilityMap: Record<string, string> = {
  High: 'Alta',
  Medium: 'Media',
  Low: 'Baja'
}
const riskLevelMap: Record<string, string> = {
  Critical: 'Crítico',
  High: 'Alto',
  Medium: 'Media',
  Low: 'Baja',
  'Very Low': 'Muy Baja',
  'Not evaluated': 'No evaluado'
}
const statusMap: Record<
  string,
  { label: string; color: 'success' | 'error' | 'warning' | 'default' }
> = {
  Open: { label: 'Abierta', color: 'warning' },
  Closed: { label: 'Cerrada', color: 'success' },
  Abierta: { label: 'Abierta', color: 'warning' },
  Cerrada: { label: 'Cerrada', color: 'success' }
}
const acceptanceMap: Record<
  string,
  { label: string; color: 'success' | 'error' }
> = {
  Accepted: { label: 'Aceptado', color: 'success' },
  'No accepted': { label: 'No aceptado', color: 'error' },
  Aceptado: { label: 'Aceptado', color: 'success' },
  'No aceptado': { label: 'No aceptado', color: 'error' }
}

// Colores igual que en el formulario
const riskLevelColor = (nivel: string) => {
  switch (nivel) {
    case 'Crítico':
      return { bg: '#e53935', color: '#fff' }
    case 'Alto':
      return { bg: '#ff7043', color: '#fff' }
    case 'Media':
      return { bg: '#fff176', color: '#333' }
    case 'Baja':
      return { bg: '#81c784', color: '#333' }
    case 'Muy Baja':
      return { bg: '#388e3c', color: '#fff' }
    default:
      return { bg: '#bdbdbd', color: '#333' }
  }
}
const impactProbColor = (valor: string) => {
  switch (valor) {
    case 'Alta':
      return { bg: '#ff7043', color: '#fff' }
    case 'Media':
      return { bg: '#fff176', color: '#333' }
    case 'Baja':
    case 'Muy Baja':
      return { bg: '#81c784', color: '#333' }
    default:
      return { bg: '#bdbdbd', color: '#333' }
  }
}

interface NonConformWorkReportTableProps {
  onEdit?: (row: NonConformWorkReport) => void
  onView?: (row: NonConformWorkReport) => void
  onCreate?: () => void
}

const NonConformWorkReportTable: React.FC<NonConformWorkReportTableProps> = ({
  onEdit,
  onView,
  onCreate
}) => {
  const canManage = useCan(PERMISSIONS.NONCONFORM_REPORT_MANAGE)
  const axiosPrivate = useAxiosPrivate()
  const [rows, setRows] = useState<NonConformWorkReport[]>([])
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<NonConformWorkReportAlert[]>([])
  const [, setAlertsLoading] = useState(true)
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(false)

  const fetchReports = async () => {
    setLoading(true)
    try {
      const res = await axiosPrivate.get('/non-conform-work-report')
      setRows(res.data || [])
    } catch (err) {
      alert('Error al obtener los reportes')
    } finally {
      setLoading(false)
    }
  }

  const fetchAlerts = async () => {
    setAlertsLoading(true)
    try {
      const res = await axiosPrivate.get('/non-conform-work-report/alerts')
      setAlerts(res.data || [])
    } catch (err) {
      setAlerts([])
    } finally {
      setAlertsLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
    fetchAlerts()
  }, [])

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: '¿Está seguro de eliminar este reporte?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!result.isConfirmed) return
    try {
      await axiosPrivate.delete(`/non-conform-work-report/${id}`)
      setRows((prev) => prev.filter((r) => r.id !== id))
      await Swal.fire({
        icon: 'success',
        title: '¡Eliminado!',
        text: 'El reporte fue eliminado correctamente.'
      })
    } catch (err) {
      alert('Error al eliminar el reporte')
    }
  }

  const columns = useMemo<MRT_ColumnDef<NonConformWorkReport>[]>(
    () => [
      {
        accessorKey: 'tncCode',
        header: 'Código TNC',
        size: 150,
        sortingFn: (rowA, rowB, columnId) => {
          return rowA
            .getValue<string>(columnId)
            .localeCompare(rowB.getValue<string>(columnId), undefined, {
              numeric: true,
              sensitivity: 'base'
            })
        }
      },
      {
        accessorKey: 'tncAcceptance',
        header: 'Aceptación',
        size: 150,
        Cell: ({ cell }) => {
          const value = cell.getValue<string>()
          const acceptance = acceptanceMap[value] || {
            label: value,
            color: 'default'
          }
          return (
            <Chip
              label={acceptance.label}
              color={acceptance.color as any}
              size='small'
              sx={{ fontWeight: 600 }}
            />
          )
        }
      },
      {
        accessorKey: 'iso17025Clause',
        header: 'Numeral ISO/IEC 17025',
        size: 180
      },
      {
        accessorKey: 'registerDate',
        header: 'Fecha de registro',
        size: 150,
        Cell: ({ cell }) => {
          const value = cell.getValue<string>()
          return value ? format(new Date(value), 'dd/MM/yyyy') : ''
        }
      },
      {
        accessorKey: 'detectedBy',
        header: 'Detectado por',
        size: 200
      },
      {
        accessorKey: 'status',
        header: 'Estatus',
        size: 130,
        Cell: ({ cell }) => {
          const value = cell.getValue<string>()
          const status = statusMap[value] || {
            label: value,
            color: 'default'
          }
          return (
            <Chip
              label={status.label}
              color={status.color as any}
              size='small'
              sx={{ fontWeight: 600 }}
            />
          )
        }
      },
      {
        accessorKey: 'impactWeight',
        header: 'Impacto',
        size: 130,
        Cell: ({ cell }) => {
          const value = cell.getValue<string>()
          const displayValue = impactMap[value] || value
          const { bg, color } = impactProbColor(displayValue)
          return (
            <Chip
              label={displayValue}
              sx={{ bgcolor: bg, color, fontWeight: 600 }}
              size='small'
            />
          )
        }
      },
      {
        accessorKey: 'probability',
        header: 'Probabilidad',
        size: 130,
        Cell: ({ cell }) => {
          const value = cell.getValue<string>()
          const displayValue = probabilityMap[value] || value
          const { bg, color } = impactProbColor(displayValue)
          return (
            <Chip
              label={displayValue}
              sx={{ bgcolor: bg, color, fontWeight: 600 }}
              size='small'
            />
          )
        }
      },
      {
        accessorKey: 'riskLevel',
        header: 'Nivel de riesgo',
        size: 150,
        Cell: ({ cell }) => {
          const value = cell.getValue<string>()
          const displayValue = riskLevelMap[value] || value
          const { bg, color } = riskLevelColor(displayValue)
          return (
            <Chip
              label={displayValue}
              sx={{ bgcolor: bg, color, fontWeight: 600 }}
              size='small'
            />
          )
        }
      }
    ],
    []
  )

  const filteredRows = useMemo(() => {
    if (showOnlyAlerts) {
      return rows.filter((row) => alerts.some((a) => a.id === row.id))
    }
    return rows
  }, [rows, showOnlyAlerts, alerts])

  const openCount = rows.filter((r) => ['Open', 'Abierta'].includes(r.status)).length
  const closedCount = rows.filter((r) => ['Closed', 'Cerrada'].includes(r.status)).length

  return (
    <>
      <LmsPageHeader
        title='Trabajo no conforme'
        subtitle='Reportes TNC, su nivel de riesgo y las revisiones pendientes'
        icon={<ReportProblemOutlined />}
        actions={
          canManage ? (
            <Button variant='contained' startIcon={<Add />} onClick={onCreate} sx={{ bgcolor: '#00BFA5', whiteSpace: 'nowrap', '&:hover': { bgcolor: '#00ACC1' } }}>
              Nuevo reporte
            </Button>
          ) : undefined
        }
      />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <LmsStatCard
            label='Reportes'
            value={rows.length}
            icon={<ListAlt />}
            tone='teal'
            active={!showOnlyAlerts}
            onClick={() => setShowOnlyAlerts(false)}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <LmsStatCard label='Abiertos' value={openCount} icon={<FolderOpen />} tone='orange' />
        </Grid>
        <Grid item xs={6} md={3}>
          <LmsStatCard label='Cerrados' value={closedCount} icon={<CheckCircle />} tone='green' />
        </Grid>
        <Grid item xs={6} md={3}>
          <LmsStatCard
            label='Con revisión pendiente'
            value={alerts.length}
            icon={<NotificationsActive />}
            tone={alerts.length > 0 ? 'red' : 'blue'}
            active={showOnlyAlerts}
            onClick={alerts.length > 0 ? () => setShowOnlyAlerts((v) => !v) : undefined}
          />
        </Grid>
      </Grid>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <MaterialReactTable
          {...purchaseTableStyle}
          columns={columns}
          data={filteredRows}
          state={{ isLoading: loading }}
          enableRowActions
          enablePinning
          renderRowActions={({ row }) => (
            <Box sx={{ display: 'flex' }}>
              <Tooltip title='Ver'>
                <IconButton
                  size='small'
                  sx={{ color: '#00BFA5' }}
                  onClick={() => onView && onView(row.original)}
                >
                  <VisibilityIcon fontSize='small' />
                </IconButton>
              </Tooltip>
              {canManage && (
                <>
                  <Tooltip title='Editar'>
                    <IconButton
                      size='small'
                      color='primary'
                      onClick={() => onEdit && onEdit(row.original)}
                    >
                      <EditIcon fontSize='small' />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title='Eliminar'>
                    <IconButton
                      size='small'
                      onClick={() =>
                        row.original.id && handleDelete(row.original.id)
                      }
                    >
                      <DeleteIcon color='error' fontSize='small' />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>
          )}
          initialState={{
            density: 'compact',
            pagination: { pageSize: 10, pageIndex: 0 },
            sorting: [{ id: 'tncCode', desc: true }],
            columnPinning: { right: ['mrt-row-actions'] }
          }}
        />
      </Paper>
    </>
  )
}

export default NonConformWorkReportTable
