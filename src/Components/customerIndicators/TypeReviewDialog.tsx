import React, { useMemo, useState } from 'react'
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
  TEAL_TEXT,
  cleanTypeLabel,
  emeraldButtonSx,
  formatCount
} from './indicatorFormat'

interface Props {
  open: boolean
  /** Tipos de la ODS que no coinciden con ningún certificado. Al guardar uno, desaparece de la lista. */
  unmatched: IndicatorTypeRow[]
  /** Todos los tipos de la tabla: los que tienen certificados son destinos posibles. */
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
  if (!option.certificateTypes?.length) return 'Con certificados'
  return option.certificateTypes
    .map((type) => `${type.name} (${type.count})`)
    .join(' · ')
}

interface RowProps {
  source: IndicatorTypeRow
  options: AliasOption[]
}

/** Una fila por tipo de la ODS: se asocia a un tipo con certificados o se marca como no metrológico. */
const ReviewRow: React.FC<RowProps> = ({ source, options }) => {
  const [target, setTarget] = useState<AliasOption | null>(null)
  const { mutateAsync, isLoading } = useCreateTypeAlias()
  const label = cleanTypeLabel(source.label)

  const save = async (
    payload: Parameters<typeof mutateAsync>[0],
    ok: string
  ) => {
    try {
      await mutateAsync(payload)
      notify.success(ok)
    } catch (error) {
      notify.error(getApiErrorMessage(error, 'No se pudo guardar.'))
    }
  }

  return (
    <Box
      component='li'
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(140px, 1fr) 1.4fr auto' },
        gap: 1.5,
        alignItems: 'start',
        py: 1.5,
        borderBottom: '1px solid #e5e7eb'
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant='body2'
          fontWeight={600}
          sx={{ overflowWrap: 'anywhere' }}
        >
          {label}
        </Typography>
        <Typography variant='caption' color='text.secondary'>
          {formatCount(source.contracted)} contratados
        </Typography>
      </Box>
      <Box>
        <Autocomplete
          size='small'
          options={options.filter((option) => option.key !== source.key)}
          value={target}
          onChange={(_, value) => setTarget(value)}
          disabled={isLoading}
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
            <TextField {...params} label='Equivale al tipo' />
          )}
        />
        {target && target.counted === 0 && (
          <Typography
            variant='caption'
            sx={{ display: 'block', mt: 0.5, color: '#b45309' }}
          >
            Solo tiene certificados que no cuentan para el avance (
            {target.certificateTypes?.map((type) => type.name).join(', ')}).
          </Typography>
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant='contained'
          size='small'
          disabled={!target || isLoading}
          onClick={() =>
            save(
              { sourceName: source.label, targetName: target?.label },
              'Tipos asociados'
            )
          }
          startIcon={
            isLoading ? (
              <CircularProgress size={14} color='inherit' />
            ) : undefined
          }
          sx={emeraldButtonSx}
        >
          Asociar
        </Button>
        <Button
          size='small'
          disabled={isLoading}
          onClick={() =>
            save(
              { sourceName: source.label, notMetrological: true },
              'Ítem excluido de la meta'
            )
          }
          sx={{ textTransform: 'none', fontWeight: 600, color: TEAL_TEXT }}
        >
          No es metrológico
        </Button>
      </Box>
    </Box>
  )
}

/**
 * Revisión de los tipos de la ODS que no cruzan con ningún certificado. Cada decisión se guarda al instante, se
 * aplica a todos los clientes y no se puede deshacer desde aquí.
 */
const TypeReviewDialog: React.FC<Props> = ({
  open,
  unmatched,
  rows,
  availableTypes,
  onClose
}) => {
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
    return [...byKey.values()].sort((a, b) =>
      cleanTypeLabel(a.label).localeCompare(cleanTypeLabel(b.label), 'es')
    )
  }, [rows, availableTypes])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='md'
      aria-labelledby='type-review-title'
      PaperProps={{ sx: { borderRadius: '12px' } }}
    >
      <DialogTitle id='type-review-title' sx={{ fontWeight: 700 }}>
        Revisar tipos de equipo
      </DialogTitle>
      <DialogContent>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
          Estos nombres vienen de la ODS y no coinciden con ningún certificado.
          Para cada uno, elige el tipo de los certificados al que equivale, o
          márcalo como no metrológico (viáticos, transporte…) para sacarlo de la
          meta. Se aplica a todos los clientes y no se puede deshacer desde
          aquí.
        </Typography>
        {unmatched.length === 0 ? (
          <Alert severity='success' sx={{ borderRadius: '12px', mt: 2 }}>
            No quedan tipos por revisar.
          </Alert>
        ) : (
          <Box component='ul' sx={{ listStyle: 'none', p: 0, m: 0 }}>
            {unmatched.map((row) => (
              <ReviewRow key={row.key} source={row} options={options} />
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default TypeReviewDialog
