import React, { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  MenuItem,
  Radio,
  TextField,
  Typography
} from '@mui/material'
import SignalLoader from 'src/Components/Common/SignalLoader'
import {
  useReleaseCatalogs,
  useReleaseMatches
} from 'src/hooks/releaseCertificates/useReleaseCertificates'
import {
  RELEASE_MATCH_LABELS,
  ReleaseNewEquipment,
  ReleaseTarget
} from './ReleaseCertificates.types'

interface ReleaseEquipmentDialogProps {
  certificateId: number | null
  /** Anexo ligado a su principal: solo se confirma, no hay equipo que elegir. */
  confirmOnly: boolean
  releasing: boolean
  onClose: () => void
  onRelease: (
    target: ReleaseTarget | undefined,
    saveEquivalence: boolean
  ) => void
}

const NEW = 'new'

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString('es-CO') : '—'

const EMPTY: ReleaseNewEquipment = {
  deviceId: '',
  certificateTypeId: '',
  city: '',
  location: '',
  sede: '',
  headquarter: '',
  activoFijo: '',
  serie: ''
}

/** La analista elige el equipo del cliente (o crea uno) y confirma: nunca se sincroniza sin esto. */
const ReleaseEquipmentDialog: React.FC<ReleaseEquipmentDialogProps> = ({
  certificateId,
  confirmOnly,
  releasing,
  onClose,
  onRelease
}) => {
  const { data, isLoading } = useReleaseMatches(
    confirmOnly ? null : certificateId
  )
  const { data: catalogs } = useReleaseCatalogs(
    certificateId !== null && !confirmOnly
  )
  const [choice, setChoice] = useState<string>(NEW)
  const [months, setMonths] = useState<6 | 12>(12)
  const [form, setForm] = useState<ReleaseNewEquipment>(EMPTY)
  const [remember, setRemember] = useState(true)

  useEffect(() => {
    if (!data) return
    const first = data.candidates[0]
    if (first) {
      setChoice(String(first.id))
      setMonths(first.suggestedMonths)
    } else {
      setChoice(NEW)
      setMonths(data.prefill.months)
    }
    setForm({
      ...EMPTY,
      deviceId: data.prefill.deviceId ?? '',
      serie: data.prefill.serie,
      activoFijo: data.prefill.activoFijo,
      location: data.prefill.location,
      sede: data.prefill.sede
    })
  }, [data])

  const creating = choice === NEW
  const missing =
    creating &&
    (!form.deviceId ||
      !form.certificateTypeId ||
      !form.city.trim() ||
      !form.location.trim() ||
      !form.sede.trim() ||
      !form.headquarter.trim())

  const confirm = () => {
    if (confirmOnly) return onRelease(undefined, false)
    const target: ReleaseTarget = creating
      ? { mode: 'new', months, ...form }
      : { mode: 'existing', fileId: Number(choice), months }
    onRelease(target, remember)
  }

  const set =
    (key: keyof ReleaseNewEquipment) =>
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }))

  return (
    <Dialog
      open={certificateId !== null}
      onClose={releasing ? undefined : onClose}
      fullWidth
      maxWidth='md'
    >
      <DialogTitle>Liberar certificado</DialogTitle>
      <DialogContent dividers>
        {confirmOnly ? (
          <Alert severity='info'>
            Este anexo queda liberado junto a su certificado principal; no crea
            otro equipo.
          </Alert>
        ) : isLoading || !data ? (
          <SignalLoader message='Buscando el equipo del cliente' />
        ) : (
          <>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
              Elige el equipo del cliente que corresponde a este certificado, o
              crea uno nuevo. No se crea ni se actualiza nada hasta que
              confirmes.
            </Typography>

            {data.candidates.map((candidate) => (
              <Box
                key={candidate.id}
                onClick={() => {
                  setChoice(String(candidate.id))
                  setMonths(candidate.suggestedMonths)
                }}
                sx={{
                  display: 'flex',
                  gap: 1,
                  alignItems: 'flex-start',
                  p: 1.5,
                  mb: 1,
                  borderRadius: 2,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor:
                    choice === String(candidate.id) ? '#00695C' : '#e5e7eb',
                  bgcolor: choice === String(candidate.id) ? '#f0fbf9' : '#fff'
                }}
              >
                <Radio
                  checked={choice === String(candidate.id)}
                  inputProps={{
                    'aria-label': `Actualizar el equipo ${candidate.deviceName ?? candidate.id}`
                  }}
                />
                <Box sx={{ minWidth: 0 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1,
                      flexWrap: 'wrap',
                      alignItems: 'center'
                    }}
                  >
                    <Typography fontWeight={600}>
                      {candidate.deviceName ?? 'Equipo'}
                    </Typography>
                    <Chip
                      size='small'
                      label={RELEASE_MATCH_LABELS[candidate.matchBy]}
                    />
                    {candidate.typeMatches === false && (
                      <Chip
                        size='small'
                        color='warning'
                        label='Otro tipo de equipo'
                      />
                    )}
                  </Box>
                  <Typography variant='body2' color='text.secondary'>
                    Serie {candidate.serie || '—'} · Activo fijo{' '}
                    {candidate.activoFijo || '—'} · {candidate.location || '—'}
                    {candidate.sede ? ` · ${candidate.sede}` : ''}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    Calibrado {formatDate(candidate.calibrationDate)} · vence{' '}
                    {formatDate(candidate.nextCalibrationDate)} (período de{' '}
                    {candidate.suggestedMonths} meses)
                  </Typography>
                </Box>
              </Box>
            ))}

            <Box
              onClick={() => setChoice(NEW)}
              sx={{
                display: 'flex',
                gap: 1,
                alignItems: 'center',
                p: 1.5,
                borderRadius: 2,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: creating ? '#00695C' : '#e5e7eb',
                bgcolor: creating ? '#f0fbf9' : '#fff'
              }}
            >
              <Radio
                checked={creating}
                inputProps={{ 'aria-label': 'Crear un equipo nuevo' }}
              />
              <Typography fontWeight={600}>
                {data.candidates.length
                  ? 'Ninguno: es un equipo nuevo del cliente'
                  : 'No hay equipos parecidos: crear un equipo nuevo del cliente'}
              </Typography>
            </Box>

            {creating && (
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    size='small'
                    label='Tipo de equipo'
                    value={form.deviceId}
                    onChange={set('deviceId')}
                    helperText={
                      data.deviceSuggestions.length
                        ? `Sugerido por el instrumento del PDF`
                        : 'Sin sugerencia: elíjalo de la lista'
                    }
                  >
                    {(catalogs?.devices ?? []).map((device) => (
                      <MenuItem key={device.id} value={device.id}>
                        {device.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    size='small'
                    label='Tipo de certificado'
                    value={form.certificateTypeId}
                    onChange={set('certificateTypeId')}
                  >
                    {(catalogs?.certificateTypes ?? []).map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                {(
                  [
                    ['city', 'Ciudad'],
                    ['sede', 'Sede (dirección)'],
                    ['headquarter', 'Sede del cliente'],
                    ['location', 'Ubicación'],
                    ['serie', 'Serie'],
                    ['activoFijo', 'Activo fijo']
                  ] as [keyof ReleaseNewEquipment, string][]
                ).map(([key, label]) => (
                  <Grid item xs={12} sm={6} key={key}>
                    <TextField
                      fullWidth
                      size='small'
                      label={label}
                      value={form[key]}
                      onChange={set(key)}
                    />
                  </Grid>
                ))}
              </Grid>
            )}

            <Box
              sx={{
                display: 'flex',
                gap: 2,
                flexWrap: 'wrap',
                alignItems: 'center',
                mt: 2
              }}
            >
              <TextField
                select
                size='small'
                label='Próxima calibración'
                value={months}
                onChange={(event) =>
                  setMonths(Number(event.target.value) as 6 | 12)
                }
                sx={{ minWidth: 200 }}
              >
                <MenuItem value={12}>A 12 meses</MenuItem>
                <MenuItem value={6}>A 6 meses</MenuItem>
              </TextField>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                  />
                }
                label='Recordar este tipo de equipo para el instrumento'
              />
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={releasing}>
          Cancelar
        </Button>
        <Button
          variant='contained'
          disabled={releasing || (!confirmOnly && (isLoading || missing))}
          onClick={confirm}
          sx={{ bgcolor: '#00BFA5', '&:hover': { bgcolor: '#00897B' } }}
        >
          {confirmOnly
            ? 'Confirmar y liberar'
            : creating
              ? 'Crear equipo y liberar'
              : 'Actualizar equipo y liberar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ReleaseEquipmentDialog
