import React, { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Switch,
  TextField,
  Typography
} from '@mui/material'
import { getApiErrorMessage } from '@utils/apiError'
import { useCreateTypeAlias } from 'src/hooks/useCustomerIndicators'
import {
  AvailableCertificateType,
  IndicatorTypeRow
} from 'src/types/customerIndicators'
import { notify } from 'src/utils/notify'
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
  /** Tipos de equipo con certificados de cualquier tipo, aunque no sumen al avance. */
  availableTypes?: AvailableCertificateType[]
  onClose: () => void
}

interface AliasOption {
  key: string
  label: string
  /** Certificados que cuentan para el avance; `undefined` si no se conoce el desglose. */
  counted?: number
  certificateTypes?: { name: string; count: number }[]
}

/** "Calibración (3) · Verificación (1)" o el texto de respaldo si la API no manda el desglose. */
const describeCertificateTypes = (option: AliasOption) => {
  if (!option.certificateTypes?.length) return 'Con certificados de calibración'
  return option.certificateTypes
    .map((type) => `${type.name} (${type.count})`)
    .join(' · ')
}

/** Asocia, una sola vez y para todos los clientes, un nombre de la ODS con un tipo de certificado. */
const TypeAliasDialog: React.FC<Props> = ({
  source,
  rows,
  availableTypes,
  onClose
}) => {
  const [target, setTarget] = useState<AliasOption | null>(null)
  const [notMetrological, setNotMetrological] = useState(false)
  const { mutateAsync, isLoading } = useCreateTypeAlias()

  useEffect(() => {
    setTarget(null)
    setNotMetrological(false)
  }, [source])

  // El mismo equipo puede tener calibración y verificación: se ofrecen todos los tipos con certificados del
  // periodo, no solo los que ya suman al avance.
  const options = useMemo(() => {
    const byKey = new Map<string, AliasOption>()
    for (const row of rows) {
      if (row.calibrated > 0)
        byKey.set(row.key, { key: row.key, label: row.label })
    }
    for (const type of availableTypes ?? []) {
      byKey.set(type.key, {
        key: type.key,
        label: type.label,
        counted: type.counted,
        certificateTypes: type.certificateTypes
      })
    }
    return [...byKey.values()]
      .filter((option) => option.key !== source?.key)
      .sort((a, b) =>
        cleanTypeLabel(a.label).localeCompare(cleanTypeLabel(b.label), 'es')
      )
  }, [rows, availableTypes, source?.key])

  const handleSave = async () => {
    if (!source || (!notMetrological && !target)) return
    try {
      await mutateAsync(
        notMetrological
          ? { sourceName: source.label, notMetrological: true }
          : { sourceName: source.label, targetName: target?.label }
      )
      notify.success(
        notMetrological ? 'Ítem excluido de la meta' : 'Tipos asociados'
      )
      onClose()
    } catch (error) {
      notify.error(getApiErrorMessage(error, 'No se pudo asociar el tipo.'))
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
          <FormControlLabel
            control={
              <Switch
                checked={notMetrological}
                onChange={(_, checked) => setNotMetrological(checked)}
                disabled={isLoading}
              />
            }
            label='No es un equipo metrológico (viáticos, transporte, etc.)'
          />
          {notMetrological && (
            <Alert severity='info' sx={{ borderRadius: '12px' }}>
              «{source ? cleanTypeLabel(source.label) : ''}» sale de la meta y
              del avance de todos los clientes, y deja de aparecer para asociar.
              Queda registrado quién lo decidió.
            </Alert>
          )}
          {!notMetrological && (
            <Autocomplete
              options={options}
              value={target}
              onChange={(_, value) => setTarget(value)}
              getOptionLabel={(option) => cleanTypeLabel(option.label)}
              isOptionEqualToValue={(a, b) => a.key === b.key}
              noOptionsText='No hay tipos de equipo con certificados en este periodo'
              renderOption={(props, option) => (
                <Box
                  component='li'
                  {...props}
                  key={option.key}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start'
                  }}
                >
                  <Typography variant='body2' fontWeight={600}>
                    {cleanTypeLabel(option.label)}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {describeCertificateTypes(option)}
                  </Typography>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label='Tipo de los certificados'
                  required
                />
              )}
            />
          )}
          {!notMetrological && target && target.counted === 0 && (
            <Alert severity='warning' sx={{ borderRadius: '12px' }}>
              «{cleanTypeLabel(target.label)}» solo tiene certificados que no
              cuentan para el avance (
              {target.certificateTypes?.map((type) => type.name).join(', ')}).
              La asociación unifica el nombre, pero el porcentaje seguirá en 0
              hasta que exista un certificado de calibración, verificación,
              informe de validación, calificación o caracterización.
            </Alert>
          )}
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
          disabled={(!target && !notMetrological) || isLoading}
          startIcon={
            isLoading ? (
              <CircularProgress size={16} color='inherit' />
            ) : undefined
          }
          sx={emeraldButtonSx}
        >
          {notMetrological ? 'Excluir de la meta' : 'Asociar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default TypeAliasDialog
