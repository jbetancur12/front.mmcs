import React from 'react'
import { Navigate } from 'react-router-dom'
import { Box } from '@mui/material'
import SignalLoader from 'src/Components/Common/SignalLoader'
import { useFeature, useFeatureFlagsLoaded } from 'src/hooks/useFeatureFlags'
import type { FeatureFlagKey } from 'src/store/featureFlagsStore'

/**
 * Muestra su contenido solo si la función está encendida en el panel de desarrollador; apagada, cae en
 * la página no encontrada. Mientras no llega el estado real del API no decide a ciegas con un valor viejo en contra.
 */
const FeatureGate: React.FC<{
  flag: FeatureFlagKey
  children: React.ReactNode
}> = ({ flag, children }) => {
  const on = useFeature(flag)
  const loaded = useFeatureFlagsLoaded()

  if (on) return <>{children}</>
  if (!loaded) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '80vh'
        }}
      >
        <SignalLoader />
      </Box>
    )
  }
  // Fuera del Layout: la ruta comodín muestra la página no encontrada, como cuando la ruta no existía.
  return <Navigate to='/funcion-no-disponible' replace />
}

export default FeatureGate
