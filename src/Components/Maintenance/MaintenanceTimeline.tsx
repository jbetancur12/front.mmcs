import React from 'react'
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab'
import { Typography, Box, Card, CardContent, Chip, Avatar } from '@mui/material'
import {
  Add,
  Assignment,
  Build,
  Comment,
  AttachFile,
  Schedule,
  CheckCircle,
  Cancel,
  PriorityHigh,
  AttachMoney
} from '@mui/icons-material'
import {
  MaintenanceTimelineEntry,
  MaintenanceAction
} from '../../types/maintenance'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface MaintenanceTimelineProps {
  timeline: MaintenanceTimelineEntry[]
  compact?: boolean
}

/**
 * MaintenanceTimeline component displays the chronological history of a maintenance ticket
 *
 * @param timeline - Array of timeline entries
 * @param compact - Whether to use compact layout
 */
const MaintenanceTimeline: React.FC<MaintenanceTimelineProps> = ({
  timeline,
  compact = false
}) => {
  const getActionConfig = (action: MaintenanceAction) => {
    switch (action) {
      case MaintenanceAction.CREATED:
        return {
          icon: <Add />,
          color: 'primary' as const,
          label: 'Creado'
        }
      case MaintenanceAction.ASSIGNED:
        return {
          icon: <Assignment />,
          color: 'primary' as const,
          label: 'Asignado'
        }
      case MaintenanceAction.STATUS_CHANGED:
        return {
          icon: <Build />,
          color: 'primary' as const,
          label: 'Estado Cambiado'
        }
      case MaintenanceAction.PRIORITY_CHANGED:
        return {
          icon: <PriorityHigh />,
          color: 'error' as const,
          label: 'Prioridad Cambiada'
        }
      case MaintenanceAction.COMMENT_ADDED:
        return {
          icon: <Comment />,
          color: 'secondary' as const,
          label: 'Comentario Agregado'
        }
      case MaintenanceAction.FILE_UPLOADED:
        return {
          icon: <AttachFile />,
          color: 'success' as const,
          label: 'Archivo Subido'
        }
      case MaintenanceAction.SCHEDULED:
        return {
          icon: <Schedule />,
          color: 'primary' as const,
          label: 'Programado'
        }
      case MaintenanceAction.COMPLETED:
        return {
          icon: <CheckCircle />,
          color: 'success' as const,
          label: 'Completado'
        }
      case MaintenanceAction.CANCELLED:
        return {
          icon: <Cancel />,
          color: 'error' as const,
          label: 'Cancelado'
        }
      case MaintenanceAction.COST_UPDATED:
        return {
          icon: <AttachMoney />,
          color: 'primary' as const,
          label: 'Costo Actualizado'
        }
      default:
        return {
          icon: <Build />,
          color: 'default' as const,
          label: 'Acción'
        }
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(
        new Date(dateString),
        compact ? 'dd/MM HH:mm' : 'dd/MM/yyyy HH:mm',
        { locale: es }
      )
    } catch {
      return 'Fecha inválida'
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const sortedTimeline = [...timeline].sort(
    (a, b) =>
      new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
  )

  if (timeline.length === 0) {
    return (
      <Card
        sx={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(109, 198, 98, 0.1)'
        }}
      >
        <CardContent>
          <Typography 
            variant='body2' 
            color='text.secondary' 
            textAlign='center'
            sx={{ fontWeight: 500 }}
          >
            No hay eventos en el historial
          </Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Timeline
      sx={{
        p: 0,
        '& .MuiTimelineItem-root': {
          minHeight: compact ? 60 : 80,
          '&:before': {
            display: 'none'
          }
        },
        '& .MuiTimelineConnector-root': {
          background: 'linear-gradient(135deg, #6dc662 0%, #5ab052 100%)',
          width: '3px'
        }
      }}
    >
      {sortedTimeline.map((entry, index) => {
        const config = getActionConfig(entry.action)
        const isLast = index === sortedTimeline.length - 1

        return (
          <TimelineItem key={entry.id}>
            <TimelineOppositeContent
              sx={{
                m: 'auto 0',
                flex: compact ? 0.3 : 0.4,
                px: 1
              }}
            >
              <Typography
                variant={compact ? 'caption' : 'body2'}
                color='text.secondary'
                fontWeight='medium'
              >
                {formatDate(entry.performedAt)}
              </Typography>
            </TimelineOppositeContent>

            <TimelineSeparator>
              <TimelineDot
                sx={{
                  background: config.color === 'primary' 
                    ? 'linear-gradient(135deg, #6dc662 0%, #5ab052 100%)'
                    : config.color === 'success'
                    ? 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)'
                    : config.color === 'error'
                    ? 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)'
                    : config.color === 'secondary'
                    ? 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)'
                    : 'linear-gradient(135deg, #9e9e9e 0%, #757575 100%)',
                  color: 'white',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  width: 40,
                  height: 40
                }}
              >
                {config.icon}
              </TimelineDot>
              {!isLast && <TimelineConnector />}
            </TimelineSeparator>

            <TimelineContent sx={{ py: compact ? 1 : 2, px: 2 }}>
              <Box>
                <Box display='flex' alignItems='center' gap={1} mb={0.5}>
                  <Chip
                    size='small'
                    label={config.label}
                    sx={{
                      background: config.color === 'primary' 
                        ? 'linear-gradient(135deg, #6dc662 0%, #5ab052 100%)'
                        : config.color === 'success'
                        ? 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)'
                        : config.color === 'error'
                        ? 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)'
                        : config.color === 'secondary'
                        ? 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)'
                        : 'linear-gradient(135deg, #9e9e9e 0%, #757575 100%)',
                      color: 'white',
                      borderRadius: '6px',
                      fontWeight: 500,
                      border: 'none'
                    }}
                  />

                  {entry.performedBy && (
                    <Box display='flex' alignItems='center' gap={0.5}>
                      <Avatar
                        sx={{
                          width: 20,
                          height: 20,
                          fontSize: '0.65rem',
                          background: 'linear-gradient(135deg, #6dc662 0%, #5ab052 100%)',
                          color: 'white'
                        }}
                      >
                        {getInitials(entry.performedBy)}
                      </Avatar>
                      <Typography variant='caption' color='text.secondary'>
                        {entry.performedBy}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Typography variant={compact ? 'body2' : 'body1'}>
                  {entry.description}
                </Typography>

                {/* Metadata display */}
                {/* {entry.metadata &&
                      Object.keys(entry.metadata).length > 0 && (
                        <Box mt={1}>
                          {Object.entries(entry.metadata).map(
                            ([key, value]) => (
                              <Typography
                                key={key}
                                variant='caption'
                                color='text.secondary'
                                display='block'
                              >
                                {key}: {String(value)}
                              </Typography>
                            )
                          )}
                        </Box>
                      )} */}
              </Box>
            </TimelineContent>
          </TimelineItem>
        )
      })}
    </Timeline>
  )
}

export default MaintenanceTimeline
