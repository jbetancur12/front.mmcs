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
import { useCalibrationAssignableMetrologists } from '../../hooks/useCalibrationServices'
import { CalibrationServiceSequenceConfig } from '../../types/calibrationService'

interface CalibrationServiceSequenceConfigDialogProps {
  open: boolean
  isLoading?: boolean
  config?: CalibrationServiceSequenceConfig
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
  onClose,
  onSubmit
}: CalibrationServiceSequenceConfigDialogProps) => {
  const { data: metrologists = [] } = useCalibrationAssignableMetrologists(open)
  const [nextQuoteNumber, setNextQuoteNumber] = useState('1')
  const [nextOdsNumber, setNextOdsNumber] = useState('1')
  const [labMetrologistUserId, setLabMetrologistUserId] = useState('')

  useEffect(() => {
    if (!open) {
      return
    }

    setNextQuoteNumber(String(config?.nextQuoteNumber ?? 1))
    setNextOdsNumber(String(config?.nextOdsNumber ?? 1))
    setLabMetrologistUserId(String(config?.labMetrologistUserId ?? ''))
  }, [config?.nextOdsNumber, config?.nextQuoteNumber, config?.labMetrologistUserId, open])

  const quotePreview = `MMCS-${nextQuoteNumber || '...'}`
  const odsPreview = `${nextOdsNumber || '...'} -CAL-MMCS`

  const handleSubmit = async () => {
    await onSubmit({
      nextQuoteNumber: Number(nextQuoteNumber),
      nextOdsNumber: Number(nextOdsNumber),
      labMetrologistUserId: labMetrologistUserId
        ? Number(labMetrologistUserId)
        : null
    })
  }

  return (
    <Dialog open={open} onClose={isLoading ? undefined : onClose} maxWidth='sm' fullWidth>
      <DialogTitle>Configurar consecutivos iniciales</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant='body2' color='text.secondary'>
            Antes de usar el módulo por primera vez, define desde qué número debe
            arrancar la oferta y desde cuál debe arrancar la ODS.
          </Typography>
          <TextField
            fullWidth
            type='number'
            label='Consecutivo inicial de oferta'
            value={nextQuoteNumber}
            onChange={(event) => setNextQuoteNumber(event.target.value)}
            disabled={isLoading}
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
            disabled={isLoading}
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
              disabled={isLoading}
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
