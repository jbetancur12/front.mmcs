import React, { useMemo, useState } from 'react'
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Schedule as ScheduleIcon,
  Summarize as SummarizeIcon
} from '@mui/icons-material'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import { Toast } from 'src/Components/ExcelManipulation/Utils'

type ReportType = 'user_progress' | 'course_analytics' | 'compliance' | 'quiz_performance' | 'custom'
type ReportFormat = 'csv' | 'pdf' | 'xlsx'
type ReportFrequency = 'daily' | 'weekly' | 'monthly'

interface ReportTemplate {
  id: number
  name: string
  description?: string
  type: ReportType
  columns: string[]
  filters?: Record<string, unknown>
  created_at: string
  updated_at: string
}

interface ScheduledReport {
  id: number
  template_id: number
  name: string
  frequency: ReportFrequency
  time: string
  format: ReportFormat
  recipients: string[]
  enabled: boolean
  next_run?: string
  template?: {
    name: string
    type: ReportType
  }
}

interface GeneratedReport {
  id: number
  name: string
  format: ReportFormat
  status: 'generating' | 'completed' | 'failed'
  record_count?: number
  created_at: string
  completed_at?: string
  template?: {
    name: string
    type: ReportType
  }
}

const templateColumnsPresets: Record<ReportType, string[]> = {
  user_progress: ['usuario', 'email', 'rol', 'cursosInscritos', 'cursosCompletados', 'porcentajeProgreso'],
  course_analytics: ['curso', 'categoria', 'inscritos', 'completados', 'porcentajeCompletacion', 'estado'],
  compliance: ['rol', 'usuario', 'cursoObligatorio', 'estado', 'fechaLimite', 'fechaCompletado'],
  quiz_performance: ['curso', 'usuario', 'intentoNumero', 'porcentaje', 'aprobado', 'fechaIntento'],
  custom: []
}

const reportTypeLabels: Record<ReportType, string> = {
  user_progress: 'Progreso de usuarios',
  course_analytics: 'Analítica de cursos',
  compliance: 'Cumplimiento',
  quiz_performance: 'Rendimiento de quizzes',
  custom: 'Personalizado'
}

const knownCustomColumns = Array.from(
  new Set(
    Object.entries(templateColumnsPresets)
      .filter(([type]) => type !== 'custom')
      .flatMap(([, columns]) => columns)
  )
)

const emptyTemplateForm = {
  name: '',
  description: '',
  type: 'user_progress' as ReportType,
  columns: [...templateColumnsPresets.user_progress]
}

const emptyScheduleForm = {
  templateId: '',
  name: '',
  frequency: 'weekly' as ReportFrequency,
  time: '09:00',
  format: 'csv' as ReportFormat,
  recipients: ''
}

const LmsReporting: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState(0)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null)
  const [editingSchedule, setEditingSchedule] = useState<ScheduledReport | null>(null)
  const [templateForm, setTemplateForm] = useState(emptyTemplateForm)
  const [scheduleForm, setScheduleForm] = useState(emptyScheduleForm)
  const [customColumnInput, setCustomColumnInput] = useState('')
  const availableColumns = templateColumnsPresets[templateForm.type]
  const isCustomTemplate = templateForm.type === 'custom'

  const templatesQuery = useQuery(['lms-reporting', 'templates'], async () => {
    const response = await axiosPrivate.get('/lms/reporting/templates')
    return response.data.data as ReportTemplate[]
  })

  const recentReportsQuery = useQuery(['lms-reporting', 'recent'], async () => {
    const response = await axiosPrivate.get('/lms/reporting/recent', {
      params: { limit: 10 }
    })
    return response.data.data as GeneratedReport[]
  })

  const scheduledReportsQuery = useQuery(['lms-reporting', 'scheduled'], async () => {
    const response = await axiosPrivate.get('/lms/reporting/scheduled')
    return response.data.data as ScheduledReport[]
  })

  const invalidateReporting = () => {
    queryClient.invalidateQueries(['lms-reporting', 'templates'])
    queryClient.invalidateQueries(['lms-reporting', 'recent'])
    queryClient.invalidateQueries(['lms-reporting', 'scheduled'])
  }

  const saveTemplateMutation = useMutation(
    async () => {
      const payload = {
        name: templateForm.name.trim(),
        description: templateForm.description.trim(),
        type: templateForm.type,
        columns: templateForm.columns
          .map((item) => item.trim())
          .filter(Boolean),
        filters: {}
      }

      if (editingTemplate) {
        const response = await axiosPrivate.put(`/lms/reporting/templates/${editingTemplate.id}`, payload)
        return response.data.data
      }

      const response = await axiosPrivate.post('/lms/reporting/templates', payload)
      return response.data.data
    },
    {
      onSuccess: () => {
        invalidateReporting()
        setTemplateDialogOpen(false)
        setEditingTemplate(null)
        setTemplateForm(emptyTemplateForm)
        setCustomColumnInput('')
        Toast.fire({
          icon: 'success',
          title: editingTemplate ? 'Plantilla actualizada' : 'Plantilla creada'
        })
      },
      onError: (error: any) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al guardar plantilla',
          text: error.response?.data?.error?.message || error.message
        })
      }
    }
  )

  const deleteTemplateMutation = useMutation(
    async (id: number) => axiosPrivate.delete(`/lms/reporting/templates/${id}`),
    {
      onSuccess: () => {
        invalidateReporting()
        Toast.fire({
          icon: 'success',
          title: 'Plantilla eliminada'
        })
      }
    }
  )

  const saveScheduleMutation = useMutation(
    async () => {
      const payload = {
        templateId: Number(scheduleForm.templateId),
        name: scheduleForm.name.trim(),
        frequency: scheduleForm.frequency,
        time: scheduleForm.time,
        format: scheduleForm.format,
        recipients: scheduleForm.recipients
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        filters: {}
      }

      if (editingSchedule) {
        const response = await axiosPrivate.put(`/lms/reporting/scheduled/${editingSchedule.id}`, payload)
        return response.data.data
      }

      const response = await axiosPrivate.post('/lms/reporting/schedule', payload)
      return response.data.data
    },
    {
      onSuccess: () => {
        invalidateReporting()
        setScheduleDialogOpen(false)
        setEditingSchedule(null)
        setScheduleForm(emptyScheduleForm)
        Toast.fire({
          icon: 'success',
          title: editingSchedule ? 'Programación actualizada' : 'Reporte programado'
        })
      },
      onError: (error: any) => {
        Toast.fire({
          icon: 'error',
          title: 'Error al guardar programación',
          text: error.response?.data?.error?.message || error.message
        })
      }
    }
  )

  const deleteScheduleMutation = useMutation(
    async (id: number) => axiosPrivate.delete(`/lms/reporting/scheduled/${id}`),
    {
      onSuccess: () => {
        invalidateReporting()
        Toast.fire({
          icon: 'success',
          title: 'Programación eliminada'
        })
      }
    }
  )

  const templates = templatesQuery.data || []
  const recentReports = recentReportsQuery.data || []
  const scheduledReports = scheduledReportsQuery.data || []

  const summary = useMemo(
    () => ({
      templates: templates.length,
      scheduled: scheduledReports.length,
      recent: recentReports.length
    }),
    [templates, scheduledReports, recentReports]
  )
  const reportingTabGuidance = [
    'Empieza por plantillas. Aquí defines la estructura base de cada reporte.',
    'Programa envíos solo cuando la plantilla ya esté clara y tenga destinatarios reales.',
    'Usa el histórico para validar qué sí generó el backend y qué sigue pendiente.'
  ]

  const handleCreateTemplate = () => {
    setEditingTemplate(null)
    setTemplateForm(emptyTemplateForm)
    setCustomColumnInput('')
    setTemplateDialogOpen(true)
  }

  const handleEditTemplate = (template: ReportTemplate) => {
    setEditingTemplate(template)
    setTemplateForm({
      name: template.name,
      description: template.description || '',
      type: template.type,
      columns: template.columns || []
    })
    setCustomColumnInput('')
    setTemplateDialogOpen(true)
  }

  const toggleTemplateColumn = (column: string) => {
    setTemplateForm((prev) => {
      const nextColumns = prev.columns.includes(column)
        ? prev.columns.filter((item) => item !== column)
        : [...prev.columns, column]

      return {
        ...prev,
        columns: nextColumns
      }
    })
  }

  const addCustomColumns = () => {
    const incomingColumns = customColumnInput
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    if (incomingColumns.length === 0) return

    setTemplateForm((prev) => ({
      ...prev,
      columns: Array.from(new Set([...prev.columns, ...incomingColumns]))
    }))
    setCustomColumnInput('')
  }

  const removeTemplateColumn = (column: string) => {
    setTemplateForm((prev) => ({
      ...prev,
      columns: prev.columns.filter((item) => item !== column)
    }))
  }

  const handleCreateSchedule = () => {
    setEditingSchedule(null)
    setScheduleForm(emptyScheduleForm)
    setScheduleDialogOpen(true)
  }

  const handleEditSchedule = (schedule: ScheduledReport) => {
    setEditingSchedule(schedule)
    setScheduleForm({
      templateId: String(schedule.template_id),
      name: schedule.name,
      frequency: schedule.frequency,
      time: schedule.time.slice(0, 5),
      format: schedule.format,
      recipients: (schedule.recipients || []).join(', ')
    })
    setScheduleDialogOpen(true)
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
                    Centro de Reportes LMS
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Flujo recomendado: plantillas primero, programaciones después y revisión histórica al final.
                  </Typography>
                </Box>
                <Chip color='info' icon={<SummarizeIcon />} label={`${summary.templates} plantilla(s) listas`} />
              </Box>
              <Alert severity='info' icon={<ScheduleIcon />}>
                <AlertTitle>Uso esperado</AlertTitle>
                Esta superficie ya trabaja con datos reales, pero sigue limitada a lo que el backend soporta hoy.
              </Alert>
            </Stack>
          </CardContent>
        </Card>

        <Box>
          <Typography variant='h4' component='h1' sx={{ fontWeight: 700, mb: 1 }}>
            Reportes LMS
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Esta pantalla ahora usa el backend real para plantillas, reportes recientes y
            programaciones. La generación/exportación avanzada todavía no se expone aquí hasta
            cerrar el contrato de archivos del módulo.
          </Typography>
        </Box>

        <Alert severity='info'>
          Disponible hoy: CRUD real de plantillas, listado real de reportes generados y
          programación real de reportes. Pendiente: builder avanzado de filtros, exportaciones
          manuales desde esta pantalla y definición final del catálogo de reportes de negocio.
        </Alert>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant='subtitle2' color='text.secondary'>
                  Plantillas
                </Typography>
                <Typography variant='h4'>{summary.templates}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant='subtitle2' color='text.secondary'>
                  Programados activos
                </Typography>
                <Typography variant='h4'>{summary.scheduled}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant='subtitle2' color='text.secondary'>
                  Reportes recientes
                </Typography>
                <Typography variant='h4'>{summary.recent}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
          <Tab label='Plantillas' />
          <Tab label='Programados' />
          <Tab label='Recientes' />
        </Tabs>

        <Alert severity='info' sx={{ mt: 2 }}>
          {reportingTabGuidance[activeTab]}
        </Alert>

          {activeTab === 0 && (
          <Card>
            <CardContent>
              <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb: 2 }}>
                <Typography variant='h6'>Plantillas Reales</Typography>
                <Button startIcon={<AddIcon />} variant='contained' onClick={handleCreateTemplate}>
                  Nueva plantilla
                </Button>
              </Stack>
              {templates.length === 0 ? (
                <Alert severity='warning'>Aún no tienes plantillas de reportes creadas.</Alert>
              ) : (
                <List>
                  {templates.map((template) => (
                    <ListItem
                      key={template.id}
                      secondaryAction={
                        <Stack direction='row' spacing={1}>
                          <IconButton onClick={() => handleEditTemplate(template)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => deleteTemplateMutation.mutate(template.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Stack>
                      }
                    >
                      <ListItemText
                        primary={template.name}
                        secondary={
                          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mt: 0.5 }}>
                            <Chip
                              icon={<SummarizeIcon />}
                              label={reportTypeLabels[template.type]}
                              size='small'
                            />
                            <Chip
                              label={`${template.columns.length} columnas`}
                              size='small'
                              variant='outlined'
                            />
                          </Stack>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 1 && (
          <Card>
            <CardContent>
              <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb: 2 }}>
                <Typography variant='h6'>Programaciones Activas</Typography>
                <Button
                  startIcon={<ScheduleIcon />}
                  variant='contained'
                  onClick={handleCreateSchedule}
                  disabled={templates.length === 0}
                >
                  Programar reporte
                </Button>
              </Stack>
              {templates.length === 0 && (
                <Alert severity='warning' sx={{ mb: 2 }}>
                  Primero necesitas al menos una plantilla real para programar reportes.
                </Alert>
              )}
              {scheduledReports.length === 0 ? (
                <Alert severity='info'>No hay reportes programados activos.</Alert>
              ) : (
                <List>
                  {scheduledReports.map((schedule) => (
                    <ListItem
                      key={schedule.id}
                      secondaryAction={
                        <Stack direction='row' spacing={1}>
                          <IconButton onClick={() => handleEditSchedule(schedule)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => deleteScheduleMutation.mutate(schedule.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Stack>
                      }
                    >
                      <ListItemText
                        primary={schedule.name}
                        secondary={
                          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mt: 0.5 }}>
                            <Chip label={schedule.template?.name || `Template ${schedule.template_id}`} size='small' />
                            <Chip label={schedule.frequency} size='small' variant='outlined' />
                            <Chip label={`${schedule.time.slice(0, 5)} · ${schedule.format.toUpperCase()}`} size='small' variant='outlined' />
                            {schedule.next_run && (
                              <Chip label={`Siguiente: ${new Date(schedule.next_run).toLocaleString()}`} size='small' variant='outlined' />
                            )}
                          </Stack>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 2 && (
          <Card>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 2 }}>
                Reportes Recientes
              </Typography>
              {recentReports.length === 0 ? (
                <Alert severity='info'>
                  Todavía no hay reportes generados desde esta cuenta.
                </Alert>
              ) : (
                <List>
                  {recentReports.map((report) => (
                    <ListItem key={report.id}>
                      <ListItemText
                        primary={report.name}
                        secondary={
                          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mt: 0.5 }}>
                            <Chip label={report.template?.name || 'Sin plantilla'} size='small' />
                            <Chip label={report.format.toUpperCase()} size='small' variant='outlined' />
                            <Chip label={report.status} size='small' color={report.status === 'completed' ? 'success' : report.status === 'failed' ? 'error' : 'warning'} />
                            {report.record_count !== undefined && (
                              <Chip label={`${report.record_count} registros`} size='small' variant='outlined' />
                            )}
                          </Stack>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        )}
      </Stack>

      <Dialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>{editingTemplate ? 'Editar plantilla' : 'Nueva plantilla'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label='Nombre'
              value={templateForm.name}
              onChange={(event) => setTemplateForm((prev) => ({ ...prev, name: event.target.value }))}
              fullWidth
            />
            <TextField
              label='Descripción'
              value={templateForm.description}
              onChange={(event) => setTemplateForm((prev) => ({ ...prev, description: event.target.value }))}
              multiline
              minRows={2}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select
                label='Tipo'
                value={templateForm.type}
                  onChange={(event) => {
                    const nextType = event.target.value as ReportType
                    setTemplateForm((prev) => ({
                      ...prev,
                      type: nextType,
                      columns: [...templateColumnsPresets[nextType]]
                    }))
                  }}
                >
                {Object.entries(reportTypeLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
              {isCustomTemplate ? (
                <Stack spacing={2}>
                  <Box>
                    <Typography variant='subtitle2' sx={{ mb: 1 }}>
                      Columnas conocidas
                    </Typography>
                    <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                      Puedes seleccionar columnas conocidas del LMS y, si hace falta, agregar extras manualmente.
                    </Typography>
                    <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                      {knownCustomColumns.map((column) => {
                        const selected = templateForm.columns.includes(column)
                        return (
                          <Chip
                            key={column}
                            label={column}
                            clickable
                            color={selected ? 'primary' : 'default'}
                            variant={selected ? 'filled' : 'outlined'}
                            onClick={() => toggleTemplateColumn(column)}
                          />
                        )
                      })}
                    </Stack>
                  </Box>

                  <Box>
                    <Typography variant='subtitle2' sx={{ mb: 1 }}>
                      Columnas extra
                    </Typography>
                    <TextField
                      label='Agregar columnas manuales'
                      helperText='Escribe columnas extra separadas por coma y luego agrégalas.'
                      value={customColumnInput}
                      onChange={(event) => setCustomColumnInput(event.target.value)}
                      fullWidth
                    />
                    <Button sx={{ mt: 1.5 }} variant='outlined' onClick={addCustomColumns} disabled={!customColumnInput.trim()}>
                      Agregar columnas manuales
                    </Button>
                  </Box>

                  <Box>
                    <Typography variant='subtitle2' sx={{ mb: 1 }}>
                      Selección actual
                    </Typography>
                    {templateForm.columns.length === 0 ? (
                      <Alert severity='warning'>Todavía no has seleccionado columnas para este reporte.</Alert>
                    ) : (
                      <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                        {templateForm.columns.map((column) => (
                          <Chip
                            key={column}
                            label={column}
                            onDelete={() => removeTemplateColumn(column)}
                            color='primary'
                            variant='outlined'
                          />
                        ))}
                      </Stack>
                    )}
                  </Box>
                </Stack>
              ) : (
                <Box>
                  <Typography variant='subtitle2' sx={{ mb: 1 }}>
                    Columnas disponibles
                  </Typography>
                  <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                    Selecciona las columnas que quieres incluir. Ya no necesitas escribir los nombres manualmente.
                  </Typography>
                  <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                    {availableColumns.map((column) => {
                      const selected = templateForm.columns.includes(column)
                      return (
                        <Chip
                          key={column}
                          label={column}
                          clickable
                          color={selected ? 'primary' : 'default'}
                          variant={selected ? 'filled' : 'outlined'}
                          onClick={() => toggleTemplateColumn(column)}
                        />
                      )
                    })}
                  </Stack>
                  <Typography variant='caption' color='text.secondary' sx={{ mt: 1.5, display: 'block' }}>
                    {templateForm.columns.length} columna(s) seleccionada(s)
                  </Typography>
                </Box>
              )}
            </Stack>
          </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateDialogOpen(false)}>Cancelar</Button>
          <Button variant='contained' onClick={() => saveTemplateMutation.mutate()}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>{editingSchedule ? 'Editar programación' : 'Programar reporte'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Plantilla</InputLabel>
              <Select
                label='Plantilla'
                value={scheduleForm.templateId}
                onChange={(event) => setScheduleForm((prev) => ({ ...prev, templateId: event.target.value }))}
              >
                {templates.map((template) => (
                  <MenuItem key={template.id} value={String(template.id)}>
                    {template.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label='Nombre de la programación'
              value={scheduleForm.name}
              onChange={(event) => setScheduleForm((prev) => ({ ...prev, name: event.target.value }))}
              fullWidth
            />
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Frecuencia</InputLabel>
                  <Select
                    label='Frecuencia'
                    value={scheduleForm.frequency}
                    onChange={(event) => setScheduleForm((prev) => ({ ...prev, frequency: event.target.value as ReportFrequency }))}
                  >
                    <MenuItem value='daily'>Diario</MenuItem>
                    <MenuItem value='weekly'>Semanal</MenuItem>
                    <MenuItem value='monthly'>Mensual</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label='Hora'
                  type='time'
                  value={scheduleForm.time}
                  onChange={(event) => setScheduleForm((prev) => ({ ...prev, time: event.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Formato</InputLabel>
                  <Select
                    label='Formato'
                    value={scheduleForm.format}
                    onChange={(event) => setScheduleForm((prev) => ({ ...prev, format: event.target.value as ReportFormat }))}
                  >
                    <MenuItem value='csv'>CSV</MenuItem>
                    <MenuItem value='pdf'>PDF</MenuItem>
                    <MenuItem value='xlsx'>XLSX</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <TextField
              label='Destinatarios'
              helperText='Emails separados por coma'
              value={scheduleForm.recipients}
              onChange={(event) => setScheduleForm((prev) => ({ ...prev, recipients: event.target.value }))}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialogOpen(false)}>Cancelar</Button>
          <Button variant='contained' onClick={() => saveScheduleMutation.mutate()}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default LmsReporting
