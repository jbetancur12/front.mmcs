import React, { useState } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  LinearProgress,
  IconButton,
  Alert,
  CircularProgress,
  Stack,
  Avatar,
  Chip,
  Tooltip,
  Paper,
  Divider
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  Storage as StorageIcon,
  VideoLibrary as VideoIcon,
  Dataset as DatabaseIcon,
  Error as ErrorIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material'
import { useLms } from '../../../hooks/useLms'

// Modern color palette
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
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  }
}

interface SystemPerformanceMetrics {
  storageUsage: {
    total: number
    used: number
    available: number
    percentage: number
  }
  videoStreamingStats: {
    activeStreams: number
    bandwidth: number
    errors: number
    totalViews: number
  }
  databasePerformance: {
    connectionPool: number
    maxConnections: number
    queryTime: number
    slowQueries: number
  }
  errorRates: {
    api: number
    database: number
    storage: number
    streaming: number
  }
  lastUpdated: string
}

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color: string
  trend?: {
    value: number
    isPositive: boolean
  }
  status?: 'healthy' | 'warning' | 'critical'
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
  trend,
  status = 'healthy'
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'healthy':
        return <CheckIcon sx={{ fontSize: 16, color: colors.success }} />
      case 'warning':
        return <WarningIcon sx={{ fontSize: 16, color: colors.warning }} />
      case 'critical':
        return <ErrorIcon sx={{ fontSize: 16, color: colors.error }} />
      default:
        return null
    }
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        border: `1px solid ${colors.gray[200]}`,
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
        }
      }}
    >
      <Stack spacing={2}>
        <Box display='flex' alignItems='center' justifyContent='space-between'>
          <Avatar
            sx={{
              bgcolor: `${color}15`,
              color: color,
              width: 48,
              height: 48
            }}
          >
            {icon}
          </Avatar>
          {getStatusIcon()}
        </Box>

        <Box>
          <Typography
            variant='h4'
            sx={{
              fontWeight: 700,
              color: colors.gray[900],
              mb: 0.5
            }}
          >
            {value}
          </Typography>
          <Typography
            variant='body2'
            sx={{
              color: colors.gray[600],
              fontWeight: 500
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant='caption'
              sx={{
                color: colors.gray[500],
                display: 'block',
                mt: 0.5
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        {trend && (
          <Box display='flex' alignItems='center' gap={1}>
            <TrendingUpIcon
              sx={{
                fontSize: 16,
                color: trend.isPositive ? colors.success : colors.error,
                transform: trend.isPositive ? 'none' : 'rotate(180deg)'
              }}
            />
            <Typography
              variant='caption'
              sx={{
                color: trend.isPositive ? colors.success : colors.error,
                fontWeight: 600
              }}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}%
            </Typography>
          </Box>
        )}
      </Stack>
    </Paper>
  )
}

interface ProgressMetricProps {
  title: string
  value: number
  max: number
  unit: string
  icon: React.ReactNode
  color: string
}

const ProgressMetric: React.FC<ProgressMetricProps> = ({
  title,
  value,
  max,
  unit,
  icon,
  color
}) => {
  const safeValue = Number.isFinite(value) ? value : 0
  const safeMax = Number.isFinite(max) && max > 0 ? max : 0
  const percentage = safeMax > 0 ? (safeValue / safeMax) * 100 : 0

  const getProgressColor = () => {
    if (percentage > 90) return colors.error
    if (percentage > 75) return colors.warning
    return colors.success
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        border: `1px solid ${colors.gray[200]}`,
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
      }}
    >
      <Stack spacing={2}>
        <Box display='flex' alignItems='center' justifyContent='space-between'>
          <Box display='flex' alignItems='center' gap={2}>
            <Avatar
              sx={{
                bgcolor: `${color}15`,
                color: color,
                width: 40,
                height: 40
              }}
            >
              {icon}
            </Avatar>
            <Typography
              variant='h6'
              sx={{
                fontWeight: 600,
                color: colors.gray[900]
              }}
            >
              {title}
            </Typography>
          </Box>
            <Chip
              label={`${safeValue.toFixed(1)} ${unit}`}
            size='small'
            sx={{
              bgcolor: `${getProgressColor()}15`,
              color: getProgressColor(),
              fontWeight: 600
            }}
          />
        </Box>

        <Box>
          <Box display='flex' justifyContent='space-between' mb={1}>
            <Typography variant='body2' color={colors.gray[600]}>
              Uso
            </Typography>
            <Typography variant='body2' color={colors.gray[600]}>
              {percentage.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress
            variant='determinate'
            value={percentage}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: colors.gray[200],
              '& .MuiLinearProgress-bar': {
                bgcolor: getProgressColor(),
                borderRadius: 4
              }
            }}
          />
          <Typography
            variant='caption'
            sx={{
              color: colors.gray[500],
              mt: 1,
              display: 'block'
            }}
          >
              {safeMax.toFixed(1)} {unit} de capacidad total
            </Typography>
        </Box>
      </Stack>
    </Paper>
  )
}

export const SystemPerformanceMetricsWidget: React.FC = () => {
    const [refreshing, setRefreshing] = useState(false)
    const { systemMetrics, isLoading, error, refetch } = useLms()

    const toNumber = (value: unknown, fallback = 0) => {
      const parsed = typeof value === 'number' ? value : Number(value)
      return Number.isFinite(parsed) ? parsed : fallback
    }

  const handleRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setTimeout(() => setRefreshing(false), 1000)
  }

  const formatBandwidth = (bps: number): string => {
    const sizes = ['bps', 'Kbps', 'Mbps', 'Gbps']
    if (bps === 0) return '0 bps'
    const i = Math.floor(Math.log(bps) / Math.log(1000))
    return `${(bps / Math.pow(1000, i)).toFixed(1)} ${sizes[i]}`
  }

  const getSystemStatus = (metrics: SystemPerformanceMetrics) => {
    const storageUsage = metrics?.storageUsage?.percentage || 0
    const errorRate = Math.max(
      metrics?.errorRates?.api || 0,
      metrics?.errorRates?.database || 0,
      metrics?.errorRates?.storage || 0,
      metrics?.errorRates?.streaming || 0
    )

    if (storageUsage > 90 || errorRate > 5) return 'critical'
    if (storageUsage > 75 || errorRate > 2) return 'warning'
    return 'healthy'
  }

  if (isLoading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box
            display='flex'
            alignItems='center'
            justifyContent='center'
            minHeight={400}
          >
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Alert severity='error'>
            No se pudieron cargar las métricas del sistema. Intenta nuevamente.
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Provide default values to prevent undefined errors
  const defaultMetrics: SystemPerformanceMetrics = {
    storageUsage: { total: 0, used: 0, available: 0, percentage: 0 },
    videoStreamingStats: {
      activeStreams: 0,
      bandwidth: 0,
      errors: 0,
      totalViews: 0
    },
    databasePerformance: {
      connectionPool: 0,
      maxConnections: 100,
      queryTime: 0,
      slowQueries: 0
    },
    errorRates: { api: 0, database: 0, storage: 0, streaming: 0 },
    lastUpdated: new Date().toISOString()
  }

  const safeMetrics: SystemPerformanceMetrics = {
    storageUsage: {
      total: toNumber(systemMetrics?.storageUsage?.total),
      used: toNumber(systemMetrics?.storageUsage?.used),
      available: toNumber(systemMetrics?.storageUsage?.available),
      percentage: toNumber(systemMetrics?.storageUsage?.percentage)
    },
    videoStreamingStats: {
      activeStreams: toNumber(systemMetrics?.videoStreamingStats?.activeStreams),
      bandwidth: toNumber(systemMetrics?.videoStreamingStats?.bandwidth),
      errors: toNumber(systemMetrics?.videoStreamingStats?.errors),
      totalViews: toNumber(systemMetrics?.videoStreamingStats?.totalViews)
    },
    databasePerformance: {
      connectionPool: toNumber(systemMetrics?.databasePerformance?.connectionPool),
      maxConnections: toNumber(systemMetrics?.databasePerformance?.maxConnections, 100),
      queryTime: toNumber(systemMetrics?.databasePerformance?.queryTime),
      slowQueries: toNumber(systemMetrics?.databasePerformance?.slowQueries)
    },
    errorRates: {
      api: toNumber(systemMetrics?.errorRates?.api),
      database: toNumber(systemMetrics?.errorRates?.database),
      storage: toNumber(systemMetrics?.errorRates?.storage),
      streaming: toNumber(systemMetrics?.errorRates?.streaming)
    },
    lastUpdated: systemMetrics?.lastUpdated || defaultMetrics.lastUpdated
  }

  const systemStatus = getSystemStatus(safeMetrics)

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box
          display='flex'
          alignItems='center'
          justifyContent='space-between'
          mb={3}
        >
          <Box>
            <Typography
              variant='h6'
              sx={{ fontWeight: 600, color: colors.gray[900] }}
            >
              Métricas del Sistema
            </Typography>
            <Typography variant='body2' color={colors.gray[600]}>
              Salud operativa y rendimiento en tiempo real
            </Typography>
          </Box>
          <Box display='flex' alignItems='center' gap={1}>
            <Chip
              label={systemStatus.toUpperCase()}
              size='small'
              sx={{
                bgcolor:
                  systemStatus === 'healthy'
                    ? `${colors.success}15`
                    : systemStatus === 'warning'
                      ? `${colors.warning}15`
                      : `${colors.error}15`,
                color:
                  systemStatus === 'healthy'
                    ? colors.success
                    : systemStatus === 'warning'
                      ? colors.warning
                      : colors.error,
                fontWeight: 600
              }}
            />
            <Tooltip title='Actualizar métricas'>
              <IconButton
                onClick={handleRefresh}
                disabled={refreshing}
                size='small'
              >
                <RefreshIcon
                  sx={{
                    animation: refreshing ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' }
                    }
                  }}
                />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Storage Usage */}
          <Grid item xs={12} md={6}>
            <ProgressMetric
              title='Uso de almacenamiento'
              value={safeMetrics.storageUsage.used}
              max={safeMetrics.storageUsage.total}
              unit='GB'
              icon={<StorageIcon />}
              color={colors.info}
            />
          </Grid>

          {/* Database Connections */}
          <Grid item xs={12} md={6}>
            <ProgressMetric
              title='Conexiones de base de datos'
              value={safeMetrics.databasePerformance.connectionPool}
              max={safeMetrics.databasePerformance.maxConnections}
              unit='connections'
              icon={<DatabaseIcon />}
              color={colors.primary}
            />
          </Grid>

          {/* Video Streaming Stats */}
          <Grid item xs={12} md={6} lg={3}>
            <MetricCard
              title='Streams activos'
              value={safeMetrics.videoStreamingStats.activeStreams}
              subtitle='Transmitiendo ahora'
              icon={<VideoIcon />}
              color={colors.info}
              status={
                safeMetrics.videoStreamingStats.errors > 10
                  ? 'warning'
                  : 'healthy'
              }
            />
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <MetricCard
              title='Uso de ancho de banda'
              value={formatBandwidth(safeMetrics.videoStreamingStats.bandwidth)}
              subtitle='Consumo actual'
              icon={<SpeedIcon />}
              color={colors.primary}
            />
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <MetricCard
              title='Tiempo de consulta'
              value={`${safeMetrics.databasePerformance.queryTime}ms`}
              subtitle='Respuesta promedio'
              icon={<DatabaseIcon />}
              color={colors.success}
              status={
                safeMetrics.databasePerformance.queryTime > 1000
                  ? 'critical'
                  : safeMetrics.databasePerformance.queryTime > 500
                    ? 'warning'
                    : 'healthy'
              }
            />
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <MetricCard
              title='Tasa de error'
              value={`${Math.max(
                safeMetrics.errorRates.api,
                safeMetrics.errorRates.database,
                safeMetrics.errorRates.storage,
                safeMetrics.errorRates.streaming
              ).toFixed(2)}%`}
              subtitle='Errores globales'
              icon={<ErrorIcon />}
              color={colors.error}
              status={
                Math.max(
                  safeMetrics.errorRates.api,
                  safeMetrics.errorRates.database,
                  safeMetrics.errorRates.storage,
                  safeMetrics.errorRates.streaming
                ) > 5
                  ? 'critical'
                  : Math.max(
                        safeMetrics.errorRates.api,
                        safeMetrics.errorRates.database,
                        safeMetrics.errorRates.storage,
                        safeMetrics.errorRates.streaming
                      ) > 2
                    ? 'warning'
                    : 'healthy'
              }
            />
          </Grid>

          {/* Error Breakdown */}
          <Grid item xs={12}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: `1px solid ${colors.gray[200]}`,
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
              }}
            >
              <Typography
                variant='h6'
                sx={{
                  fontWeight: 600,
                  color: colors.gray[900],
                  mb: 2
                }}
              >
                Desglose de errores
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Box textAlign='center'>
                    <Typography
                      variant='h5'
                      sx={{ fontWeight: 700, color: colors.error }}
                    >
                      {safeMetrics.errorRates.api.toFixed(2)}%
                    </Typography>
                    <Typography variant='body2' color={colors.gray[600]}>
                      Errores API
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box textAlign='center'>
                    <Typography
                      variant='h5'
                      sx={{ fontWeight: 700, color: colors.warning }}
                    >
                      {safeMetrics.errorRates.database.toFixed(2)}%
                    </Typography>
                    <Typography variant='body2' color={colors.gray[600]}>
                      Errores BD
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box textAlign='center'>
                    <Typography
                      variant='h5'
                      sx={{ fontWeight: 700, color: colors.info }}
                    >
                      {safeMetrics.errorRates.storage.toFixed(2)}%
                    </Typography>
                    <Typography variant='body2' color={colors.gray[600]}>
                      Errores almacenamiento
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box textAlign='center'>
                    <Typography
                      variant='h5'
                      sx={{ fontWeight: 700, color: colors.primary }}
                    >
                      {safeMetrics.errorRates.streaming.toFixed(2)}%
                    </Typography>
                    <Typography variant='body2' color={colors.gray[600]}>
                      Errores streaming
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box
          display='flex'
          alignItems='center'
          justifyContent='between'
          gap={2}
        >
          <Typography variant='caption' color={colors.gray[500]}>
            Última actualización: {new Date(safeMetrics.lastUpdated).toLocaleString()}
          </Typography>
          <Typography variant='caption' color={colors.gray[500]}>
            Actualización automática cada 30 segundos
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

export default SystemPerformanceMetricsWidget
