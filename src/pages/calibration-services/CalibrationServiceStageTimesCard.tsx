import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import { getRoleLabelEs } from 'src/constants/roles'
import { useCalibrationServiceStageTimes } from '../../hooks/useCalibrationServices'

/** Horas a un texto corto: menos de 48 h en horas, más en días. */
const formatDuration = (hours: number | null) => {
  if (hours === null) return '—'
  return hours < 48
    ? `${hours.toLocaleString('es-CO')} h`
    : `${(hours / 24).toLocaleString('es-CO', { maximumFractionDigits: 1 })} d`
}

/**
 * Tiempo promedio y mediano entre hitos del flujo (ODS, programación, ejecución, corte, factura, documentos, cierre),
 * con el detalle por rol de quien cerró cada etapa.
 */
const CalibrationServiceStageTimesCard = () => {
  const { data, isLoading, isError, refetch, isFetching } =
    useCalibrationServiceStageTimes()

  return (
    <Card
      elevation={0}
      sx={{ mb: 3, borderRadius: '16px', border: '1px solid #e5e7eb' }}
    >
      <CardContent>
        <Typography variant='h6' sx={{ fontWeight: 700 }}>
          Tiempo por etapa
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Cuánto pasa entre un hito y el siguiente. Solo cuentan los servicios
          que ya llegaron a los dos hitos.
        </Typography>
        {isLoading ? (
          <Typography variant='body2'>Calculando…</Typography>
        ) : isError ? (
          <Alert
            severity='warning'
            action={
              <Button
                color='inherit'
                size='small'
                onClick={() => void refetch()}
                disabled={isFetching}
              >
                Reintentar
              </Button>
            }
          >
            No pudimos calcular el tiempo por etapa. Reintenta en un momento; el
            resto de la analítica no se ve afectado.
          </Alert>
        ) : (
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Etapa</TableCell>
                <TableCell align='right'>Servicios</TableCell>
                <TableCell align='right'>Promedio</TableCell>
                <TableCell align='right'>Mediana</TableCell>
                <TableCell>Por rol (promedio)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(data?.transitions || []).map((stage) => (
                <TableRow key={stage.key}>
                  <TableCell sx={{ fontWeight: 600 }}>{stage.label}</TableCell>
                  <TableCell align='right'>{stage.count}</TableCell>
                  <TableCell align='right'>
                    {formatDuration(stage.avgHours)}
                  </TableCell>
                  <TableCell align='right'>
                    {formatDuration(stage.medianHours)}
                  </TableCell>
                  <TableCell>
                    <Stack
                      direction='row'
                      spacing={0.5}
                      flexWrap='wrap'
                      useFlexGap
                    >
                      {stage.byRole.slice(0, 4).map((entry) => (
                        <Chip
                          key={entry.role}
                          size='small'
                          variant='outlined'
                          label={`${getRoleLabelEs(entry.role)}: ${formatDuration(entry.avgHours)} (${entry.count})`}
                        />
                      ))}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

export default CalibrationServiceStageTimesCard
