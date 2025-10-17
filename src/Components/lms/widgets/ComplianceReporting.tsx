import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Alert,
  Skeleton,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Badge
} from '@mui/material'
import {
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Refresh as RefreshIcon,
  GetApp as ExportIcon,
  Visibility as ViewIcon,
  NotificationImportant as AlertIcon
} from '@mui/icons-material'
import { format, differenceInDays, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
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

interface ComplianceData {
  id: string
  requirement: string
  description: string
  status: 'compliant' | 'at-risk' | 'non-compliant'
  dueDate: string
  completionRate: number
  totalUsers: number
  completedUsers: number
  overdueUsers: number
  department?: string
  role?: string
  priority: 'high' | 'medium' | 'low'
  regulatoryBody?: string
  lastUpdated: string
}

interface ComplianceByRole {
  role: string
  totalRequirements: number
  compliantRequirements: number
  atRiskRequirements: number
  nonCompliantRequirements: number
  overallComplianceRate: number
  users: number
}

interface ComplianceByDepartment {
  department: string
  totalRequirements: number
  compliantRequirements: number
  atRiskRequirements: number
  nonCompliantRequirements: number
  overallComplianceRate: number
  users: number
}

interface ComplianceReportingProps {
  onRequirementClick?: (requirement: ComplianceData) => void
  onExportReport?: (filters: any) => void
  showFilters?: boolean
  compactView?: boolean
}

const ComplianceReporting: React.FC<ComplianceReportingProps> = ({
  onRequirementClick,
  onExportReport,
  showFilters = true,
  compactView = false
}) => {
  const [complianceData, setComplianceData] = useState<ComplianceData[]>([])
  const [complianceByRole, setComplianceByRole] = useState<ComplianceByRole[]>([])
  const [complianceByDepartment, setComplianceByDepartment] = useState<ComplianceByDepartment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    department: 'all',
    role: 'all',
    regulatoryBody: 'all'
  })

  // Status options
  const statusOptions = [
    { value: 'all', label: 'Todos los Estados' },
    { value: 'compliant', label: 'Cumpliendo' },
    { value: 'at-risk', label: 'En Riesgo' },
    { value: 'non-compliant', label: 'No Cumpliendo' }
  ]

  // Priority options
  const priorityOptions = [
    { value: 'all', label: 'Todas las Prioridades' },
    { value: 'high', label: 'Alta' },
    { value: 'medium', label: 'Media' },
    { value: 'low', label: 'Baja' }
  ]

  // Department options
  const departmentOptions = [
    { value: 'all', label: 'Todos los Departamentos' },
    { value: 'development', label: 'Desarrollo' },
    { value: 'sales', label: 'Ventas' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'hr', label: 'Recursos Humanos' },
    { value: 'operations', label: 'Operaciones' }
  ]

  // Role options
  const roleOptions = [
    { value: 'all', label: 'Todos los Roles' },
    { value: 'admin', label: 'Administrador' },
    { value: 'manager', label: 'Gerente' },
    { value: 'employee', label: 'Empleado' },
    { value: 'contractor', label: 'Contratista' }
  ]

  // Regulatory body options
  const regulatoryBodyOptions = [
    { value: 'all', label: 'Todos los Organismos' },
    { value: 'osha', label: 'OSHA' },
    { value: 'iso', label: 'ISO' },
    { value: 'gdpr', label: 'GDPR' },
    { value: 'sox', label: 'SOX' },
    { value: 'hipaa', label: 'HIPAA' }
  ]

  // Fetch compliance data
  const fetchComplianceData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Mock data - replace with actual API calls
      const mockComplianceData: ComplianceData[] = [
        {
          id: '1',
          requirement: 'Seguridad en el Trabajo',
          description: 'Entrenamiento obligatorio en seguridad laboral según OSHA',
          status: 'compliant',
          dueDate: '2024-12-31',
          completionRate: 95,
          totalUsers: 150,
          completedUsers: 143,
          overdueUsers: 0,
          department: 'operations',
          role: 'employee',
          priority: 'high',
          regulatoryBody: 'osha',
          lastUpdated: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          requirement: 'Protección de Datos',
          description: 'Capacitación en GDPR y manejo de datos personales',
          status: 'at-risk',
          dueDate: '2024-03-31',
          completionRate: 72,
          totalUsers: 200,
          completedUsers: 144,
          overdueUsers: 15,
          department: 'all',
          role: 'all',
          priority: 'high',
          regulatoryBody: 'gdpr',
          lastUpdated: '2024-01-14T15:30:00Z'
        },
        {
          id: '3',
          requirement: 'Prevención de Acoso',
          description: 'Entrenamiento anual en prevención de acoso laboral',
          status: 'non-compliant',
          dueDate: '2024-02-28',
          completionRate: 45,
          totalUsers: 180,
          completedUsers: 81,
          overdueUsers: 45,
          department: 'hr',
          role: 'manager',
          priority: 'high',
          regulatoryBody: 'internal',
          lastUpdated: '2024-01-13T09:15:00Z'
        },
        {
          id: '4',
          requirement: 'Ciberseguridad Básica',
          description: 'Fundamentos de ciberseguridad para todos los empleados',
          status: 'compliant',
          dueDate: '2024-06-30',
          completionRate: 88,
          totalUsers: 220,
          completedUsers: 194,
          overdueUsers: 0,
          department: 'all',
          role: 'all',
          priority: 'medium',
          regulatoryBody: 'internal',
          lastUpdated: '2024-01-12T14:20:00Z'
        },
        {
          id: '5',
          requirement: 'Manejo de Sustancias Químicas',
          description: 'Protocolo de seguridad para manejo de químicos',
          status: 'at-risk',
          dueDate: '2024-04-15',
          completionRate: 68,
          totalUsers: 85,
          completedUsers: 58,
          overdueUsers: 8,
          department: 'operations',
          role: 'employee',
          priority: 'high',
          regulatoryBody: 'osha',
          lastUpdated: '2024-01-11T11:45:00Z'
        }
      ]

      const mockComplianceByRole: ComplianceByRole[] = [
        {
          role: 'Administrador',
          totalRequirements: 8,
          compliantRequirements: 6,
          atRiskRequirements: 2,
          nonCompliantRequirements: 0,
          overallComplianceRate: 85,
          users: 12
        },
        {
          role: 'Gerente',
          totalRequirements: 10,
          compliantRequirements: 5,
          atRiskRequirements: 3,
          nonCompliantRequirements: 2,
          overallComplianceRate: 65,
          users: 45
        },
        {
          role: 'Empleado',
          totalRequirements: 6,
          compliantRequirements: 4,
          atRiskRequirements: 1,
          nonCompliantRequirements: 1,
          overallComplianceRate: 78,
          users: 320
        },
        {
          role: 'Contratista',
          totalRequirements: 4,
          compliantRequirements: 3,
          atRiskRequirements: 1,
          nonCompliantRequirements: 0,
          overallComplianceRate: 82,
          users: 28
        }
      ]

      const mockComplianceByDepartment: ComplianceByDepartment[] = [
        {
          department: 'Desarrollo',
          totalRequirements: 7,
          compliantRequirements: 5,
          atRiskRequirements: 2,
          nonCompliantRequirements: 0,
          overallComplianceRate: 82,
          users: 85
        },
        {
          department: 'Ventas',
          totalRequirements: 6,
          compliantRequirements: 4,
          atRiskRequirements: 1,
          nonCompliantRequirements: 1,
          overallComplianceRate: 75,
          users: 65
        },
        {
          department: 'Marketing',
          totalRequirements: 5,
          compliantRequirements: 4,
          atRiskRequirements: 1,
          nonCompliantRequirements: 0,
          overallComplianceRate: 88,
          users: 42
        },
        {
          department: 'Recursos Humanos',
          totalRequirements: 9,
          compliantRequirements: 6,
          atRiskRequirements: 2,
          nonCompliantRequirements: 1,
          overallComplianceRate: 72,
          users: 28
        },
        {
          department: 'Operaciones',
          totalRequirements: 12,
          compliantRequirements: 8,
          atRiskRequirements: 3,
          nonCompliantRequirements: 1,
          overallComplianceRate: 78,
          users: 185
        }
      ]

      setComplianceData(mockComplianceData)
      setComplianceByRole(mockComplianceByRole)
      setComplianceByDepartment(mockComplianceByDepartment)
    } catch (err) {
      console.error('Error fetching compliance data:', err)
      setError('Error al cargar datos de cumplimiento')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComplianceData()
  }, [])

  // Filter compliance data
  const filteredComplianceData = complianceData.filter(item => {
    return (
      (filters.status === 'all' || item.status === filters.status) &&
      (filters.priority === 'all' || item.priority === filters.priority) &&
      (filters.department === 'all' || item.department === filters.department) &&
      (filters.role === 'all' || item.role === filters.role) &&
      (filters.regulatoryBody === 'all' || item.regulatoryBody === filters.regulatoryBody)
    )
  })

  // Get status configuration
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'compliant':
        return {
          label: 'Cumpliendo',
          color: colors.success,
          icon: <CheckCircleIcon />,
          bgcolor: '#f0fdf4'
        }
      case 'at-risk':
        return {
          label: 'En Riesgo',
          color: colors.warning,
          icon: <WarningIcon />,
          bgcolor: '#fef3c7'
        }
      case 'non-compliant':
        return {
          label: 'No Cumpliendo',
          color: colors.error,
          icon: <ErrorIcon />,
          bgcolor: '#fef2f2'
        }
      default:
        return {
          label: 'Desconocido',
          color: colors.gray[500],
          icon: <ScheduleIcon />,
          bgcolor: colors.gray[50]
        }
    }
  }

  // Get priority configuration
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return { label: 'Alta', color: colors.error }
      case 'medium':
        return { label: 'Media', color: colors.warning }
      case 'low':
        return { label: 'Baja', color: colors.info }
      default:
        return { label: 'N/A', color: colors.gray[500] }
    }
  }

  // Calculate days until due date
  const getDaysUntilDue = (dueDate: string) => {
    const days = differenceInDays(parseISO(dueDate), new Date())
    return days
  }

  // Handle filter change
  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle export
  const handleExport = () => {
    onExportReport?.(filters)
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={400} />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: colors.gray[800] }}>
          Reporte de Cumplimiento Regulatorio
        </Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Actualizar">
            <IconButton onClick={fetchComplianceData}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExport}
            sx={{
              borderColor: colors.gray[300],
              color: colors.gray[700],
              '&:hover': {
                borderColor: colors.primary,
                color: colors.primary
              }
            }}
          >
            Exportar
          </Button>
        </Stack>
      </Box>

      {/* Filters */}
      {showFilters && (
        <Card sx={{ borderRadius: '16px', border: `1px solid ${colors.gray[200]}`, mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: colors.gray[800] }}>
              Filtros
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={2.4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filters.status}
                    label="Estado"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    {statusOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Prioridad</InputLabel>
                  <Select
                    value={filters.priority}
                    label="Prioridad"
                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                  >
                    {priorityOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Departamento</InputLabel>
                  <Select
                    value={filters.department}
                    label="Departamento"
                    onChange={(e) => handleFilterChange('department', e.target.value)}
                  >
                    {departmentOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Rol</InputLabel>
                  <Select
                    value={filters.role}
                    label="Rol"
                    onChange={(e) => handleFilterChange('role', e.target.value)}
                  >
                    {roleOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Organismo</InputLabel>
                  <Select
                    value={filters.regulatoryBody}
                    label="Organismo"
                    onChange={(e) => handleFilterChange('regulatoryBody', e.target.value)}
                  >
                    {regulatoryBodyOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        {/* Compliance by Role */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ borderRadius: '16px', border: `1px solid ${colors.gray[200]}` }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <PersonIcon sx={{ color: colors.primary, mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: colors.gray[800] }}>
                  Cumplimiento por Rol
                </Typography>
              </Box>
              <Stack spacing={2}>
                {complianceByRole.map((role) => (
                  <Box key={role.role} sx={{ p: 2, border: `1px solid ${colors.gray[200]}`, borderRadius: '8px' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {role.role}
                      </Typography>
                      <Badge badgeContent={role.users} color="primary">
                        <PersonIcon sx={{ color: colors.gray[400] }} />
                      </Badge>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={role.overallComplianceRate}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: colors.gray[200],
                        '& .MuiLinearProgress-bar': {
                          bgcolor: role.overallComplianceRate >= 80 ? colors.success : 
                                   role.overallComplianceRate >= 60 ? colors.warning : colors.error,
                          borderRadius: 4
                        }
                      }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="caption" color={colors.gray[500]}>
                        {role.compliantRequirements}/{role.totalRequirements} requisitos
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {role.overallComplianceRate}%
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Compliance by Department */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ borderRadius: '16px', border: `1px solid ${colors.gray[200]}` }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <BusinessIcon sx={{ color: colors.info, mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: colors.gray[800] }}>
                  Cumplimiento por Departamento
                </Typography>
              </Box>
              <Stack spacing={2}>
                {complianceByDepartment.map((dept) => (
                  <Box key={dept.department} sx={{ p: 2, border: `1px solid ${colors.gray[200]}`, borderRadius: '8px' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {dept.department}
                      </Typography>
                      <Badge badgeContent={dept.users} color="secondary">
                        <BusinessIcon sx={{ color: colors.gray[400] }} />
                      </Badge>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={dept.overallComplianceRate}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: colors.gray[200],
                        '& .MuiLinearProgress-bar': {
                          bgcolor: dept.overallComplianceRate >= 80 ? colors.success : 
                                   dept.overallComplianceRate >= 60 ? colors.warning : colors.error,
                          borderRadius: 4
                        }
                      }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="caption" color={colors.gray[500]}>
                        {dept.compliantRequirements}/{dept.totalRequirements} requisitos
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {dept.overallComplianceRate}%
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Detailed Requirements Table */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: '16px', border: `1px solid ${colors.gray[200]}` }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <AssignmentIcon sx={{ color: colors.warning, mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: colors.gray[800] }}>
                  Requisitos Regulatorios Detallados
                </Typography>
              </Box>
              <TableContainer component={Paper} sx={{ borderRadius: '8px', border: `1px solid ${colors.gray[200]}` }}>
                <Table>
                  <TableHead sx={{ bgcolor: colors.gray[50] }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Requisito</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Progreso</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Fecha Límite</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Prioridad</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Organismo</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredComplianceData.map((requirement) => {
                      const statusConfig = getStatusConfig(requirement.status)
                      const priorityConfig = getPriorityConfig(requirement.priority)
                      const daysUntilDue = getDaysUntilDue(requirement.dueDate)
                      
                      return (
                        <TableRow key={requirement.id} hover>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {requirement.requirement}
                              </Typography>
                              <Typography variant="caption" color={colors.gray[500]}>
                                {requirement.description}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={statusConfig.icon}
                              label={statusConfig.label}
                              size="small"
                              sx={{
                                bgcolor: statusConfig.bgcolor,
                                color: statusConfig.color,
                                '& .MuiChip-icon': { color: statusConfig.color }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ minWidth: 120 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption">
                                  {requirement.completedUsers}/{requirement.totalUsers}
                                </Typography>
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                  {requirement.completionRate}%
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={requirement.completionRate}
                                sx={{
                                  height: 6,
                                  borderRadius: 3,
                                  bgcolor: colors.gray[200],
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: requirement.completionRate >= 80 ? colors.success : 
                                             requirement.completionRate >= 60 ? colors.warning : colors.error,
                                    borderRadius: 3
                                  }
                                }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2">
                                {format(parseISO(requirement.dueDate), 'dd/MM/yyyy', { locale: es })}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                color={daysUntilDue < 0 ? colors.error : daysUntilDue < 30 ? colors.warning : colors.gray[500]}
                              >
                                {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} días vencido` : 
                                 daysUntilDue === 0 ? 'Vence hoy' : 
                                 `${daysUntilDue} días restantes`}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={priorityConfig.label}
                              size="small"
                              variant="outlined"
                              sx={{
                                borderColor: priorityConfig.color,
                                color: priorityConfig.color
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ textTransform: 'uppercase' }}>
                              {requirement.regulatoryBody}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.5}>
                              <Tooltip title="Ver detalles">
                                <IconButton 
                                  size="small"
                                  onClick={() => onRequirementClick?.(requirement)}
                                >
                                  <ViewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {requirement.overdueUsers > 0 && (
                                <Tooltip title={`${requirement.overdueUsers} usuarios vencidos`}>
                                  <IconButton size="small" sx={{ color: colors.error }}>
                                    <AlertIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default ComplianceReporting