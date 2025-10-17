import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Autocomplete,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import {
  Download as DownloadIcon,
  Schedule as ScheduleIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Email as EmailIcon,
  PictureAsPdf as PdfIcon,
  TableChart as CsvIcon,
  Assessment as ReportIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Visibility as VisibilityIcon,
  CalendarToday as CalendarIcon,
  Group as GroupIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  GridOn as TableChart
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { es } from 'date-fns/locale'
import { useQuery } from 'react-query'

interface ReportTemplate {
  id: string
  name: string
  description: string
  type: 'user_progress' | 'course_analytics' | 'compliance' | 'quiz_performance' | 'custom'
  filters: ReportFilters
  columns: string[]
  schedule?: ScheduleConfig
  recipients?: string[]
  createdAt: Date
  lastRun?: Date
}

interface ReportFilters {
  dateRange: {
    start: Date | null
    end: Date | null
  }
  userTypes: string[]
  roles: string[]
  courses: string[]
  categories: string[]
  status: string[]
  includeInactive: boolean
}

interface ScheduleConfig {
  enabled: boolean
  frequency: 'daily' | 'weekly' | 'monthly'
  dayOfWeek?: number
  dayOfMonth?: number
  time: string
  timezone: string
}

interface ReportData {
  id: string
  name: string
  generatedAt: Date
  status: 'generating' | 'completed' | 'failed'
  downloadUrl?: string
  format: 'csv' | 'pdf' | 'xlsx'
  size?: number
  recordCount?: number
}

const LmsReporting: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    },
    userTypes: [],
    roles: [],
    courses: [],
    categories: [],
    status: [],
    includeInactive: false
  })
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [generatingReports, setGeneratingReports] = useState<string[]>([])
  const [recentReports, setRecentReports] = useState<ReportData[]>([])

  // Mock data for report templates
  const mockTemplates: ReportTemplate[] = [
    {
      id: 'user-progress',
      name: 'Progreso de Usuarios',
      description: 'Reporte detallado del progreso de todos los usuarios en sus cursos',
      type: 'user_progress',
      filters: {
        dateRange: { start: null, end: null },
        userTypes: [],
        roles: [],
        courses: [],
        categories: [],
        status: [],
        includeInactive: false
      },
      columns: ['Usuario', 'Email', 'Rol', 'Cursos Inscritos', 'Cursos Completados', '% Progreso', 'Última Actividad'],
      createdAt: new Date('2024-01-15'),
      lastRun: new Date('2024-10-15')
    },
    {
      id: 'compliance-report',
      name: 'Reporte de Cumplimiento',
      description: 'Estado de cumplimiento de cursos obligatorios por rol',
      type: 'compliance',
      filters: {
        dateRange: { start: null, end: null },
        userTypes: ['Interno'],
        roles: [],
        courses: [],
        categories: [],
        status: ['mandatory'],
        includeInactive: false
      },
      columns: ['Rol', 'Usuario', 'Curso Obligatorio', 'Estado', 'Fecha Límite', 'Fecha Completado', 'Días Vencido'],
      schedule: {
        enabled: true,
        frequency: 'weekly',
        dayOfWeek: 1,
        time: '09:00',
        timezone: 'America/Bogota'
      },
      recipients: ['admin@company.com', 'hr@company.com'],
      createdAt: new Date('2024-01-10'),
      lastRun: new Date('2024-10-14')
    },
    {
      id: 'course-analytics',
      name: 'Analíticas de Cursos',
      description: 'Métricas detalladas de rendimiento por curso',
      type: 'course_analytics',
      filters: {
        dateRange: { start: null, end: null },
        userTypes: [],
        roles: [],
        courses: [],
        categories: [],
        status: [],
        includeInactive: false
      },
      columns: ['Curso', 'Categoría', 'Inscritos', 'Completados', '% Completación', 'Rating Promedio', 'Tiempo Promedio'],
      createdAt: new Date('2024-02-01'),
      lastRun: new Date('2024-10-13')
    }
  ]

  // Mock data for recent reports
  const mockRecentReports: ReportData[] = [
    {
      id: 'report-001',
      name: 'Progreso de Usuarios - Octubre 2024',
      generatedAt: new Date('2024-10-15T10:30:00'),
      status: 'completed',
      downloadUrl: '/api/reports/download/report-001.csv',
      format: 'csv',
      size: 2048576,
      recordCount: 1234
    },
    {
      id: 'report-002',
      name: 'Cumplimiento Semanal',
      generatedAt: new Date('2024-10-14T09:00:00'),
      status: 'completed',
      downloadUrl: '/api/reports/download/report-002.pdf',
      format: 'pdf',
      size: 1024768,
      recordCount: 456
    },
    {
      id: 'report-003',
      name: 'Analíticas de Cursos Q3',
      generatedAt: new Date('2024-10-13T15:45:00'),
      status: 'generating',
      format: 'xlsx'
    }
  ]

  useEffect(() => {
    setReportTemplates(mockTemplates)
    setRecentReports(mockRecentReports)
  }, [])

  const handleGenerateReport = async (template: ReportTemplate, format: 'csv' | 'pdf' | 'xlsx') => {
    const reportId = `report-${Date.now()}`
    setGeneratingReports(prev => [...prev, reportId])

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // In real implementation, this would call the API
      // const response = await axiosPrivate.post('/api/lms/reports/generate', {
      //   templateId: template.id,
      //   format,
      //   filters
      // })

      const newReport: ReportData = {
        id: reportId,
        name: `${template.name} - ${new Date().toLocaleDateString('es-ES')}`,
        generatedAt: new Date(),
        status: 'completed',
        downloadUrl: `/api/reports/download/${reportId}.${format}`,
        format,
        size: Math.floor(Math.random() * 5000000) + 500000,
        recordCount: Math.floor(Math.random() * 2000) + 100
      }

      setRecentReports(prev => [newReport, ...prev])
      
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setGeneratingReports(prev => prev.filter(id => id !== reportId))
    }
  }

  const handleDownloadReport = (report: ReportData) => {
    if (report.downloadUrl) {
      // In real implementation, this would trigger the download
      console.log('Downloading report:', report.downloadUrl)
      // window.open(report.downloadUrl, '_blank')
    }
  }

  const handleSaveTemplate = (template: ReportTemplate) => {
    if (selectedTemplate) {
      setReportTemplates(prev => prev.map(t => t.id === template.id ? template : t))
    } else {
      setReportTemplates(prev => [...prev, { ...template, id: `template-${Date.now()}`, createdAt: new Date() }])
    }
    setTemplateDialogOpen(false)
    setSelectedTemplate(null)
  }

  const handleScheduleReport = (template: ReportTemplate, schedule: ScheduleConfig) => {
    const updatedTemplate = { ...template, schedule }
    setReportTemplates(prev => prev.map(t => t.id === template.id ? updatedTemplate : t))
    setScheduleDialogOpen(false)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusColor = (status: ReportData['status']) => {
    switch (status) {
      case 'completed': return 'success'
      case 'generating': return 'warning'
      case 'failed': return 'error'
      default: return 'default'
    }
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return <PdfIcon color="error" />
      case 'csv': return <CsvIcon color="success" />
      case 'xlsx': return <TableChart color="primary" />
      default: return <ReportIcon />
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant='h4' component='h1' sx={{ fontWeight: 'bold' }}>
                Reportes y Exportación
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Genera reportes personalizados y programa entregas automáticas
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<ReportIcon />}
                onClick={() => {
                  setSelectedTemplate(null)
                  setTemplateDialogOpen(true)
                }}
              >
                Nuevo Reporte
              </Button>
              <Button
                variant="outlined"
                startIcon={<ScheduleIcon />}
                onClick={() => setScheduleDialogOpen(true)}
              >
                Programar
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} sx={{ mb: 3 }}>
          <Tab label="Plantillas de Reportes" icon={<ReportIcon />} />
          <Tab label="Reportes Recientes" icon={<DownloadIcon />} />
          <Tab label="Reportes Programados" icon={<ScheduleIcon />} />
        </Tabs>

        {/* Tab 0: Report Templates */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            {reportTemplates.map((template) => (
              <Grid item xs={12} md={6} lg={4} key={template.id}>
                <Card sx={{ height: '100%' }}>
                  <CardHeader
                    title={template.name}
                    subheader={template.description}
                    action={
                      <IconButton onClick={() => {
                        setSelectedTemplate(template)
                        setTemplateDialogOpen(true)
                      }}>
                        <SettingsIcon />
                      </IconButton>
                    }
                  />
                  <CardContent>
                    <Box sx={{ mb: 2 }}>
                      <Chip 
                        label={template.type.replace('_', ' ')} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                      {template.schedule?.enabled && (
                        <Chip 
                          label="Programado" 
                          size="small" 
                          color="success" 
                          variant="outlined" 
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Columnas: {template.columns.length}
                    </Typography>
                    
                    {template.lastRun && (
                      <Typography variant="caption" color="text.secondary">
                        Última ejecución: {template.lastRun.toLocaleDateString('es-ES')}
                      </Typography>
                    )}

                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<CsvIcon />}
                        onClick={() => handleGenerateReport(template, 'csv')}
                        disabled={generatingReports.includes(`report-${Date.now()}`)}
                      >
                        CSV
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PdfIcon />}
                        onClick={() => handleGenerateReport(template, 'pdf')}
                        disabled={generatingReports.includes(`report-${Date.now()}`)}
                      >
                        PDF
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<TableChart />}
                        onClick={() => handleGenerateReport(template, 'xlsx')}
                        disabled={generatingReports.includes(`report-${Date.now()}`)}
                      >
                        Excel
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Tab 1: Recent Reports */}
        {activeTab === 1 && (
          <Card>
            <CardHeader 
              title="Reportes Generados Recientemente"
              action={
                <Button startIcon={<RefreshIcon />} onClick={() => window.location.reload()}>
                  Actualizar
                </Button>
              }
            />
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Reporte</TableCell>
                      <TableCell>Formato</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Generado</TableCell>
                      <TableCell>Tamaño</TableCell>
                      <TableCell>Registros</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {report.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getFormatIcon(report.format)}
                            <Typography variant="body2">
                              {report.format.toUpperCase()}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={report.status === 'generating' ? 'Generando...' : 
                                   report.status === 'completed' ? 'Completado' : 'Error'}
                            color={getStatusColor(report.status) as any}
                            size="small"
                          />
                          {report.status === 'generating' && (
                            <LinearProgress sx={{ mt: 1, width: 100 }} />
                          )}
                        </TableCell>
                        <TableCell>
                          {report.generatedAt.toLocaleString('es-ES')}
                        </TableCell>
                        <TableCell>
                          {report.size ? formatFileSize(report.size) : '-'}
                        </TableCell>
                        <TableCell>
                          {report.recordCount?.toLocaleString() || '-'}
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {report.status === 'completed' && (
                              <Tooltip title="Descargar">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleDownloadReport(report)}
                                >
                                  <DownloadIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Compartir">
                              <IconButton size="small">
                                <ShareIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {/* Tab 2: Scheduled Reports */}
        {activeTab === 2 && (
          <Grid container spacing={3}>
            {reportTemplates.filter(t => t.schedule?.enabled).map((template) => (
              <Grid item xs={12} md={6} key={template.id}>
                <Card>
                  <CardHeader
                    title={template.name}
                    subheader={`Frecuencia: ${template.schedule?.frequency}`}
                    action={
                      <IconButton onClick={() => {
                        setSelectedTemplate(template)
                        setScheduleDialogOpen(true)
                      }}>
                        <SettingsIcon />
                      </IconButton>
                    }
                  />
                  <CardContent>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Próxima ejecución: {/* Calculate next run date */}
                        {new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Hora: {template.schedule?.time}
                      </Typography>
                    </Box>

                    {template.recipients && template.recipients.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" fontWeight="bold" gutterBottom>
                          Destinatarios:
                        </Typography>
                        {template.recipients.map((email, index) => (
                          <Chip 
                            key={index}
                            label={email} 
                            size="small" 
                            variant="outlined" 
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ))}
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" variant="outlined">
                        Ejecutar Ahora
                      </Button>
                      <Button size="small" variant="outlined" color="error">
                        Pausar
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}

            {reportTemplates.filter(t => t.schedule?.enabled).length === 0 && (
              <Grid item xs={12}>
                <Alert severity="info">
                  No hay reportes programados. Puedes programar reportes automáticos desde las plantillas de reportes.
                </Alert>
              </Grid>
            )}
          </Grid>
        )}

        {/* Template Dialog */}
        <Dialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {selectedTemplate ? 'Editar Plantilla de Reporte' : 'Nueva Plantilla de Reporte'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nombre del Reporte"
                    defaultValue={selectedTemplate?.name || ''}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Descripción"
                    defaultValue={selectedTemplate?.description || ''}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo de Reporte</InputLabel>
                    <Select defaultValue={selectedTemplate?.type || 'user_progress'}>
                      <MenuItem value="user_progress">Progreso de Usuarios</MenuItem>
                      <MenuItem value="course_analytics">Analíticas de Cursos</MenuItem>
                      <MenuItem value="compliance">Cumplimiento</MenuItem>
                      <MenuItem value="quiz_performance">Rendimiento de Quizzes</MenuItem>
                      <MenuItem value="custom">Personalizado</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                {/* Filters Section */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Filtros
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Fecha inicio"
                    value={filters.dateRange.start}
                    onChange={(date) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: date }
                    }))}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Fecha fin"
                    value={filters.dateRange.end}
                    onChange={(date) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: date }
                    }))}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    options={['Interno', 'Cliente']}
                    value={filters.userTypes}
                    onChange={(_, value) => setFilters(prev => ({ ...prev, userTypes: value }))}
                    renderInput={(params) => <TextField {...params} label="Tipos de Usuario" />}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    options={['Desarrollador', 'Gerente', 'Analista', 'Admin']}
                    value={filters.roles}
                    onChange={(_, value) => setFilters(prev => ({ ...prev, roles: value }))}
                    renderInput={(params) => <TextField {...params} label="Roles" />}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={filters.includeInactive}
                        onChange={(e) => setFilters(prev => ({ ...prev, includeInactive: e.target.checked }))}
                      />
                    }
                    label="Incluir usuarios inactivos"
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTemplateDialogOpen(false)}>Cancelar</Button>
            <Button variant="contained" onClick={() => {
              // Handle save template
              setTemplateDialogOpen(false)
            }}>
              Guardar Plantilla
            </Button>
          </DialogActions>
        </Dialog>

        {/* Schedule Dialog */}
        <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Programar Reporte Automático</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Plantilla de Reporte</InputLabel>
                    <Select defaultValue={selectedTemplate?.id || ''}>
                      {reportTemplates.map((template) => (
                        <MenuItem key={template.id} value={template.id}>
                          {template.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Frecuencia</InputLabel>
                    <Select defaultValue="weekly">
                      <MenuItem value="daily">Diario</MenuItem>
                      <MenuItem value="weekly">Semanal</MenuItem>
                      <MenuItem value="monthly">Mensual</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="time"
                    label="Hora"
                    defaultValue="09:00"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Destinatarios (separados por coma)"
                    placeholder="admin@company.com, hr@company.com"
                    multiline
                    rows={2}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Formato</InputLabel>
                    <Select defaultValue="pdf">
                      <MenuItem value="csv">CSV</MenuItem>
                      <MenuItem value="pdf">PDF</MenuItem>
                      <MenuItem value="xlsx">Excel</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setScheduleDialogOpen(false)}>Cancelar</Button>
            <Button variant="contained">
              Programar Reporte
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  )
}

export default LmsReporting