import React from 'react'
import { Box } from '@mui/material'
import { useFeature } from 'src/hooks/useFeatureFlags'
import { isHolidaySeason } from 'src/utils/holidaySeason'
import { intent, neutral } from 'src/theme/designTokens'

/** Gorro navideño sobre el avatar. El contenedor del avatar es `relative`. */
export function HolidayHat(): React.ReactElement | null {
  const isEnabled = useFeature('holiday_hat')
  if (!isEnabled || !isHolidaySeason()) return null

  // Coordenadas sobre el avatar de 36 px: el borde blanco sigue su curva.
  return (
    <Box
      component='svg'
      viewBox='0 -12 48 48'
      aria-hidden='true'
      data-testid='holiday-hat'
      sx={{
        position: 'absolute',
        top: -12,
        left: 0,
        width: 48,
        height: 48,
        pointerEvents: 'none',
        zIndex: 1
      }}
    >
      <Box
        component='path'
        d='M11.5 3C15-12 34-14 41-1C43 3 43.5 7 43 12L36 4L34 13A17 17 0 0 0 11.5 3Z'
        sx={{ fill: intent.danger }}
      />
      <Box
        component='path'
        d='M11.6 2.2A17 17 0 0 1 34.2 12.7'
        sx={{
          fill: 'none',
          stroke: '#fff',
          strokeWidth: 5.5,
          strokeLinecap: 'round',
          filter: 'drop-shadow(0 1px 0 rgb(0 0 0 / 0.25))'
        }}
      />
      <Box
        component='circle'
        cx={42}
        cy={12.5}
        r={3.8}
        sx={{ fill: '#fff', stroke: neutral.borderStrong }}
      />
    </Box>
  )
}

/** Moño en la esquina superior izquierda del logo. El enlace es `relative`. */
export function HolidayBow(): React.ReactElement | null {
  const isEnabled = useFeature('holiday_bow')
  if (!isEnabled || !isHolidaySeason()) return null

  return (
    <Box
      component='svg'
      viewBox='-24 -18 48 48'
      aria-hidden='true'
      data-testid='holiday-bow'
      sx={{
        position: 'absolute',
        top: -11,
        left: { xs: -9, md: -6 },
        width: 26,
        pointerEvents: 'none',
        zIndex: 1
      }}
    >
      <g transform='rotate(-35)'>
        <Box
          component='path'
          d='M0 0C-8-14-22-8-18 0C-22 8-8 14 0 0ZM0 0C8-14 22-8 18 0C22 8 8 14 0 0Z'
          sx={{ fill: intent.danger }}
        />
        <Box
          component='path'
          d='M-2 3L-10 20L-5 18L-2 22L1 5ZM2 3L10 20L5 18L2 22L-1 5Z'
          sx={{ fill: intent.dangerInk }}
        />
        <Box component='circle' r={4.5} sx={{ fill: intent.dangerInk }} />
      </g>
    </Box>
  )
}
