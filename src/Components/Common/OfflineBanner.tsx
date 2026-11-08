import WifiOffRoundedIcon from '@mui/icons-material/WifiOffRounded'
import { Box, Typography } from '@mui/material'
import { useOnlineStatus } from 'src/hooks/useOnlineStatus'
import { intent } from 'src/theme/designTokens'

/**
 * Aviso fijo arriba cuando el teléfono no tiene red. Lo que se capture queda en el borrador del
 * teléfono, pero guardar en el servidor necesita conexión: el aviso lo dice antes de que falle.
 */
const OfflineBanner = ({ message }: { message?: string }) => {
  const online = useOnlineStatus()
  if (online) return null

  return (
    <Box
      role='status'
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 2,
        py: 1,
        bgcolor: intent.warningSoft,
        borderBottom: `1px solid ${intent.warning}`
      }}
    >
      <WifiOffRoundedIcon sx={{ color: intent.warningInk, fontSize: 20 }} />
      <Typography
        sx={{ color: intent.warningInk, fontWeight: 600, fontSize: '0.85rem' }}
      >
        {message ??
          'Sin conexión. Lo que captures se conserva, pero no se guarda hasta que vuelva la señal.'}
      </Typography>
    </Box>
  )
}

export default OfflineBanner
