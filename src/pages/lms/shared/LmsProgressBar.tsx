import React from 'react'
import {
  Box,
  LinearProgress,
  Typography,
  Chip,
  Paper
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  PlayCircle as PlayCircleIcon
} from '@mui/icons-material'

interface ProgressStep {
  id: string
  title: string
  type: 'text' | 'video' | 'quiz'
  completed: boolean
  current?: boolean
}

interface LmsProgressBarProps {
  steps: ProgressStep[]
  currentStepId?: string
  onStepClick?: (stepId: string) => void
  showLabels?: boolean
  variant?: 'horizontal' | 'vertical'
}

const LmsProgressBar: React.FC<LmsProgressBarProps> = ({
  steps,
  currentStepId,
  onStepClick,
  showLabels = true,
  variant = 'horizontal'
}) => {
  const completedSteps = steps.filter(step => step.completed).length
  const totalSteps = steps.length
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

  const getStepIcon = (step: ProgressStep) => {
    if (step.completed) {
      return <CheckCircleIcon color="success" />
    }
    if (step.id === currentStepId) {
      return <PlayCircleIcon color="primary" />
    }
    return <RadioButtonUncheckedIcon color="disabled" />
  }

  const getStepColor = (step: ProgressStep) => {
    if (step.completed) return 'success'
    if (step.id === currentStepId) return 'primary'
    return 'default'
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'video':
        return 'Video'
      case 'text':
        return 'Texto'
      case 'quiz':
        return 'Quiz'
      default:
        return 'Contenido'
    }
  }

  if (variant === 'vertical') {
    return (
      <Paper sx={{ p: 2 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Progreso del Curso
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <LinearProgress
              variant="determinate"
              value={progressPercentage}
              sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
            />
            <Typography variant="body2" color="text.secondary">
              {completedSteps}/{totalSteps}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            {Math.round(progressPercentage)}% completado
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {steps.map((step, index) => (
            <Box
              key={step.id}
              onClick={() => onStepClick?.(step.id)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 1,
                borderRadius: 1,
                cursor: onStepClick ? 'pointer' : 'default',
                backgroundColor: step.id === currentStepId ? 'action.selected' : 'transparent',
                '&:hover': onStepClick ? {
                  backgroundColor: 'action.hover'
                } : {}
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 24 }}>
                {getStepIcon(step)}
              </Box>
              
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: step.id === currentStepId ? 'medium' : 'normal',
                    color: step.completed ? 'success.main' : 
                           step.id === currentStepId ? 'primary.main' : 'text.primary'
                  }}
                  noWrap
                >
                  {index + 1}. {step.title}
                </Typography>
                {showLabels && (
                  <Chip
                    label={getTypeLabel(step.type)}
                    size="small"
                    color={getStepColor(step)}
                    variant="outlined"
                    sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                  />
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>
    )
  }

  // Horizontal variant
  return (
    <Box sx={{ width: '100%' }}>
      {/* Overall Progress */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Progreso del Curso
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {completedSteps}/{totalSteps} ({Math.round(progressPercentage)}%)
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progressPercentage}
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Box>

      {/* Step Indicators */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          overflowX: 'auto',
          pb: 1
        }}
      >
        {steps.map((step, index) => (
          <Box
            key={step.id}
            onClick={() => onStepClick?.(step.id)}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: 80,
              p: 1,
              borderRadius: 1,
              cursor: onStepClick ? 'pointer' : 'default',
              backgroundColor: step.id === currentStepId ? 'action.selected' : 'transparent',
              '&:hover': onStepClick ? {
                backgroundColor: 'action.hover'
              } : {}
            }}
          >
            <Box sx={{ mb: 0.5 }}>
              {getStepIcon(step)}
            </Box>
            
            <Typography
              variant="caption"
              align="center"
              sx={{
                fontWeight: step.id === currentStepId ? 'medium' : 'normal',
                color: step.completed ? 'success.main' : 
                       step.id === currentStepId ? 'primary.main' : 'text.secondary',
                lineHeight: 1.2
              }}
            >
              {index + 1}
            </Typography>
            
            {showLabels && (
              <Chip
                label={getTypeLabel(step.type)}
                size="small"
                color={getStepColor(step)}
                variant="outlined"
                sx={{ mt: 0.5, height: 16, fontSize: '0.6rem' }}
              />
            )}
          </Box>
        ))}
      </Box>
    </Box>
  )
}

export default LmsProgressBar