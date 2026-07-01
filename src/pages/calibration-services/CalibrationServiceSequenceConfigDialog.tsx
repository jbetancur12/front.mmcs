import { useEffect, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import Swal from 'sweetalert2'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { useCalibrationAssignableMetrologists } from '../../hooks/useCalibrationServices'
import { CalibrationServiceSequenceConfig } from '../../types/calibrationService'

interface CalibrationServiceSequenceConfigDialogProps {
  open: boolean
  isLoading?: boolean
  config?: CalibrationServiceSequenceConfig
  isAdmin?: boolean
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
  isAdmin = false,
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
  }, [config?.nextOdsNumber, config?.nextQuoteNumber, config?.labMetrologistUserId, open])

  const quotePreview = `MMCS-${nextQuoteNumber || '...'}`
  const odsPreview = `${nextOdsNumber || '...'} -CAL-MMCS`

  const hasQuoteChanged =
    isAlreadyInitialized && Number(nextQuoteNumber) !== (config?.nextQuoteNumber ?? 0)
  const hasOdsChanged =
    isAlreadyInitialized && Number(nextOdsNumber) !== (config?.nextOdsNumber ?? 0)

  const handleEnableEdit = async () => {
    const result = await Swal.fire({
      icon: 'warning',
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
      confirmButtonText: 'Sí, habilitar edición',
      cancelButtonText: 'Cancelar',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      reverseButtons: true
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
        Swal.fire({
          icon: 'error',
          title: 'Consecutivo inválido',
          text: `El consecutivo de oferta no puede ser menor al actual (${config?.nextQuoteNumber}). Ya se emitieron documentos hasta ese número.`
        })
        return
      }
      if (newOds < (config?.nextOdsNumber ?? 0)) {
        Swal.fire({
          icon: 'error',
          title: 'Consecutivo inválido',
          text: `El consecutivo de ODS no puede ser menor al actual (${config?.nextOdsNumber}). Ya se emitieron documentos hasta ese número.`
        })
        return
      }
    }

    // SweetAlert si hay cambios en consecutivos
    if (hasQuoteChanged || hasOdsChanged) {
      const result = await Swal.fire({
        icon: 'warning',
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
        confirmButtonText: 'Sí, cambiar consecutivos',
        cancelButtonText: 'Cancelar',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        reverseButtons: true
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
    <Dialog open={open} onClose={isLoading ? undefined : onClose} maxWidth='sm' fullWidth>
      <DialogTitle>
        {isAlreadyInitialized
          ? 'Configuración de laboratorio'
          : 'Configurar consecutivos iniciales'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {!isAlreadyInitialized ? (
            <Typography variant='body2' color='text.secondary'>
              Antes de usar el módulo por primera vez, define desde qué número debe
              arrancar la oferta y desde cuál debe arrancar la ODS.
            </Typography>
          ) : (
            <Typography variant='body2' color='text.secondary'>
              {editMode
                ? 'Los campos están habilitados para edición. Ten precaución al modificar los valores.'
                : 'Configuración actual del módulo. Los campos están bloqueados para evitar cambios accidentales.'}
            </Typography>
          )}

          {/* Botón habilitar edición (solo admin, solo cuando ya inicializado) */}
          {isAlreadyInitialized && isAdmin && !editMode ? (
            <Button
              variant='outlined'
              color='warning'
              startIcon={<EditOutlinedIcon />}
              onClick={() => void handleEnableEdit()}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Habilitar edición
            </Button>
          ) : null}

          <TextField
            fullWidth
            type='number'
            label='Consecutivo inicial de oferta'
            value={nextQuoteNumber}
            onChange={(event) => setNextQuoteNumber(event.target.value)}
            disabled={fieldsDisabled || isLoading}
            inputProps={{ min: 1 }}
          />
          <Typography variant='caption' color='text.secondary'>
            Vista previa: {quotePreview}
          </Typography>
          <TextField
            fullWidth
            type='number'
            label='Consecutivo inicial de ODS'
            value={nextOdsNumber}
            onChange={(event) => setNextOdsNumber(event.target.value)}
            disabled={fieldsDisabled || isLoading}
            inputProps={{ min: 1 }}
          />
          <Typography variant='caption' color='text.secondary'>
            Vista previa: {odsPreview}
          </Typography>

          <Typography variant='h6' fontWeight={700} sx={{ mt: 2 }}>
            Configuración de laboratorio
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Metrólogo de laboratorio</InputLabel>
            <Select
              value={labMetrologistUserId}
              label='Metrólogo de laboratorio'
              disabled={fieldsDisabled || isLoading}
              onChange={(event) =>
                setLabMetrologistUserId(event.target.value)
              }
            >
              <MenuItem value=''>
                <em>Selecciona un metrólogo</em>
              </MenuItem>
              {metrologists.map((metrologist) => (
                <MenuItem
                  key={metrologist.id}
                  value={String(metrologist.id)}
                >
                  {metrologist.nombre}
                  {metrologist.email ? ` · ${metrologist.email}` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant='caption' color='text.secondary'>
            Metrólogo que recibirá automáticamente los servicios de
            calibración en laboratorio (cuando no sea en sitio).
          </Typography>
          {!isAdmin && isAlreadyInitialized ? (
            <Typography variant='caption' color='text.secondary' sx={{ fontStyle: 'italic' }}>
              Solo un administrador puede modificar esta configuración.
            </Typography>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button
          variant='contained'
          onClick={() => void handleSubmit()}
          disabled={
            isLoading ||
            !editMode ||
            Number(nextQuoteNumber) < 1 ||
            Number(nextOdsNumber) < 1
          }
        >
          Guardar configuración
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CalibrationServiceSequenceConfigDialog