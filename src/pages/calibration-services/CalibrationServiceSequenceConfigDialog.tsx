import { useEffect, useState } from 'react'
import { Button, MenuItem, TextField, Typography } from '@mui/material'
import FormDialog, {
  FormDialogSection
} from '../../Components/Common/FormDialog'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { useCalibrationAssignableMetrologists } from '../../hooks/useCalibrationServices'
import { CalibrationServiceSequenceConfig } from '../../types/calibrationService'
import { notify } from 'src/utils/notify'
import { confirmDialog } from 'src/utils/confirm'

interface CalibrationServiceSequenceConfigDialogProps {
  open: boolean
  isLoading?: boolean
  config?: CalibrationServiceSequenceConfig
  canResetSequence?: boolean
  onClose: () => void
  onSubmit: (values: {
    nextQuoteNumber: number
    nextOdsNumber: number
    labMetrologistUserId?: number | null
  }) => Promise<void> | void
}

const CalibrationServiceSequenceConfigDialog = ({
  open,
  isLoading = false,
  config,
  canResetSequence = false,
  onClose,
  onSubmit
}: CalibrationServiceSequenceConfigDialogProps) => {
  const { data: metrologists = [] } = useCalibrationAssignableMetrologists(open)
  const [nextQuoteNumber, setNextQuoteNumber] = useState('1')
  const [nextOdsNumber, setNextOdsNumber] = useState('1')
  const [labMetrologistUserId, setLabMetrologistUserId] = useState('')
  const [editMode, setEditMode] = useState(false)

  const isAlreadyInitialized = Boolean(config?.initialized)

  useEffect(() => {
    if (!open) {
      setEditMode(false)
      return
    }

    setNextQuoteNumber(String(config?.nextQuoteNumber ?? 1))
    setNextOdsNumber(String(config?.nextOdsNumber ?? 1))
    setLabMetrologistUserId(String(config?.labMetrologistUserId ?? ''))
  }, [
    config?.nextOdsNumber,
    config?.nextQuoteNumber,
    config?.labMetrologistUserId,
    open
  ])

  const quotePreview = `MMCS-${nextQuoteNumber || '...'}`
  const odsPreview = `${nextOdsNumber || '...'} -CAL-MMCS`

  const hasQuoteChanged =
    isAlreadyInitialized &&
    Number(nextQuoteNumber) !== (config?.nextQuoteNumber ?? 0)
  const hasOdsChanged =
    isAlreadyInitialized &&
    Number(nextOdsNumber) !== (config?.nextOdsNumber ?? 0)

  const handleEnableEdit = async () => {
    const result = await confirmDialog({
      title: 'Habilitar edición',
      html: `
        <p style="text-align:left;margin-bottom:12px">Vas a habilitar la edición de la configuración de laboratorio. Esta operación tiene <strong>riesgos</strong>:</p>
        <ul style="text-align:left;margin-bottom:12px">
          <li>Modificar consecutivos puede generar saltos en la numeración</li>
          <li>Los documentos ya emitidos mantienen su código actual</li>
          <li>Cambiar el metrólogo de laboratorio afecta servicios futuros</li>
        </ul>
        <p style="text-align:left;font-weight:600">¿Confirmas que deseas habilitar la edición?</p>
      `,
      confirmLabel: 'Sí, habilitar edición',
      cancelLabel: 'Cancelar',
      tone: 'danger'
    })
    if (result.isConfirmed) {
      setEditMode(true)
    }
  }

  const handleSubmit = async () => {
    const newQuote = Number(nextQuoteNumber)
    const newOds = Number(nextOdsNumber)

    // Validar que no sean menores a los actuales
    if (isAlreadyInitialized) {
      if (newQuote < (config?.nextQuoteNumber ?? 0)) {
        notify.error(
          'Consecutivo inválido',
          `El consecutivo de oferta no puede ser menor al actual (${config?.nextQuoteNumber}). Ya se emitieron documentos hasta ese número.`
        )
        return
      }
      if (newOds < (config?.nextOdsNumber ?? 0)) {
        notify.error(
          'Consecutivo inválido',
          `El consecutivo de ODS no puede ser menor al actual (${config?.nextOdsNumber}). Ya se emitieron documentos hasta ese número.`
        )
        return
      }
    }

    // SweetAlert si hay cambios en consecutivos
    if (hasQuoteChanged || hasOdsChanged) {
      const result = await confirmDialog({
        title: '¿Cambiar consecutivos?',
        html: `
          <p style="text-align:left;margin-bottom:12px">Vas a modificar los consecutivos del módulo de calibración. Esta operación tiene <strong>riesgos</strong>:</p>
          <ul style="text-align:left;margin-bottom:12px">
            <li>Los documentos ya emitidos mantienen su código actual</li>
            <li>Los nuevos documentos se generarán con el nuevo consecutivo</li>
            <li>Pueden generarse saltos en la numeración</li>
          </ul>
          <p style="text-align:left;font-weight:600">¿Confirmas que deseas continuar?</p>
        `,
        confirmLabel: 'Sí, cambiar consecutivos',
        cancelLabel: 'Cancelar',
        tone: 'danger'
      })
      if (!result.isConfirmed) return
    }

    await onSubmit({
      nextQuoteNumber: newQuote,
      nextOdsNumber: newOds,
      labMetrologistUserId: labMetrologistUserId
        ? Number(labMetrologistUserId)
        : null
    })

    setEditMode(false)
  }

  const fieldsDisabled = isLoading || !editMode

  return (
    <FormDialog
      open={open}
      onClose={isLoading ? () => undefined : onClose}
      title={
        isAlreadyInitialized
          ? 'Configuración de laboratorio'
          : 'Configurar consecutivos iniciales'
      }
      subtitle={
        !isAlreadyInitialized
          ? 'Define desde qué número arrancan la oferta y la ODS antes de usar el módulo.'
          : editMode
            ? 'Edición habilitada: ten precaución al cambiar los valores.'
            : 'Configuración actual. Está bloqueada para evitar cambios accidentales.'
      }
      submitLabel='Guardar configuración'
      onSubmit={() => void handleSubmit()}
      loading={isLoading}
      submitDisabled={
        !editMode || Number(nextQuoteNumber) < 1 || Number(nextOdsNumber) < 1
      }
    >
      {isAlreadyInitialized && canResetSequence && !editMode ? (
        <Button
          variant='outlined'
          color='warning'
          startIcon={<EditOutlinedIcon />}
          onClick={() => void handleEnableEdit()}
          sx={{ textTransform: 'none', fontWeight: 600, mb: 3 }}
        >
          Habilitar edición
        </Button>
      ) : null}

      <FormDialogSection title='Consecutivos'>
        <TextField
          type='number'
          label='Consecutivo inicial de oferta'
          value={nextQuoteNumber}
          onChange={(event) => setNextQuoteNumber(event.target.value)}
          disabled={fieldsDisabled || isLoading}
          inputProps={{ min: 1 }}
          helperText={`Vista previa: ${quotePreview}`}
        />
        <TextField
          type='number'
          label='Consecutivo inicial de ODS'
          value={nextOdsNumber}
          onChange={(event) => setNextOdsNumber(event.target.value)}
          disabled={fieldsDisabled || isLoading}
          inputProps={{ min: 1 }}
          helperText={`Vista previa: ${odsPreview}`}
        />
      </FormDialogSection>

      <FormDialogSection
        title='Laboratorio'
        description='El metrólogo que recibe automáticamente los servicios de calibración en laboratorio (cuando no es en sitio).'
      >
        <TextField
          select
          label='Metrólogo de laboratorio'
          sx={{ gridColumn: { sm: '1 / -1' } }}
          value={labMetrologistUserId}
          disabled={fieldsDisabled || isLoading}
          onChange={(event) => setLabMetrologistUserId(event.target.value)}
          SelectProps={{ displayEmpty: true }}
          InputLabelProps={{ shrink: true }}
        >
          <MenuItem value=''>
            <em>Selecciona un metrólogo</em>
          </MenuItem>
          {metrologists.map((metrologist) => (
            <MenuItem key={metrologist.id} value={String(metrologist.id)}>
              {metrologist.nombre}
              {metrologist.email ? ` · ${metrologist.email}` : ''}
            </MenuItem>
          ))}
        </TextField>
      </FormDialogSection>

      {!canResetSequence && isAlreadyInitialized ? (
        <Typography
          variant='caption'
          color='text.secondary'
          sx={{ display: 'block', mt: 2, fontStyle: 'italic' }}
        >
          Solo un administrador puede modificar esta configuración.
        </Typography>
      ) : null}
    </FormDialog>
  )
}

export default CalibrationServiceSequenceConfigDialog
