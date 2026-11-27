import { useEffect, useState } from 'react'
import {
  Alert,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField
} from '@mui/material'
import FormDialog from '../../../Components/Common/FormDialog'
import {
  useServiceVisits,
  useVisitMutation
} from '../../../hooks/useCalibrationVisits'
import { CalibrationService } from '../../../types/calibrationService'
import { CalibrationVisit } from '../../../types/calibrationVisit'
import VisitItemsPicker, { buildPickerItems } from './VisitItemsPicker'
import { formatDay, todayKey } from './visitUtils'

interface Props {
  service: CalibrationService
  visit: CalibrationVisit | null
  onClose: () => void
}

interface Row {
  executed: string
  nonCertifiable: string
  note: string
}

const EMPTY_ROW: Row = { executed: '', nonCertifiable: '', note: '' }

// Arranca solo con lo planeado (o lo ya registrado, al corregir); lo demás se busca y se agrega.
const buildRows = (visit: CalibrationVisit) =>
  Object.fromEntries(
    visit.items.flatMap((saved) => {
      const executed =
        visit.status === 'executed'
          ? saved.executedQuantity
          : saved.plannedQuantity
      if (!executed) return []
      return [
        [
          saved.itemId,
          {
            executed: String(executed),
            nonCertifiable: saved.nonCertifiableQuantity
              ? String(saved.nonCertifiableQuantity)
              : '',
            note: saved.note || ''
          }
        ]
      ]
    })
  ) as Record<number, Row>

/** Cuántos equipos se calibraron en la visita: de ahí sale cuántos certificados debe. */
const VisitExecutionDialog = ({ service, visit, onClose }: Props) => {
  const [rows, setRows] = useState<Record<number, Row>>({})
  const [reason, setReason] = useState('')
  const [finished, setFinished] = useState('')
  const mutation = useVisitMutation(service.id)
  const { data: serviceVisits } = useServiceVisits(service.id, Boolean(visit))

  useEffect(() => {
    if (visit) {
      setRows(buildRows(visit))
      setReason('')
      setFinished('')
    }
  }, [visit])

  if (!visit) return null

  const correcting = visit.status === 'executed'
  // Antes de la fecha final hay que confirmar que la visita ya terminó.
  const beforeEnd = !correcting && visit.endDate > todayKey()
  const set = (itemId: number, patch: Partial<Row>) =>
    setRows((current) => ({
      ...current,
      [itemId]: { ...current[itemId], ...patch }
    }))

  const filled = Object.entries(rows).filter(([, row]) => row.executed !== '')
  const invalid =
    (beforeEnd && finished !== 'yes') ||
    !filled.length ||
    filled.some(([, row]) => {
      const without = Number(row.nonCertifiable) || 0
      return without > Number(row.executed) || (without > 0 && !row.note.trim())
    }) ||
    (correcting && !reason.trim())

  const submit = () =>
    mutation.mutate(
      {
        method: 'post',
        path: `visits/${visit.id}/execution`,
        success: correcting ? 'Cantidades corregidas' : 'Ejecución registrada',
        body: {
          items: filled.map(([itemId, row]) => ({
            itemId: Number(itemId),
            executedQuantity: Number(row.executed) || 0,
            nonCertifiableQuantity: Number(row.nonCertifiable) || 0,
            note: row.note
          })),
          ...(correcting ? { reason } : {}),
          ...(beforeEnd ? { finished: true } : {})
        }
      },
      { onSuccess: onClose }
    )

  return (
    <FormDialog
      open
      onClose={mutation.isLoading ? () => undefined : onClose}
      title={correcting ? 'Corregir cantidades' : 'Registrar ejecución'}
      subtitle={`Visita ${visit.visitNumber} · ${service.odsCode || service.serviceCode}`}
      submitLabel={correcting ? 'Guardar corrección' : 'Registrar ejecución'}
      onSubmit={submit}
      loading={mutation.isLoading}
      submitDisabled={invalid}
      maxWidth='md'
    >
      <Stack spacing={2}>
        <Alert severity='info'>
          Escribe cuántos equipos calibraste. La visita queda completa cuando
          estén cargados los certificados de todos.
        </Alert>
        {beforeEnd && (
          <FormControl>
            <FormLabel id='visit-finished'>
              {`La visita está programada hasta el ${formatDay(visit.endDate, "d 'de' MMMM")}. ¿Ya terminó?`}
            </FormLabel>
            <RadioGroup
              row
              aria-labelledby='visit-finished'
              value={finished}
              onChange={(event) => setFinished(event.target.value)}
            >
              <FormControlLabel
                value='yes'
                control={<Radio />}
                label='Sí, terminó'
              />
              <FormControlLabel value='no' control={<Radio />} label='No' />
            </RadioGroup>
          </FormControl>
        )}
        {finished === 'yes' && (
          <Alert severity='warning'>
            La fecha final pasa a hoy y desde hoy corre el plazo para cargar los
            certificados.
          </Alert>
        )}
        {finished === 'no' && (
          <Alert severity='info'>
            Registra la ejecución cuando termine la visita.
          </Alert>
        )}
        <VisitItemsPicker
          items={buildPickerItems(service, serviceVisits?.visits, visit.id)}
          selectedIds={Object.keys(rows).map(Number)}
          onAdd={(added) =>
            setRows((current) => ({
              ...Object.fromEntries(added.map((i) => [i.id, EMPTY_ROW])),
              ...current
            }))
          }
          onRemove={(itemId) =>
            setRows((current) => {
              const next = { ...current }
              delete next[itemId]
              return next
            })
          }
          renderFields={(item) => {
            const row = rows[item.id]
            if (!row) return null
            const without = Number(row.nonCertifiable) || 0
            return (
              <Stack spacing={1} sx={{ width: { sm: 260 } }}>
                <Stack direction='row' spacing={1}>
                  <TextField
                    type='number'
                    size='small'
                    label='Calibrados'
                    value={row.executed}
                    inputProps={{ min: 0 }}
                    onChange={(event) =>
                      set(item.id, { executed: event.target.value })
                    }
                  />
                  <TextField
                    type='number'
                    size='small'
                    label='Sin certificado'
                    value={row.nonCertifiable}
                    inputProps={{ min: 0 }}
                    error={without > Number(row.executed || 0)}
                    onChange={(event) =>
                      set(item.id, { nonCertifiable: event.target.value })
                    }
                  />
                </Stack>
                {without > 0 && (
                  <TextField
                    size='small'
                    label='¿Por qué no llevan certificado?'
                    value={row.note}
                    onChange={(event) =>
                      set(item.id, { note: event.target.value })
                    }
                    required
                  />
                )}
              </Stack>
            )
          }}
        />
        {correcting && (
          <TextField
            label='Motivo de la corrección'
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            required
            fullWidth
          />
        )}
      </Stack>
    </FormDialog>
  )
}

export default VisitExecutionDialog
