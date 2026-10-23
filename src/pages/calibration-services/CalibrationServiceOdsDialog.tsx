import { Alert, Checkbox, FormControlLabel, TextField } from '@mui/material'
import { useEffect, useState } from 'react'
import FormDialog, {
  FormDialogSection
} from '../../Components/Common/FormDialog'

export interface CalibrationServiceOdsDialogValues {
  issuedAt: string
  executionCustomerName: string
  executionSiteName: string
  scheduledFor: string
  scheduleWindow: string
  serviceComments: string
  modificationReason: string
  customerAgreements: string
  signerName: string
  signerRole: string
  externalReference: string
  receptionNotes: string
  internalNotes: string
  generatePdfImmediately: boolean
}

interface CalibrationServiceOdsDialogProps {
  open: boolean
  serviceCode: string
  initialValues: CalibrationServiceOdsDialogValues
  isLoading?: boolean
  isLabCalibration?: boolean
  onClose: () => void
  onSubmit: (values: CalibrationServiceOdsDialogValues) => Promise<void> | void
}

const FULL_ROW = { gridColumn: { sm: '1 / -1' } }

/** Emite la ODS de un servicio: fechas, datos operativos, observaciones y firma. */
const CalibrationServiceOdsDialog = ({
  open,
  serviceCode,
  initialValues,
  isLoading = false,
  isLabCalibration = false,
  onClose,
  onSubmit
}: CalibrationServiceOdsDialogProps) => {
  const [values, setValues] =
    useState<CalibrationServiceOdsDialogValues>(initialValues)

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
    <FormDialog
      open={open}
      onClose={isLoading ? () => undefined : onClose}
      title='Emitir ODS'
      subtitle={serviceCode}
      submitLabel={
        values.generatePdfImmediately ? 'Emitir ODS y generar PDF' : 'Emitir ODS'
      }
      onSubmit={() => void onSubmit(values)}
      loading={isLoading}
      maxWidth='md'
    >
      <Alert severity='info' sx={{ mb: 3 }}>
        {isLabCalibration
          ? 'Genera la orden de servicio y programa la calibración en laboratorio según el tiempo de entrega de la cotización.'
          : 'Genera la orden de servicio y activa el primer semáforo de seguimiento.'}
      </Alert>

      <FormDialogSection title='Fechas'>
        <TextField
          type='date'
          label='Fecha de emisión'
          value={values.issuedAt}
          disabled={isLoading}
          onChange={(event) => setField('issuedAt', event.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          type='date'
          label='Programada para'
          value={values.scheduledFor}
          disabled={isLoading}
          onChange={(event) => setField('scheduledFor', event.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label='Franja u horario'
          sx={FULL_ROW}
          value={values.scheduleWindow}
          disabled={isLoading}
          onChange={(event) => setField('scheduleWindow', event.target.value)}
          placeholder='Ej. 8:00 a.m. - 12:00 m.'
        />
      </FormDialogSection>

      <FormDialogSection
        title='Datos operativos'
        description='Si la cotización era para un cliente distinto al de la oferta, confírmalo aquí. Alimenta el encabezado «Cliente diferente oferta».'
      >
        <TextField
          label='Cliente de ejecución'
          value={values.executionCustomerName}
          disabled={isLoading}
          onChange={(event) =>
            setField('executionCustomerName', event.target.value)
          }
        />
        <TextField
          label='Sede de ejecución'
          value={values.executionSiteName}
          disabled={isLoading}
          onChange={(event) => setField('executionSiteName', event.target.value)}
        />
      </FormDialogSection>

      <FormDialogSection title='Observaciones de la ODS'>
        <TextField
          multiline
          minRows={3}
          label='Comentarios del servicio'
          value={values.serviceComments}
          disabled={isLoading}
          onChange={(event) => setField('serviceComments', event.target.value)}
        />
        <TextField
          multiline
          minRows={3}
          label='Motivo de modificación'
          value={values.modificationReason}
          disabled={isLoading}
          onChange={(event) =>
            setField('modificationReason', event.target.value)
          }
        />
        <TextField
          multiline
          minRows={3}
          label='Acuerdos con el cliente'
          value={values.customerAgreements}
          disabled={isLoading}
          onChange={(event) =>
            setField('customerAgreements', event.target.value)
          }
        />
        <TextField
          multiline
          minRows={3}
          label='Recepción y observaciones'
          value={values.receptionNotes}
          disabled={isLoading}
          onChange={(event) => setField('receptionNotes', event.target.value)}
        />
        <TextField
          multiline
          minRows={2}
          label='Notas internas'
          sx={FULL_ROW}
          value={values.internalNotes}
          disabled={isLoading}
          onChange={(event) => setField('internalNotes', event.target.value)}
        />
      </FormDialogSection>

      <FormDialogSection title='Firma y conformidad'>
        <TextField
          label='Nombre de quien recibe o valida'
          value={values.signerName}
          disabled={isLoading}
          onChange={(event) => setField('signerName', event.target.value)}
        />
        <TextField
          label='Cargo'
          value={values.signerRole}
          disabled={isLoading}
          onChange={(event) => setField('signerRole', event.target.value)}
        />
        <FormControlLabel
          sx={FULL_ROW}
          control={
            <Checkbox
              checked={values.generatePdfImmediately}
              disabled={isLoading}
              onChange={(event) =>
                setField('generatePdfImmediately', event.target.checked)
              }
              sx={{ '&.Mui-checked': { color: '#00BFA5' } }}
            />
          }
          label='Generar el PDF oficial de la ODS en este mismo paso'
        />
      </FormDialogSection>
    </FormDialog>
  )
}

export default CalibrationServiceOdsDialog
