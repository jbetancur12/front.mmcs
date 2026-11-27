import { useEffect, useState } from 'react'
import { Alert, Box, Stack, TextField, Typography } from '@mui/material'
import FormDialog from '../../../Components/Common/FormDialog'
import { useVisitMutation } from '../../../hooks/useCalibrationVisits'
import { CalibrationService } from '../../../types/calibrationService'
import { CalibrationVisit } from '../../../types/calibrationVisit'
import { neutral } from 'src/theme/designTokens'

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

const buildRows = (service: CalibrationService, visit: CalibrationVisit) =>
  Object.fromEntries(
    (service.items || []).map((item) => {
      const saved = visit.items.find((i) => i.itemId === item.id)
      const executed =
        visit.status === 'executed'
          ? saved?.executedQuantity
          : saved?.plannedQuantity
      return [
        item.id,
        {
          executed: executed ? String(executed) : '',
          nonCertifiable: saved?.nonCertifiableQuantity
            ? String(saved.nonCertifiableQuantity)
            : '',
          note: saved?.note || ''
        }
      ]
    })
  ) as Record<number, Row>

/** Cuántos equipos se calibraron en la visita: de ahí sale cuántos certificados debe. */
const VisitExecutionDialog = ({ service, visit, onClose }: Props) => {
  const [rows, setRows] = useState<Record<number, Row>>({})
  const [reason, setReason] = useState('')
  const mutation = useVisitMutation(service.id)

  useEffect(() => {
    if (visit) {
      setRows(buildRows(service, visit))
      setReason('')
    }
  }, [service, visit])

  if (!visit) return null

  const correcting = visit.status === 'executed'
  const set = (itemId: number, patch: Partial<Row>) =>
    setRows((current) => ({
      ...current,
      [itemId]: { ...current[itemId], ...patch }
    }))

  const filled = Object.entries(rows).filter(([, row]) => row.executed !== '')
  const invalid =
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
          ...(correcting ? { reason } : {})
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
        {(service.items || []).map((item) => {
          const row = rows[item.id]
          if (!row) return null
          const without = Number(row.nonCertifiable) || 0
          return (
            <Box
              key={item.id}
              sx={{
                border: `1px solid ${neutral.border}`,
                borderRadius: 2,
                p: 1.5
              }}
            >
              <Typography fontWeight={600} sx={{ mb: 1 }}>
                {item.itemName}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                  type='number'
                  size='small'
                  label='Calibrados'
                  value={row.executed}
                  inputProps={{ min: 0 }}
                  onChange={(event) =>
                    set(item.id, { executed: event.target.value })
                  }
                  fullWidth
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
                  fullWidth
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
                  fullWidth
                  sx={{ mt: 1.5 }}
                />
              )}
            </Box>
          )
        })}
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
