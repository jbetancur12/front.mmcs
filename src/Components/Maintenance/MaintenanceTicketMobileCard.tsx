import React, { useState } from 'react'
import {
  Box,
  Chip,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography
} from '@mui/material'
import { Delete, Edit, MoreVert } from '@mui/icons-material'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { intent, neutral, withAlpha } from 'src/theme/designTokens'
import { MaintenanceTicket } from '../../types/maintenance'
import MaintenanceStatusBadge from './MaintenanceStatusBadge'
import MaintenancePriorityBadge from './MaintenancePriorityBadge'
import { getTicketPendings } from './ticketPendings'

interface MaintenanceTicketMobileCardProps {
  ticket: MaintenanceTicket
  onView: (ticket: MaintenanceTicket) => void
  onEdit?: (ticket: MaintenanceTicket) => void
  onDelete?: (ticket: MaintenanceTicket) => void
}

const MAX_PENDING_CHIPS = 2

const formatShortDate = (value?: string | null) => {
  if (!value) return ''
  try {
    return format(new Date(value), 'dd/MM/yyyy', { locale: es })
  } catch {
    return ''
  }
}

/**
 * Tarjeta compacta del panel en celular: tres líneas y toda la tarjeta abre el ticket.
 * Editar y eliminar quedan en el menú de tres puntos.
 */
const MaintenanceTicketMobileCard: React.FC<
  MaintenanceTicketMobileCardProps
> = ({ ticket, onView, onEdit, onDelete }) => {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const pendings = getTicketPendings(ticket)
  const equipment = [
    ticket.equipmentType,
    [ticket.equipmentBrand, ticket.equipmentModel].filter(Boolean).join(' ')
  ]
    .filter(Boolean)
    .join(' · ')
  const hasMenu = Boolean(onEdit || onDelete)

  const closeMenu = () => setMenuAnchor(null)

  return (
    <Box
      component='article'
      role='button'
      tabIndex={0}
      aria-label={`Abrir ticket ${ticket.ticketCode}`}
      onClick={() => onView(ticket)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onView(ticket)
        }
      }}
      sx={{
        p: 1.5,
        borderRadius: '12px',
        border: `1px solid ${neutral.border}`,
        bgcolor: neutral.surface,
        boxShadow: `0 1px 3px ${withAlpha(neutral.text, 0.06)}`,
        cursor: 'pointer',
        '&:active': { bgcolor: neutral.surfaceAlt }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant='subtitle2' sx={{ fontWeight: 700 }} noWrap>
            {ticket.ticketCode}
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            {formatShortDate(ticket.createdAt)}
          </Typography>
        </Box>
        {hasMenu && (
          <IconButton
            size='small'
            aria-label={`Más acciones del ticket ${ticket.ticketCode}`}
            aria-haspopup='menu'
            onClick={(e) => {
              e.stopPropagation()
              setMenuAnchor(e.currentTarget)
            }}
            sx={{ mr: -0.5 }}
          >
            <MoreVert fontSize='small' />
          </IconButton>
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.75 }}>
        <MaintenancePriorityBadge priority={ticket.priority} size='small' />
        <MaintenanceStatusBadge status={ticket.status} />
      </Box>

      <Typography variant='body2' sx={{ fontWeight: 600, mt: 0.75 }} noWrap>
        {ticket.customerName}
      </Typography>
      <Typography variant='caption' color='text.secondary' noWrap component='p'>
        {equipment || 'Equipo sin especificar'}
      </Typography>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 0.5,
          mt: 0.75
        }}
      >
        <Typography variant='caption' color='text.secondary'>
          {ticket.assignedTechnician?.name || 'Sin técnico'}
        </Typography>
        {pendings.slice(0, MAX_PENDING_CHIPS).map((pending) => (
          <Chip
            key={pending}
            size='small'
            label={pending}
            sx={{
              height: 20,
              backgroundColor: intent.warningSoft,
              color: intent.warningInk,
              fontWeight: 600,
              fontSize: '0.7rem'
            }}
          />
        ))}
        {pendings.length > MAX_PENDING_CHIPS && (
          <Typography variant='caption' color='text.secondary'>
            +{pendings.length - MAX_PENDING_CHIPS}
          </Typography>
        )}
      </Box>

      {hasMenu && (
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={closeMenu}
          onClick={(e) => e.stopPropagation()}
        >
          {onEdit && (
            <MenuItem
              onClick={() => {
                closeMenu()
                onEdit(ticket)
              }}
            >
              <ListItemIcon>
                <Edit fontSize='small' sx={{ color: intent.action }} />
              </ListItemIcon>
              <ListItemText>Editar</ListItemText>
            </MenuItem>
          )}
          {onDelete && (
            <MenuItem
              onClick={() => {
                closeMenu()
                onDelete(ticket)
              }}
            >
              <ListItemIcon>
                <Delete fontSize='small' sx={{ color: intent.danger }} />
              </ListItemIcon>
              <ListItemText>Eliminar</ListItemText>
            </MenuItem>
          )}
        </Menu>
      )}
    </Box>
  )
}

export default MaintenanceTicketMobileCard
