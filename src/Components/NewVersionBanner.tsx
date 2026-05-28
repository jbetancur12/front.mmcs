import { Box, Button, Typography } from '@mui/material'
import { useNewVersion } from '../hooks/useNewVersion'

const NewVersionBanner = () => {
  const hasNewVersion = useNewVersion()

  if (!hasNewVersion) return null

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: 'linear-gradient(135deg, #0f766e 0%, #059669 50%, #047857 100%)',
        px: { xs: 2, md: 4 },
        py: 1.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        flexWrap: 'wrap',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
        animation: 'slideUp 0.3s ease-out',
        '@keyframes slideUp': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' }
        }
      }}
    >
      <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>
        Hay una nueva versión disponible
      </Typography>
      <Button
        variant='contained'
        onClick={() => window.location.reload()}
        sx={{
          background: '#fff',
          color: '#059669',
          fontWeight: 700,
          borderRadius: '10px',
          textTransform: 'none',
          '&:hover': { background: '#f0fdf4' }
        }}
      >
        Actualizar
      </Button>
    </Box>
  )
}

export default NewVersionBanner
