import { Alert, Box, Chip, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { CalibrationServiceCut } from '../../types/calibrationService'

interface CalibrationServiceCutsPanelProps {
  cuts: CalibrationServiceCut[]
}

const cutTypeLabels = {
  partial: 'Parcial',
  final: 'Final'
} as const

const cutStatusLabels = {
  draft: 'Borrador',
  ready_for_invoicing: 'Listo para facturar'
} as const

const CalibrationServiceCutsPanel = ({ cuts }: CalibrationServiceCutsPanelProps) => {
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
            <TableCell>Items</TableCell>
            <TableCell>Fecha liberación</TableCell>
            <TableCell>Notas</TableCell>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}

export default CalibrationServiceCutsPanel
