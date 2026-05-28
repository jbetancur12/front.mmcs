import { Box, Button, Chip, Typography } from '@mui/material'
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined'
import React from 'react'

interface ImpersonationBarProps {
  impersonatorName: string
  targetName: string
  targetRoles: string[]
  onStop: () => void
}

const ImpersonationBar: React.FC<ImpersonationBarProps> = ({
  impersonatorName,
  targetName,
  targetRoles,
  onStop,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        px: 3,
        py: 1,
        backgroundColor: '#fef3c7',
        borderBottom: '1px solid #f59e0b',
        flexWrap: 'wrap',
      }}
    >
      <AdminPanelSettingsOutlinedIcon sx={{ color: '#d97706', fontSize: 20 }} />
      <Typography variant='body2' fontWeight={600} sx={{ color: '#92400e' }}>
        Estás operando como <strong>{targetName}</strong>
      </Typography>
      {targetRoles.map((role) => (
        <Chip
          key={role}
          size='small'
          label={role}
          sx={{
            height: 20,
            backgroundColor: 'rgba(217,119,6,0.12)',
            color: '#92400e',
            fontWeight: 600,
            fontSize: '0.7rem',
            '& .MuiChip-label': { px: 0.8 },
          }}
        />
      ))}
      <Typography variant='caption' sx={{ color: '#92400e', opacity: 0.7 }}>
        (suplantado por {impersonatorName})
      </Typography>
      <Button
        size='small'
        variant='outlined'
        onClick={onStop}
        sx={{
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.75rem',
          borderColor: '#d97706',
          color: '#92400e',
          '&:hover': {
            borderColor: '#b45309',
            backgroundColor: 'rgba(217,119,6,0.08)',
          },
        }}
      >
        Volver a mi sesión
      </Button>
    </Box>
  )
}

export default ImpersonationBar
