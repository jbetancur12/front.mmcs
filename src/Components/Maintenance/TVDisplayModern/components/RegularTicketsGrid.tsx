import React from 'react'
import { Grid, Card, CardContent, Box, Typography } from '@mui/material'
import { AccessTime } from '@mui/icons-material'
import { RegularTicketsGridProps } from '../types'
import { useModernStyles } from '../hooks/useModernStyles'
import MaintenancePriorityBadge from '../../MaintenancePriorityBadge'
import MaintenanceStatusBadge from '../../MaintenanceStatusBadge'

const RegularTicketsGrid: React.FC<RegularTicketsGridProps> = ({
  tickets,
  gridCalculation,
  colors,
  getElapsedTime
}) => {
  const { cardStyles } = useModernStyles()

  if (!tickets || tickets.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography
          variant='h6'
          sx={{
            color: colors.textSecondary,
            fontWeight: 500
          }}
        >
          No hay tickets regulares para mostrar
        </Typography>
      </Box>
    )
  }

  return (
    <Grid 
      container 
      spacing={gridCalculation?.cardSpacing ? gridCalculation.cardSpacing / 8 : 1} 
      sx={{ 
        height: '100%', 
        overflow: 'hidden',
        margin: 0,
        width: '100%'
      }}
    >
      {tickets.map((ticket) => (
        <Grid
          item
          xs={gridCalculation ? 12 / gridCalculation.columns : 3}
          key={ticket.id}
          sx={{ 
            height: gridCalculation ? `${gridCalculation.cardHeight}px` : 'auto',
            display: 'flex'
          }}
        >
          <Card
            sx={{
              ...cardStyles.base,
              ...cardStyles.regular,
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <CardContent sx={{ 
              p: 1, 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              '&:last-child': { pb: 1 } // Reducir padding bottom
            }}>
              {/* Ticket Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                <Typography
                  variant='h6'
                  sx={{
                    fontWeight: 800,
                    color: colors.primary,
                    fontSize: '1rem',
                    lineHeight: 1.2
                  }}
                >
                  {ticket.ticketCode}
                </Typography>
                <MaintenancePriorityBadge priority={ticket.priority} size='small' />
              </Box>

              {/* Equipment Information */}
              <Typography
                variant='subtitle2'
                sx={{
                  color: colors.textPrimary,
                  mb: 0.25,
                  fontWeight: 700,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '0.9rem',
                  lineHeight: 1.2
                }}
              >
                {ticket.equipmentType}
              </Typography>

              <Typography
                variant='body2'
                sx={{
                  color: colors.textSecondary,
                  mb: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '0.8rem',
                  lineHeight: 1.2
                }}
              >
                {ticket.equipmentBrand} {ticket.equipmentModel}
              </Typography>

              {/* Footer */}
              <Box sx={{ mt: 'auto' }}>
                <Box sx={{ mb: 0.5 }}>
                  <MaintenanceStatusBadge status={ticket.status} size='small' />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AccessTime sx={{ color: colors.textSecondary, fontSize: '0.9rem' }} />
                  <Typography
                    variant='body2'
                    sx={{
                      color: colors.textSecondary,
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      lineHeight: 1.2
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
  )
}

export default RegularTicketsGrid