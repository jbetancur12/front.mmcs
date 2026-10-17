import React from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography
} from '@mui/material'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { getApiErrorMessage } from '@utils/apiError'
import { useSaveIndicatorGoal } from 'src/hooks/useCustomerIndicators'
import { bigToast } from '../ExcelManipulation/Utils'
import {
  EMERALD_GRADIENT,
  formatCount,
  emeraldButtonSx
} from './indicatorFormat'

interface Props {
  open: boolean
  onClose: () => void
  customerId: number | string
  year: number
  /** Contratado según las ODS del año (solo lectura). */
  contracted: number
  currentManualGoal?: number | null
  currentReason?: string | null
}

const schema = Yup.object({
  manualGoal: Yup.number()
    .typeError('Escribe un número')
    .integer('Debe ser un número entero')
    .moreThan(0, 'Debe ser mayor que 0')
    .required('La meta es obligatoria'),
  reason: Yup.string()
    .trim()
    .min(5, 'Escribe al menos 5 caracteres')
    .max(500, 'Máximo 500 caracteres')
    .required('El motivo es obligatorio')
})

/** Diálogo para fijar una meta distinta de la automática, con motivo. */
const GoalOverrideDialog: React.FC<Props> = ({
  open,
  onClose,
  customerId,
  year,
  contracted,
  currentManualGoal,
  currentReason
}) => {
  const { mutateAsync, isLoading } = useSaveIndicatorGoal()

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      manualGoal: currentManualGoal ? String(currentManualGoal) : '',
      reason: currentReason ?? ''
    },
    validationSchema: schema,
    onSubmit: async (values) => {
      try {
        await mutateAsync({
          customerId,
          year,
          mode: 'manual',
          manualGoal: Number(values.manualGoal),
          reason: values.reason.trim()
        })
        bigToast('Meta guardada', 'success')
        onClose()
      } catch (error) {
        bigToast(
          getApiErrorMessage(error, 'No se pudo guardar la meta.'),
          'error'
        )
      }
    }
  })

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      fullWidth
      maxWidth='sm'
      aria-labelledby='goal-override-title'
      PaperProps={{ sx: { borderRadius: '16px' } }}
    >
      <form onSubmit={formik.handleSubmit} noValidate>
        <DialogTitle
          id='goal-override-title'
          sx={{
            background: EMERALD_GRADIENT,
            color: 'white',
            textAlign: 'center',
            fontWeight: 700
          }}
        >
          Meta de calibración {year}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'grid', gap: 2.5, mt: 2 }}>
            <Typography variant='body2' color='text.secondary'>
              La meta automática es la suma de los equipos de las ODS del año.
              Fija otra solo si el comité acordó un número distinto, y deja el
              motivo.
            </Typography>
            <TextField
              label='Contratado según las ODS del año'
              value={formatCount(contracted)}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              id='manualGoal'
              name='manualGoal'
              label='Meta para el comité'
              type='number'
              value={formik.values.manualGoal}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.manualGoal && !!formik.errors.manualGoal}
              helperText={formik.touched.manualGoal && formik.errors.manualGoal}
              inputProps={{ min: 1, step: 1 }}
              required
              fullWidth
            />
            <TextField
              id='reason'
              name='reason'
              label='Motivo'
              value={formik.values.reason}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.reason && !!formik.errors.reason}
              helperText={
                (formik.touched.reason && formik.errors.reason) ||
                `${formik.values.reason.length} / 500 caracteres`
              }
              multiline
              minRows={3}
              required
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={onClose}
            disabled={isLoading}
            sx={{ textTransform: 'none' }}
          >
            Cancelar
          </Button>
          <Button
            type='submit'
            variant='contained'
            disabled={isLoading}
            startIcon={
              isLoading ? (
                <CircularProgress size={16} color='inherit' />
              ) : undefined
            }
            sx={emeraldButtonSx}
          >
            Guardar meta
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default GoalOverrideDialog
