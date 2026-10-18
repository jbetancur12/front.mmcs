// src/Components/LaboratoryMonitor/ChamberTabs.tsx
import React from 'react'
import { Tabs, Tab, Box, Paper, Typography } from '@mui/material'
import { Chamber, CHAMBER_STATUS } from './types' // Ajusta la ruta si es necesario

interface ChamberTabsProps {
  chambers: Chamber[]
  selectedChamberId: string | number | null
  onChamberSelect: (chamberId: string) => void
}

// Punto de estado: la cámara calibrando se ve de un vistazo sin abrirla
const StatusDot: React.FC<{ live: boolean }> = ({ live }) => (
  <Box
    component='span'
    role='img'
    aria-label={live ? 'En calibración' : 'En reposo'}
    sx={{
      width: 8,
      height: 8,
      borderRadius: '50%',
      bgcolor: live ? '#00BFA5' : '#d1d5db',
      flexShrink: 0
    }}
  />
)

export const ChamberTabs: React.FC<ChamberTabsProps> = ({
  chambers,
  selectedChamberId,
  onChamberSelect
}) => {
  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    onChamberSelect(newValue)
  }

  if (!chambers || chambers.length === 0) {
    return <Typography sx={{ p: 2 }}>No hay cámaras configuradas.</Typography>
  }

  return (
    <Paper
      variant='outlined'
      sx={{ borderRadius: '12px', borderColor: '#e5e7eb', width: '100%' }}
    >
      <Tabs
        value={selectedChamberId || false} // Tabs necesita un valor que no sea null
        onChange={handleChange}
        aria-label='Cámaras ambientales'
        variant='scrollable'
        scrollButtons='auto'
        TabIndicatorProps={{ sx: { bgcolor: '#00BFA5', height: 3 } }}
        sx={{ minHeight: 56 }}
      >
        {chambers.map((chamber) => (
          <Tab
            key={chamber.id}
            value={chamber.id}
            iconPosition='start'
            icon={
              <StatusDot live={chamber.status === CHAMBER_STATUS.CALIBRATING} />
            }
            label={chamber.name}
            sx={{
              minHeight: 56,
              textTransform: 'none',
              fontWeight: 600,
              gap: 0.5,
              '&.Mui-selected': { color: '#00897B' }
            }}
          />
        ))}
      </Tabs>
    </Paper>
  )
}
