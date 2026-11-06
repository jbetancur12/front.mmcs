import React from 'react'
import { Box, Checkbox, Chip, Typography } from '@mui/material'
import ComputerOutlinedIcon from '@mui/icons-material/ComputerOutlined'
import SmartphoneOutlinedIcon from '@mui/icons-material/SmartphoneOutlined'
import { formatSessionActivity } from 'src/hooks/useSessions'
import { brand, neutral } from 'src/theme/designTokens'

interface SessionDeviceRowProps {
  deviceLabel: string
  ip: string | null
  lastSeenAt: string
  /** Marca "Esta sesión" cuando la fila es la del navegador actual. */
  current?: boolean
  /** Botón de acción a la derecha (Cerrar sesión). */
  action?: React.ReactNode
  /** Casilla a la izquierda para escoger la sesión (diálogo del login). */
  select?: { checked: boolean; onChange: (checked: boolean) => void }
}

/** Una sesión con su equipo, IP y última actividad; la usan el login y la lista de sesiones. */
const SessionDeviceRow: React.FC<SessionDeviceRowProps> = ({
  deviceLabel,
  ip,
  lastSeenAt,
  current = false,
  action,
  select
}) => {
  const isMobile = /Android|iOS/.test(deviceLabel)
  const Icon = isMobile ? SmartphoneOutlinedIcon : ComputerOutlinedIcon
  const activity = formatSessionActivity(lastSeenAt)

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 1.5,
        border: `1px solid ${neutral.border}`,
        borderRadius: '12px',
        borderColor: select?.checked ? brand.main : neutral.border
      }}
    >
      {select && (
        <Checkbox
          checked={select.checked}
          onChange={(event) => select.onChange(event.target.checked)}
          inputProps={{ 'aria-label': `Cerrar la sesión de ${deviceLabel}` }}
          sx={{ p: 0.5, '&.Mui-checked': { color: brand.main } }}
        />
      )}
      <Box
        sx={{
          width: 40,
          height: 40,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          bgcolor: brand.soft,
          color: brand.ink
        }}
      >
        <Icon fontSize='small' />
      </Box>
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap'
          }}
        >
          <Typography
            sx={{ fontWeight: 600, fontSize: 14, color: neutral.text }}
          >
            {deviceLabel}
          </Typography>
          {current && (
            <Chip
              label='Esta sesión'
              size='small'
              color='success'
              variant='outlined'
            />
          )}
        </Box>
        <Typography variant='caption' color='text.secondary'>
          {[ip, activity].filter(Boolean).join(' · ')}
        </Typography>
      </Box>
      {action}
    </Box>
  )
}

export default SessionDeviceRow
