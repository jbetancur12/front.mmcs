import React, { useEffect, useState } from 'react'
import {
  Autocomplete,
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
import { getApiErrorMessage } from '@utils/apiError'
import { useCreateTypeAlias } from 'src/hooks/useCustomerIndicators'
import { IndicatorTypeRow } from 'src/types/customerIndicators'
import { bigToast } from '../ExcelManipulation/Utils'
import {
  EMERALD_GRADIENT,
  cleanTypeLabel,
  emeraldButtonSx
} from './indicatorFormat'

interface Props {
  /** Tipo de la ODS que no coincidió con ningún certificado; `null` cierra el diálogo. */
  source: IndicatorTypeRow | null
  /** Todos los tipos de la tabla: los que tienen certificados son los destinos posibles. */
  rows: IndicatorTypeRow[]
  onClose: () => void
}

/** Asocia, una sola vez y para todos los clientes, un nombre de la ODS con un tipo de certificado. */
const TypeAliasDialog: React.FC<Props> = ({ source, rows, onClose }) => {
  const [target, setTarget] = useState<IndicatorTypeRow | null>(null)
  const { mutateAsync, isLoading } = useCreateTypeAlias()

  useEffect(() => {
    setTarget(null)
  }, [source])

  const options = rows.filter(
    (row) => row.calibrated > 0 && row.key !== source?.key
  )

  const handleSave = async () => {
    if (!source || !target) return
    try {
      await mutateAsync({ sourceName: source.label, targetName: target.label })
      bigToast('Tipos asociados', 'success')
      onClose()
    } catch (error) {
      bigToast(
        getApiErrorMessage(error, 'No se pudo asociar el tipo.'),
        'error'
      )
    }
  }

  return (
    <Dialog
      open={!!source}
      onClose={isLoading ? undefined : onClose}
      fullWidth
      maxWidth='sm'
      aria-labelledby='type-alias-title'
      PaperProps={{ sx: { borderRadius: '16px' } }}
    >
      <DialogTitle
        id='type-alias-title'
        sx={{
          background: EMERALD_GRADIENT,
          color: 'white',
          textAlign: 'center',
          fontWeight: 700
        }}
      >
        Asociar tipo de equipo
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'grid', gap: 2.5, mt: 2 }}>
          <Typography variant='body2' color='text.secondary'>
            «{source ? cleanTypeLabel(source.label) : ''}» viene de la ODS y no
            coincide con ningún certificado. Elige el tipo de los certificados
            al que equivale. Se aplica a todos los clientes y no se puede
            deshacer desde aquí.
          </Typography>
          <Autocomplete
            options={options}
            value={target}
            onChange={(_, value) => setTarget(value)}
            getOptionLabel={(option) => cleanTypeLabel(option.label)}
            isOptionEqualToValue={(a, b) => a.key === b.key}
            noOptionsText='No hay tipos con certificados en este periodo'
            renderInput={(params) => (
              <TextField
                {...params}
                label='Tipo de los certificados'
                required
              />
            )}
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
          variant='contained'
          onClick={handleSave}
          disabled={!target || isLoading}
          startIcon={
            isLoading ? (
              <CircularProgress size={16} color='inherit' />
            ) : undefined
          }
          sx={emeraldButtonSx}
        >
          Asociar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default TypeAliasDialog
