import React from 'react'
import { Box, Card, CardContent, Grid, Typography, Chip } from '@mui/material'
import { Warning, AccessTime } from '@mui/icons-material'
import { CriticalTicketsSectionProps } from '../types'
import { useModernStyles } from '../hooks/useModernStyles'
import MaintenancePriorityBadge from '../../MaintenancePriorityBadge'
import MaintenanceStatusBadge from '../../MaintenanceStatusBadge'

const CriticalTicketsSection: React.FC<CriticalTicketsSectionProps> = ({
  urgentTickets,
  colors,
  getElapsedTime,
  totalUrgentTickets = 0,
  currentPage = 1,
  totalPages = 1
}) => {
  const { } = useModernStyles()

  if (!urgentTickets || urgentTickets.length === 0) {
    return null
  }

  return (
    <Box sx={{ mb: 4 }}>
      {/* Critical Section Header - Compacto */}
      <Card
        sx={{
          backgroundColor: 'rgba(220, 53, 69, 0.02)',
          border: `2px solid ${colors.danger}`,
          borderRadius: '12px',
          p: 2, // Padding reducido
          mb: 1 // Margen reducido
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Warning sx={{ fontSize: '1.5rem', color: colors.danger }} />
          <Typography
            variant='h6'
            sx={{
              color: colors.danger,
              fontWeight: 800,
              fontSize: '1.2rem'
            }}
          >
            TICKETS CRÍTICOS - ATENCIÓN INMEDIATA
          </Typography>
          <Box sx={{ ml: 'auto', display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip
              label={`${totalUrgentTickets} total`}
              color="error"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
            {totalPages > 1 && (
              <Chip
                label={`Página ${currentPage} de ${totalPages}`}
                color="error"
                sx={{ 
                  fontWeight: 600,
                  backgroundColor: 'rgba(220, 53, 69, 0.1)'
                }}
              />
            )}
          </Box>
        </Box>
      </Card>

      {/* Critical Tickets Grid - Spacing reducido */}
      <Grid container spacing={1.5}>
        {urgentTickets.map((ticket) => (
          <Grid item xs={6} key={ticket.id}>
            <Card
              sx={{
                background: '#ffebee', // Fondo mejorado que te gustó
                border: `2px solid ${colors.danger}`,
                borderLeft: `6px solid ${colors.danger}`,
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(220, 53, 69, 0.15)',
                minHeight: '140px', // Altura reducida
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(220, 53, 69, 0.25)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Ticket Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography
                    variant='h5'
                    sx={{
                      fontWeight: 800,
                      color: colors.primary,
                      fontSize: '1.5rem'
                    }}
                  >
                    {ticket.ticketCode}
                  </Typography>
                  <MaintenancePriorityBadge priority={ticket.priority} size='small' />
                </Box>

                {/* Equipment Information */}
                <Typography
                  variant='h6'
                  sx={{
                    color: colors.textPrimary, // Mejor contraste
                    mb: 1,
                    fontWeight: 700,
                    fontSize: '1.25rem'
                  }}
                >
                  {ticket.equipmentType}
                </Typography>

                <Typography
                  variant='body1'
                  sx={{
                    color: colors.textSecondary, // Mejor contraste
                    mb: 2,
                    fontSize: '1rem'
                  }}
                >
                  {ticket.equipmentBrand} {ticket.equipmentModel}
                </Typography>

                {/* Footer with Status and Time */}
                <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <MaintenanceStatusBadge status={ticket.status} size='small' />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTime sx={{ color: colors.textSecondary, fontSize: '1.2rem' }} />
                    <Typography
                      variant='body2'
                      sx={{
                        color: colors.textSecondary, // Mejor contraste
                        fontWeight: 600
                      }}
                    >
                      {getElapsedTime(ticket.createdAt)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default CriticalTicketsSection