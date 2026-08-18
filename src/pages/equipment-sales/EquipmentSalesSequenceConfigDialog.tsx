import { useEffect, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import Swal from 'sweetalert2'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { EquipmentQuotationSequenceConfig } from '../../types/equipmentSales'

interface EquipmentSalesSequenceConfigDialogProps {
  open: boolean
  isLoading?: boolean
  config?: EquipmentQuotationSequenceConfig
  isAdmin?: boolean
  onClose: () => void
  onSubmit: (values: { nextQuoteNumber: number }) => Promise<void> | void
}

const EquipmentSalesSequenceConfigDialog = ({
  open,
  isLoading = false,
  config,
  isAdmin = false,
  onClose,
  onSubmit
}: EquipmentSalesSequenceConfigDialogProps) => {
  const [nextQuoteNumber, setNextQuoteNumber] = useState('1')
  const [editMode, setEditMode] = useState(false)

  const isAlreadyInitialized = Boolean(config?.initialized)

  useEffect(() => {
    if (!open) {
      setEditMode(false)
      return
    }
    setNextQuoteNumber(String(config?.nextQuoteNumber ?? 1))
    // Primera configuración: editable sin gate de admin.
    if (!config?.initialized) {
      setEditMode(true)
    }
  }, [config?.initialized, config?.nextQuoteNumber, open])

  const quotePreview = `${config?.quotePrefix || 'COT-EQ-'}${String(nextQuoteNumber).padStart(4, '0')}`
  const hasQuoteChanged =
    isAlreadyInitialized && Number(nextQuoteNumber) !== (config?.nextQuoteNumber ?? 0)

  const handleEnableEdit = async () => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Habilitar edición',
      html: `
        <p style="text-align:left;margin-bottom:12px">Vas a habilitar la edición de los consecutivos. Esta operación tiene <strong>riesgos</strong>:</p>
        <ul style="text-align:left;margin-bottom:12px">
          <li>Modificar consecutivos puede generar saltos en la numeración</li>
          <li>Las cotizaciones ya emitidas mantienen su código actual</li>
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

    if (isAlreadyInitialized) {
      if (newQuote < (config?.nextQuoteNumber ?? 0)) {
        Swal.fire({
          icon: 'error',
          title: 'Consecutivo inválido',
          text: `El consecutivo no puede ser menor al actual (${config?.nextQuoteNumber}). Ya se emitieron cotizaciones hasta ese número.`
        })
        return
      }
    }

    if (hasQuoteChanged) {
      const result = await Swal.fire({
        icon: 'warning',
        title: '¿Cambiar consecutivo?',
        html: `
          <p style="text-align:left;margin-bottom:12px">Vas a modificar el consecutivo de cotizaciones. Esta operación tiene <strong>riesgos</strong>:</p>
          <ul style="text-align:left;margin-bottom:12px">
            <li>Las cotizaciones ya emitidas mantienen su código actual</li>
            <li>Las nuevas cotizaciones se generarán con el nuevo consecutivo</li>
            <li>Pueden generarse saltos en la numeración</li>
          </ul>
          <p style="text-align:left;font-weight:600">¿Confirmas que deseas continuar?</p>
        `,
        confirmButtonText: 'Sí, cambiar consecutivo',
        cancelButtonText: 'Cancelar',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        reverseButtons: true
      })
      if (!result.isConfirmed) return
    }

    await onSubmit({ nextQuoteNumber: newQuote })
    setEditMode(false)
  }

  const fieldsDisabled = isLoading || (isAlreadyInitialized && !editMode)

  return (
    <Dialog open={open} onClose={isLoading ? undefined : onClose} maxWidth='sm' fullWidth>
      <DialogTitle>
        {isAlreadyInitialized
          ? 'Configuración de consecutivos'
          : 'Configurar consecutivo inicial'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {!isAlreadyInitialized ? (
            <Typography variant='body2' color='text.secondary'>
              Antes de guardar la primera cotización, define desde qué número debe
              arrancar el consecutivo. Sin esta configuración el sistema deriva el
              código automáticamente.
            </Typography>
          ) : (
            <Typography variant='body2' color='text.secondary'>
              {editMode
                ? 'Los campos están habilitados para edición. Ten precaución al modificar los valores.'
                : 'Configuración actual del módulo. Los campos están bloqueados para evitar cambios accidentales.'}
            </Typography>
          )}

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
            label='Consecutivo inicial de cotización'
            value={nextQuoteNumber}
            onChange={(event) => setNextQuoteNumber(event.target.value)}
            disabled={fieldsDisabled || isLoading}
            inputProps={{ min: 1 }}
          />
          <Typography variant='caption' color='text.secondary'>
            Vista previa: {quotePreview}
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
          disabled={isLoading || (isAlreadyInitialized && !editMode) || Number(nextQuoteNumber) < 1}
        >
          Guardar configuración
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EquipmentSalesSequenceConfigDialog
