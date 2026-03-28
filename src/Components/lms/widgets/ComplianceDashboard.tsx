import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Alert,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon
} from '@mui/icons-material'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts'
import { useMandatoryTrainingAnalytics } from '../../../hooks/useLms'

// Color palette
const colors = {
  primary: '#10b981',
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

interface ComplianceDashboardProps {
  onRoleClick?: (role: string) => void
  onExportReport?: () => void
}

interface ComplianceRoleData {
  role: string
  totalUsers: number
  completedUsers: number
  inProgressUsers: number
  notStartedUsers: number
  completionRate: number
}

const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({
  onRoleClick,
  onExportReport
}) => {
  const [selectedPeriod] = useState('current')
  const [selectedDepartment] = useState('')
  void selectedPeriod
  void selectedDepartment

  // Fetch mandatory training analytics
  const {
    data: analyticsData,
    isLoading,
    error,
    refetch
  } = useMandatoryTrainingAnalytics({
    includeEscalation: true
  })

  const courses = analyticsData?.courses || []
  const overall = analyticsData?.overall || {}

  // Process compliance data by role
  const complianceByRole: ComplianceRoleData[] = courses.reduce((acc: ComplianceRoleData[], course: any) => {
    if (course.compliance) {
      course.compliance.forEach((roleData: any) => {
        const existingRole = acc.find((r: ComplianceRoleData) => r.role === roleData.role)
        if (existingRole) {
          existingRole.totalUsers += roleData.totalUsers
          existingRole.completedUsers += roleData.completedUsers
          existingRole.inProgressUsers += roleData.inProgressUsers
          existingRole.notStartedUsers += roleData.notStartedUsers
        } else {
          acc.push({ ...roleData })
        }
      })
    }
    return acc
  }, [])

  // Recalculate completion rates
  complianceByRole.forEach((role: ComplianceRoleData) => {
    role.completionRate = role.totalUsers > 0 ? 
      Math.round((role.completedUsers / role.totalUsers) * 100) : 0
  })

  // Sort by completion rate
  complianceByRole.sort((a: ComplianceRoleData, b: ComplianceRoleData) => b.completionRate - a.completionRate)

  // Prepare pie chart data
  const pieChartData = [
    { name: 'Completado', value: overall.totalAssignedUsers - overall.totalOverdue - overall.totalUrgent || 0, color: colors.success },
    { name: 'En Progreso', value: overall.totalUrgent || 0, color: colors.warning },
    { name: 'Vencido', value: overall.totalOverdue || 0, color: colors.error }
  ].filter(item => item.value > 0)

  // Prepare bar chart data
  const barChartData = complianceByRole.slice(0, 8).map((role: ComplianceRoleData) => ({
    role: role.role.length > 15 ? role.role.substring(0, 15) + '...' : role.role,
    completionRate: role.completionRate,
    totalUsers: role.totalUsers,
    completedUsers: role.completedUsers
  }))

  const handleRefresh = () => {
    refetch()
  }

  const getComplianceLevel = (rate: number) => {
    if (rate >= 90) return 'excellent'
    if (rate >= 75) return 'good'
    if (rate >= 50) return 'warning'
    return 'critical'
  }

  const getComplianceColor = (level: string) => {
    switch (level) {
      case 'excellent':
        return colors.success
      case 'good':
        return colors.primary
      case 'warning':
        return colors.warning
      case 'critical':
        return colors.error
      default:
        return colors.gray[400]
    }
  }

  if (isLoading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Dashboard de Cumplimiento
          </Typography>
          <Stack spacing={2}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rectangular" height={80} />
            ))}
          </Stack>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Alert severity="error">
            Error al cargar dashboard de cumplimiento
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight="bold">
            Dashboard de Cumplimiento por Rol
          </Typography>
          <Box display="flex" gap={1}>
            <Tooltip title="Exportar reporte">
              <IconButton onClick={onExportReport} size="small">
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Actualizar datos">
              <IconButton onClick={handleRefresh} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 2,
                background: `linear-gradient(135deg, ${colors.success} 0%, #047857 100%)`,
                color: 'white'
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {overall.overallCompletionRate || 0}%
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Cumplimiento General
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 2,
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.success} 100%)`,
                color: 'white'
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {complianceByRole.length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Roles Evaluados
                  </Typography>
                </Box>
                <GroupIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 2,
                background: complianceByRole.filter((r: ComplianceRoleData) => r.completionRate >= 90).length > complianceByRole.length / 2
                  ? `linear-gradient(135deg, ${colors.success} 0%, #047857 100%)`
                  : `linear-gradient(135deg, ${colors.warning} 0%, #ea580c 100%)`,
                color: 'white'
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {complianceByRole.filter((r: ComplianceRoleData) => r.completionRate >= 90).length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Roles Excelentes
                  </Typography>
                </Box>
                <CheckIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 2,
                background: complianceByRole.filter((r: ComplianceRoleData) => r.completionRate < 50).length > 0
                  ? `linear-gradient(135deg, ${colors.error} 0%, #b91c1c 100%)`
                  : `linear-gradient(135deg, ${colors.success} 0%, #047857 100%)`,
                color: 'white'
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {complianceByRole.filter((r: ComplianceRoleData) => r.completionRate < 50).length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Roles en Riesgo
                  </Typography>
                </Box>
                <ErrorIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Charts Section */}
        <Grid container spacing={3} mb={3}>
          {/* Pie Chart */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Distribución de Cumplimiento
              </Typography>
              <Box height={250}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Bar Chart */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Cumplimiento por Rol
              </Typography>
              <Box height={250}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="role" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis />
                    <RechartsTooltip 
                      formatter={(value) => [
                        `${value}%`,
                        'Tasa de Cumplimiento'
                      ]}
                      labelFormatter={(label) => `Rol: ${label}`}
                    />
                    <Bar 
                      dataKey="completionRate" 
                      fill={colors.primary}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Detailed Table */}
        <Paper sx={{ mb: 2 }}>
          <Box p={2} borderBottom={1} borderColor="divider">
            <Typography variant="subtitle1" fontWeight="bold">
              Detalle de Cumplimiento por Rol
            </Typography>
          </Box>
          
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: colors.gray[50] }}>
                  <TableCell>Rol</TableCell>
                  <TableCell align="center">Total Usuarios</TableCell>
                  <TableCell align="center">Completados</TableCell>
                  <TableCell align="center">En Progreso</TableCell>
                  <TableCell align="center">Sin Iniciar</TableCell>
                  <TableCell align="center">Tasa de Cumplimiento</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {complianceByRole.map((role: ComplianceRoleData, index: number) => {
                  const complianceLevel = getComplianceLevel(role.completionRate)
                  const complianceColor = getComplianceColor(complianceLevel)
                  
                  return (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <PersonIcon color="action" />
                          <Typography variant="body2" fontWeight="medium">
                            {role.role}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight="medium">
                          {role.totalUsers}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography 
                          variant="body2" 
                          fontWeight="medium"
                          color={colors.success}
                        >
                          {role.completedUsers}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography 
                          variant="body2" 
                          fontWeight="medium"
                          color={colors.warning}
                        >
                          {role.inProgressUsers}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography 
                          variant="body2" 
                          fontWeight="medium"
                          color={colors.gray[500]}
                        >
                          {role.notStartedUsers}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ minWidth: 100 }}>
                          <LinearProgress
                            variant="determinate"
                            value={role.completionRate}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: colors.gray[200],
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: complianceColor
                              }
                            }}
                          />
                          <Typography variant="caption" color="textSecondary" mt={0.5}>
                            {role.completionRate}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={
                            complianceLevel === 'excellent' ? 'Excelente' :
                            complianceLevel === 'good' ? 'Bueno' :
                            complianceLevel === 'warning' ? 'Atención' : 'Crítico'
                          }
                          color={
                            complianceLevel === 'excellent' ? 'success' :
                            complianceLevel === 'good' ? 'primary' :
                            complianceLevel === 'warning' ? 'warning' : 'error'
                          }
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => onRoleClick?.(role.role)}
                        >
                          Ver Detalles
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {complianceByRole.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography color="textSecondary">
              No hay datos de cumplimiento disponibles
            </Typography>
          </Box>
        )}

        {/* Recommendations */}
        {complianceByRole.filter((r: ComplianceRoleData) => r.completionRate < 75).length > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Recomendaciones de Mejora
            </Typography>
            <Typography variant="body2">
              Se detectaron {complianceByRole.filter((r: ComplianceRoleData) => r.completionRate < 75).length} roles 
              con tasas de cumplimiento por debajo del 75%. Se recomienda:
            </Typography>
            <Box component="ul" sx={{ mt: 1, mb: 0 }}>
              <li>Enviar recordatorios personalizados a usuarios pendientes</li>
              <li>Revisar la accesibilidad y claridad del contenido</li>
              <li>Implementar sesiones de capacitación adicionales</li>
              <li>Establecer fechas límite más claras</li>
            </Box>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

export default ComplianceDashboard
