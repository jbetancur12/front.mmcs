// src/Components/LaboratoryMonitor/ChamberTabs.tsx
import React from 'react'
import { Tabs, Tab, Box, Typography } from '@mui/material'
import { Chamber } from './types' // Ajusta la ruta si es necesario

interface ChamberTabsProps {
  chambers: Chamber[]
  selectedChamberId: string | number | null
  onChamberSelect: (chamberId: string) => void
}

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
    <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '100%' }}>
      <Tabs
        value={selectedChamberId || false} // Tabs necesita un valor que no sea null
        onChange={handleChange}
        aria-label='Cámaras ambientales'
        variant='scrollable'
        scrollButtons='auto'
      >
        {chambers.map((chamber) => (
          <Tab label={chamber.name} value={chamber.id} key={chamber.id} />
        ))}
      </Tabs>
    </Box>
  )
}
