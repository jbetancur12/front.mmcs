import React, { useEffect, useState, useMemo } from 'react'
import {
  Box,
  Button,
  IconButton,
  Typography,
  Chip,
  Alert,
  Stack,
  Switch,
  FormControlLabel,
  Tooltip,
  Paper
} from '@mui/material'
import MaterialReactTable, { type MRT_ColumnDef } from 'material-react-table'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import VisibilityIcon from '@mui/icons-material/Visibility'
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
  const axiosPrivate = useAxiosPrivate()
  const [rows, setRows] = useState<NonConformWorkReport[]>([])
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<NonConformWorkReportAlert[]>([])
  const [alertsLoading, setAlertsLoading] = useState(true)
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

  return (
    <Box>
      {/* ALERTAS DE REVISIÓN */}
      {!alertsLoading && alerts.length > 0 && (
        <Stack spacing={2} mb={2}>
          <Alert
            severity='warning'
            action={
              <Button
                color='inherit'
                size='small'
                onClick={() => setShowOnlyAlerts(true)}
              >
                Ver alertas
              </Button>
            }
            sx={{ fontWeight: 600 }}
          >
            <b>¡Tienes {alerts.length} reportes con revisión pendiente!</b> Usa
            el filtro para ver solo los reportes con alerta de revisión.
          </Alert>
        </Stack>
      )}

      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={2}
      >
        <Typography variant='h6'>Reportes de Trabajo No Conforme</Typography>
        <Box display='flex' alignItems='center' gap={2}>
          {alerts.length > 0 && (
            <FormControlLabel
              control={
                <Switch
                  checked={showOnlyAlerts}
                  onChange={(_, checked) => setShowOnlyAlerts(checked)}
                  color='warning'
                />
              }
              label='Mostrar solo reportes con alerta de revisión'
            />
          )}
          <Button variant='contained' color='primary' onClick={onCreate}>
            Nuevo reporte
          </Button>
        </Box>
      </Box>

      <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <MaterialReactTable
          columns={columns}
          data={filteredRows}
          state={{ isLoading: loading }}
          localization={MRT_Localization_ES}
          enableRowActions
          renderRowActions={({ row }) => (
            <Box sx={{ display: 'flex', gap: '0.5rem' }}>
              <Tooltip title='Ver'>
                <IconButton onClick={() => onView && onView(row.original)}>
                  <VisibilityIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title='Editar'>
                <IconButton onClick={() => onEdit && onEdit(row.original)}>
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title='Eliminar'>
                <IconButton
                  onClick={() =>
                    row.original.id && handleDelete(row.original.id)
                  }
                >
                  <DeleteIcon color='error' />
                </IconButton>
              </Tooltip>
            </Box>
          )}
          initialState={{
            density: 'compact',
            pagination: { pageSize: 10, pageIndex: 0 },
            sorting: [{ id: 'tncCode', desc: true }]
          }}
          muiTablePaperProps={{
            elevation: 0,
            sx: {
              borderRadius: '0'
            }
          }}
          muiTableBodyCellProps={{
            sx: {
              textAlign: 'left'
            }
          }}
          muiTableHeadCellProps={{
            sx: {
              fontWeight: 700,
              backgroundColor: '#f5f5f5'
            }
          }}
        />
      </Paper>
    </Box>
  )
}

export default NonConformWorkReportTable
