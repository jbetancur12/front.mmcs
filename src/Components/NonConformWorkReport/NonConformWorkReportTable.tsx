import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  TablePagination,
  CircularProgress,
  Chip,
  Alert,
  Stack,
  Switch,
  FormControlLabel
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import VisibilityIcon from '@mui/icons-material/Visibility'
import useAxiosPrivate from '@utils/use-axios-private'
import { NonConformWorkReport } from './NonConformWorkReport.types'
import { format } from 'date-fns'
import Swal from 'sweetalert2'
import { NonConformWorkReportAlert } from './NonConformWorkReport.types'

// Traducciones y mapeos
const columns = [
  { id: 'tncCode', label: 'Código TNC' },
  { id: 'tncAcceptance', label: 'Aceptación' },
  { id: 'registerDate', label: 'Fecha de registro' },
  { id: 'detectedBy', label: 'Detectado por' },
  { id: 'status', label: 'Estatus' },
  { id: 'impactWeight', label: 'Impacto' },
  { id: 'probability', label: 'Probabilidad' },
  { id: 'riskLevel', label: 'Nivel de riesgo' }
]

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
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [alerts, setAlerts] = useState<NonConformWorkReportAlert[]>([])
  const [alertsLoading, setAlertsLoading] = useState(true)
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(false)

  const fetchReports = async () => {
    setLoading(true)
    try {
      const res = await axiosPrivate.get('/non-conform-work-report')
      setRows(res.data)
    } catch (err) {
      alert('Error al obtener los reportes')
    } finally {
      setLoading(false)
    }
  }

  // Fetch de alertas de revisión
  const fetchAlerts = async () => {
    setAlertsLoading(true)
    try {
      const res = await axiosPrivate.get('/non-conform-work-report/alerts')
      setAlerts(res.data)
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

  // Renderizado
  return (
    <Box>
      {/* ALERTAS DE REVISIÓN */}
      {alertsLoading
        ? null
        : alerts.length > 0 && (
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
                <b>¡Tienes {alerts.length} reportes con revisión pendiente!</b>{' '}
                Usa el filtro para ver solo los reportes con alerta de revisión.
              </Alert>
            </Stack>
          )}
      {/* FIN ALERTAS */}
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
      <Paper elevation={2} sx={{ borderRadius: 3 }}>
        {loading ? (
          <Box
            display='flex'
            justifyContent='center'
            alignItems='center'
            minHeight={200}
          >
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  {columns.map((col) => (
                    <TableCell
                      key={col.id}
                      sx={{ fontWeight: 700, background: '#f5f5f5' }}
                    >
                      {col.label}
                    </TableCell>
                  ))}
                  <TableCell sx={{ fontWeight: 700, background: '#f5f5f5' }}>
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(showOnlyAlerts
                  ? rows.filter((row) => alerts.some((a) => a.id === row.id))
                  : rows
                )
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row) => (
                    <TableRow key={row.id} hover>
                      {columns.map((col) => {
                        let value = row[col.id as keyof NonConformWorkReport]
                        let displayValue = value
                        if (col.id === 'impactWeight') {
                          displayValue = impactMap[value as string] || value
                          const { bg, color } = impactProbColor(
                            displayValue as string
                          )
                          return (
                            <TableCell key={col.id} align='center'>
                              <Chip
                                label={displayValue}
                                sx={{ bgcolor: bg, color, fontWeight: 600 }}
                                size='small'
                              />
                            </TableCell>
                          )
                        } else if (col.id === 'probability') {
                          displayValue =
                            probabilityMap[value as string] || value
                          const { bg, color } = impactProbColor(
                            displayValue as string
                          )
                          return (
                            <TableCell key={col.id} align='center'>
                              <Chip
                                label={displayValue}
                                sx={{ bgcolor: bg, color, fontWeight: 600 }}
                                size='small'
                              />
                            </TableCell>
                          )
                        } else if (col.id === 'riskLevel') {
                          displayValue = riskLevelMap[value as string] || value
                          const { bg, color } = riskLevelColor(
                            displayValue as string
                          )
                          return (
                            <TableCell key={col.id} align='center'>
                              <Chip
                                label={displayValue}
                                sx={{ bgcolor: bg, color, fontWeight: 600 }}
                                size='small'
                              />
                            </TableCell>
                          )
                        } else if (col.id === 'status') {
                          const status = statusMap[value as string] || {
                            label: value,
                            color: 'default'
                          }
                          return (
                            <TableCell key={col.id} align='center'>
                              <Chip
                                label={status.label}
                                color={status.color}
                                size='small'
                                sx={{ fontWeight: 600 }}
                              />
                            </TableCell>
                          )
                        } else if (col.id === 'tncAcceptance') {
                          const acceptance = acceptanceMap[value as string] || {
                            label: value,
                            color: 'default'
                          }
                          return (
                            <TableCell key={col.id} align='center'>
                              <Chip
                                label={acceptance.label}
                                color={acceptance.color}
                                size='small'
                                sx={{ fontWeight: 600 }}
                              />
                            </TableCell>
                          )
                        } else if (col.id === 'registerDate') {
                          // Formato humano dd/MM/yyyy
                          let formatted = value
                            ? format(new Date(value as string), 'dd/MM/yyyy')
                            : ''
                          return (
                            <TableCell key={col.id} align='center'>
                              {formatted}
                            </TableCell>
                          )
                        }
                        return (
                          <TableCell key={col.id}>{displayValue}</TableCell>
                        )
                      })}
                      <TableCell align='center'>
                        <IconButton onClick={() => onView && onView(row)}>
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton onClick={() => onEdit && onEdit(row)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => row.id && handleDelete(row.id)}
                        >
                          <DeleteIcon color='error' />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <TablePagination
          component='div'
          count={rows.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10))
            setPage(0)
          }}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Paper>
    </Box>
  )
}

export default NonConformWorkReportTable
