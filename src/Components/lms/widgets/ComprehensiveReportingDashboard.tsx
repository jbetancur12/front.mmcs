import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
  Paper,
  Chip,
  Stack,
  Button,
  IconButton,
  Tooltip,
  Alert,
  Divider
} from '@mui/material'
import {
  Assessment as ReportIcon,
  TrendingUp as TrendsIcon,
  Assignment as ComplianceIcon,
  GetApp as ExportIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Visibility as ViewIcon
} from '@mui/icons-material'
import ReportGenerationInterface from './ReportGenerationInterface'
import LearningTrendsChart from './LearningTrendsChart'
import ComplianceReporting from './ComplianceReporting'
import AdvancedAnalyticsCharts from './AdvancedAnalyticsCharts'

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
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937'
  }
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reporting-tabpanel-${index}`}
      aria-labelledby={`reporting-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `reporting-tab-${index}`,
    'aria-controls': `reporting-tabpanel-${index}`,
  }
}

interface ComprehensiveReportingDashboardProps {
  onReportGenerated?: (report: any) => void
  onError?: (error: string) => void
  defaultTab?: number
}

const ComprehensiveReportingDashboard: React.FC<ComprehensiveReportingDashboardProps> = ({
  onReportGenerated,
  onError,
  defaultTab = 0
}) => {
  const [currentTab, setCurrentTab] = useState(defaultTab)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue)
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleReportGenerated = (report: any) => {
    onReportGenerated?.(report)
    // Show success message or notification
  }

  const handleError = (error: string) => {
    onError?.(error)
    // Show error message or notification
  }

  const handleRequirementClick = (requirement: any) => {
    // Handle compliance requirement click - could open detail modal
    console.log('Requirement clicked:', requirement)
  }

  const handleExportReport = (filters: any) => {
    // Handle export functionality
    console.log('Export report with filters:', filters)
  }

  // Tab configuration
  const tabs = [
    {
      label: 'Generación de Reportes',
      icon: <ReportIcon />,
      description: 'Crear y descargar reportes personalizados'
    },
    {
      label: 'Tendencias de Aprendizaje',
      icon: <TrendsIcon />,
      description: 'Análisis temporal de patrones de aprendizaje'
    },
    {
      label: 'Cumplimiento Regulatorio',
      icon: <ComplianceIcon />,
      description: 'Estado de requisitos regulatorios y compliance'
    },
    {
      label: 'Análisis Avanzado',
      icon: <ViewIcon />,
      description: 'Visualizaciones interactivas y correlaciones'
    }
  ]

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
          color: 'white',
          borderRadius: '16px',
          mb: 3,
          p: 3
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Centro de Reportes y Análisis
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
              Generación de reportes, análisis de tendencias y cumplimiento regulatorio
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Actualizar datos">
              <IconButton
                onClick={handleRefresh}
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Configuración">
              <IconButton
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                }}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      </Paper>

      {/* Navigation Tabs */}
      <Card sx={{ borderRadius: '16px', border: `1px solid ${colors.gray[200]}`, mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            aria-label="reporting dashboard tabs"
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                minHeight: 80,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                color: colors.gray[600],
                '&.Mui-selected': {
                  color: colors.primary
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: colors.primary,
                height: 3
              }
            }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                icon={tab.icon}
                label={
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {tab.label}
                    </Typography>
                    <Typography variant="caption" color={colors.gray[500]} sx={{ display: 'block', mt: 0.5 }}>
                      {tab.description}
                    </Typography>
                  </Box>
                }
                {...a11yProps(index)}
                sx={{ flexDirection: 'column', gap: 1 }}
              />
            ))}
          </Tabs>
        </Box>

        {/* Tab Content */}
        <TabPanel value={currentTab} index={0}>
          <ReportGenerationInterface
            onReportGenerated={handleReportGenerated}
            onError={handleError}
          />
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <LearningTrendsChart
                timeRange="month"
                showComparisons={true}
                interactive={true}
                height={500}
              />
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Insights Automáticos:</strong> Las tendencias muestran un crecimiento del 12% en inscripciones 
                  durante el último mes, con una mejora del 8% en las tasas de finalización. 
                  Los cursos técnicos tienen el mejor rendimiento con un 89% de satisfacción promedio.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <ComplianceReporting
            onRequirementClick={handleRequirementClick}
            onExportReport={handleExportReport}
            showFilters={true}
            compactView={false}
          />
        </TabPanel>

        <TabPanel value={currentTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <AdvancedAnalyticsCharts
                timeRange="month"
                showFilters={true}
                interactive={true}
                height={500}
              />
            </Grid>
            <Grid item xs={12}>
              <Card sx={{ borderRadius: '16px', border: `1px solid ${colors.gray[200]}` }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: colors.gray[800] }}>
                    Insights y Recomendaciones
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2, bgcolor: colors.primaryLight, borderRadius: '8px' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: colors.primary, mb: 1 }}>
                          Oportunidad de Mejora
                        </Typography>
                        <Typography variant="body2" color={colors.gray[700]}>
                          Los cursos de "Soft Skills" muestran menor engagement. 
                          Considere agregar elementos interactivos.
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2, bgcolor: '#fef3c7', borderRadius: '8px' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: colors.warning, mb: 1 }}>
                          Atención Requerida
                        </Typography>
                        <Typography variant="body2" color={colors.gray[700]}>
                          15 usuarios tienen entrenamientos vencidos en cumplimiento GDPR. 
                          Acción inmediata requerida.
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2, bgcolor: '#f0fdf4', borderRadius: '8px' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: colors.success, mb: 1 }}>
                          Tendencia Positiva
                        </Typography>
                        <Typography variant="body2" color={colors.gray[700]}>
                          La retención de usuarios ha mejorado un 23% 
                          tras la implementación de gamificación.
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Quick Actions Footer */}
      <Card sx={{ borderRadius: '16px', border: `1px solid ${colors.gray[200]}` }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: colors.gray[800] }}>
                Acciones Rápidas
              </Typography>
              <Typography variant="body2" color={colors.gray[500]}>
                Operaciones frecuentes para análisis y reportes
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<ExportIcon />}
                onClick={() => {/* Export all data */}}
                sx={{
                  borderColor: colors.gray[300],
                  color: colors.gray[700],
                  '&:hover': {
                    borderColor: colors.primary,
                    color: colors.primary
                  }
                }}
              >
                Exportar Todo
              </Button>
              <Button
                variant="contained"
                startIcon={<ReportIcon />}
                onClick={() => setCurrentTab(0)}
                sx={{
                  bgcolor: colors.primary,
                  '&:hover': { bgcolor: colors.primaryDark }
                }}
              >
                Nuevo Reporte
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default ComprehensiveReportingDashboard