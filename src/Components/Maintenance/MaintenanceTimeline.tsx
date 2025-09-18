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
      <Card>
        <CardContent>
          <Typography variant='body2' color='text.secondary' textAlign='center'>
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
                color={
                  config.color === 'default' ? 'grey' : (config.color as any)
                }
                variant='outlined'
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
                    color={config.color}
                    variant='outlined'
                  />

                  {entry.performedBy && (
                    <Box display='flex' alignItems='center' gap={0.5}>
                      <Avatar
                        sx={{
                          width: 20,
                          height: 20,
                          fontSize: '0.65rem'
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
