import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField
} from '@mui/material'
import { techErrorMessage, useEquipmentList, useSaveReport } from '@hooks/useTechManagement'
import { SurveillanceReport } from 'src/types/techManagement'
import {
  EVENT_TYPE_LABELS,
  notifyError,
  notifySuccess,
  primaryButtonSx,
  REPORT_STATUS,
  SEVERITY_LABELS,
  todayIso
} from './techUi'

type FormValues = {
  customerEquipmentId: number | null
  eventType: string
  severity: string
  detectedAt: string
  description: string
  patientAffected: string
  outcome: string
  service: string
  detectedByName: string
  status: string
  invimaReportNumber: string
  reportedAt: string
}

const fromReport = (report?: SurveillanceReport | null): FormValues => ({
  customerEquipmentId: report?.customerEquipmentId ?? null,
  eventType: report?.eventType || '',
  severity: report?.severity || '',
  detectedAt: report?.detectedAt?.slice(0, 10) || todayIso(),
  description: report?.description || '',
  patientAffected: report?.patientAffected == null ? '' : report.patientAffected ? 'si' : 'no',
  outcome: report?.outcome || '',
  service: report?.service || '',
  detectedByName: report?.detectedByName || '',
  status: report?.status || 'borrador',
  invimaReportNumber: report?.invimaReportNumber || '',
  reportedAt: report?.reportedAt?.slice(0, 10) || ''
})

interface Props {
  customerId: string
  open: boolean
  report?: SurveillanceReport | null
  defaultEquipmentId?: number
  onClose: () => void
}

/** Reporte de evento o incidente adverso con dispositivo médico (FOREIA001 / FOREIA002 del INVIMA). */
const ReportFormDialog = ({ customerId, open, report, defaultEquipmentId, onClose }: Props) => {
  const [values, setValues] = useState<FormValues>(fromReport(report))
  const save = useSaveReport(customerId)
  const { data: equipment } = useEquipmentList(customerId, { pageSize: 500 })
  const options = equipment?.items ?? []
  const selected = useMemo(
    () => options.find((item) => item.id === values.customerEquipmentId) || null,
    [options, values.customerEquipmentId]
  )

  useEffect(() => {
    if (open) {
      const initial = fromReport(report)
      if (!report && defaultEquipmentId) initial.customerEquipmentId = defaultEquipmentId
      setValues(initial)
    }
  }, [open, report, defaultEquipmentId])

  const set = (key: keyof FormValues, value: unknown) => setValues((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async () => {
    if (values.description.trim().length < 10) {
      notifyError('Describe el evento con al menos 10 caracteres')
      return
    }
    const payload = {
      customerEquipmentId: values.customerEquipmentId,
      eventType: (values.eventType || null) as SurveillanceReport['eventType'],
      severity: (values.severity || null) as SurveillanceReport['severity'],
      detectedAt: values.detectedAt,
      description: values.description.trim(),
      patientAffected: values.patientAffected === '' ? null : values.patientAffected === 'si',
      outcome: values.outcome || null,
      service: values.service || null,
      detectedByName: values.detectedByName || null,
      status: values.status as SurveillanceReport['status'],
      invimaReportNumber: values.invimaReportNumber || null,
      reportedAt: values.reportedAt || null
    }
    try {
      const saved = await save.mutateAsync({ id: report?.id, payload })
      notifySuccess(report ? 'Reporte actualizado' : `Reporte ${saved.code} creado`)
      onClose()
    } catch (error) {
      notifyError(techErrorMessage(error, 'No se pudo guardar el reporte'))
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle
        sx={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', textAlign: 'center', fontWeight: 700 }}
      >
        {report ? `Reporte ${report.code}` : 'Nuevo reporte de tecnovigilancia'}
      </DialogTitle>
      <DialogContent sx={{ pt: '24px !important' }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Autocomplete
              options={options}
              value={selected}
              onChange={(_, value) => set('customerEquipmentId', value?.id ?? null)}
              getOptionLabel={(option) =>
                [option.name, option.brand, option.model, option.serie && `Serie ${option.serie}`].filter(Boolean).join(' · ')
              }
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => <TextField {...params} size='small' label='Equipo involucrado' />}
              noOptionsText='Sin equipos'
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField select fullWidth size='small' label='Tipo' value={values.eventType} onChange={(e) => set('eventType', e.target.value)}>
              <MenuItem value=''>Por clasificar</MenuItem>
              {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField select fullWidth size='small' label='Gravedad' value={values.severity} onChange={(e) => set('severity', e.target.value)}>
              <MenuItem value=''>Por clasificar</MenuItem>
              {Object.entries(SEVERITY_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size='small'
              type='date'
              label='Fecha de detección'
              value={values.detectedAt}
              onChange={(e) => set('detectedAt', e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: todayIso() }}
            />
          </Grid>
          {values.severity === 'serio' && (
            <Grid item xs={12}>
              <Alert severity='warning'>Un evento o incidente serio se reporta al INVIMA dentro de las 72 horas siguientes a su detección.</Alert>
            </Grid>
          )}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              size='small'
              label='Descripción del evento o incidente *'
              value={values.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField select fullWidth size='small' label='¿Afectó a un paciente o usuario?' value={values.patientAffected} onChange={(e) => set('patientAffected', e.target.value)}>
              <MenuItem value=''>Sin determinar</MenuItem>
              <MenuItem value='si'>Sí</MenuItem>
              <MenuItem value='no'>No</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size='small' label='Servicio' value={values.service} onChange={(e) => set('service', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size='small' label='Detectado por' value={values.detectedByName} onChange={(e) => set('detectedByName', e.target.value)} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth multiline minRows={2} size='small' label='Desenlace / consecuencias' value={values.outcome} onChange={(e) => set('outcome', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField select fullWidth size='small' label='Estado' value={values.status} onChange={(e) => set('status', e.target.value)}>
              {Object.entries(REPORT_STATUS).map(([value, meta]) => (
                <MenuItem key={value} value={value}>
                  {meta.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size='small' label='N.º de reporte INVIMA' value={values.invimaReportNumber} onChange={(e) => set('invimaReportNumber', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size='small'
              type='date'
              label='Fecha de reporte al INVIMA'
              value={values.reportedAt}
              onChange={(e) => set('reportedAt', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          Cancelar
        </Button>
        <Button variant='contained' onClick={handleSubmit} disabled={save.isLoading} sx={primaryButtonSx}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ReportFormDialog
