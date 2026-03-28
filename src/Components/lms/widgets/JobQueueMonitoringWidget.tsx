import React, { useState } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  LinearProgress,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Alert,
  CircularProgress,
  Stack,
  Avatar
} from '@mui/material'
import {
  PlayArrow as RetryIcon,
  Stop as CancelIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  PlayCircle as ActiveIcon,
  Cancel as CancelledIcon,
  Memory as MemoryIcon
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import {
  lmsService,
  type JobQueueStatus,
  type Job
} from '../../../services/lmsService'

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
    700: '#374151',
    800: '#1f2937'
  }
}

interface JobQueueMonitoringWidgetProps {
  refreshInterval?: number
  onJobAction?: (jobId: string, action: string) => void
}

const JobQueueMonitoringWidget: React.FC<JobQueueMonitoringWidgetProps> = ({
  refreshInterval = 30000,
  onJobAction
}) => {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [jobDetailsOpen, setJobDetailsOpen] = useState(false)
  const queryClient = useQueryClient()

  // Fetch job queue status
  const {
    data: jobQueueData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['jobQueueStatus'],
    queryFn: () => lmsService.getJobQueueStatus(),
    refetchInterval: refreshInterval,
    staleTime: 10000 // Consider data stale after 10 seconds
  })

  // Retry job mutation
  const retryJobMutation = useMutation({
    mutationFn: (jobId: string) => lmsService.retryJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobQueueStatus'] })
      onJobAction?.(selectedJob?.id || '', 'retry')
    }
  })

  // Cancel job mutation
  const cancelJobMutation = useMutation({
    mutationFn: (jobId: string) => lmsService.cancelJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobQueueStatus'] })
      onJobAction?.(selectedJob?.id || '', 'cancel')
    }
  })

  const handleJobDetails = async (job: Job) => {
    try {
      const jobDetails = await lmsService.getJobDetails(job.id)
      setSelectedJob(jobDetails)
      setJobDetailsOpen(true)
    } catch (error) {
      console.error('Error fetching job details:', error)
      setSelectedJob(job)
      setJobDetailsOpen(true)
    }
  }

  const handleRetryJob = (jobId: string) => {
    retryJobMutation.mutate(jobId)
  }

  const handleCancelJob = (jobId: string) => {
    cancelJobMutation.mutate(jobId)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckIcon sx={{ color: colors.success }} />
      case 'failed':
        return <ErrorIcon sx={{ color: colors.error }} />
      case 'active':
        return <ActiveIcon sx={{ color: colors.info }} />
      case 'pending':
        return <PendingIcon sx={{ color: colors.warning }} />
      case 'cancelled':
        return <CancelledIcon sx={{ color: colors.gray[500] }} />
      default:
        return <InfoIcon sx={{ color: colors.gray[400] }} />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.success
      case 'failed':
        return colors.error
      case 'active':
        return colors.info
      case 'pending':
        return colors.warning
      case 'cancelled':
        return colors.gray[500]
      default:
        return colors.gray[400]
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return colors.success
      case 'warning':
        return colors.warning
      case 'critical':
        return colors.error
      default:
        return colors.gray[400]
    }
  }

  const getHealthLabel = (health?: string) => {
    if (!health) return 'SIN DATOS'
    return health.toUpperCase()
  }

  const getStatusLabel = (status?: string) => {
    if (!status) return 'SIN ESTADO'
    return status.toUpperCase()
  }

  const toNumber = (value: unknown, fallback = 0) => {
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  const formatDuration = (milliseconds: number) => {
    const safeMilliseconds = toNumber(milliseconds)
    if (safeMilliseconds < 1000) return `${safeMilliseconds}ms`
    if (safeMilliseconds < 60000) return `${(safeMilliseconds / 1000).toFixed(1)}s`
    return `${(safeMilliseconds / 60000).toFixed(1)}m`
  }

  const formatJobType = (type: string) => {
    return type
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
  }

  if (isLoading) {
    return (
      <Card
        sx={{ borderRadius: '16px', border: `1px solid ${colors.gray[200]}` }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              py: 4
            }}
          >
            <CircularProgress size={40} />
          </Box>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card
        sx={{ borderRadius: '16px', border: `1px solid ${colors.gray[200]}` }}
      >
        <CardContent sx={{ p: 3 }}>
          <Alert severity='error'>
            Error loading job queue data. Please try again.
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const jobQueue: JobQueueStatus = jobQueueData || {
    activeJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    queueHealth: 'healthy',
    processingTimes: { average: 0, p95: 0, p99: 0 },
    jobTypes: {
      certificateGeneration: {
        active: 0,
        completed: 0,
        failed: 0,
        averageProcessingTime: 0,
        successRate: 100
      },
      videoProcessing: {
        active: 0,
        completed: 0,
        failed: 0,
        averageProcessingTime: 0,
        successRate: 100
      },
      emailNotifications: {
        active: 0,
        completed: 0,
        failed: 0,
        averageProcessingTime: 0,
        successRate: 100
      },
      dataCleanup: {
        active: 0,
        completed: 0,
        failed: 0,
        averageProcessingTime: 0,
        successRate: 100
      }
    },
    recentJobs: []
  }

  return (
    <>
      <Card
        sx={{
          borderRadius: '16px',
          border: `1px solid ${colors.gray[200]}`,
          height: '100%'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar
                sx={{
                  bgcolor: colors.info,
                  mr: 2,
                  width: 40,
                  height: 40
                }}
              >
                <MemoryIcon />
              </Avatar>
              <Box>
                <Typography
                  variant='h6'
                  sx={{ fontWeight: 700, color: colors.gray[800] }}
                >
                  Job Queue Monitor
                </Typography>
                <Typography variant='body2' color={colors.gray[500]}>
                  System job processing status
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={getHealthLabel(jobQueue.queueHealth)}
                size='small'
                sx={{
                  bgcolor: getHealthColor(jobQueue.queueHealth || 'unknown'),
                  color: 'white',
                  fontWeight: 700
                }}
              />
              <IconButton
                onClick={() => refetch()}
                size='small'
                sx={{ color: colors.gray[500] }}
              >
                <RefreshIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Job Status Overview */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={3}>
              <Box
                sx={{
                  textAlign: 'center',
                  p: 2,
                  borderRadius: '12px',
                  bgcolor: colors.gray[50],
                  border: `1px solid ${colors.gray[100]}`
                }}
              >
                <Typography
                  variant='h4'
                  sx={{ fontWeight: 700, color: colors.info, mb: 0.5 }}
                >
                  {jobQueue.activeJobs}
                </Typography>
                <Typography
                  variant='body2'
                  color={colors.gray[500]}
                  sx={{ fontWeight: 500 }}
                >
                  Active
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box
                sx={{
                  textAlign: 'center',
                  p: 2,
                  borderRadius: '12px',
                  bgcolor: colors.gray[50],
                  border: `1px solid ${colors.gray[100]}`
                }}
              >
                <Typography
                  variant='h4'
                  sx={{ fontWeight: 700, color: colors.success, mb: 0.5 }}
                >
                  {jobQueue.completedJobs}
                </Typography>
                <Typography
                  variant='body2'
                  color={colors.gray[500]}
                  sx={{ fontWeight: 500 }}
                >
                  Completed
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box
                sx={{
                  textAlign: 'center',
                  p: 2,
                  borderRadius: '12px',
                  bgcolor: colors.gray[50],
                  border: `1px solid ${colors.gray[100]}`
                }}
              >
                <Typography
                  variant='h4'
                  sx={{ fontWeight: 700, color: colors.error, mb: 0.5 }}
                >
                  {jobQueue.failedJobs}
                </Typography>
                <Typography
                  variant='body2'
                  color={colors.gray[500]}
                  sx={{ fontWeight: 500 }}
                >
                  Failed
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box
                sx={{
                  textAlign: 'center',
                  p: 2,
                  borderRadius: '12px',
                  bgcolor: colors.gray[50],
                  border: `1px solid ${colors.gray[100]}`
                }}
              >
                <Typography
                  variant='h4'
                  sx={{ fontWeight: 700, color: colors.gray[700], mb: 0.5 }}
                >
                  {formatDuration(jobQueue.processingTimes?.average || 0)}
                </Typography>
                <Typography
                  variant='body2'
                  color={colors.gray[500]}
                  sx={{ fontWeight: 500 }}
                >
                  Avg Time
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Job Types Breakdown */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant='subtitle1'
              sx={{ fontWeight: 600, mb: 2, color: colors.gray[800] }}
            >
              Job Types Status
            </Typography>
            <Stack spacing={2}>
              {Object.entries(jobQueue.jobTypes || {}).map(([type, status]) => (
                <Box
                  key={type}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                    borderRadius: '12px',
                    bgcolor: colors.gray[50],
                    border: `1px solid ${colors.gray[100]}`
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor:
                          toNumber(status.successRate) > 90
                            ? colors.success
                            : toNumber(status.successRate) > 70
                              ? colors.warning
                              : colors.error,
                        mr: 2
                      }}
                    />
                    <Typography
                      variant='body2'
                      sx={{ fontWeight: 600, color: colors.gray[800] }}
                    >
                      {formatJobType(type)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant='body2' color={colors.gray[500]}>
                      {toNumber(status.active)} active
                    </Typography>
                    <Typography variant='body2' color={colors.gray[500]}>
                      {toNumber(status.successRate).toFixed(1)}% success
                    </Typography>
                    <Typography variant='body2' color={colors.gray[500]}>
                      {formatDuration(toNumber(status.averageProcessingTime))} avg
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* Recent Jobs */}
          {jobQueue.recentJobs && jobQueue.recentJobs.length > 0 && (
            <Box>
              <Typography
                variant='subtitle1'
                sx={{ fontWeight: 600, mb: 2, color: colors.gray[800] }}
              >
                Recent Jobs
              </Typography>
              <TableContainer
                component={Paper}
                sx={{
                  borderRadius: '12px',
                  border: `1px solid ${colors.gray[200]}`
                }}
              >
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Progress</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {jobQueue.recentJobs.slice(0, 5).map((job) => (
                      <TableRow key={job.id} hover>
                        <TableCell>
                          <Typography variant='body2' sx={{ fontWeight: 500 }}>
                            {formatJobType(job.type)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getStatusIcon(job.status)}
                            <Chip
                              label={getStatusLabel(job.status)}
                              size='small'
                              sx={{
                                ml: 1,
                                bgcolor: getStatusColor(
                                  job.status || 'unknown'
                                ),
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.7rem'
                              }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              minWidth: 100
                            }}
                          >
                            <LinearProgress
                              variant='determinate'
                              value={toNumber(job.progress)}
                              sx={{
                                flex: 1,
                                mr: 1,
                                height: 6,
                                borderRadius: 3,
                                bgcolor: colors.gray[200],
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: getStatusColor(job.status),
                                  borderRadius: 3
                                }
                              }}
                            />
                            <Typography
                              variant='body2'
                              color={colors.gray[500]}
                              sx={{ fontSize: '0.75rem' }}
                            >
                              {toNumber(job.progress)}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2' color={colors.gray[500]}>
                            {job.processingTime
                              ? formatDuration(job.processingTime)
                              : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title='View Details'>
                              <IconButton
                                size='small'
                                onClick={() => handleJobDetails(job)}
                                sx={{ color: colors.gray[500] }}
                              >
                                <InfoIcon fontSize='small' />
                              </IconButton>
                            </Tooltip>
                            {job.status === 'failed' && (
                              <Tooltip title='Retry Job'>
                                <IconButton
                                  size='small'
                                  onClick={() => handleRetryJob(job.id)}
                                  sx={{ color: colors.warning }}
                                  disabled={retryJobMutation.isLoading}
                                >
                                  <RetryIcon fontSize='small' />
                                </IconButton>
                              </Tooltip>
                            )}
                            {(job.status === 'active' ||
                              job.status === 'pending') && (
                              <Tooltip title='Cancel Job'>
                                <IconButton
                                  size='small'
                                  onClick={() => handleCancelJob(job.id)}
                                  sx={{ color: colors.error }}
                                  disabled={cancelJobMutation.isLoading}
                                >
                                  <CancelIcon fontSize='small' />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Job Details Dialog */}
      <Dialog
        open={jobDetailsOpen}
        onClose={() => setJobDetailsOpen(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Typography variant='h6' sx={{ fontWeight: 700 }}>
              Job Details
            </Typography>
            {selectedJob && (
              <Chip
                label={getStatusLabel(selectedJob.status)}
                size='small'
                sx={{
                  bgcolor: getStatusColor(selectedJob.status || 'unknown'),
                  color: 'white',
                  fontWeight: 600
                }}
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedJob && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography
                    variant='body2'
                    color={colors.gray[500]}
                    sx={{ mb: 0.5 }}
                  >
                    Job ID
                  </Typography>
                  <Typography variant='body1' sx={{ fontWeight: 600, mb: 2 }}>
                    {selectedJob.id}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography
                    variant='body2'
                    color={colors.gray[500]}
                    sx={{ mb: 0.5 }}
                  >
                    Type
                  </Typography>
                  <Typography variant='body1' sx={{ fontWeight: 600, mb: 2 }}>
                    {formatJobType(selectedJob.type)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography
                    variant='body2'
                    color={colors.gray[500]}
                    sx={{ mb: 0.5 }}
                  >
                    Priority
                  </Typography>
                  <Typography variant='body1' sx={{ fontWeight: 600, mb: 2 }}>
                    {selectedJob.priority}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography
                    variant='body2'
                    color={colors.gray[500]}
                    sx={{ mb: 0.5 }}
                  >
                    Attempts
                  </Typography>
                  <Typography variant='body1' sx={{ fontWeight: 600, mb: 2 }}>
                    {selectedJob.attempts} / {selectedJob.maxAttempts}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography
                    variant='body2'
                    color={colors.gray[500]}
                    sx={{ mb: 0.5 }}
                  >
                    Progress
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LinearProgress
                      variant='determinate'
                      value={selectedJob.progress}
                      sx={{
                        flex: 1,
                        mr: 2,
                        height: 8,
                        borderRadius: 4,
                        bgcolor: colors.gray[200],
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getStatusColor(selectedJob.status),
                          borderRadius: 4
                        }
                      }}
                    />
                    <Typography variant='body2' sx={{ fontWeight: 600 }}>
                      {selectedJob.progress}%
                    </Typography>
                  </Box>
                </Grid>
                {selectedJob.error && (
                  <Grid item xs={12}>
                    <Typography
                      variant='body2'
                      color={colors.gray[500]}
                      sx={{ mb: 0.5 }}
                    >
                      Error
                    </Typography>
                    <Alert severity='error' sx={{ mb: 2 }}>
                      {selectedJob.error}
                    </Alert>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography
                    variant='body2'
                    color={colors.gray[500]}
                    sx={{ mb: 0.5 }}
                  >
                    Timestamps
                  </Typography>
                  <Box
                    sx={{ bgcolor: colors.gray[50], p: 2, borderRadius: '8px' }}
                  >
                    <Typography variant='body2' sx={{ mb: 1 }}>
                      <strong>Created:</strong>{' '}
                      {new Date(selectedJob.createdAt).toLocaleString()}
                    </Typography>
                    {selectedJob.startedAt && (
                      <Typography variant='body2' sx={{ mb: 1 }}>
                        <strong>Started:</strong>{' '}
                        {new Date(selectedJob.startedAt).toLocaleString()}
                      </Typography>
                    )}
                    {selectedJob.completedAt && (
                      <Typography variant='body2' sx={{ mb: 1 }}>
                        <strong>Completed:</strong>{' '}
                        {new Date(selectedJob.completedAt).toLocaleString()}
                      </Typography>
                    )}
                    {selectedJob.failedAt && (
                      <Typography variant='body2'>
                        <strong>Failed:</strong>{' '}
                        {new Date(selectedJob.failedAt).toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJobDetailsOpen(false)}>Close</Button>
          {selectedJob?.status === 'failed' && (
            <Button
              variant='contained'
              startIcon={<RetryIcon />}
              onClick={() => {
                handleRetryJob(selectedJob.id)
                setJobDetailsOpen(false)
              }}
              disabled={retryJobMutation.isLoading}
              sx={{
                bgcolor: colors.warning,
                '&:hover': { bgcolor: '#ea580c' }
              }}
            >
              Retry Job
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  )
}

export default JobQueueMonitoringWidget
