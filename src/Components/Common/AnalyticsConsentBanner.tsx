import { useEffect, useState } from 'react'
import { Box, Button, Paper, Typography } from '@mui/material'
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined'
import { useLocation } from 'react-router-dom'
import { usePostHog } from 'posthog-js/react'
import { brand, neutral } from 'src/theme/designTokens'
import {
  OPEN_ANALYTICS_CONSENT_EVENT,
  getAnalyticsConsent,
  setAnalyticsConsent,
  type AnalyticsConsentDecision
} from 'src/utils/analyticsConsent'

const LOGIN_PATH = '/login'
const ASK_AFTER_LOGIN_MS = 1200

/**
 * Aviso de primer ingreso para la analítica de la plataforma. No bloquea el
 * trabajo: PostHog arranca apagado y solo se enciende si la persona acepta.
 * La elección se puede cambiar desde el menú de la cuenta.
 */
const AnalyticsConsentBanner = () => {
  const posthog = usePostHog()
  const location = useLocation()
  const [decision, setDecision] = useState<AnalyticsConsentDecision | null>(
    () => getAnalyticsConsent()
  )
  const [open, setOpen] = useState(false)

  // Aplica la decisión guardada desde que carga la app (también en el login).
  useEffect(() => {
    if (decision === 'granted') posthog?.opt_in_capturing()
    if (decision === 'denied') posthog?.opt_out_capturing()
  }, [decision, posthog])

  // Pregunta una sola vez, después de iniciar sesión.
  useEffect(() => {
    if (decision || location.pathname === LOGIN_PATH) return
    if (!window.localStorage.getItem('accessToken')) return

    const timer = window.setTimeout(() => setOpen(true), ASK_AFTER_LOGIN_MS)
    return () => window.clearTimeout(timer)
  }, [decision, location.pathname])

  // Reabrir desde "Preferencias de analítica" en el menú de la cuenta.
  useEffect(() => {
    const handleOpen = () => setOpen(true)
    window.addEventListener(OPEN_ANALYTICS_CONSENT_EVENT, handleOpen)
    return () =>
      window.removeEventListener(OPEN_ANALYTICS_CONSENT_EVENT, handleOpen)
  }, [])

  const choose = (next: AnalyticsConsentDecision) => {
    setAnalyticsConsent(next)
    setDecision(next)
    setOpen(false)
    if (next === 'denied') {
      posthog?.opt_out_capturing()
      posthog?.reset()
    }
  }

  if (!open) return null

  return (
    <Paper
      elevation={0}
      role='dialog'
      aria-label='Preferencias de analítica'
      sx={{
        position: 'fixed',
        left: { xs: 16, md: 24 },
        right: { xs: 16, md: 'auto' },
        bottom: { xs: 16, md: 24 },
        width: { xs: 'auto', md: 400 },
        maxWidth: 'calc(100vw - 32px)',
        zIndex: 1200,
        p: 2.25,
        borderRadius: '16px',
        border: `1px solid ${neutral.border}`,
        boxShadow: '0 18px 40px rgba(15, 23, 42, 0.18)'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: '10px',
            bgcolor: brand.soft,
            color: brand.ink,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0
          }}
        >
          <InsightsOutlinedIcon fontSize='small' />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{ fontSize: 14, fontWeight: 700, color: neutral.text }}
          >
            ¿Nos ayudas a mejorar?
          </Typography>
          <Typography
            sx={{
              mt: 0.5,
              fontSize: 13,
              lineHeight: 1.5,
              color: neutral.textBody
            }}
          >
            Usamos PostHog para saber qué pantallas se usan y mejorarlas. No
            afecta tu trabajo y puedes cambiar la elección desde el menú de tu
            cuenta.{' '}
            <Box
              component='a'
              href='https://metromedicslab.com/politica-cookies'
              target='_blank'
              rel='noopener noreferrer'
              sx={{
                color: brand.ink,
                fontWeight: 600,
                textDecoration: 'underline'
              }}
            >
              Más información
            </Box>
          </Typography>
          <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              size='small'
              variant='contained'
              onClick={() => choose('granted')}
              sx={{
                bgcolor: brand.main,
                '&:hover': { bgcolor: brand.hover },
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: '8px'
              }}
            >
              Permitir
            </Button>
            <Button
              size='small'
              onClick={() => choose('denied')}
              sx={{
                color: neutral.textBody,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              No, gracias
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  )
}

export default AnalyticsConsentBanner
