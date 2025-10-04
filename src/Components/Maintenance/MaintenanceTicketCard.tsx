import React from 'react'
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Avatar
} from '@mui/material'
import {
  Visibility,
  Edit,
  Schedule,
  LocationOn,
  Build
} from '@mui/icons-material'
import { MaintenanceTicket } from '../../types/maintenance'
import MaintenanceStatusBadge from './MaintenanceStatusBadge'
import MaintenancePriorityBadge from './MaintenancePriorityBadge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface MaintenanceTicketCardProps {
  ticket: MaintenanceTicket
  onView?: (ticket: MaintenanceTicket) => void
  onEdit?: (ticket: MaintenanceTicket) => void
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
  showActions = true,
  compact = false
}) => {
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
        transition: 'all 0.2s',
        minHeight: { xs: 'auto', md: 300 },
        '&:hover': {
          elevation: 4,
          transform: 'translateY(-2px)'
        }
      }}
      role='article'
      aria-label={`Ticket de mantenimiento ${safeText(ticket.ticketCode, 'sin código')}`}
    >
      <CardContent sx={{ flexGrow: 1, pb: compact ? 1 : 2, p: { xs: 2, sm: 3 } }}>
        {/* Header with ticket number and priority */}
        <Box
          display='flex'
          flexDirection={{ xs: 'column', sm: 'row' }}
          justifyContent='space-between'
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          mb={1}
          gap={{ xs: 0.5, sm: 0 }}
        >
          <Typography
            variant={compact ? 'subtitle1' : 'h6'}
            component='h3'
            fontWeight='bold'
            color='primary'
            sx={{
              fontSize: { xs: '1rem', sm: compact ? '1.1rem' : '1.25rem' },
              letterSpacing: '0.5px'
            }}
          >
            #{safeText(ticket.ticketCode, 'SIN-CÓDIGO')}
          </Typography>
          <MaintenancePriorityBadge priority={ticket.priority} size='small' />
        </Box>

        {/* Status */}
        <Box mb={2}>
          <MaintenanceStatusBadge status={ticket.status} />
        </Box>

        {/* Customer info */}
        <Box mb={2}>
          <Typography
            variant='subtitle2'
            color='text.secondary'
            gutterBottom
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            Cliente
          </Typography>
          <Typography
            variant='body2'
            fontWeight='medium'
            sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}
          >
            {safeText(ticket.customerName, 'Cliente no especificado')}
          </Typography>
          {!compact && (
            <Typography
              variant='caption'
              color='text.secondary'
              sx={{ fontSize: { xs: '0.75rem', sm: '0.75rem' } }}
            >
              {safeText(ticket.customerEmail, 'Sin email')}
            </Typography>
          )}
          {!compact && ticket.customerPhone && (
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

        {/* Equipment info */}
        <Box mb={2}>
          <Typography variant='subtitle2' color='text.secondary' gutterBottom>
            Equipo
          </Typography>
          <Box display='flex' alignItems='center' gap={0.5} mb={0.5}>
            <Build fontSize='small' color='action' aria-hidden='true' />
            <Typography variant='body2'>
              {safeText(ticket.equipmentType, 'Tipo no especificado')} -{' '}
              {safeText(ticket.equipmentBrand, 'Marca no especificada')}
            </Typography>
          </Box>
          {!compact && (
            <Typography variant='caption' color='text.secondary'>
              Modelo: {safeText(ticket.equipmentModel, 'No especificado')} |
              S/N: {safeText(ticket.equipmentSerial, 'No especificado')}
            </Typography>
          )}
        </Box>

        {/* Issue description */}
        <Box mb={2}>
          <Typography variant='subtitle2' color='text.secondary' gutterBottom>
            Descripción
          </Typography>
          <Typography
            variant='body2'
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: compact ? 2 : 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {safeText(ticket.issueDescription, 'Sin descripción del problema')}
          </Typography>
        </Box>

        {/* Location */}
        <Box display='flex' alignItems='center' gap={0.5} mb={2}>
          <LocationOn fontSize='small' color='action' aria-hidden='true' />
          <Typography variant='body2' color='text.secondary'>
            {safeText(ticket.location, 'Ubicación no especificada')}
          </Typography>
        </Box>

        {/* Assigned technician */}
        <Box mb={2}>
          <Typography variant='subtitle2' color='text.secondary' gutterBottom>
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
              <Typography variant='body2'>
                {ticket.assignedTechnician.name}
              </Typography>
            </Box>
          ) : (
            <Typography
              variant='body2'
              color='text.secondary'
              fontStyle='italic'
            >
              Sin asignar
            </Typography>
          )}
        </Box>

        {/* Scheduled date */}
        {ticket.scheduledDate && (
          <Box display='flex' alignItems='center' gap={0.5} mb={1}>
            <Schedule fontSize='small' color='action' aria-hidden='true' />
            <Typography variant='caption' color='text.secondary'>
              Programado: {formatDate(ticket.scheduledDate)}
            </Typography>
          </Box>
        )}

        {/* Created date */}
        <Typography variant='caption' color='text.secondary'>
          Creado: {formatDate(ticket.createdAt)}
        </Typography>

        {/* File count */}
        {ticket.files && ticket.files.length > 0 && (
          <Box mt={1}>
            <Chip
              size='small'
              label={`${ticket.files.length} archivo${ticket.files.length > 1 ? 's' : ''}`}
              variant='outlined'
              color='info'
            />
          </Box>
        )}
      </CardContent>

      {/* Actions */}
      {showActions && (
        <CardActions sx={{ justifyContent: 'flex-end', pt: 0, p: { xs: 1, sm: 2 } }}>
          {onView && (
            <Tooltip title='Ver detalles'>
              <IconButton
                size='medium'
                onClick={() => onView(ticket)}
                color='primary'
                aria-label={`Ver detalles del ticket ${safeText(ticket.ticketCode, 'sin código')}`}
                sx={{
                  minWidth: 44,
                  minHeight: 44
                }}
              >
                <Visibility />
              </IconButton>
            </Tooltip>
          )}
          {onEdit && (
            <Tooltip title='Editar'>
              <IconButton
                size='medium'
                onClick={() => onEdit(ticket)}
                color='secondary'
                aria-label={`Editar ticket ${safeText(ticket.ticketCode, 'sin código')}`}
                sx={{
                  minWidth: 44,
                  minHeight: 44
                }}
              >
                <Edit />
              </IconButton>
            </Tooltip>
          )}
        </CardActions>
      )}
    </Card>
  )
}

export default MaintenanceTicketCard
