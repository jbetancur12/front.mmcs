import React, { useState, useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction
} from '@mui/material'
import {
  FileDownload as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as CsvIcon,
  Assessment as ReportIcon,
  DateRange as DateIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { es } from 'date-fns/locale'
import { format, subDays, subMonths, subYears } from 'date-fns'
import { lmsService } from '../../../services/lmsService'

// Modern color palette
const colors = {
  primary: '#10b981',
  primaryDark: '#059669',
  primaryLight: '#f0fdf4',
  success: '#059669',
  warning: '#d97706',
  error: '#dc2626',
  info: '#3b82f6',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    700: '#374151',
    800: '#1f2937'
  }
}

interface ReportFilter {
  startDate: Date | null
  endDate: Date | null
  userType: string
  courseStatus: string
  department: string
  role: string
  reportType: string
}

interface GeneratedReport {
  id: string
  name: string
  type: string
  format: string
  generatedAt: Date
  size: string
  downloadUrl?: string
  status: 'generating' | 'completed' | 'failed'
}

interface ReportGenerationInterfaceProps {
  onReportGenerated?: (report: GeneratedReport) => void
  onError?: (error: string) => void
}

const ReportGenerationInterface: React.FC<ReportGenerationInterfaceProps> = ({
  onReportGenerated,
  onError
}) => {
  const [filters, setFilters] = useState<ReportFilter>({
    startDate: subMonths(new Date(), 3), // Default to last 3 months
    endDate: new Date(),
    userType: 'all',
    courseStatus: 'all',
    department: 'all',
    role: 'all',
    reportType: 'comprehensive'
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([])
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'pdf'>('csv')
  const [previewData, setPreviewData] = useState<any>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)

  // Report type options
  const reportTypes = [
    { value: 'comprehensive', label: 'Reporte Integral', description: 'Análisis completo de cursos, usuarios y rendimiento' },
    { value: 'course_completion', label: 'Finalización de Cursos', description: 'Tasas de finalización y progreso por curso' },
    { value: 'user_progress', label: 'Progreso de Usuarios', description: 'Análisis detallado del progreso individual' },
    { value: 'quiz_performance', label: 'Rendimiento de Evaluaciones', description: 'Análisis de quizzes y preguntas problemáticas' },
    { value: 'compliance', label: 'Cumplimiento Regulatorio', description: 'Estado de entrenamientos obligatorios' },
    { value: 'learning_trends', label: 'Tendencias de Aprendizaje', description: 'Análisis temporal de patrones de aprendizaje' },
    { value: 'assignment_tracking', label: 'Seguimiento de Asignaciones', description: 'Estado de asignaciones y fechas límite' }
  ]

  // User type options
  const userTypes = [
    { value: 'all', label: 'Todos los Usuarios' },
    { value: 'internal', label: 'Empleados Internos' },
    { value: 'client', label: 'Clientes Externos' }
  ]

  // Course status options
  const courseStatuses = [
    { value: 'all', label: 'Todos los Estados' },
    { value: 'published', label: 'Publicados' },
    { value: 'draft', label: 'Borradores' },
    { value: 'archived', label: 'Archivados' }
  ]

  // Department options (would come from API in real implementation)
  const departments = [
    { value: 'all', label: 'Todos los Departamentos' },
    { value: 'development', label: 'Desarrollo' },
    { value: 'sales', label: 'Ventas' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'hr', label: 'Recursos Humanos' },
    { value: 'operations', label: 'Operaciones' }
  ]

  // Role options
  const roles = [
    { value: 'all', label: 'Todos los Roles' },
    { value: 'admin', label: 'Administrador' },
    { value: 'training_manager', label: 'Gestor de Entrenamiento' },
    { value: 'employee', label: 'Empleado' },
    { value: 'client', label: 'Cliente' }
  ]

  // Quick date range presets
  const datePresets = [
    { label: 'Última semana', days: 7 },
    { label: 'Último mes', days: 30 },
    { label: 'Últimos 3 meses', days: 90 },
    { label: 'Último año', days: 365 }
  ]

  const handleFilterChange = (field: keyof ReportFilter, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDatePreset = (days: number) => {
    const endDate = new Date()
    const startDate = subDays(endDate, days)
    setFilters(prev => ({
      ...prev,
      startDate,
      endDate
    }))
  }

  const generateReportPreview = useCallback(async () => {
    if (!filters.reportType) return

    setIsLoadingPreview(true)
    try {
      // Generate preview data based on report type
      const previewParams = {
        reportType: filters.reportType,
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString(),
        userType: filters.userType !== 'all' ? filters.userType : undefined,
        courseStatus: filters.courseStatus !== 'all' ? filters.courseStatus : undefined,
        department: filters.department !== 'all' ? filters.department : undefined,
        role: filters.role !== 'all' ? filters.role : undefined,
        preview: true
      }

      // Call appropriate service method based on report type
      let preview
      switch (filters.reportType) {
        case 'comprehensive':
          preview = await lmsService.getComprehensiveDashboard(previewParams)
          break
        case 'quiz_performance':
          preview = await lmsService.getQuizPerformanceAnalytics(previewParams)
          break
        case 'compliance':
          preview = await lmsService.getMandatoryTrainingAnalytics(previewParams)
          break
        default:
          preview = await lmsService.getAnalytics(previewParams)
      }

      setPreviewData(preview)
    } catch (error) {
      console.error('Error generating preview:', error)
      onError?.('Error al generar vista previa del reporte')
    } finally {
      setIsLoadingPreview(false)
    }
  }, [filters, onError])

  const generateReport = async () => {
    if (!filters.reportType || !filters.startDate || !filters.endDate) {
      onError?.('Por favor complete todos los campos requeridos')
      return
    }

    setIsGenerating(true)
    try {
      const reportParams = {
        type: filters.reportType,
        format: selectedFormat,
        startDate: filters.startDate.toISOString(),
        endDate: filters.endDate.toISOString(),
        userType: filters.userType !== 'all' ? filters.userType : undefined,
        courseStatus: filters.courseStatus !== 'all' ? filters.courseStatus : undefined,
        department: filters.department !== 'all' ? filters.department : undefined,
        role: filters.role !== 'all' ? filters.role : undefined
      }

      const blob = await lmsService.generateReport(filters.reportType, reportParams)
      
      // Create download URL
      const url = window.URL.createObjectURL(blob)
      const reportName = `${reportTypes.find(r => r.value === filters.reportType)?.label}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.${selectedFormat}`
      
      // Create new report entry
      const newReport: GeneratedReport = {
        id: Date.now().toString(),
        name: reportName,
        type: filters.reportType,
        format: selectedFormat,
        generatedAt: new Date(),
        size: `${Math.round(blob.size / 1024)} KB`,
        downloadUrl: url,
        status: 'completed'
      }

      setGeneratedReports(prev => [newReport, ...prev])
      onReportGenerated?.(newReport)

      // Auto-download
      const link = document.createElement('a')
      link.href = url
      link.download = reportName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

    } catch (error) {
      console.error('Error generating report:', error)
      onError?.('Error al generar el reporte')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadReport = (report: GeneratedReport) => {
    if (report.downloadUrl) {
      const link = document.createElement('a')
      link.href = report.downloadUrl
      link.download = report.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const deleteReport = (reportId: string) => {
    setGeneratedReports(prev => {
      const report = prev.find(r => r.id === reportId)
      if (report?.downloadUrl) {
        window.URL.revokeObjectURL(report.downloadUrl)
      }
      return prev.filter(r => r.id !== reportId)
    })
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: colors.gray[800] }}>
          Generación de Reportes
        </Typography>

        <Grid container spacing={3}>
          {/* Filter Configuration */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ borderRadius: '16px', border: `1px solid ${colors.gray[200]}` }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <FilterIcon sx={{ color: colors.primary, mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: colors.gray[800] }}>
                    Configuración de Filtros
                  </Typography>
                </Box>

                <Grid container spacing={3}>
                  {/* Report Type */}
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Tipo de Reporte</InputLabel>
                      <Select
                        value={filters.reportType}
                        label="Tipo de Reporte"
                        onChange={(e) => handleFilterChange('reportType', e.target.value)}
                      >
                        {reportTypes.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {type.label}
                              </Typography>
                              <Typography variant="body2" color={colors.gray[500]}>
                                {type.description}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Date Range */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                      Rango de Fechas
                    </Typography>
                    <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                      {datePresets.map((preset) => (
                        <Chip
                          key={preset.label}
                          label={preset.label}
                          onClick={() => handleDatePreset(preset.days)}
                          variant="outlined"
                          sx={{
                            '&:hover': {
                              bgcolor: colors.primaryLight,
                              borderColor: colors.primary
                            }
                          }}
                        />
                      ))}
                    </Stack>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <DatePicker
                          label="Fecha de Inicio"
                          value={filters.startDate}
                          onChange={(date) => handleFilterChange('startDate', date)}
                          slotProps={{
                            textField: { fullWidth: true }
                          }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <DatePicker
                          label="Fecha de Fin"
                          value={filters.endDate}
                          onChange={(date) => handleFilterChange('endDate', date)}
                          slotProps={{
                            textField: { fullWidth: true }
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* Additional Filters */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Tipo de Usuario</InputLabel>
                      <Select
                        value={filters.userType}
                        label="Tipo de Usuario"
                        onChange={(e) => handleFilterChange('userType', e.target.value)}
                      >
                        {userTypes.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Estado del Curso</InputLabel>
                      <Select
                        value={filters.courseStatus}
                        label="Estado del Curso"
                        onChange={(e) => handleFilterChange('courseStatus', e.target.value)}
                      >
                        {courseStatuses.map((status) => (
                          <MenuItem key={status.value} value={status.value}>
                            {status.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Departamento</InputLabel>
                      <Select
                        value={filters.department}
                        label="Departamento"
                        onChange={(e) => handleFilterChange('department', e.target.value)}
                      >
                        {departments.map((dept) => (
                          <MenuItem key={dept.value} value={dept.value}>
                            {dept.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Rol</InputLabel>
                      <Select
                        value={filters.role}
                        label="Rol"
                        onChange={(e) => handleFilterChange('role', e.target.value)}
                      >
                        {roles.map((role) => (
                          <MenuItem key={role.value} value={role.value}>
                            {role.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Format Selection and Actions */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      Formato de Exportación
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Chip
                        icon={<CsvIcon />}
                        label="CSV"
                        onClick={() => setSelectedFormat('csv')}
                        color={selectedFormat === 'csv' ? 'primary' : 'default'}
                        variant={selectedFormat === 'csv' ? 'filled' : 'outlined'}
                      />
                      <Chip
                        icon={<PdfIcon />}
                        label="PDF"
                        onClick={() => setSelectedFormat('pdf')}
                        color={selectedFormat === 'pdf' ? 'primary' : 'default'}
                        variant={selectedFormat === 'pdf' ? 'filled' : 'outlined'}
                      />
                    </Stack>
                  </Box>

                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="outlined"
                      startIcon={<ViewIcon />}
                      onClick={generateReportPreview}
                      disabled={isLoadingPreview || !filters.reportType}
                      sx={{
                        borderColor: colors.gray[300],
                        color: colors.gray[700],
                        '&:hover': {
                          borderColor: colors.primary,
                          color: colors.primary
                        }
                      }}
                    >
                      {isLoadingPreview ? <CircularProgress size={20} /> : 'Vista Previa'}
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={generateReport}
                      disabled={isGenerating || !filters.reportType || !filters.startDate || !filters.endDate}
                      sx={{
                        bgcolor: colors.primary,
                        '&:hover': { bgcolor: colors.primaryDark }
                      }}
                    >
                      {isGenerating ? <CircularProgress size={20} color="inherit" /> : 'Generar Reporte'}
                    </Button>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Generated Reports List */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ borderRadius: '16px', border: `1px solid ${colors.gray[200]}` }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: colors.gray[800] }}>
                    Reportes Generados
                  </Typography>
                  <Tooltip title="Actualizar lista">
                    <IconButton size="small">
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                </Box>

                {generatedReports.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <ReportIcon sx={{ fontSize: 48, color: colors.gray[400], mb: 2 }} />
                    <Typography variant="body2" color={colors.gray[500]}>
                      No hay reportes generados
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ p: 0 }}>
                    {generatedReports.map((report) => (
                      <ListItem
                        key={report.id}
                        sx={{
                          border: `1px solid ${colors.gray[200]}`,
                          borderRadius: '8px',
                          mb: 1,
                          p: 2
                        }}
                      >
                        <ListItemIcon>
                          {report.format === 'pdf' ? (
                            <PdfIcon sx={{ color: colors.error }} />
                          ) : (
                            <CsvIcon sx={{ color: colors.success }} />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                              {report.name}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" color={colors.gray[500]}>
                                {format(report.generatedAt, 'dd/MM/yyyy HH:mm')}
                              </Typography>
                              <br />
                              <Typography variant="caption" color={colors.gray[500]}>
                                {report.size}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="Descargar">
                              <IconButton
                                size="small"
                                onClick={() => downloadReport(report)}
                                disabled={report.status !== 'completed'}
                              >
                                <DownloadIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar">
                              <IconButton
                                size="small"
                                onClick={() => deleteReport(report.id)}
                                sx={{ color: colors.error }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Preview Section */}
          {previewData && (
            <Grid item xs={12}>
              <Card sx={{ borderRadius: '16px', border: `1px solid ${colors.gray[200]}` }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: colors.gray[800] }}>
                    Vista Previa del Reporte
                  </Typography>
                  
                  <Paper sx={{ p: 2, bgcolor: colors.gray[50], borderRadius: '8px' }}>
                    <pre style={{ 
                      fontSize: '0.875rem', 
                      overflow: 'auto', 
                      maxHeight: '300px',
                      margin: 0,
                      fontFamily: 'monospace'
                    }}>
                      {JSON.stringify(previewData, null, 2)}
                    </pre>
                  </Paper>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Box>
    </LocalizationProvider>
  )
}

export default ReportGenerationInterface