import React, { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Grid,
  Button // Importado Button de MUI
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Swal from 'sweetalert2' // Importado SweetAlert2
import useAxiosPrivate from '@utils/use-axios-private' // Asumiendo que esta ruta es correcta
import MonthlyChart from './MonthlyChart' // Asumiendo que está en la misma carpeta

// Tipos (sin cambios)
type RawLog = {
  method: string
  route: string
  requests: string
  totalIncoming: string
  totalOutgoing: string
  total: string
}

// Se asume que la API devuelve un objeto pagination en la respuesta del summary
type BandwidthStatsResponse = {
  totalInMB: {
    totalMB: string
    incomingMB: string
    outgoingMB: string
  }
  logs: RawLog[]
  pagination?: {
    // Hecho opcional para seguridad
    totalPages: number
  }
}

const BandwidthStats: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const [data, setData] = useState<BandwidthStatsResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // --- useEffect Unificado y Mejorado ---
  useEffect(() => {
    setLoading(true)
    // Flag para controlar actualizaciones si el componente se desmonta rápido
    let isMounted = true

    axiosPrivate
      .get<BandwidthStatsResponse>(
        `/bandwidth-logs/summary?page=${page}&limit=10`
      )
      .then((res) => {
        if (isMounted) {
          setData(res.data)
          // Acceso seguro a totalPages, default a 1 si no existe
          setTotalPages(res.data.pagination?.totalPages ?? 1)
        }
      })
      .catch((error) => {
        console.error('Error fetching bandwidth summary:', error)
        if (isMounted) {
          // Mostrar alerta de error al usuario
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar las estadísticas de ancho de banda. Inténtalo de nuevo más tarde.'
          })
          // Opcional: podrías querer limpiar los datos o establecer un estado de error
          // setData(null);
          // setTotalPages(1);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    // Cleanup function para evitar actualizaciones de estado en componente desmontado
    return () => {
      isMounted = false
    }
  }, [page, axiosPrivate]) // axiosPrivate añadido como dependencia si puede cambiar

  // --- Eliminado el segundo useEffect redundante ---

  // Función auxiliar para formatear bytes (sin cambios)
  const formatBytes = (bytes: string | number): string => {
    const numBytes = Number(bytes)
    if (isNaN(numBytes) || numBytes < 0) return '0.00 MB' // Manejo de valores inválidos
    return (numBytes / 1024 / 1024).toFixed(2) + ' MB'
  }

  // Función para agrupar logs (sin cambios)
  const groupLogsByRoute = (logs: RawLog[]): Record<string, RawLog[]> => {
    const grouped: Record<string, RawLog[]> = {}
    logs.forEach((log) => {
      if (!grouped[log.route]) grouped[log.route] = []
      grouped[log.route].push(log)
    })
    return grouped
  }

  // --- Renderizado ---

  if (loading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        mt={4}
        minHeight='400px'
      >
        <CircularProgress />
      </Box>
    )
  }

  // Si no hay datos después de cargar (posiblemente por un error manejado)
  if (!data) {
    return (
      <Box p={4}>
        <Typography variant='h6' color='text.secondary' align='center'>
          No hay datos de ancho de banda disponibles en este momento.
        </Typography>
      </Box>
    )
  }

  const groupedLogs = groupLogsByRoute(data.logs)

  return (
    <Box p={4}>
      <Typography variant='h4' gutterBottom>
        Estadísticas de Ancho de Banda
      </Typography>

      {/* Gráfico Mensual */}
      <MonthlyChart />

      <Typography variant='h5' gutterBottom sx={{ mt: 4 }}>
        Uso de Ancho de Banda (Mes Actual)
      </Typography>
      <Grid container spacing={2} mb={4}>
        {/* Tarjetas de Resumen - Asumen que data.totalInMB tiene los MB formateados */}
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Total Entrante
              </Typography>
              <Typography variant='body1'>
                {data.totalInMB.incomingMB ?? 'N/A'} MB
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Total Saliente
              </Typography>
              <Typography variant='body1'>
                {data.totalInMB.outgoingMB ?? 'N/A'} MB
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Transferencia Total
              </Typography>
              <Typography variant='body1'>
                {data.totalInMB.totalMB ?? 'N/A'} MB
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant='h5' gutterBottom sx={{ mt: 4 }}>
        Detalle por Ruta y Método (Página {page} de {totalPages})
      </Typography>

      {Object.entries(groupedLogs).length > 0 ? (
        Object.entries(groupedLogs).map(([route, methods]) => (
          <Accordion key={route} sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant='subtitle1' sx={{ wordBreak: 'break-all' }}>
                {route}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 1 }}>
              {' '}
              {/* Menos padding en detalles */}
              <Table size='small' aria-label={`Detalles para la ruta ${route}`}>
                <TableHead>
                  <TableRow>
                    <TableCell>Método</TableCell>
                    <TableCell align='right'>Peticiones</TableCell>
                    <TableCell align='right'>Entrante</TableCell>
                    <TableCell align='right'>Saliente</TableCell>
                    <TableCell align='right'>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {methods.map((m) => (
                    <TableRow key={m.method} hover>
                      <TableCell component='th' scope='row'>
                        {m.method}
                      </TableCell>
                      <TableCell align='right'>{m.requests}</TableCell>
                      <TableCell align='right'>
                        {formatBytes(m.totalIncoming)}
                      </TableCell>
                      <TableCell align='right'>
                        {formatBytes(m.totalOutgoing)}
                      </TableCell>
                      <TableCell align='right'>
                        {formatBytes(m.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AccordionDetails>
          </Accordion>
        ))
      ) : (
        <Typography color='text.secondary' sx={{ mt: 2 }}>
          No hay logs detallados para mostrar en esta página.
        </Typography>
      )}

      {/* Controles de Paginación con MUI Button */}
      {totalPages > 1 && (
        <Box
          mt={4}
          display='flex'
          justifyContent='center'
          alignItems='center'
          gap={2}
        >
          <Button
            variant='outlined'
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))} // Previene ir a página < 1
          >
            Anterior
          </Button>
          <Typography>
            Página {page} de {totalPages}
          </Typography>
          <Button
            variant='outlined'
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))} // Previene ir más allá de totalPages
          >
            Siguiente
          </Button>
        </Box>
      )}
    </Box>
  )
}

export default BandwidthStats
