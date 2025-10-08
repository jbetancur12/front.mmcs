import React from 'react'
import { Box, Card, Typography, LinearProgress } from '@mui/material'
import { PaginationProgressProps } from '../types'

const PaginationProgress: React.FC<PaginationProgressProps> = ({
  slideIndex,
  totalTickets,
  ticketsPerPage,
  colors
}) => {
  const totalPages = Math.ceil(totalTickets / ticketsPerPage)
  const currentPage = slideIndex + 1
  const showingTickets = Math.min(currentPage * ticketsPerPage, totalTickets)
  const progressPercentage = Math.round((currentPage / totalPages) * 100)

  if (totalTickets <= ticketsPerPage) {
    return null
  }

  return (
    <Card
      sx={{
        backgroundColor: colors.secondaryBackground,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        p: 1.5 // Padding reducido
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography
          variant='body2'
          sx={{
            color: colors.textSecondary,
            fontWeight: 600,
            minWidth: '120px',
            fontSize: '0.85rem'
          }}
        >
          {showingTickets} de {totalTickets}
        </Typography>

        <Box sx={{ flex: 1, maxWidth: '300px' }}>
          <LinearProgress
            variant='determinate'
            value={progressPercentage}
            sx={{
              height: '6px',
              borderRadius: '4px',
              backgroundColor: colors.borderLight,
              '& .MuiLinearProgress-bar': {
                backgroundColor: colors.primary,
                borderRadius: '4px'
              }
            }}
          />
        </Box>

        <Typography
          variant='body2'
          sx={{
            color: colors.textSecondary,
            fontWeight: 600,
            minWidth: '40px',
            textAlign: 'right',
            fontSize: '0.85rem'
          }}
        >
          {progressPercentage}%
        </Typography>
      </Box>
    </Card>
  )
}

export default PaginationProgress