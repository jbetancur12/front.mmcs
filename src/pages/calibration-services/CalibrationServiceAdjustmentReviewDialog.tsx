import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import {
  CalibrationServiceAdjustment,
  CalibrationServiceAdjustmentStatus
} from '../../types/calibrationService'

interface CalibrationServiceAdjustmentReviewDialogProps {
  open: boolean
  adjustment: CalibrationServiceAdjustment | null
  isLoading?: boolean
  onClose: () => void
  onSubmit: (values: {
    decision: Extract<CalibrationServiceAdjustmentStatus, 'approved' | 'rejected'>
    commercialNotes?: string | null
    pricingNotes?: string | null
    approvedUnitPrice?: number | null
    approvedSubtotal?: number | null
    approvedTotal?: number | null
  }) => void | Promise<void>
}

const CalibrationServiceAdjustmentReviewDialog = ({
  open,
  adjustment,
  isLoading = false,
  onClose,
  onSubmit
}: CalibrationServiceAdjustmentReviewDialogProps) => {
  const [decision, setDecision] =
    useState<Extract<CalibrationServiceAdjustmentStatus, 'approved' | 'rejected'>>(
      'approved'
    )
  const [commercialNotes, setCommercialNotes] = useState('')
  const [pricingNotes, setPricingNotes] = useState('')
  const [approvedUnitPrice, setApprovedUnitPrice] = useState('')

  useEffect(() => {
    if (!open || !adjustment) {
      return
    }

    setDecision('approved')
    setCommercialNotes(adjustment.commercialNotes || '')
    setPricingNotes(adjustment.pricingNotes || '')
    setApprovedUnitPrice(
      adjustment.approvedUnitPrice !== null &&
        adjustment.approvedUnitPrice !== undefined
        ? String(adjustment.approvedUnitPrice)
        : ''
    )
  }, [open, adjustment])

  const needsPricing = Boolean(adjustment?.requiresCommercialAdjustment)
  const pricedQuantity = useMemo(() => {
    if (!adjustment) {
      return 0
    }

    if (adjustment.changeType === 'extra_item') {
      return adjustment.actualQuantity || 0
    }

    return Math.abs(adjustment.differenceQuantity || 0)
  }, [adjustment])

  const approvedUnitPriceNumber = approvedUnitPrice ? Number(approvedUnitPrice) : 0
  const approvedSubtotal = pricedQuantity * approvedUnitPriceNumber
  const approvedTotal = approvedSubtotal

  const handleSubmit = async () => {
    await onSubmit({
      decision,
      commercialNotes: commercialNotes.trim() || null,
      pricingNotes: pricingNotes.trim() || null,
      approvedUnitPrice: approvedUnitPrice ? Number(approvedUnitPrice) : null,
      approvedSubtotal: approvedUnitPrice ? approvedSubtotal : null,
      approvedTotal: approvedUnitPrice ? approvedTotal : null
    })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>Revisar novedad</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ mt: 0.5 }}>
          <Typography variant='body2' color='text.secondary'>
            {adjustment?.itemName || 'Sin ítem'} · {adjustment?.description || ''}
          </Typography>
          <TextField
            select
            fullWidth
            label='Decisión'
            value={decision}
            onChange={(event) =>
              setDecision(
                event.target.value as Extract<
                  CalibrationServiceAdjustmentStatus,
                  'approved' | 'rejected'
                >
              )
            }
          >
            <MenuItem value='approved'>Aprobar novedad</MenuItem>
            <MenuItem value='rejected'>Rechazar novedad</MenuItem>
          </TextField>
          <TextField
            fullWidth
            label='Observación comercial'
            value={commercialNotes}
            onChange={(event) => setCommercialNotes(event.target.value)}
            multiline
            minRows={2}
          />
          {decision === 'approved' && needsPricing ? (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Notas de valoración'
                  value={pricingNotes}
                  onChange={(event) => setPricingNotes(event.target.value)}
                  multiline
                  minRows={2}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type='number'
                  label='Precio unitario'
                  value={approvedUnitPrice}
                  onChange={(event) => setApprovedUnitPrice(event.target.value)}
                  inputProps={{ min: 0 }}
                  helperText={`Cantidad a reconocer: ${pricedQuantity}`}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type='number'
                  label='Subtotal'
                  value={approvedUnitPrice ? approvedSubtotal : ''}
                  inputProps={{ min: 0 }}
                  InputProps={{ readOnly: true }}
                  helperText='Se calcula automáticamente'
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type='number'
                  label='Total aprobado'
                  value={approvedUnitPrice ? approvedTotal : ''}
                  inputProps={{ min: 0 }}
                  InputProps={{ readOnly: true }}
                  helperText='Se calcula automáticamente'
                />
              </Grid>
            </Grid>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button variant='contained' onClick={() => void handleSubmit()} disabled={isLoading}>
          Guardar decisión
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CalibrationServiceAdjustmentReviewDialog
