import React, { useEffect } from 'react'
import { Box, Typography } from '@mui/material'
import { useStore } from '@nanostores/react'
import { userStore } from 'src/store/userStore'
import { useFeature } from 'src/hooks/useFeatureFlags'
import { canSeeNewLogo } from 'src/utils/newLogo'
import { neutral } from 'src/theme/designTokens'

const NEW_LOGO_PATH = '/images/logo-nuevo'

/** Cambia el ícono de la pestaña y lo restaura al salir. */
const useNewFavicon = (enabled: boolean) => {
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (!enabled || !link) return
    const previous = link.getAttribute('href') ?? ''
    link.setAttribute('href', `${NEW_LOGO_PATH}/favicon.svg`)
    return () => link.setAttribute('href', previous)
  }, [enabled])
}

/** Logo del encabezado: el nuevo para quienes lo revisan, el actual para el resto. */
function BrandLogo(): React.ReactElement {
  const { rol } = useStore(userStore)
  const isEnabled = useFeature('new_logo')
  const isNew = isEnabled && canSeeNewLogo(rol)
  useNewFavicon(isNew)

  if (!isNew) {
    return (
      <Box
        component='img'
        src='/images/logo2.png'
        alt='Metromedics'
        className='brand-logo'
        sx={{ height: { xs: 32, md: 40 }, width: 'auto' }}
      />
    )
  }

  const isotype = { height: { xs: 28, md: 40 }, width: 'auto' }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
      <Box
        component='img'
        src={`${NEW_LOGO_PATH}/isotipo-claro.svg`}
        alt=''
        sx={{
          ...isotype,
          display: 'block',
          'html.dark &': { display: 'none' }
        }}
      />
      <Box
        component='img'
        src={`${NEW_LOGO_PATH}/isotipo-oscuro.svg`}
        alt=''
        sx={{
          ...isotype,
          display: 'none',
          'html.dark &': { display: 'block' }
        }}
      />
      <Typography
        component='span'
        sx={{
          fontSize: { xs: 16, sm: 20, md: 24 },
          fontWeight: 700,
          lineHeight: 1,
          color: neutral.text,
          // En móviles muy angostos el nombre chocaría con los íconos.
          '@media (max-width: 379.95px)': { display: 'none' }
        }}
      >
        Metromedics
      </Typography>
    </Box>
  )
}

export default BrandLogo
