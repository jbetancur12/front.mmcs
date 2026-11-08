import { Box, Button, Typography } from '@mui/material'
import { useEffect } from 'react'
import { useNewVersion } from '../hooks/useNewVersion'
import { applyUpdate, checkForPwaUpdate, usePwaNeedRefresh } from '../utils/pwa'
import {
  brand,
  neutral,
  intent,
  detail,
  withAlpha
} from 'src/theme/designTokens'

const NewVersionBanner = () => {
  const hasNewVersion = useNewVersion()
  const pwaNeedsRefresh = usePwaNeedRefresh()

  // version.json cambió: que el navegador busque el service worker nuevo sin esperar su revisión periódica
  useEffect(() => {
    if (hasNewVersion) void checkForPwaUpdate()
  }, [hasNewVersion])

  if (!hasNewVersion && !pwaNeedsRefresh) return null

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: `linear-gradient(135deg, ${brand.ink} 0%, ${detail.to} 50%, ${intent.successInk} 100%)`,
        px: { xs: 2, md: 4 },
        py: 1.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        flexWrap: 'wrap',
        boxShadow: `0 -4px 20px ${withAlpha(neutral.black, 0.15)}`,
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
        onClick={() => void applyUpdate()}
        sx={{
          background: neutral.surface,
          color: brand.ink,
          fontWeight: 700,
          borderRadius: '10px',
          textTransform: 'none',
          '&:hover': { background: intent.successSoft }
        }}
      >
        Actualizar
      </Button>
    </Box>
  )
}

export default NewVersionBanner
