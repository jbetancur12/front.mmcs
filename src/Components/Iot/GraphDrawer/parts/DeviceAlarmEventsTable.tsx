import React from 'react'

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Skeleton,
  Chip,
  Button
} from '@mui/material'
import { format } from 'date-fns'
import { Alert, AlertTitle } from '@mui/material'
import { useQuery } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'

interface AlarmEvent {
  id: number
  alarmId: number
  deviceId: number
  alarmName: string
  severity: string
  eventType: 'activated' | 'deactivated'
  timestamp: string
  metric: string
  condition: string
  threshold: number
  value: number
}

interface DeviceAlarmEventsTableProps {
  deviceId: number
}

const DeviceAlarmEventsTable: React.FC<DeviceAlarmEventsTableProps> = ({
  deviceId
}) => {
  // Usar fetch nativo para diagnosticar el problema
  const axiosPrivate = useAxiosPrivate()
  const {
    data: events = [],
    isLoading,
    error,
    refetch
  } = useQuery<AlarmEvent[]>({
    queryKey: [`/devicesIot/${deviceId}/alarm-events`],
    queryFn: async () => {
      try {
        // Usar fetch nativo con opciones completas
        const response = await axiosPrivate.get(
          `/devicesIot/${deviceId}/alarm-events`
        )

        // Primero verificar si la respuesta es correcta

        // Intentar parsear como JSON
        try {
          const data = await response.data
          return data as AlarmEvent[]
        } catch (parseError) {
          console.error('Error al parsear JSON:', parseError)
          throw new Error(
            `Problema al parsear la respuesta como JSON: ${parseError}`
          )
        }
      } catch (error) {
        console.error('Error completo al obtener eventos de alarmas:', error)
        throw error
      }
    },
    refetchInterval: 10000 // Refrescar cada 10 segundos
  })

  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        {[...Array(5)].map((_, index) => (
          <Skeleton key={index} height={45} />
        ))}
      </Box>
    )
  }

  if (error) {
    console.error('Error detallado:', error)
    return (
      <Alert severity='error' sx={{ m: 2 }}>
        <AlertTitle>Error</AlertTitle>
        Error al cargar el historial de eventos de alarmas.
        {error instanceof Error ? ` Detalles: ${error.message}` : ''}
        <Box sx={{ mt: 2 }}>
          <Button
            variant='contained'
            color='primary'
            size='small'
            onClick={() => refetch()}
          >
            Reintentar
          </Button>
        </Box>
      </Alert>
    )
  }

  if (!events || events.length === 0) {
    return (
      <Alert severity='info' sx={{ m: 2 }}>
        <AlertTitle>Información</AlertTitle>
        No hay eventos de alarmas registrados para este dispositivo
      </Alert>
    )
  }

  const getEventDescription = (event: AlarmEvent) => {
    const metricDisplay =
      {
        temperature: 'Temperatura',
        humidity: 'Humedad',
        battery: 'Batería'
      }[event.metric] || event.metric

    const conditionDisplay =
      {
        above: 'mayor que',
        below: 'menor que',
        equal: 'igual a'
      }[event.condition] || event.condition

    // Detect sensor error values
    const valueDisplay =
      event.value === -127 ? 'Error de sensor' : `${event.value.toFixed(1)}`

    return `${metricDisplay} ${conditionDisplay} ${event.threshold} (valor actual: ${valueDisplay})`
  }

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell>
              <strong>Fecha/Hora</strong>
            </TableCell>
            <TableCell>
              <strong>Nombre</strong>
            </TableCell>
            <TableCell>
              <strong>Tipo</strong>
            </TableCell>
            <TableCell>
              <strong>Severidad</strong>
            </TableCell>
            <TableCell>
              <strong>Detalles</strong>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {events.map((event: AlarmEvent) => (
            <TableRow key={event.id}>
              <TableCell>
                {format(new Date(event.timestamp), 'dd/MM/yyyy HH:mm:ss')}
              </TableCell>
              <TableCell>{event.alarmName}</TableCell>
              <TableCell>
                <Chip
                  size='small'
                  label={
                    event.eventType === 'activated' ? 'Activada' : 'Desactivada'
                  }
                  color={event.eventType === 'activated' ? 'error' : 'success'}
                />
              </TableCell>
              <TableCell>
                <Chip
                  size='small'
                  label={
                    {
                      info: 'Información',
                      warning: 'Advertencia',
                      critical: 'Crítica'
                    }[event.severity] || event.severity
                  }
                  color={
                    ({
                      info: 'info',
                      warning: 'warning',
                      critical: 'error'
                    }[event.severity] as any) || 'default'
                  }
                />
              </TableCell>
              <TableCell>{getEventDescription(event)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default DeviceAlarmEventsTable
