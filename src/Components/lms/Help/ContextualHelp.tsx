import React, { useState, ReactNode } from 'react'
import {
  Tooltip,
  IconButton,
  Popover,
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Fade,
  ClickAwayListener
} from '@mui/material'
import {
  Help as HelpIcon,
  Info as InfoIcon,
  TrendingUp as TrendIcon,
  Assessment as MetricIcon,
  Timeline as ChartIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
  OpenInNew as ExternalIcon
} from '@mui/icons-material'

interface HelpTooltipProps {
  title: string
  content: string | ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
  size?: 'small' | 'medium' | 'large'
  children: ReactNode
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  title,
  content,
  placement = 'top',
  size = 'medium',
  children
}) => {
  return (
    <Tooltip
      title={
        <Box sx={{ p: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="body2">
            {content}
          </Typography>
        </Box>
      }
      placement={placement}
      arrow
      enterDelay={500}
      leaveDelay={200}
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: 'rgba(0,0,0,0.9)',
            backdropFilter: 'blur(8px)',
            borderRadius: '8px',
            maxWidth: size === 'small' ? 200 : size === 'large' ? 400 : 300,
            fontSize: '0.875rem'
          }
        },
        arrow: {
          sx: {
            color: 'rgba(0,0,0,0.9)'
          }
        }
      }}
    >
      {children}
    </Tooltip>
  )
}

interface MetricHelpProps {
  metric: string
  value: string | number
  description: string
  calculation?: string
  interpretation?: {
    good: string
    warning: string
    critical: string
  }
  relatedMetrics?: string[]
  size?: 'small' | 'medium'
}

export const MetricHelp: React.FC<MetricHelpProps> = ({
  metric,
  value,
  description,
  calculation,
  interpretation,
  relatedMetrics,
  size = 'medium'
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)

  return (
    <>
      <IconButton
        size={size}
        onClick={handleClick}
        sx={{
          color: '#6b7280',
          '&:hover': {
            color: '#3b82f6',
            bgcolor: 'rgba(59, 130, 246, 0.1)'
          }
        }}
      >
        <InfoIcon fontSize={size} />
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center'
        }}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: '1px solid rgba(0,0,0,0.1)',
            maxWidth: 350
          }
        }}
      >
        <Card elevation={0}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1f2937' }}>
                  {metric}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#3b82f6', mt: 0.5 }}>
                  {value}
                </Typography>
              </Box>
              <IconButton size="small" onClick={handleClose}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            <Typography variant="body2" sx={{ color: '#6b7280', mb: 2 }}>
              {description}
            </Typography>

            {calculation && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#374151' }}>
                    Cálculo
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    fontFamily: 'monospace', 
                    bgcolor: '#f9fafb', 
                    p: 1, 
                    borderRadius: 1,
                    fontSize: '0.8rem'
                  }}>
                    {calculation}
                  </Typography>
                </Box>
              </>
            )}

            {interpretation && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#374151' }}>
                    Interpretación
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckIcon sx={{ color: '#10b981', fontSize: 16, mr: 1 }} />
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        <strong>Bueno:</strong> {interpretation.good}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <WarningIcon sx={{ color: '#f59e0b', fontSize: 16, mr: 1 }} />
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        <strong>Atención:</strong> {interpretation.warning}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <WarningIcon sx={{ color: '#ef4444', fontSize: 16, mr: 1 }} />
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        <strong>Crítico:</strong> {interpretation.critical}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </>
            )}

            {relatedMetrics && relatedMetrics.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#374151' }}>
                    Métricas Relacionadas
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {relatedMetrics.map((related, index) => (
                      <Chip
                        key={index}
                        label={related}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontSize: '0.7rem',
                          height: 24,
                          borderColor: '#d1d5db',
                          color: '#6b7280'
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Popover>
    </>
  )
}

interface FeatureGuideProps {
  title: string
  steps: {
    title: string
    description: string
    icon?: ReactNode
  }[]
  onComplete?: () => void
  showOnMount?: boolean
}

export const FeatureGuide: React.FC<FeatureGuideProps> = ({
  title,
  steps,
  onComplete,
  showOnMount = false
}) => {
  const [open, setOpen] = useState(showOnMount)
  const [currentStep, setCurrentStep] = useState(0)

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleComplete = () => {
    setOpen(false)
    setCurrentStep(0)
    if (onComplete) {
      onComplete()
    }
  }

  if (!open) {
    return (
      <Button
        startIcon={<HelpIcon />}
        variant="outlined"
        size="small"
        onClick={() => setOpen(true)}
        sx={{
          borderColor: '#d1d5db',
          color: '#6b7280',
          textTransform: 'none',
          '&:hover': {
            borderColor: '#3b82f6',
            color: '#3b82f6'
          }
        }}
      >
        Guía de Uso
      </Button>
    )
  }

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Card
        sx={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          maxWidth: 400,
          width: '90vw',
          borderRadius: '16px',
          boxShadow: '0 20px 64px rgba(0,0,0,0.2)'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
            <IconButton size="small" onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {steps[currentStep].icon && (
                <Box sx={{ mr: 2, color: '#3b82f6' }}>
                  {steps[currentStep].icon}
                </Box>
              )}
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {steps[currentStep].title}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#6b7280', lineHeight: 1.6 }}>
              {steps[currentStep].description}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {steps.map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: index === currentStep ? '#3b82f6' : '#d1d5db',
                    transition: 'background-color 0.2s'
                  }}
                />
              ))}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              sx={{ textTransform: 'none' }}
            >
              Anterior
            </Button>
            <Typography variant="body2" sx={{ 
              alignSelf: 'center', 
              color: '#6b7280',
              fontSize: '0.8rem'
            }}>
              {currentStep + 1} de {steps.length}
            </Typography>
            <Button
              variant="contained"
              onClick={handleNext}
              sx={{ 
                textTransform: 'none',
                bgcolor: '#3b82f6',
                '&:hover': { bgcolor: '#2563eb' }
              }}
            >
              {currentStep === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </ClickAwayListener>
  )
}

// Predefined help content for common LMS metrics
export const LMSMetricHelp = {
  completionRate: {
    metric: 'Tasa de Finalización',
    description: 'Porcentaje de usuarios que han completado exitosamente los cursos asignados',
    calculation: '(Usuarios que completaron / Total usuarios asignados) × 100',
    interpretation: {
      good: 'Mayor al 80% indica alta efectividad del programa',
      warning: 'Entre 60-80% requiere revisión del contenido',
      critical: 'Menor al 60% indica problemas serios en el programa'
    },
    relatedMetrics: ['Tiempo Promedio', 'Tasa de Abandono', 'Satisfacción']
  },

  averageScore: {
    metric: 'Puntuación Promedio',
    description: 'Calificación promedio obtenida por los usuarios en evaluaciones',
    calculation: 'Suma de todas las calificaciones / Número total de evaluaciones',
    interpretation: {
      good: 'Mayor a 85% indica buen dominio del contenido',
      warning: 'Entre 70-85% sugiere necesidad de refuerzo',
      critical: 'Menor a 70% requiere revisión urgente del material'
    },
    relatedMetrics: ['Tasa de Aprobación', 'Intentos Promedio', 'Tiempo de Estudio']
  },

  engagementRate: {
    metric: 'Tasa de Participación',
    description: 'Nivel de interacción activa de los usuarios con el contenido del curso',
    calculation: '(Sesiones activas / Total sesiones iniciadas) × 100',
    interpretation: {
      good: 'Mayor al 75% indica alto compromiso',
      warning: 'Entre 50-75% sugiere contenido poco atractivo',
      critical: 'Menor al 50% indica problemas de motivación'
    },
    relatedMetrics: ['Tiempo en Plataforma', 'Recursos Accedidos', 'Interacciones']
  }
}

export default {
  HelpTooltip,
  MetricHelp,
  FeatureGuide,
  LMSMetricHelp
}