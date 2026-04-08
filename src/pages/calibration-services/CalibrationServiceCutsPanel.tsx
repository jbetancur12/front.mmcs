import { Alert, Box, Button, Chip, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { CalibrationServiceCut } from '../../types/calibrationService'

interface CalibrationServiceCutsPanelProps {
  cuts: CalibrationServiceCut[]
  canMarkReady?: boolean
  isBusy?: boolean
  onMarkReady?: (cutId: number) => void | Promise<void>
}

const cutTypeLabels = {
  partial: 'Parcial',
  final: 'Final'
} as const

const cutStatusLabels = {
  draft: 'Borrador',
  ready_for_invoicing: 'Listo para facturar'
} as const

const CalibrationServiceCutsPanel = ({
  cuts,
  canMarkReady = false,
  isBusy = false,
  onMarkReady
}: CalibrationServiceCutsPanelProps) => {
  if (!cuts.length) {
    return <Alert severity='info'>Este servicio todavía no tiene cortes creados.</Alert>
  }

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell>Código</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>Semáforo</TableCell>
            <TableCell>Items</TableCell>
            <TableCell>Fecha liberación</TableCell>
            <TableCell>Notas</TableCell>
            <TableCell>Acción</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {cuts.map((cut) => (
            <TableRow key={cut.id}>
              <TableCell>{cut.cutCode}</TableCell>
              <TableCell>
                <Chip size='small' label={cutTypeLabels[cut.cutType]} />
              </TableCell>
              <TableCell>{cutStatusLabels[cut.status]}</TableCell>
              <TableCell>
                <Chip
                  size='small'
                  color={
                    cut.slaIndicator?.color === 'green'
                      ? 'success'
                      : cut.slaIndicator?.color === 'yellow'
                        ? 'warning'
                        : cut.slaIndicator?.color === 'red'
                          ? 'error'
                          : cut.slaIndicator?.color === 'blue'
                            ? 'info'
                            : 'default'
                  }
                  label={cut.slaIndicator?.label || 'Sin iniciar'}
                />
              </TableCell>
              <TableCell>
                <Stack spacing={0.5}>
                  {(cut.items || []).map((item) => (
                    <Typography key={item.id} variant='body2'>
                      {item.serviceItem?.itemName || `Ítem ${item.serviceItemId}`} · {item.quantity}
                    </Typography>
                  ))}
                </Stack>
              </TableCell>
              <TableCell>
                {cut.releasedAt
                  ? new Date(cut.releasedAt).toLocaleDateString('es-CO')
                  : 'Sin fecha'}
              </TableCell>
              <TableCell>{cut.notes || 'Sin notas'}</TableCell>
              <TableCell>
                {canMarkReady && cut.status === 'draft' ? (
                  <Button
                    size='small'
                    variant='outlined'
                    onClick={() => void onMarkReady?.(cut.id)}
                    disabled={isBusy}
                  >
                    Listo para facturar
                  </Button>
                ) : (
                  'Sin acción'
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}

export default CalibrationServiceCutsPanel
