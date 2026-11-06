import {
  CheckCircleRounded,
  RadioButtonUncheckedRounded
} from '@mui/icons-material'
import { Box, Typography } from '@mui/material'

import { getPasswordRules } from 'src/utils/passwordPolicy'
import { brand, neutral } from 'src/theme/designTokens'

/**
 * Checklist en vivo de lo que pide la contraseña (largo, mayúscula, minúscula,
 * número, no común). Va bajo el campo de contraseña nueva; el servidor tiene la
 * última palabra.
 */
const PasswordRequirements = ({ password }: { password: string }) => (
  <Box
    component='ul'
    aria-label='Requisitos de la contraseña'
    sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 0.5 }}
  >
    {getPasswordRules(password).map((rule) => (
      <Box
        key={rule.id}
        component='li'
        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
      >
        {rule.met ? (
          <CheckCircleRounded sx={{ fontSize: 16, color: brand.main }} />
        ) : (
          <RadioButtonUncheckedRounded
            sx={{ fontSize: 16, color: neutral.textFaint }}
          />
        )}
        <Typography
          variant='caption'
          sx={{
            color: rule.met ? brand.ink : neutral.textMuted,
            fontWeight: rule.met ? 600 : 400
          }}
        >
          {rule.label}
        </Typography>
      </Box>
    ))}
  </Box>
)

export default PasswordRequirements
