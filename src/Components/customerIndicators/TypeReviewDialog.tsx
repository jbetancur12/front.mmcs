import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  TextField,
  Typography
} from '@mui/material'
import { getApiErrorMessage } from '@utils/apiError'
import {
  useCreateTypeAlias,
  useDeleteTypeAlias,
  useTypeAliases
} from 'src/hooks/useCustomerIndicators'
import {
  AvailableCertificateType,
  IndicatorTypeRow,
  TypeAliasEntry
} from 'src/types/customerIndicators'
import { confirmDialog } from 'src/utils/confirm'
import { notify } from 'src/utils/notify'
import {
  TEAL_TEXT,
  cleanTypeLabel,
  emeraldButtonSx,
  formatCount,
  formatDate
} from './indicatorFormat'
import { suggestType } from './typeSuggestions'

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

type Reason = 'alias' | 'texto'

/** "Calibración (3) · Verificación (1)" o el texto de respaldo si la API no manda el desglose. */
const describeCertificateTypes = (option: AliasOption) => {
  if (!option.certificateTypes?.length) return 'Con certificados'
  return option.certificateTypes
    .map((type) => `${type.name} (${type.count})`)
    .join(' · ')
}

const REASON_HINT: Record<Reason, string> = {
  alias: 'Se parece a un nombre que ya asociaste antes',
  texto: 'Se parece al nombre de este equipo en los certificados'
}

interface RowProps {
  source: IndicatorTypeRow
  options: AliasOption[]
  target: AliasOption | null
  suggestedBy?: Reason
  busy: boolean
  onTargetChange: (option: AliasOption | null) => void
  onAssociate: () => void
  onExclude: () => void
}

/** Una fila por tipo de la ODS: se asocia a un tipo con certificados o se marca como no metrológico. */
const ReviewRow: React.FC<RowProps> = ({
  source,
  options,
  target,
  suggestedBy,
  busy,
  onTargetChange,
  onAssociate,
  onExclude
}) => (
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
        {cleanTypeLabel(source.label)}
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
        onChange={(_, value) => onTargetChange(value)}
        disabled={busy}
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
      {suggestedBy && target && (
        <Chip
          size='small'
          label='Sugerido'
          title={REASON_HINT[suggestedBy]}
          sx={{
            mt: 0.75,
            bgcolor: '#E0F7F4',
            color: TEAL_TEXT,
            fontWeight: 600
          }}
        />
      )}
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
        disabled={!target || busy}
        onClick={onAssociate}
        startIcon={
          busy ? <CircularProgress size={14} color='inherit' /> : undefined
        }
        sx={emeraldButtonSx}
      >
        Asociar
      </Button>
      <Button
        size='small'
        disabled={busy}
        onClick={onExclude}
        sx={{ textTransform: 'none', fontWeight: 600, color: TEAL_TEXT }}
      >
        No es metrológico
      </Button>
    </Box>
  </Box>
)

/** Nombre legible de un alias guardado: viene normalizado (minúsculas, sin tildes). */
const aliasLabel = (entry: TypeAliasEntry) =>
  entry.notMetrological ? 'No es metrológico' : entry.targetName

/**
 * Revisión de los tipos de la ODS que no cruzan con ningún certificado. Propone un tipo cuando hay un candidato
 * claro; cada decisión se guarda al instante, se aplica a todos los clientes y se puede deshacer más abajo.
 */
const TypeReviewDialog: React.FC<Props> = ({
  open,
  unmatched,
  rows,
  availableTypes,
  onClose
}) => {
  const { mutateAsync: createAlias } = useCreateTypeAlias()
  const { mutateAsync: removeAlias } = useDeleteTypeAlias()
  const { data: aliases = [], isFetched } = useTypeAliases(open)
  const [selection, setSelection] = useState<
    Record<string, AliasOption | null>
  >({})
  const [suggested, setSuggested] = useState<Record<string, Reason>>({})
  const [busyKeys, setBusyKeys] = useState<string[]>([])
  const [bulkRunning, setBulkRunning] = useState(false)
  const [undoingId, setUndoingId] = useState<number | null>(null)
  // Claves a las que ya se les propuso algo, para no pisar lo que la persona cambió
  const proposed = useRef<Set<string>>(new Set())

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

  useEffect(() => {
    if (!open) {
      proposed.current = new Set()
      setSelection({})
      setSuggested({})
      return
    }
    // Esperar a que lleguen las asociaciones guardadas antes de proponer
    if (!isFetched) return
    const nextSelection: Record<string, AliasOption | null> = {}
    const nextSuggested: Record<string, Reason> = {}
    for (const row of unmatched) {
      if (proposed.current.has(row.key)) continue
      proposed.current.add(row.key)
      const suggestion = suggestType(row.label, options, aliases)
      if (suggestion) {
        nextSelection[row.key] = suggestion.option
        nextSuggested[row.key] = suggestion.reason
      }
    }
    if (Object.keys(nextSelection).length) {
      setSelection((current) => ({ ...nextSelection, ...current }))
      setSuggested((current) => ({ ...nextSuggested, ...current }))
    }
  }, [open, isFetched, unmatched, options, aliases])

  const setBusy = (key: string, busy: boolean) =>
    setBusyKeys((current) =>
      busy ? [...current, key] : current.filter((item) => item !== key)
    )

  const save = async (
    row: IndicatorTypeRow,
    payload: Parameters<typeof createAlias>[0],
    success: string
  ) => {
    setBusy(row.key, true)
    try {
      await createAlias(payload)
      notify.success(success)
    } catch (error) {
      notify.error(
        getApiErrorMessage(
          error,
          `No se pudo guardar «${cleanTypeLabel(row.label)}».`
        )
      )
    } finally {
      setBusy(row.key, false)
    }
  }

  const associate = (row: IndicatorTypeRow) => {
    const target = selection[row.key]
    if (!target) return
    save(
      row,
      { sourceName: row.label, targetName: target.label },
      'Tipos asociados'
    )
  }

  const withTarget = unmatched.filter((row) => selection[row.key])

  const associateAll = async () => {
    const { isConfirmed } = await confirmDialog({
      title: `Asociar ${withTarget.length} tipos`,
      text: 'Se guardan las asociaciones que ves elegidas, para todos los clientes. Revisa que sean correctas: se pueden deshacer, pero una por una.',
      confirmLabel: 'Asociar'
    })
    if (!isConfirmed) return
    setBulkRunning(true)
    let saved = 0
    for (const row of withTarget) {
      const target = selection[row.key]
      if (!target) continue
      setBusy(row.key, true)
      try {
        await createAlias({ sourceName: row.label, targetName: target.label })
        saved += 1
      } catch (error) {
        notify.error(
          getApiErrorMessage(
            error,
            `No se pudo asociar «${cleanTypeLabel(row.label)}».`
          )
        )
      } finally {
        setBusy(row.key, false)
      }
    }
    setBulkRunning(false)
    if (saved) notify.success(`${saved} tipos asociados`)
  }

  const undo = async (entry: TypeAliasEntry) => {
    const { isConfirmed } = await confirmDialog({
      title: 'Deshacer',
      text: `«${entry.sourceName}» volverá a la lista por revisar y su cantidad volverá a la meta o a su tipo original, en todos los clientes.`,
      confirmLabel: 'Deshacer'
    })
    if (!isConfirmed) return
    setUndoingId(entry.id)
    try {
      await removeAlias(entry.id)
      notify.success('Decisión deshecha')
    } catch (error) {
      notify.error(getApiErrorMessage(error, 'No se pudo deshacer.'))
    } finally {
      setUndoingId(null)
    }
  }

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
          meta. Se aplica a todos los clientes. Donde hay un candidato claro ya
          viene elegido: revísalo antes de asociar.
        </Typography>
        {unmatched.length === 0 ? (
          <Alert severity='success' sx={{ borderRadius: '12px', mt: 2 }}>
            No quedan tipos por revisar.
          </Alert>
        ) : (
          <>
            {withTarget.length > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', my: 1 }}>
                <Button
                  variant='outlined'
                  size='small'
                  disabled={bulkRunning || busyKeys.length > 0}
                  onClick={associateAll}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    color: TEAL_TEXT
                  }}
                >
                  Asociar los {withTarget.length} con tipo elegido
                </Button>
              </Box>
            )}
            <Box component='ul' sx={{ listStyle: 'none', p: 0, m: 0 }}>
              {unmatched.map((row) => (
                <ReviewRow
                  key={row.key}
                  source={row}
                  options={options}
                  target={selection[row.key] ?? null}
                  suggestedBy={suggested[row.key]}
                  busy={busyKeys.includes(row.key)}
                  onTargetChange={(option) => {
                    setSelection((current) => ({
                      ...current,
                      [row.key]: option
                    }))
                    setSuggested((current) => {
                      const next = { ...current }
                      delete next[row.key]
                      return next
                    })
                  }}
                  onAssociate={() => associate(row)}
                  onExclude={() =>
                    save(
                      row,
                      { sourceName: row.label, notMetrological: true },
                      'Ítem excluido de la meta'
                    )
                  }
                />
              ))}
            </Box>
          </>
        )}
        {aliases.length > 0 && (
          <>
            <Divider sx={{ mt: 3, mb: 2 }} />
            <Typography variant='subtitle2' fontWeight={700}>
              Decisiones guardadas ({aliases.length})
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              Valen para todos los clientes. Si alguna está mal, deshazla y el
              nombre vuelve a la lista por revisar.
            </Typography>
            <Box
              component='ul'
              sx={{
                listStyle: 'none',
                p: 0,
                m: 0,
                maxHeight: 220,
                overflowY: 'auto'
              }}
            >
              {aliases.map((entry) => (
                <Box
                  component='li'
                  key={entry.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    py: 0.75,
                    borderBottom: '1px solid #f3f4f6'
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant='body2'
                      sx={{ overflowWrap: 'anywhere' }}
                    >
                      {entry.sourceName} → <strong>{aliasLabel(entry)}</strong>
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {entry.createdBy?.name ?? 'Sin registro'}
                      {entry.createdAt
                        ? ` · ${formatDate(entry.createdAt)}`
                        : ''}
                    </Typography>
                  </Box>
                  <Button
                    size='small'
                    disabled={undoingId === entry.id}
                    onClick={() => undo(entry)}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      color: TEAL_TEXT
                    }}
                  >
                    Deshacer
                  </Button>
                </Box>
              ))}
            </Box>
          </>
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
