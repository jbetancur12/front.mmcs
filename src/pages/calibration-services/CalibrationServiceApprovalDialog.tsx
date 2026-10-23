import { Box, MenuItem, TextField } from '@mui/material'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import FormDialog, {
  FormDialogSection
} from '../../Components/Common/FormDialog'
import FileDropZone from '../../Components/Common/FileDropZone'

const FULL_ROW = { gridColumn: { sm: '1 / -1' } }

const APPROVAL_CHANNEL_OPTIONS = [
  'En persona',
  'Por Email',
  'Por Telefono',
  'Por WhatsApp'
]

export type CalibrationServiceDecisionMode =
  | 'approve'
  | 'reject'
  | 'request_changes'

export interface CalibrationServiceDecisionValues {
  approvalChannel: string
  approvalReference: string
  decisionDate: string
  notes: string
  evidenceFile: File | null
  onSiteCalibration: boolean | null
  hasEquipmentSale: boolean | null
}

interface CalibrationServiceApprovalDialogProps {
  open: boolean
  mode: CalibrationServiceDecisionMode
  serviceCode: string
  isLoading?: boolean
  onClose: () => void
  onSubmit: (values: CalibrationServiceDecisionValues) => Promise<void> | void
}

const buildTodayValue = () => new Date().toISOString().slice(0, 10)

const createInitialValues = (): CalibrationServiceDecisionValues => ({
  approvalChannel: '',
  approvalReference: '',
  decisionDate: buildTodayValue(),
  notes: '',
  evidenceFile: null,
  onSiteCalibration: null,
  hasEquipmentSale: null
})

const CalibrationServiceApprovalDialog = ({
  open,
  mode,
  serviceCode,
  isLoading = false,
  onClose,
  onSubmit
}: CalibrationServiceApprovalDialogProps) => {
  const [values, setValues] =
    useState<CalibrationServiceDecisionValues>(createInitialValues)

  useEffect(() => {
    if (!open) {
      setValues(createInitialValues())
    }
  }, [open, mode])

  const isRejectMode = mode === 'reject'
  const isRequestChangesMode = mode === 'request_changes'

  const isDecisionApproval = !isRejectMode && !isRequestChangesMode
  const isIncomplete =
    !values.evidenceFile ||
    (isDecisionApproval &&
      (values.onSiteCalibration === null || values.hasEquipmentSale === null))

  const yesNo = (value: boolean | null) =>
    value === null ? '' : value ? 'si' : 'no'
  const parseYesNo = (value: string) =>
    value === 'si' ? true : value === 'no' ? false : null

  return (
    <FormDialog
      open={open}
      onClose={isLoading ? () => undefined : onClose}
      title={
        isRejectMode
          ? 'Registrar rechazo del cliente'
          : isRequestChangesMode
            ? 'Registrar solicitud de modificación'
            : 'Registrar aprobación del cliente'
      }
      subtitle={serviceCode}
      submitLabel={
        isRejectMode
          ? 'Registrar rechazo'
          : isRequestChangesMode
            ? 'Registrar solicitud'
            : 'Registrar aprobación'
      }
      onSubmit={() => void onSubmit(values)}
      loading={isLoading}
      submitDisabled={isIncomplete}
      maxWidth='md'
    >
      {isDecisionApproval ? (
        <FormDialogSection title='Alcance del servicio'>
          <TextField
            select
            required
            label='Calibración en sitio'
            value={yesNo(values.onSiteCalibration)}
            disabled={isLoading}
            onChange={(event) =>
              setValues((previous) => ({
                ...previous,
                onSiteCalibration: parseYesNo(event.target.value)
              }))
            }
          >
            <MenuItem value='si'>Sí</MenuItem>
            <MenuItem value='no'>No, en laboratorio</MenuItem>
          </TextField>
          <TextField
            select
            required
            label='Incluye venta de equipo'
            value={yesNo(values.hasEquipmentSale)}
            disabled={isLoading}
            onChange={(event) =>
              setValues((previous) => ({
                ...previous,
                hasEquipmentSale: parseYesNo(event.target.value)
              }))
            }
          >
            <MenuItem value='si'>Sí</MenuItem>
            <MenuItem value='no'>No</MenuItem>
          </TextField>
        </FormDialogSection>
      ) : null}

      <FormDialogSection
        title='Respuesta del cliente'
        description='Deja trazado cómo y cuándo respondió el cliente.'
      >
        <TextField
          select
          required
          label='Medio de respuesta'
          value={values.approvalChannel}
          disabled={isLoading}
          onChange={(event) =>
            setValues((previous) => ({
              ...previous,
              approvalChannel: event.target.value
            }))
          }
        >
          {APPROVAL_CHANNEL_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          type='date'
          label='Fecha'
          value={values.decisionDate}
          disabled={isLoading}
          onChange={(event) =>
            setValues((previous) => ({
              ...previous,
              decisionDate: event.target.value
            }))
          }
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          sx={FULL_ROW}
          required={isDecisionApproval}
          label='Email o teléfono de referencia'
          value={values.approvalReference}
          disabled={isLoading}
          onChange={(event) =>
            setValues((previous) => ({
              ...previous,
              approvalReference: event.target.value
            }))
          }
          helperText={
            isDecisionApproval
              ? 'Obligatorio: el contacto que aprobó.'
              : 'Opcional si la respuesta no llegó por un contacto específico.'
          }
        />
        <TextField
          sx={FULL_ROW}
          required={!isDecisionApproval}
          multiline
          minRows={3}
          label={
            isRejectMode
              ? 'Motivo u observación'
              : isRequestChangesMode
                ? 'Qué pidió modificar el cliente'
                : 'Observación'
          }
          value={values.notes}
          disabled={isLoading}
          onChange={(event) =>
            setValues((previous) => ({
              ...previous,
              notes: event.target.value
            }))
          }
          helperText={
            isRejectMode
              ? 'Cuenta brevemente por qué el cliente rechazó la cotización.'
              : isRequestChangesMode
                ? 'Qué pidió cambiar, para rehacer y reenviar la cotización.'
                : 'Contexto adicional de la respuesta del cliente.'
          }
        />
      </FormDialogSection>

      <FormDialogSection
        title='Evidencia'
        description='Obligatoria: correo, captura, acta o soporte de la respuesta.'
      >
        <Box sx={FULL_ROW}>
          <FileDropZone
            file={values.evidenceFile}
            onFileSelected={(file) =>
              setValues((previous) => ({ ...previous, evidenceFile: file }))
            }
            onReject={(message) => toast.error(message)}
            accept='.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx'
            acceptLabel='soporte'
            title='Arrastra la evidencia aquí o haz clic para elegirla'
            hint='PDF, imagen, Word o Excel · máximo 10 MB'
            disabled={isLoading}
          />
        </Box>
      </FormDialogSection>
    </FormDialog>
  )
}

export default CalibrationServiceApprovalDialog
