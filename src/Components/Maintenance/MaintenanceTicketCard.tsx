import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  IconButton,
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
  ExpandLess
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
  const [expanded, setExpanded] = useState(false)

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
      <CardContent sx={{ flexGrow: 1, pb: 1, p: { xs: 2, sm: 3 } }}>
        {/* Header with ticket number, priority and status */}
        <Box
          display='flex'
          flexDirection={{ xs: 'column', sm: 'row' }}
          justifyContent='space-between'
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          mb={2}
          gap={{ xs: 1, sm: 0 }}
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
          <Box display='flex' alignItems='center' gap={1}>
            <MaintenancePriorityBadge priority={ticket.priority} size='small' />
            <MaintenanceStatusBadge status={ticket.status} />
          </Box>
        </Box>

        {/* ESSENTIAL FIELDS - Always visible */}

        {/* Customer name */}
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
        </Box>

        {/* Equipment info - Condensed */}
        <Box mb={2}>
          <Typography
            variant='subtitle2'
            color='text.secondary'
            gutterBottom
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            Equipo
          </Typography>
          <Box display='flex' alignItems='center' gap={0.5}>
            <Build fontSize='small' color='action' aria-hidden='true' />
            <Typography variant='body2' sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
              {safeText(ticket.equipmentType, 'Tipo no especificado')} -{' '}
              {safeText(ticket.equipmentBrand, 'Marca no especificada')}
            </Typography>
          </Box>
        </Box>

        {/* Issue description - Truncated */}
        <Box mb={2}>
          <Typography
            variant='subtitle2'
            color='text.secondary'
            gutterBottom
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
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
              fontSize: { xs: '0.875rem', sm: '0.875rem' }
            }}
          >
            {safeText(ticket.issueDescription, 'Sin descripción del problema')}
          </Typography>
        </Box>

        {/* Assigned technician */}
        <Box mb={2}>
          <Typography
            variant='subtitle2'
            color='text.secondary'
            gutterBottom
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
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
              <Typography variant='body2' sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
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
        <Collapse in={expanded} timeout="auto" unmountOnExit>
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
              <Typography variant='caption' color='text.secondary' display='block'>
                Modelo: {safeText(ticket.equipmentModel, 'No especificado')}
              </Typography>
              <Typography variant='caption' color='text.secondary' display='block'>
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
                <LocationOn fontSize='small' color='action' aria-hidden='true' />
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
                  <Schedule fontSize='small' color='action' aria-hidden='true' />
                  <Typography variant='caption' color='text.secondary'>
                    {formatDate(ticket.scheduledDate)}
                  </Typography>
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
              <Typography variant='caption' color='text.secondary'>
                {formatDate(ticket.createdAt)}
              </Typography>
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

        {/* Ver más / Ver menos button */}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Button
            onClick={handleExpandClick}
            endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
            size="small"
            sx={{
              textTransform: 'none',
              fontSize: { xs: '0.875rem', sm: '0.875rem' }
            }}
            aria-expanded={expanded}
            aria-label={expanded ? 'Ver menos detalles' : 'Ver más detalles'}
          >
            {expanded ? 'Ver menos' : 'Ver más'}
          </Button>
        </Box>
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
