import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import { CalibrationServicePhysicalTraceabilityEntry } from '../../types/calibrationService'

interface Props {
  entries: CalibrationServicePhysicalTraceabilityEntry[]
  canRegister: boolean
  isBusy?: boolean
  onRegister: () => void
}

const formatDateTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString('es-CO', {
        dateStyle: 'short',
        timeStyle: 'short'
      })
    : 'Sin registrar'

const CalibrationServiceLogisticsPanel = ({
  entries,
  canRegister,
  isBusy = false,
  onRegister
}: Props) => {
  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent='space-between'
        spacing={1.5}
      >
        <Box>
          <Typography variant='subtitle1' fontWeight={700}>
            Recogida y entrega física
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Registra cada movimiento físico del equipo para dejar trazabilidad operativa.
          </Typography>
        </Box>
        {canRegister ? (
          <Button
            variant='contained'
            startIcon={<LocalShippingOutlinedIcon />}
            onClick={onRegister}
            disabled={isBusy}
          >
            Registrar movimiento
          </Button>
        ) : null}
      </Stack>

      {entries.length ? (
        <Box sx={{ overflowX: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Movimiento</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Contacto</TableCell>
                <TableCell>Ubicación</TableCell>
                <TableCell>Observaciones</TableCell>
                <TableCell>Registrado por</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <Chip
                      size='small'
                      color={entry.movementType === 'pickup' ? 'warning' : 'success'}
                      label={entry.movementType === 'pickup' ? 'Recogida' : 'Entrega'}
                    />
                  </TableCell>
                  <TableCell>{formatDateTime(entry.occurredAt)}</TableCell>
                  <TableCell>
                    {entry.contactName}
                    {entry.contactRole ? ` · ${entry.contactRole}` : ''}
                  </TableCell>
                  <TableCell>{entry.location || 'Sin registrar'}</TableCell>
                  <TableCell>{entry.notes || 'Sin observaciones'}</TableCell>
                  <TableCell>{entry.recordedByName || 'Sistema'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      ) : (
        <Alert severity='info'>
          Aún no hay movimientos físicos registrados para este servicio.
        </Alert>
      )}
    </Stack>
  )
}

export default CalibrationServiceLogisticsPanel
