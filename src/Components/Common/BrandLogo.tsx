import React, { useEffect } from 'react'
import { Box } from '@mui/material'
import { useStore } from '@nanostores/react'
import { userStore } from 'src/store/userStore'
import { useFeature } from 'src/hooks/useFeatureFlags'
import { canSeeNewLogo } from 'src/utils/newLogo'

const NEW_LOGO_PATH = '/images/logo-nuevo'
const NARROW = '(max-width: 439.95px)'

/** Cambia el ícono de la pestaña y lo restaura al salir. */
const useNewFavicon = (enabled: boolean) => {
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (!enabled || !link) return
    const previous = link.getAttribute('href') ?? ''
    link.setAttribute('href', `${NEW_LOGO_PATH}/favicon.png`)
    return () => link.setAttribute('href', previous)
  }, [enabled])
}

/**
 * Imagen del logo en claro u oscuro, sin descriptor. En móviles angostos el
 * nombre chocaría con los íconos: solo el símbolo.
 */
function ThemedLogo({ dark }: { dark: boolean }): React.ReactElement {
  const display = dark ? 'none' : 'block'
  const darkDisplay = dark ? 'block' : 'none'
  const file = dark ? 'oscuro' : 'claro'

  return (
    <picture>
      <source media={NARROW} srcSet={`${NEW_LOGO_PATH}/simbolo-${file}.png`} />
      <Box
        component='img'
        src={`${NEW_LOGO_PATH}/logo-${file}.png`}
        alt='Metromedics'
        sx={{
          height: { xs: 26, md: 28 },
          ml: { md: 1 },
          width: 'auto',
          display,
          'html.dark &': { display: darkDisplay },
          [`@media ${NARROW}`]: { height: 32 }
        }}
      />
    </picture>
  )
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

  return (
    <>
      <ThemedLogo dark={false} />
      <ThemedLogo dark />
    </>
  )
}

export default BrandLogo
