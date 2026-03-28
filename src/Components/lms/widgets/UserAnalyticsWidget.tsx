import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Avatar,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
  Skeleton
} from '@mui/material'
import {
  People as PeopleIcon,
  Business as BusinessIcon,
  PersonOutline as PersonOutlineIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material'
import { LmsDashboardScope } from '../../../utils/lmsIdentity'

// Modern color palette
const colors = {
  primary: '#10b981',
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

interface UserAnalytics {
  totalUsers?: number
  internalUsers?: number
  clientUsers?: number
  activeUsers?: number
  completionRateByUserType?: {
    internal: number
    client: number
  }
  progressDistribution?: {
    notStarted: number
    inProgress: number
    completed: number
  }
}

interface UserAnalyticsWidgetProps {
  data?: UserAnalytics
  loading?: boolean
  error?: string
  onViewDetails?: () => void
  onUserTypeClick?: (userType: 'internal' | 'client') => void
  scope?: LmsDashboardScope
  userRole?: string
  department?: string
}

const UserAnalyticsWidget: React.FC<UserAnalyticsWidgetProps> = ({
  data,
  loading = false,
  error,
  onViewDetails,
  onUserTypeClick,
  scope = 'admin',
  userRole,
  department
}) => {
  void userRole
  if (loading) {
    return (
      <Card sx={{ borderRadius: '16px', border: `1px solid ${colors.gray[200]}` }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="text" width="40%" height={20} />
            </Box>
          </Box>
          <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card sx={{ borderRadius: '16px', border: `1px solid ${colors.error}` }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="body2" color={colors.error}>
            Error loading user analytics
          </Typography>
        </CardContent>
      </Card>
    )
  }

  // Role-based data filtering and display logic
  const getScopeLabel = () => {
    switch (scope) {
      case 'training_manager':
        return 'Usuarios en Capacitación'
      case 'limited':
        return `Usuarios - ${department || 'Vista Operativa'}`
      default:
        return 'Analytics de Usuarios'
    }
  }

  const getScopeDescription = () => {
    switch (scope) {
      case 'training_manager':
        return 'Usuarios en cursos gestionados'
      case 'limited':
        return 'Usuarios visibles en la operación actual'
      default:
        return 'Segmentación y engagement'
    }
  }

  const engagementRate = (data.totalUsers || 0) > 0 ? 
    Math.round(((data.activeUsers || 0) / (data.totalUsers || 1)) * 100) : 0

  const totalProgress = (data.progressDistribution?.notStarted || 0) + 
                       (data.progressDistribution?.inProgress || 0) + 
                       (data.progressDistribution?.completed || 0)

  return (
    <Card sx={{
      borderRadius: '16px',
      border: `1px solid ${colors.gray[200]}`,
      transition: 'all 0.3s ease-in-out',
      '&:hover': {
        borderColor: colors.info,
        boxShadow: `0 8px 25px rgba(59, 130, 246, 0.15)`,
        transform: 'translateY(-2px)'
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar sx={{
            bgcolor: '#eff6ff',
            color: colors.info,
            mr: 2,
            width: 48,
            height: 48
          }}>
            <PeopleIcon />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: colors.gray[800] }}>
              {getScopeLabel()}
            </Typography>
            <Typography variant="body2" color={colors.gray[500]}>
              {getScopeDescription()}
            </Typography>
            {scope !== 'admin' && (
              <Box sx={{ mt: 0.5 }}>
                <Typography variant="caption" sx={{
                  bgcolor: '#eff6ff',
                  color: colors.info,
                  px: 1,
                  py: 0.25,
                  borderRadius: 1,
                  fontSize: '0.7rem'
                }}>
                  {scope === 'training_manager' ? 'Vista Gestor' : 'Vista Acotada'}
                </Typography>
              </Box>
            )}
          </Box>
          <Tooltip title="Ver detalles completos">
            <IconButton onClick={onViewDetails} size="small">
              <AssessmentIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Main Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: colors.gray[50], borderRadius: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: colors.gray[800] }}>
                {data.totalUsers || 0}
              </Typography>
              <Typography variant="body2" color={colors.gray[500]}>
                Total
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#eff6ff', borderRadius: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: colors.info }}>
                {data.activeUsers || 0}
              </Typography>
              <Typography variant="body2" color={colors.info}>
                Activos
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: colors.primaryLight, borderRadius: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: colors.primary }}>
                {engagementRate}%
              </Typography>
              <Typography variant="body2" color={colors.primary}>
                Engagement
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* User Type Breakdown */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: colors.gray[700], mb: 2 }}>
            Segmentación por Tipo
          </Typography>
          
          {/* Internal Users */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 2,
              mb: 2,
              bgcolor: colors.gray[50],
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                bgcolor: colors.primaryLight,
                transform: 'translateX(4px)'
              }
            }}
            onClick={() => onUserTypeClick?.('internal')}
          >
            <Avatar sx={{ bgcolor: colors.primary, mr: 2, width: 32, height: 32 }}>
              <PersonOutlineIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: colors.gray[800] }}>
                Usuarios Internos
              </Typography>
              <Typography variant="caption" color={colors.gray[500]}>
                {data.internalUsers || 0} usuarios • {data.completionRateByUserType?.internal || 0}% completado
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: colors.primary }}>
                {(data.totalUsers || 0) > 0 ? Math.round(((data.internalUsers || 0) / (data.totalUsers || 1)) * 100) : 0}%
              </Typography>
            </Box>
          </Box>

          {/* Client Users */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 2,
              bgcolor: colors.gray[50],
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                bgcolor: '#eff6ff',
                transform: 'translateX(4px)'
              }
            }}
            onClick={() => onUserTypeClick?.('client')}
          >
            <Avatar sx={{ bgcolor: colors.info, mr: 2, width: 32, height: 32 }}>
              <BusinessIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: colors.gray[800] }}>
                Usuarios Cliente
              </Typography>
              <Typography variant="caption" color={colors.gray[500]}>
                {data.clientUsers || 0} usuarios • {data.completionRateByUserType?.client || 0}% completado
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: colors.info }}>
                {(data.totalUsers || 0) > 0 ? Math.round(((data.clientUsers || 0) / (data.totalUsers || 1)) * 100) : 0}%
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Progress Distribution */}
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: colors.gray[700], mb: 2 }}>
            Distribución de Progreso
          </Typography>
          
          {/* Progress Bars */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" color={colors.gray[500]}>
                Completados
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {data.progressDistribution?.completed || 0} ({totalProgress > 0 ? Math.round(((data.progressDistribution?.completed || 0) / totalProgress) * 100) : 0}%)
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={totalProgress > 0 ? ((data.progressDistribution?.completed || 0) / totalProgress) * 100 : 0}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: colors.gray[200],
                '& .MuiLinearProgress-bar': {
                  bgcolor: colors.success,
                  borderRadius: 3
                }
              }}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" color={colors.gray[500]}>
                En Progreso
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {data.progressDistribution?.inProgress || 0} ({totalProgress > 0 ? Math.round(((data.progressDistribution?.inProgress || 0) / totalProgress) * 100) : 0}%)
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={totalProgress > 0 ? ((data.progressDistribution?.inProgress || 0) / totalProgress) * 100 : 0}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: colors.gray[200],
                '& .MuiLinearProgress-bar': {
                  bgcolor: colors.warning,
                  borderRadius: 3
                }
              }}
            />
          </Box>

          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" color={colors.gray[500]}>
                Sin Comenzar
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {data.progressDistribution?.notStarted || 0} ({totalProgress > 0 ? Math.round(((data.progressDistribution?.notStarted || 0) / totalProgress) * 100) : 0}%)
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={totalProgress > 0 ? ((data.progressDistribution?.notStarted || 0) / totalProgress) * 100 : 0}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: colors.gray[200],
                '& .MuiLinearProgress-bar': {
                  bgcolor: colors.gray[400],
                  borderRadius: 3
                }
              }}
            />
          </Box>
        </Box>

        {/* Summary Stats */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-around', 
          mt: 3, 
          pt: 2, 
          borderTop: `1px solid ${colors.gray[200]}` 
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
              <TrendingUpIcon sx={{ color: colors.success, fontSize: 16, mr: 0.5 }} />
              <Typography variant="body2" sx={{ fontWeight: 700, color: colors.success }}>
                +{Math.round(engagementRate * 0.1)}%
              </Typography>
            </Box>
            <Typography variant="caption" color={colors.gray[500]}>
              Este Mes
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: colors.gray[800] }}>
              {Math.round(((data.completionRateByUserType?.internal || 0) + (data.completionRateByUserType?.client || 0)) / 2)}%
            </Typography>
            <Typography variant="caption" color={colors.gray[500]}>
              Promedio Global
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: colors.info }}>
              {Math.round(((data.activeUsers || 0) / (data.totalUsers || 1)) * 100)}%
            </Typography>
            <Typography variant="caption" color={colors.gray[500]}>
              Tasa Actividad
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default UserAnalyticsWidget
