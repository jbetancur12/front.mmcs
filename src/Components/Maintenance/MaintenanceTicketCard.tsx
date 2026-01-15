import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Tooltip,
  Avatar,
  Button,
  Collapse
} from '@mui/material'
import {
  Visibility,
  Edit,
  Schedule,
  LocationOn,
  Build,
  ExpandMore,
  ExpandLess,
  Delete
} from '@mui/icons-material'
import { MaintenanceTicket } from '../../types/maintenance'
import MaintenanceStatusBadge from './MaintenanceStatusBadge'
import MaintenancePriorityBadge from './MaintenancePriorityBadge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import useRelativeTime from '../../hooks/useRelativeTime'

interface MaintenanceTicketCardProps {
  ticket: MaintenanceTicket
  onView?: (ticket: MaintenanceTicket) => void
  onEdit?: (ticket: MaintenanceTicket) => void
  onDelete?: (ticket: MaintenanceTicket) => void
  showActions?: boolean
  compact?: boolean
}

/**
 * MaintenanceTicketCard component displays a maintenance ticket in a card format
 *
 * @param ticket - The maintenance ticket data
 * @param onView - Callback when view button is clicked
 * @param onEdit - Callback when edit button is clicked
 * @param showActions - Whether to show action buttons
 * @param compact - Whether to use compact layout
 */
const MaintenanceTicketCard: React.FC<MaintenanceTicketCardProps> = ({
  ticket,
  onView,
  onEdit,
  onDelete,
  showActions = true,
  compact = false
}) => {
  const [expanded, setExpanded] = useState(false)

  // Relative time hooks
  const createdTime = useRelativeTime(ticket.createdAt)
  const scheduledTime = useRelativeTime(ticket.scheduledDate)

  const handleExpandClick = () => {
    setExpanded(!expanded)
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'No disponible'
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es })
    } catch {
      return 'Fecha inválida'
    }
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name || name.trim() === '') return '??'
    return (
      name
        .trim()
        .split(' ')
        .map((n) => n?.[0] || '')
        .join('')
        .toUpperCase()
        .slice(0, 2) || '??'
    )
  }

  const safeText = (
    text: string | null | undefined,
    fallback = 'No especificado'
  ) => {
    return text && text.trim() !== '' ? text.trim() : fallback
  }

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: { xs: 'auto', md: 320 },
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(109, 198, 98, 0.12)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: '#6dc662',
          opacity: 0.8
        },
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(109, 198, 98, 0.15)',
          border: '1px solid rgba(109, 198, 98, 0.2)',
          '&::before': {
            opacity: 1
          }
        }
      }}
      role='article'
      aria-label={`Ticket de mantenimiento ${safeText(ticket.ticketCode, 'sin código')}`}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1, p: { xs: 2, sm: 3 } }}>
        {/* Header with ticket number, priority and status - MINIMAL */}
        <Box
          display='flex'
          flexDirection={{ xs: 'column', sm: 'row' }}
          justifyContent='space-between'
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          mb={3}
          gap={{ xs: 2, sm: 0 }}
        >
          <Box display='flex' alignItems='center' gap={1.5}>
            <Box
              sx={{
                background: '#6dc662',
                borderRadius: '8px',
                p: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 36,
                minHeight: 36
              }}
            >
              <Build sx={{ color: 'white', fontSize: 18 }} />
            </Box>
            <Box>
              <Typography
                variant={compact ? 'h6' : 'h5'}
                component='h3'
                sx={{
                  fontSize: { xs: '1.2rem', sm: compact ? '1.3rem' : '1.4rem' },
                  fontWeight: 700,
                  color: '#6dc662',
                  mb: 0.2
                }}
              >
                #{safeText(ticket.ticketCode, 'SIN-CÓDIGO')}
              </Typography>
              <Typography
                variant='caption'
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.75rem',
                  fontWeight: 500
                }}
              >
                Ticket de Mantenimiento
              </Typography>
            </Box>
          </Box>
          <Box display='flex' alignItems='center' gap={1} flexWrap='wrap'>
            <MaintenancePriorityBadge priority={ticket.priority} size='small' />
            <MaintenanceStatusBadge status={ticket.status} />
          </Box>
        </Box>

        {/* ESSENTIAL FIELDS - Always visible */}

        {/* Customer name - MINIMAL */}
        <Box mb={2}>
          <Typography
            variant='subtitle2'
            color='text.secondary'
            gutterBottom
            sx={{
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              fontWeight: 600
            }}
          >
            Cliente
          </Typography>
          <Typography
            variant='body2'
            fontWeight='medium'
            sx={{
              fontSize: { xs: '0.875rem', sm: '0.875rem' },
              color: 'text.primary'
            }}
          >
            {safeText(ticket.customerName, 'Cliente no especificado')}
          </Typography>
        </Box>

        {/* Equipment info - MINIMAL */}
        <Box mb={2}>
          <Typography
            variant='subtitle2'
            color='text.secondary'
            gutterBottom
            sx={{
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              fontWeight: 600
            }}
          >
            Equipo
          </Typography>
          <Box display='flex' alignItems='center' gap={0.5}>
            <Build fontSize='small' color='action' aria-hidden='true' />
            <Typography
              variant='body2'
              sx={{
                fontSize: { xs: '0.875rem', sm: '0.875rem' },
                color: 'text.primary'
              }}
            >
              {safeText(ticket.equipmentType, 'Tipo no especificado')} -{' '}
              {safeText(ticket.equipmentBrand, 'Marca no especificada')}
            </Typography>
          </Box>
        </Box>

        {/* Issue description - MINIMAL */}
        <Box mb={2}>
          <Typography
            variant='subtitle2'
            color='text.secondary'
            gutterBottom
            sx={{
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              fontWeight: 600
            }}
          >
            Descripción
          </Typography>
          <Typography
            variant='body2'
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: { xs: '0.875rem', sm: '0.875rem' },
              color: 'text.primary',
              lineHeight: 1.4
            }}
          >
            {safeText(ticket.issueDescription, 'Sin descripción del problema')}
          </Typography>
        </Box>

        {/* Assigned technician - MINIMAL */}
        <Box mb={2}>
          <Typography
            variant='subtitle2'
            color='text.secondary'
            gutterBottom
            sx={{
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              fontWeight: 600
            }}
          >
            Técnico Asignado
          </Typography>
          {ticket.assignedTechnician && ticket.assignedTechnician.name ? (
            <Box display='flex' alignItems='center' gap={1}>
              <Avatar
                sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
                src={undefined}
                aria-hidden='true'
              >
                {getInitials(ticket.assignedTechnician.name)}
              </Avatar>
              <Typography
                variant='body2'
                sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}
              >
                {ticket.assignedTechnician.name}
              </Typography>
            </Box>
          ) : (
            <Typography
              variant='body2'
              color='text.secondary'
              fontStyle='italic'
              sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}
            >
              Sin asignar
            </Typography>
          )}
        </Box>

        {/* ADDITIONAL FIELDS - Collapsible section */}
        <Collapse in={expanded} timeout='auto' unmountOnExit>
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            {/* Customer contact details */}
            <Box mb={2}>
              <Typography
                variant='subtitle2'
                color='text.secondary'
                gutterBottom
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Contacto del Cliente
              </Typography>
              <Typography
                variant='caption'
                color='text.secondary'
                display='block'
                sx={{ fontSize: { xs: '0.75rem', sm: '0.75rem' } }}
              >
                {safeText(ticket.customerEmail, 'Sin email')}
              </Typography>
              {ticket.customerPhone && (
                <Typography
                  variant='caption'
                  color='text.secondary'
                  display='block'
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.75rem' } }}
                >
                  Tel: {safeText(ticket.customerPhone, 'Sin teléfono')}
                </Typography>
              )}
            </Box>

            {/* Equipment details */}
            <Box mb={2}>
              <Typography
                variant='subtitle2'
                color='text.secondary'
                gutterBottom
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Detalles del Equipo
              </Typography>
              <Typography
                variant='caption'
                color='text.secondary'
                display='block'
              >
                Modelo: {safeText(ticket.equipmentModel, 'No especificado')}
              </Typography>
              <Typography
                variant='caption'
                color='text.secondary'
                display='block'
              >
                S/N: {safeText(ticket.equipmentSerial, 'No especificado')}
              </Typography>
            </Box>

            {/* Location */}
            <Box mb={2}>
              <Typography
                variant='subtitle2'
                color='text.secondary'
                gutterBottom
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Ubicación
              </Typography>
              <Box display='flex' alignItems='center' gap={0.5}>
                <LocationOn
                  fontSize='small'
                  color='action'
                  aria-hidden='true'
                />
                <Typography variant='body2' color='text.secondary'>
                  {safeText(ticket.location, 'Ubicación no especificada')}
                </Typography>
              </Box>
            </Box>

            {/* Scheduled date */}
            {ticket.scheduledDate && (
              <Box mb={2}>
                <Typography
                  variant='subtitle2'
                  color='text.secondary'
                  gutterBottom
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  Fecha Programada
                </Typography>
                <Box display='flex' alignItems='center' gap={0.5}>
                  <Schedule
                    fontSize='small'
                    color='action'
                    aria-hidden='true'
                  />
                  <Tooltip
                    title={
                      scheduledTime.absoluteTime ||
                      formatDate(ticket.scheduledDate)
                    }
                  >
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      sx={{ cursor: 'help' }}
                    >
                      {scheduledTime.relativeTime ||
                        formatDate(ticket.scheduledDate)}
                    </Typography>
                  </Tooltip>
                </Box>
              </Box>
            )}

            {/* Created date */}
            <Box mb={2}>
              <Typography
                variant='subtitle2'
                color='text.secondary'
                gutterBottom
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Fecha de Creación
              </Typography>
              <Tooltip
                title={createdTime.absoluteTime || formatDate(ticket.createdAt)}
              >
                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={{ cursor: 'help' }}
                >
                  {createdTime.relativeTime || formatDate(ticket.createdAt)}
                </Typography>
              </Tooltip>
            </Box>

            {/* File count */}
            {ticket.files && ticket.files.length > 0 && (
              <Box>
                <Typography
                  variant='subtitle2'
                  color='text.secondary'
                  gutterBottom
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  Archivos Adjuntos
                </Typography>
                <Chip
                  size='small'
                  label={`${ticket.files.length} archivo${ticket.files.length > 1 ? 's' : ''}`}
                  variant='outlined'
                  color='info'
                />
              </Box>
            )}
          </Box>
        </Collapse>

        {/* Ver más / Ver menos button - COMPACT & RESPONSIVE */}
        <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'center' }}>
          <Button
            onClick={handleExpandClick}
            endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
            size='small'
            sx={{
              textTransform: 'none',
              fontSize: { xs: '0.75rem', sm: '0.8rem' },
              color: '#6dc662',
              borderRadius: '6px',
              fontWeight: 500,
              minHeight: { xs: 28, sm: 32 },
              px: { xs: 1.5, sm: 2 },
              py: { xs: 0.5, sm: 0.75 },
              transition: 'all 0.2s ease',
              '& .MuiButton-endIcon': {
                marginLeft: { xs: 0.5, sm: 1 },
                '& > svg': {
                  fontSize: { xs: '1rem', sm: '1.2rem' }
                }
              },
              '&:hover': {
                background: 'rgba(109, 198, 98, 0.08)',
                transform: 'translateY(-1px)'
              }
            }}
            aria-expanded={expanded}
            aria-label={expanded ? 'Ver menos detalles' : 'Ver más detalles'}
          >
            {expanded ? 'Ver menos' : 'Ver más'}
          </Button>
        </Box>
      </CardContent>

      {/* Actions - COMPACT & RESPONSIVE */}
      {showActions && (
        <CardActions
          sx={{
            justifyContent: 'flex-end',
            pt: 0,
            p: { xs: 0.75, sm: 1.5 },
            gap: { xs: 0.5, sm: 1 }
          }}
        >
          {onView && (
            <Tooltip title='Ver detalles'>
              <Button
                variant='text'
                size='small'
                onClick={() => onView(ticket)}
                startIcon={<Visibility />}
                aria-label={`Ver detalles del ticket ${safeText(ticket.ticketCode, 'sin código')}`}
                sx={{
                  color: '#6dc662',
                  borderRadius: '6px',
                  fontWeight: 500,
                  fontSize: { xs: '0.75rem', sm: '0.8rem' },
                  textTransform: 'none',
                  minHeight: { xs: 28, sm: 32 },
                  px: { xs: 1, sm: 1.5 },
                  py: { xs: 0.5, sm: 0.75 },
                  transition: 'all 0.2s ease',
                  '& .MuiButton-startIcon': {
                    marginRight: { xs: 0.5, sm: 0.75 },
                    '& > svg': {
                      fontSize: { xs: '0.9rem', sm: '1rem' }
                    }
                  },
                  '&:hover': {
                    background: 'rgba(109, 198, 98, 0.08)',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                <Box
                  component='span'
                  sx={{ display: { xs: 'none', sm: 'inline' } }}
                >
                  Ver
                </Box>
              </Button>
            </Tooltip>
          )}
          {onEdit && (
            <Tooltip title='Editar'>
              <Button
                variant='text'
                size='small'
                onClick={() => onEdit(ticket)}
                startIcon={<Edit />}
                aria-label={`Editar ticket ${safeText(ticket.ticketCode, 'sin código')}`}
                sx={{
                  color: '#ff9800',
                  borderRadius: '6px',
                  fontWeight: 500,
                  fontSize: { xs: '0.75rem', sm: '0.8rem' },
                  textTransform: 'none',
                  minHeight: { xs: 28, sm: 32 },
                  px: { xs: 1, sm: 1.5 },
                  py: { xs: 0.5, sm: 0.75 },
                  transition: 'all 0.2s ease',
                  '& .MuiButton-startIcon': {
                    marginRight: { xs: 0.5, sm: 0.75 },
                    '& > svg': {
                      fontSize: { xs: '0.9rem', sm: '1rem' }
                    }
                  },
                  '&:hover': {
                    background: 'rgba(255, 152, 0, 0.08)',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                <Box
                  component='span'
                  sx={{ display: { xs: 'none', sm: 'inline' } }}
                >
                  Editar
                </Box>
              </Button>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title='Eliminar'>
              <Button
                variant='text'
                size='small'
                onClick={() => onDelete(ticket)}
                startIcon={<Delete />}
                aria-label={`Eliminar ticket ${safeText(ticket.ticketCode, 'sin código')}`}
                sx={{
                  color: '#f44336',
                  borderRadius: '6px',
                  fontWeight: 500,
                  fontSize: { xs: '0.75rem', sm: '0.8rem' },
                  textTransform: 'none',
                  minHeight: { xs: 28, sm: 32 },
                  px: { xs: 1, sm: 1.5 },
                  py: { xs: 0.5, sm: 0.75 },
                  transition: 'all 0.2s ease',
                  '& .MuiButton-startIcon': {
                    marginRight: { xs: 0.5, sm: 0.75 },
                    '& > svg': {
                      fontSize: { xs: '0.9rem', sm: '1rem' }
                    }
                  },
                  '&:hover': {
                    background: 'rgba(244, 67, 54, 0.08)',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                <Box
                  component='span'
                  sx={{ display: { xs: 'none', sm: 'inline' } }}
                >
                  Eliminar
                </Box>
              </Button>
            </Tooltip>
          )}
        </CardActions>
      )}
    </Card>
  )
}

export default MaintenanceTicketCard
