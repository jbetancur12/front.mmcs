import React, { useMemo } from 'react'
import { Box, Typography } from '@mui/material'
import { DescriptionOutlined } from '@mui/icons-material'
import { MaintenanceTicket } from 'src/types/maintenance'
import { intent, neutral } from 'src/theme/designTokens'

const MAX_TECHNICIANS = 6

interface ReportsStripProps {
  /** Completados que todavía no tienen reporte técnico. */
  tickets: MaintenanceTicket[]
}

/** Franja inferior: cuántos reportes técnicos faltan y quién los debe. */
const ReportsStrip: React.FC<ReportsStripProps> = ({ tickets }) => {
  const byTechnician = useMemo(() => {
    const counts = new Map<string, number>()
    tickets.forEach((t) => {
      const name = t.assignedTechnician?.name ?? 'Sin técnico'
      counts.set(name, (counts.get(name) ?? 0) + 1)
    })
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [tickets])

  if (tickets.length === 0) return null

  const shown = byTechnician.slice(0, MAX_TECHNICIANS)
  const rest = byTechnician.length - shown.length

  return (
    <Box
      sx={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: 2,
        py: 1,
        borderRadius: '12px',
        bgcolor: intent.warningSoft,
        border: `1px solid ${intent.warning}`,
        overflow: 'hidden'
      }}
    >
      <DescriptionOutlined
        sx={{
          color: intent.warningInk,
          fontSize: { xs: '1.4rem', xl: '2rem' }
        }}
      />
      <Typography
        sx={{
          fontWeight: 800,
          color: intent.warningInk,
          fontSize: { xs: '1rem', xl: '1.5rem' },
          whiteSpace: 'nowrap'
        }}
      >
        {tickets.length} sin reporte técnico
      </Typography>
      <Box sx={{ display: 'flex', gap: 2.5, minWidth: 0, overflow: 'hidden' }}>
        {shown.map(([name, count]) => (
          <Typography
            key={name}
            noWrap
            sx={{
              color: neutral.text,
              fontWeight: 600,
              fontSize: { xs: '0.9rem', xl: '1.25rem' }
            }}
          >
            {name}{' '}
            <Box component='span' sx={{ fontWeight: 800 }}>
              {count}
            </Box>
          </Typography>
        ))}
        {rest > 0 && (
          <Typography
            sx={{
              color: neutral.textMuted,
              fontWeight: 600,
              fontSize: { xs: '0.9rem', xl: '1.25rem' }
            }}
          >
            +{rest} más
          </Typography>
        )}
      </Box>
    </Box>
  )
}

export default ReportsStrip
