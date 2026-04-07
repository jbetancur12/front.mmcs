import {
  Alert,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  FormControlLabel,
  Grid,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { useEffect, useState } from 'react'

export interface CalibrationServiceOdsDialogValues {
  issuedAt: string
  executionCustomerName: string
  executionSiteName: string
  contactName: string
  contactEmail: string
  contactPhone: string
  city: string
  department: string
  address: string
  internalNotes: string
  scheduledFor: string
  scheduleWindow: string
  serviceComments: string
  modificationReason: string
  customerAgreements: string
  signerName: string
  signerRole: string
  externalReference: string
  receptionNotes: string
  generatePdfImmediately: boolean
}

interface CalibrationServiceOdsDialogProps {
  open: boolean
  serviceCode: string
  initialValues: CalibrationServiceOdsDialogValues
  isLoading?: boolean
  onClose: () => void
  onSubmit: (values: CalibrationServiceOdsDialogValues) => Promise<void> | void
}

const CalibrationServiceOdsDialog = ({
  open,
  serviceCode,
  initialValues,
  isLoading = false,
  onClose,
  onSubmit
}: CalibrationServiceOdsDialogProps) => {
  const [values, setValues] = useState<CalibrationServiceOdsDialogValues>(
    initialValues
  )

  useEffect(() => {
    if (open) {
      setValues(initialValues)
    }
  }, [initialValues, open])

  const setField = <K extends keyof CalibrationServiceOdsDialogValues>(
    field: K,
    value: CalibrationServiceOdsDialogValues[K]
  ) => {
    setValues((previous) => ({
      ...previous,
      [field]: value
    }))
  }

  return (
    <Dialog open={open} onClose={isLoading ? undefined : onClose} fullWidth maxWidth='md'>
      <DialogTitle>Emitir ODS para {serviceCode}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Alert severity='info'>
            Esta acción genera la Orden de Servicio y activa el primer semáforo de seguimiento.
          </Alert>

          <FormControlLabel
            control={
              <Checkbox
                checked={values.generatePdfImmediately}
                disabled={isLoading}
                onChange={(event) =>
                  setField('generatePdfImmediately', event.target.checked)
                }
              />
            }
            label='Generar el PDF oficial de la ODS en este mismo paso'
          />

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type='date'
                label='Fecha de emisión'
                value={values.issuedAt}
                disabled={isLoading}
                onChange={(event) => setField('issuedAt', event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type='date'
                label='Programada para'
                value={values.scheduledFor}
                disabled={isLoading}
                onChange={(event) => setField('scheduledFor', event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label='Franja / ventana'
                value={values.scheduleWindow}
                disabled={isLoading}
                onChange={(event) => setField('scheduleWindow', event.target.value)}
                placeholder='Ej. 8:00 a.m. - 12:00 m.'
              />
            </Grid>
          </Grid>

          <Typography variant='subtitle2' fontWeight={700}>
            Datos operativos
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Cliente de ejecución'
                value={values.executionCustomerName}
                disabled={isLoading}
                onChange={(event) =>
                  setField('executionCustomerName', event.target.value)
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Sede de ejecución'
                value={values.executionSiteName}
                disabled={isLoading}
                onChange={(event) => setField('executionSiteName', event.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label='Contacto'
                value={values.contactName}
                disabled={isLoading}
                onChange={(event) => setField('contactName', event.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label='Email'
                value={values.contactEmail}
                disabled={isLoading}
                onChange={(event) => setField('contactEmail', event.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label='Teléfono'
                value={values.contactPhone}
                disabled={isLoading}
                onChange={(event) => setField('contactPhone', event.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label='Ciudad'
                value={values.city}
                disabled={isLoading}
                onChange={(event) => setField('city', event.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label='Departamento'
                value={values.department}
                disabled={isLoading}
                onChange={(event) => setField('department', event.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label='Referencia externa'
                value={values.externalReference}
                disabled={isLoading}
                onChange={(event) => setField('externalReference', event.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Dirección'
                value={values.address}
                disabled={isLoading}
                onChange={(event) => setField('address', event.target.value)}
              />
            </Grid>
          </Grid>

          <Typography variant='subtitle2' fontWeight={700}>
            Observaciones ODS
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label='Comentarios del servicio'
                value={values.serviceComments}
                disabled={isLoading}
                onChange={(event) => setField('serviceComments', event.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label='Motivo de modificación'
                value={values.modificationReason}
                disabled={isLoading}
                onChange={(event) =>
                  setField('modificationReason', event.target.value)
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label='Acuerdos con el cliente'
                value={values.customerAgreements}
                disabled={isLoading}
                onChange={(event) =>
                  setField('customerAgreements', event.target.value)
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label='Recepción / observaciones'
                value={values.receptionNotes}
                disabled={isLoading}
                onChange={(event) => setField('receptionNotes', event.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                label='Notas internas'
                value={values.internalNotes}
                disabled={isLoading}
                onChange={(event) => setField('internalNotes', event.target.value)}
              />
            </Grid>
          </Grid>

          <Typography variant='subtitle2' fontWeight={700}>
            Firma / conformidad
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Nombre de quien recibe o valida'
                value={values.signerName}
                disabled={isLoading}
                onChange={(event) => setField('signerName', event.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Cargo'
                value={values.signerRole}
                disabled={isLoading}
                onChange={(event) => setField('signerRole', event.target.value)}
              />
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button
          variant='contained'
          disabled={isLoading}
          onClick={() => void onSubmit(values)}
        >
          {isLoading
            ? 'Emitiendo ODS...'
            : values.generatePdfImmediately
              ? 'Emitir ODS y generar PDF'
              : 'Emitir ODS'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CalibrationServiceOdsDialog
