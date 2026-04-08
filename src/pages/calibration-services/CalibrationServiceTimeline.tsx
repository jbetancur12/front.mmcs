import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator
} from '@mui/lab'
import {
  AttachFileOutlined,
  CheckCircleOutlineOutlined,
  DescriptionOutlined,
  EditOutlined,
  HighlightOffOutlined,
  PlaylistAddCheckOutlined,
  PostAddOutlined,
  SendOutlined
} from '@mui/icons-material'
import { Box, Chip, Stack, Typography } from '@mui/material'
import {
  CALIBRATION_SERVICE_APPROVAL_LABELS,
  CALIBRATION_SERVICE_EVENT_COLORS,
  CALIBRATION_SERVICE_EVENT_LABELS,
  CALIBRATION_SERVICE_STATUS_LABELS
} from '../../constants/calibrationServices'
import {
  CalibrationServiceApprovalStatus,
  CalibrationServiceEvent,
  CalibrationServiceEventType,
  CalibrationServiceStatus
} from '../../types/calibrationService'

interface CalibrationServiceTimelineProps {
  events: CalibrationServiceEvent[]
}

const EVENT_ICON_MAP: Record<CalibrationServiceEventType, JSX.Element> = {
  service_created: <PostAddOutlined fontSize='small' />,
  service_updated: <EditOutlined fontSize='small' />,
  approval_requested: <SendOutlined fontSize='small' />,
  service_approved: <CheckCircleOutlineOutlined fontSize='small' />,
  service_rejected: <HighlightOffOutlined fontSize='small' />,
  ods_issued: <DescriptionOutlined fontSize='small' />,
  document_uploaded: <AttachFileOutlined fontSize='small' />
}

const getDotPalette = (
  color: 'primary' | 'success' | 'error' | 'warning' | 'info' | 'secondary'
) => {
  switch (color) {
    case 'primary':
      return { bg: '#eef2ff', fg: '#4f46e5' }
    case 'success':
      return { bg: '#ecfdf5', fg: '#059669' }
    case 'error':
      return { bg: '#fef2f2', fg: '#dc2626' }
    case 'warning':
      return { bg: '#fffbeb', fg: '#d97706' }
    case 'info':
      return { bg: '#eff6ff', fg: '#2563eb' }
    default:
      return { bg: '#f5f3ff', fg: '#7c3aed' }
  }
}

const formatDateTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Sin fecha'

const formatActorType = (type?: string) => {
  switch (type) {
    case 'system':
      return 'Sistema'
    case 'customer':
      return 'Cliente'
    default:
      return 'Usuario'
  }
}

const formatStateValue = (value?: string | null) => {
  if (!value) {
    return 'Sin dato'
  }

  if (value in CALIBRATION_SERVICE_STATUS_LABELS) {
    return CALIBRATION_SERVICE_STATUS_LABELS[value as CalibrationServiceStatus]
  }

  if (value in CALIBRATION_SERVICE_APPROVAL_LABELS) {
    return CALIBRATION_SERVICE_APPROVAL_LABELS[value as CalibrationServiceApprovalStatus]
  }

  return value
}

const CalibrationServiceTimeline = ({
  events
}: CalibrationServiceTimelineProps) => {
  if (!events.length) {
    return (
      <Typography variant='body2' color='text.secondary'>
        El servicio todavía no tiene eventos visibles.
      </Typography>
    )
  }

  const orderedEvents = [...events].sort(
    (left, right) =>
      new Date(left.occurredAt).getTime() - new Date(right.occurredAt).getTime()
  )

  return (
    <Timeline
      sx={{
        p: 0,
        '& .MuiTimelineItem-root': {
          minHeight: 84,
          '&:before': {
            display: 'none'
          }
        },
        '& .MuiTimelineConnector-root': {
          backgroundColor: '#cbd5e1',
          width: '3px'
        }
      }}
    >
      {orderedEvents.map((event, index) => {
        const eventColor = CALIBRATION_SERVICE_EVENT_COLORS[event.eventType]
        const dotPalette = getDotPalette(eventColor)
        const isLast = index === orderedEvents.length - 1

        return (
          <TimelineItem key={event.id}>
            <TimelineOppositeContent
              sx={{
                m: 'auto 0',
                flex: 0.34,
                px: 1
              }}
            >
              <Typography variant='caption' color='text.secondary' fontWeight={600}>
                {formatDateTime(event.occurredAt)}
              </Typography>
            </TimelineOppositeContent>

            <TimelineSeparator>
              <TimelineDot
                sx={{
                  backgroundColor: dotPalette.bg,
                  color: dotPalette.fg,
                  border: 'none',
                  boxShadow: 'none',
                  width: 38,
                  height: 38
                }}
              >
                {EVENT_ICON_MAP[event.eventType] || (
                  <PlaylistAddCheckOutlined fontSize='small' />
                )}
              </TimelineDot>
              {!isLast ? <TimelineConnector /> : null}
            </TimelineSeparator>

            <TimelineContent sx={{ py: 1.25, px: 2 }}>
              <Stack spacing={1}>
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={1}
                  alignItems={{ xs: 'flex-start', md: 'center' }}
                >
                  <Chip
                    size='small'
                    color={eventColor}
                    label={CALIBRATION_SERVICE_EVENT_LABELS[event.eventType]}
                  />
                  <Typography variant='caption' color='text.secondary'>
                    {formatActorType(event.performedByType)} · {event.performedByName}
                  </Typography>
                </Stack>

                <Typography variant='body2' fontWeight={600}>
                  {event.description}
                </Typography>

                {event.oldValue || event.newValue ? (
                  <Box>
                    <Typography variant='caption' color='text.secondary'>
                      {`Antes: ${formatStateValue(event.oldValue)}`}
                      {' · '}
                      {`Después: ${formatStateValue(event.newValue)}`}
                    </Typography>
                  </Box>
                ) : null}
              </Stack>
            </TimelineContent>
          </TimelineItem>
        )
      })}
    </Timeline>
  )
}

export default CalibrationServiceTimeline
