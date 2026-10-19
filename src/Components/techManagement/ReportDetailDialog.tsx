import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { Add, Delete, Edit } from '@mui/icons-material'
import {
  techErrorMessage,
  useDeleteAction,
  useReport,
  useSaveAction,
  useSaveAnalysis
} from '@hooks/useTechManagement'
import { Methodology, SurveillanceAction, SurveillanceReport } from 'src/types/techManagement'
import {
  ACTION_STATUS_LABELS,
  confirmAction,
  DEADLINE_STATUS,
  EVENT_TYPE_LABELS,
  formatDate,
  METHODOLOGY_LABELS,
  notifyError,
  notifySuccess,
  primaryButtonSx,
  REPORT_STATUS,
  SEVERITY_LABELS,
  StatusChip
} from './techUi'

const CAUSE_CATEGORIES = ['Equipo', 'Usuario / operador', 'Paciente', 'Procedimiento', 'Ambiente', 'Mantenimiento', 'Otro']

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <Box>
    <Typography variant='caption' color='text.secondary'>
      {label}
    </Typography>
    <Typography variant='body2'>{value || '—'}</Typography>
  </Box>
)

interface Props {
  customerId: string
  reportId: number | null
  canWrite: boolean
  onEdit: (report: SurveillanceReport) => void
  onClose: () => void
}

/** Detalle del reporte: datos, análisis de causa y plan de acción con seguimiento. */
const ReportDetailDialog = ({ customerId, reportId, canWrite, onEdit, onClose }: Props) => {
  const { data: report, isLoading } = useReport(customerId, reportId)
  const saveAnalysis = useSaveAnalysis(customerId)
  const saveAction = useSaveAction(customerId)
  const deleteAction = useDeleteAction(customerId)

  const [methodology, setMethodology] = useState<Methodology>('espina_pescado')
  const [causes, setCauses] = useState<{ category: string; description: string }[]>([])
  const [conclusion, setConclusion] = useState('')
  const [actionDraft, setActionDraft] = useState<Partial<SurveillanceAction> | null>(null)

  useEffect(() => {
    if (!report) return
    setMethodology(report.analysis?.methodology || 'espina_pescado')
    setCauses(report.analysis?.causes?.length ? report.analysis.causes : [])
    setConclusion(report.analysis?.conclusion || '')
    setActionDraft(null)
  }, [report])

  if (!reportId) return null

  const handleSaveAnalysis = async () => {
    try {
      await saveAnalysis.mutateAsync({ reportId, payload: { methodology, causes, conclusion } })
      notifySuccess('Análisis guardado')
    } catch (error) {
      notifyError(techErrorMessage(error, 'No se pudo guardar el análisis'))
    }
  }

  const handleSaveAction = async () => {
    if (!actionDraft?.description?.trim()) {
      notifyError('Describe la acción')
      return
    }
    try {
      const { id, ...payload } = actionDraft
      await saveAction.mutateAsync({ reportId, id, payload })
      setActionDraft(null)
      notifySuccess('Acción guardada')
    } catch (error) {
      notifyError(techErrorMessage(error, 'No se pudo guardar la acción'))
    }
  }

  const handleDeleteAction = async (action: SurveillanceAction) => {
    if (!(await confirmAction('¿Eliminar esta acción?', undefined, 'Eliminar'))) return
    try {
      await deleteAction.mutateAsync({ reportId, id: action.id })
    } catch (error) {
      notifyError(techErrorMessage(error, 'No se pudo eliminar la acción'))
    }
  }

  return (
    <Dialog open onClose={onClose} maxWidth='md' fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle
        sx={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', textAlign: 'center', fontWeight: 700 }}
      >
        {report ? `Reporte ${report.code}` : 'Reporte'}
      </DialogTitle>
      <DialogContent sx={{ pt: '24px !important' }}>
        {isLoading || !report ? (
          <Box display='flex' justifyContent='center' py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={3}>
            <Box display='flex' gap={1} flexWrap='wrap'>
              <StatusChip {...REPORT_STATUS[report.status]} />
              {report.deadlineStatus && <StatusChip {...DEADLINE_STATUS[report.deadlineStatus]} />}
              {report.origin !== 'manual' && (
                <StatusChip label={report.origin === 'qr' ? 'Reportado desde el QR' : 'Desde un servicio'} color='info' />
              )}
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Field
                  label='Equipo'
                  value={
                    report.equipment
                      ? [report.equipment.name, report.equipment.brand, report.equipment.model, report.equipment.serie && `Serie ${report.equipment.serie}`]
                          .filter(Boolean)
                          .join(' · ')
                      : null
                  }
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Field label='Tipo' value={report.eventType ? EVENT_TYPE_LABELS[report.eventType] : 'Por clasificar'} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Field label='Gravedad' value={report.severity ? SEVERITY_LABELS[report.severity] : 'Por clasificar'} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Field label='Detectado' value={formatDate(report.detectedAt)} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Field label='Plazo de reporte' value={formatDate(report.reportDeadline)} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Field label='Reportado al INVIMA' value={formatDate(report.reportedAt)} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Field label='N.º INVIMA' value={report.invimaReportNumber} />
              </Grid>
              <Grid item xs={12}>
                <Field label='Descripción' value={report.description} />
              </Grid>
              {report.outcome && (
                <Grid item xs={12}>
                  <Field label='Desenlace' value={report.outcome} />
                </Grid>
              )}
            </Grid>

            <Divider />
            <Box>
              <Typography variant='h6' fontWeight={600} mb={2}>
                Análisis de causa
              </Typography>
              {canWrite ? (
                <Stack spacing={2}>
                  <TextField
                    select
                    size='small'
                    label='Metodología'
                    value={methodology}
                    onChange={(e) => setMethodology(e.target.value as Methodology)}
                    sx={{ maxWidth: 320 }}
                  >
                    {Object.entries(METHODOLOGY_LABELS).map(([value, label]) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </TextField>
                  {causes.map((cause, index) => (
                    <Box key={index} display='flex' gap={1} alignItems='flex-start' flexWrap={{ xs: 'wrap', sm: 'nowrap' }}>
                      <TextField
                        select
                        size='small'
                        label='Categoría'
                        value={cause.category}
                        onChange={(e) => setCauses((prev) => prev.map((c, i) => (i === index ? { ...c, category: e.target.value } : c)))}
                        sx={{ minWidth: 180 }}
                      >
                        {CAUSE_CATEGORIES.map((category) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        fullWidth
                        size='small'
                        label='Causa'
                        value={cause.description}
                        onChange={(e) => setCauses((prev) => prev.map((c, i) => (i === index ? { ...c, description: e.target.value } : c)))}
                      />
                      <IconButton aria-label='Quitar causa' onClick={() => setCauses((prev) => prev.filter((_, i) => i !== index))}>
                        <Delete fontSize='small' />
                      </IconButton>
                    </Box>
                  ))}
                  <Box>
                    <Button
                      size='small'
                      startIcon={<Add />}
                      onClick={() => setCauses((prev) => [...prev, { category: 'Equipo', description: '' }])}
                      sx={{ textTransform: 'none' }}
                    >
                      Agregar causa
                    </Button>
                  </Box>
                  <TextField
                    multiline
                    minRows={2}
                    size='small'
                    label='Conclusión'
                    value={conclusion}
                    onChange={(e) => setConclusion(e.target.value)}
                  />
                  <Box>
                    <Button variant='contained' onClick={handleSaveAnalysis} disabled={saveAnalysis.isLoading} sx={primaryButtonSx}>
                      Guardar análisis
                    </Button>
                  </Box>
                </Stack>
              ) : report.analysis ? (
                <Stack spacing={1}>
                  <Field label='Metodología' value={METHODOLOGY_LABELS[report.analysis.methodology]} />
                  {report.analysis.causes.map((cause, index) => (
                    <Typography key={index} variant='body2'>
                      • <strong>{cause.category}:</strong> {cause.description}
                    </Typography>
                  ))}
                  <Field label='Conclusión' value={report.analysis.conclusion} />
                </Stack>
              ) : (
                <Typography variant='body2' color='text.secondary'>
                  Sin análisis registrado.
                </Typography>
              )}
            </Box>

            <Divider />
            <Box>
              <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
                <Typography variant='h6' fontWeight={600}>
                  Plan de acción
                </Typography>
                {canWrite && !actionDraft && (
                  <Button size='small' startIcon={<Add />} onClick={() => setActionDraft({ status: 'pendiente' })} sx={{ textTransform: 'none' }}>
                    Agregar acción
                  </Button>
                )}
              </Box>
              <Stack spacing={1.5}>
                {(report.actions || []).map((action) => (
                  <Box key={action.id} sx={{ border: '1px solid #e5e7eb', borderRadius: 2, p: 1.5 }} display='flex' gap={1}>
                    <Box flex={1}>
                      <Typography variant='body2' fontWeight={600}>
                        {action.description}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {[action.responsibleName, action.dueDate && `Fecha límite ${formatDate(action.dueDate)}`, ACTION_STATUS_LABELS[action.status], action.completedAt && `Cumplida el ${formatDate(action.completedAt)}`]
                          .filter(Boolean)
                          .join(' · ')}
                      </Typography>
                      {action.followUp && (
                        <Typography variant='body2' color='text.secondary'>
                          Seguimiento: {action.followUp}
                        </Typography>
                      )}
                    </Box>
                    {canWrite && (
                      <Box>
                        <IconButton size='small' color='primary' aria-label='Editar acción' onClick={() => setActionDraft(action)}>
                          <Edit fontSize='small' />
                        </IconButton>
                        <IconButton size='small' color='error' aria-label='Eliminar acción' onClick={() => handleDeleteAction(action)}>
                          <Delete fontSize='small' />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                ))}
                {!report.actions?.length && !actionDraft && (
                  <Typography variant='body2' color='text.secondary'>
                    Sin acciones registradas.
                  </Typography>
                )}
                {actionDraft && (
                  <Box sx={{ border: '1px dashed #00BFA5', borderRadius: 2, p: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          size='small'
                          label='Acción'
                          value={actionDraft.description || ''}
                          onChange={(e) => setActionDraft((prev) => ({ ...prev, description: e.target.value }))}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          size='small'
                          label='Responsable'
                          value={actionDraft.responsibleName || ''}
                          onChange={(e) => setActionDraft((prev) => ({ ...prev, responsibleName: e.target.value }))}
                        />
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <TextField
                          fullWidth
                          size='small'
                          type='date'
                          label='Fecha límite'
                          value={actionDraft.dueDate?.slice(0, 10) || ''}
                          onChange={(e) => setActionDraft((prev) => ({ ...prev, dueDate: e.target.value }))}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <TextField
                          select
                          fullWidth
                          size='small'
                          label='Estado'
                          value={actionDraft.status || 'pendiente'}
                          onChange={(e) => setActionDraft((prev) => ({ ...prev, status: e.target.value as SurveillanceAction['status'] }))}
                        >
                          {Object.entries(ACTION_STATUS_LABELS).map(([value, label]) => (
                            <MenuItem key={value} value={value}>
                              {label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          size='small'
                          label='Seguimiento'
                          value={actionDraft.followUp || ''}
                          onChange={(e) => setActionDraft((prev) => ({ ...prev, followUp: e.target.value }))}
                        />
                      </Grid>
                    </Grid>
                    <Box display='flex' justifyContent='flex-end' gap={1} mt={2}>
                      <Button onClick={() => setActionDraft(null)} sx={{ textTransform: 'none' }}>
                        Cancelar
                      </Button>
                      <Button variant='contained' onClick={handleSaveAction} disabled={saveAction.isLoading} sx={primaryButtonSx}>
                        Guardar acción
                      </Button>
                    </Box>
                  </Box>
                )}
              </Stack>
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {canWrite && report && (
          <Button startIcon={<Edit />} onClick={() => onEdit(report)} sx={{ textTransform: 'none', mr: 'auto' }}>
            Editar datos del reporte
          </Button>
        )}
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ReportDetailDialog
