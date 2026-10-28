import { useEffect, useState } from 'react'
import { Alert, Button, TextField } from '@mui/material'
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined'
import { useCan } from '@utils/functions'
import { notify } from 'src/utils/notify'
import { PERMISSIONS } from 'src/constants/permissions'
import FormDialog, {
  FormDialogSection
} from '../../../Components/Common/FormDialog'
import { useCalibrationServiceMutations } from '../../../hooks/useCalibrationServices'
import { getApiErrorMessage } from '../../../utils/apiError'
import { CalibrationService } from '../../../types/calibrationService'
import { secondaryActionSx } from './calibrationServiceDetailUtils'

interface Props {
  service: CalibrationService
}

const REISSUE_STATUSES = [
  'ods_issued',
  'pending_programming',
  'scheduled',
  'in_execution',
  'technically_completed'
]

const FULL_ROW = { gridColumn: { sm: '1 / -1' } }

type Fields = {
  executionCustomerName: string
  executionSiteName: string
  contactName: string
  contactPhone: string
  address: string
  serviceComments: string
  customerAgreements: string
  signerName: string
  signerRole: string
  receptionNotes: string
  reason: string
}

const text = (value: unknown) => (typeof value === 'string' ? value : '')

const buildInitial = (service: CalibrationService): Fields => {
  const ods = (service.otherFields?.ods || {}) as Record<string, unknown>
  return {
    executionCustomerName: text(service.executionCustomerName),
    executionSiteName: text(service.executionSiteName),
    contactName: text(service.contactName),
    contactPhone: text(service.contactPhone),
    address: text(service.address),
    serviceComments: text(ods.serviceComments),
    customerAgreements: text(ods.customerAgreements),
    signerName: text(ods.signerName),
    signerRole: text(ods.signerRole),
    receptionNotes: text(ods.receptionNotes),
    reason: ''
  }
}

const LABELS: Array<[keyof Fields, string, boolean]> = [
  ['executionCustomerName', 'Cliente en ejecución', false],
  ['executionSiteName', 'Sede de ejecución', false],
  ['contactName', 'Contacto', false],
  ['contactPhone', 'Teléfono de contacto', false],
  ['address', 'Dirección', true],
  ['serviceComments', 'Comentarios del servicio', true],
  ['customerAgreements', 'Acuerdos con el cliente', true],
  ['signerName', 'Quién firma', false],
  ['signerRole', 'Cargo de quien firma', false],
  ['receptionNotes', 'Notas de recepción', true]
]

/**
 * Reemitir la ODS ya emitida con una nueva versión (H-14): corrige datos con un motivo obligatorio; la versión anterior
 * queda en el historial y se genera un PDF nuevo sin borrar el anterior. Solo con la capacidad de emitir ODS.
 */
const CalibrationServiceOdsReissueAction = ({ service }: Props) => {
  const canIssueOds = useCan(PERMISSIONS.CALIBRATION_SERVICE_ODS)
  const { reissueOds } = useCalibrationServiceMutations()
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<Fields>(() => buildInitial(service))

  useEffect(() => {
    if (open) {
      setValues(buildInitial(service))
    }
  }, [open, service])

  if (
    !canIssueOds ||
    !service.odsCode ||
    !REISSUE_STATUSES.includes(service.status)
  ) {
    return null
  }

  const odsVersion =
    Number(
      (service.otherFields?.ods as { version?: number } | undefined)?.version
    ) || 1

  const handleSubmit = async () => {
    if (values.reason.trim().length < 5) {
      notify.error('Escribe el motivo de la reemisión.')
      return
    }
    const initial = buildInitial(service)
    const changes = Object.fromEntries(
      (Object.keys(values) as Array<keyof Fields>)
        .filter((key) => key !== 'reason' && values[key] !== initial[key])
        .map((key) => [key, values[key]])
    )
    if (!Object.keys(changes).length) {
      notify.error('Modifica al menos un dato de la ODS.')
      return
    }
    try {
      const result = await reissueOds.mutateAsync({
        serviceId: service.id,
        reason: values.reason.trim(),
        ...changes
      })
      setOpen(false)
      if ((result as { pdfError?: string }).pdfError) {
        notify.warning((result as { pdfError?: string }).pdfError as string)
      } else {
        notify.success(`ODS reemitida: versión ${odsVersion + 1}.`)
      }
    } catch (error) {
      notify.error(getApiErrorMessage(error, 'No fue posible reemitir la ODS'))
    }
  }

  return (
    <>
      <Button
        variant='outlined'
        startIcon={<AutorenewOutlinedIcon />}
        onClick={() => setOpen(true)}
        sx={secondaryActionSx}
      >
        Reemitir ODS
      </Button>
      <FormDialog
        open={open}
        onClose={reissueOds.isLoading ? () => undefined : () => setOpen(false)}
        title='Reemitir ODS'
        subtitle={`${service.odsCode} · versión actual ${odsVersion}`}
        submitLabel={`Reemitir como versión ${odsVersion + 1}`}
        onSubmit={() => void handleSubmit()}
        loading={reissueOds.isLoading}
        maxWidth='md'
      >
        <Alert severity='info' sx={{ mb: 3 }}>
          Corrige solo lo que cambió. Se genera un PDF nuevo y el anterior queda
          guardado junto con el motivo en el historial.
        </Alert>
        <FormDialogSection title='Datos de la ODS'>
          {LABELS.map(([key, label, wide]) => (
            <TextField
              key={key}
              label={label}
              value={values[key]}
              multiline={wide}
              minRows={wide ? 2 : undefined}
              sx={wide ? FULL_ROW : undefined}
              onChange={(event) =>
                setValues((previous) => ({
                  ...previous,
                  [key]: event.target.value
                }))
              }
            />
          ))}
        </FormDialogSection>
        <FormDialogSection title='Motivo'>
          <TextField
            required
            multiline
            minRows={2}
            sx={FULL_ROW}
            label='Motivo de la reemisión'
            value={values.reason}
            onChange={(event) =>
              setValues((previous) => ({
                ...previous,
                reason: event.target.value
              }))
            }
          />
        </FormDialogSection>
      </FormDialog>
    </>
  )
}

export default CalibrationServiceOdsReissueAction
