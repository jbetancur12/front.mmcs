import { useEffect, useState } from 'react'
import { Alert, Autocomplete, Box, MenuItem, TextField } from '@mui/material'
import FormDialog, {
  FormDialogSection
} from '../../../Components/Common/FormDialog'
import { useCalibrationAssignableMetrologists } from '../../../hooks/useCalibrationServices'
import {
  useServiceVisits,
  useVisitMutation
} from '../../../hooks/useCalibrationVisits'
import { CalibrationService } from '../../../types/calibrationService'
import { CalibrationVisit } from '../../../types/calibrationVisit'
import { getOperationsSummary } from '../calibrationServiceOtherFields'
import VisitItemsPicker, { buildPickerItems } from './VisitItemsPicker'
import { todayKey } from './visitUtils'

interface Props {
  open: boolean
  service: CalibrationService
  /** Visita que se edita; sin ella se programa una nueva. */
  visit?: CalibrationVisit | null
  /** Fecha con la que arranca una visita nueva (desde la agenda). */
  initialDate?: string
  onClose: () => void
}

const FULL_ROW = { gridColumn: { sm: '1 / -1' } }

const buildValues = (
  visit?: CalibrationVisit | null,
  initialDate?: string
) => ({
  startDate: visit?.startDate || initialDate || todayKey(),
  endDate: visit?.endDate || initialDate || todayKey(),
  commitmentDate: '',
  metrologistIds: visit?.metrologists.map((m) => m.userId) || [],
  responsibleId: visit?.uploadResponsibleUserId || 0,
  siteName: visit?.siteName || '',
  notes: visit?.notes || '',
  reason: '',
  quantities: Object.fromEntries(
    (visit?.items || []).map((i) => [i.itemId, String(i.plannedQuantity)])
  ) as Record<number, string>
})

/** Programa una visita nueva o cambia fecha, personal y equipos de una existente. */
const VisitFormDialog = ({
  open,
  service,
  visit,
  initialDate,
  onClose
}: Props) => {
  const [values, setValues] = useState(() => buildValues(visit, initialDate))
  const { data: metrologists = [] } = useCalibrationAssignableMetrologists(open)
  const mutation = useVisitMutation(service.id)
  const { data: serviceVisits } = useServiceVisits(service.id, open)
  const pickerItems = buildPickerItems(
    service,
    serviceVisits?.visits,
    visit?.id
  )
  const selectedIds = Object.keys(values.quantities).map(Number)
  const plannedTotal = Object.values(values.quantities).reduce(
    (sum, quantity) => sum + (Number(quantity) || 0),
    0
  )

  useEffect(() => {
    if (open) setValues(buildValues(visit, initialDate))
  }, [open, visit, initialDate])

  const set = (patch: Partial<typeof values>) =>
    setValues((current) => ({ ...current, ...patch }))

  const executed = visit?.status === 'executed'
  const needsCommitment =
    !visit &&
    ['ods_issued', 'pending_programming'].includes(service.status) &&
    !getOperationsSummary(service).commitmentDate
  const selected = metrologists.filter((m) =>
    values.metrologistIds.includes(m.id)
  )
  const responsibleId = values.metrologistIds.includes(values.responsibleId)
    ? values.responsibleId
    : values.metrologistIds[0] ?? ''

  const formalChange = Boolean(
    visit &&
      (values.startDate !== visit.startDate ||
        values.endDate !== visit.endDate ||
        responsibleId !== visit.uploadResponsibleUserId ||
        [...values.metrologistIds].sort().join() !==
          visit.metrologists
            .map((m) => m.userId)
            .sort()
            .join())
  )

  const invalid =
    !values.startDate ||
    values.endDate < values.startDate ||
    !values.metrologistIds.length ||
    (needsCommitment && !values.commitmentDate) ||
    (formalChange && !values.reason.trim())

  const submit = () => {
    const items = Object.entries(values.quantities)
      .map(([itemId, quantity]) => ({
        itemId: Number(itemId),
        plannedQuantity: Number(quantity) || 0
      }))
      .filter((item) => item.plannedQuantity > 0)
    mutation.mutate(
      {
        method: visit ? 'put' : 'post',
        path: visit ? `visits/${visit.id}` : 'visits',
        success: visit ? 'Visita actualizada' : 'Visita programada',
        body: {
          ...(executed
            ? {}
            : {
                startDate: values.startDate,
                endDate: values.endDate,
                items
              }),
          metrologistUserIds: values.metrologistIds,
          uploadResponsibleUserId: responsibleId || undefined,
          siteName: values.siteName,
          notes: values.notes,
          ...(needsCommitment ? { commitmentDate: values.commitmentDate } : {}),
          ...(formalChange ? { reason: values.reason } : {})
        }
      },
      { onSuccess: onClose }
    )
  }

  return (
    <FormDialog
      open={open}
      onClose={mutation.isLoading ? () => undefined : onClose}
      title={visit ? `Editar visita ${visit.visitNumber}` : 'Programar visita'}
      subtitle={service.odsCode || service.serviceCode}
      submitLabel={visit ? 'Guardar cambios' : 'Programar visita'}
      onSubmit={submit}
      loading={mutation.isLoading}
      submitDisabled={invalid}
      maxWidth='md'
    >
      <FormDialogSection title='Fechas'>
        <TextField
          type='date'
          label='Desde'
          value={values.startDate}
          disabled={executed}
          onChange={(event) => {
            const startDate = event.target.value
            set({
              startDate,
              endDate: values.endDate < startDate ? startDate : values.endDate
            })
          }}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          type='date'
          label='Hasta'
          value={values.endDate}
          disabled={executed}
          onChange={(event) => set({ endDate: event.target.value })}
          InputLabelProps={{ shrink: true }}
          helperText='El plazo de carga se cuenta desde este día'
        />
        {needsCommitment && (
          <TextField
            type='date'
            label='Fecha compromiso del servicio'
            value={values.commitmentDate}
            onChange={(event) => set({ commitmentDate: event.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        )}
        <TextField
          label='Sede o lugar (opcional)'
          value={values.siteName}
          onChange={(event) => set({ siteName: event.target.value })}
        />
      </FormDialogSection>

      <FormDialogSection title='Personal'>
        <Autocomplete
          multiple
          options={metrologists}
          value={selected}
          getOptionLabel={(option) => option.nombre || `Usuario ${option.id}`}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          onChange={(_, next) => set({ metrologistIds: next.map((m) => m.id) })}
          renderInput={(params) => (
            <TextField {...params} label='Metrólogos de la visita' />
          )}
          sx={FULL_ROW}
        />
        <TextField
          select
          label='Responsable de cargar los certificados'
          value={responsibleId}
          disabled={!selected.length}
          onChange={(event) =>
            set({ responsibleId: Number(event.target.value) })
          }
          sx={FULL_ROW}
        >
          {selected.map((m) => (
            <MenuItem key={m.id} value={m.id}>
              {m.nombre}
            </MenuItem>
          ))}
        </TextField>
      </FormDialogSection>

      {!executed && (
        <FormDialogSection
          title={
            plannedTotal
              ? `Equipos planeados: ${plannedTotal}`
              : 'Equipos planeados (opcional)'
          }
        >
          <Box sx={FULL_ROW}>
            <VisitItemsPicker
              items={pickerItems}
              selectedIds={selectedIds}
              onAdd={(added) =>
                set({
                  quantities: {
                    ...values.quantities,
                    ...Object.fromEntries(
                      added.map((i) => [i.id, String(i.pending || '')])
                    )
                  }
                })
              }
              onRemove={(itemId) => {
                const quantities = { ...values.quantities }
                delete quantities[itemId]
                set({ quantities })
              }}
              renderFields={(item) => {
                const value = values.quantities[item.id] ?? ''
                return (
                  <TextField
                    type='number'
                    size='small'
                    label='Cantidad'
                    value={value}
                    inputProps={{ min: 0, max: item.contracted }}
                    error={Number(value) > item.contracted}
                    onChange={(event) =>
                      set({
                        quantities: {
                          ...values.quantities,
                          [item.id]: event.target.value
                        }
                      })
                    }
                    sx={{ width: 110 }}
                  />
                )
              }}
            />
          </Box>
        </FormDialogSection>
      )}

      <FormDialogSection title='Notas'>
        <TextField
          label='Indicaciones para la visita'
          value={values.notes}
          onChange={(event) => set({ notes: event.target.value })}
          multiline
          minRows={2}
          sx={FULL_ROW}
        />
        {formalChange && (
          <>
            <Alert severity='info' sx={FULL_ROW}>
              Cambiar fechas o personal queda en el historial con su motivo.
            </Alert>
            <TextField
              label='Motivo del cambio'
              value={values.reason}
              onChange={(event) => set({ reason: event.target.value })}
              required
              sx={FULL_ROW}
            />
          </>
        )}
      </FormDialogSection>
    </FormDialog>
  )
}

export default VisitFormDialog
