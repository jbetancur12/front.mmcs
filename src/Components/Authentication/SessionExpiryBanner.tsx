import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Cookies from 'js-cookie'
import {
  Alert,
  Box,
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { axiosPublic } from '@utils/api'

interface SessionExpiryBannerProps {
  finalWarningMsBefore?: number
  warningMsBefore?: number
}

const formatTimeLeft = (secondsLeft: number) => {
  if (secondsLeft >= 60) {
    const minutes = Math.floor(secondsLeft / 60)
    const seconds = secondsLeft % 60

    return seconds > 0
      ? `${minutes} min ${seconds} s`
      : `${minutes} min`
  }

  return `${secondsLeft} s`
}

const SessionExpiryBanner = ({
  finalWarningMsBefore = 10_000,
  warningMsBefore = 30_000
}: SessionExpiryBannerProps) => {
  const navigate = useNavigate()
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [warningKey, setWarningKey] = useState<string | null>(null)
  const [dismissedKey, setDismissedKey] = useState<string | null>(
    sessionStorage.getItem('session-expiry-banner-dismissed')
  )
  const [finalWarningDismissed, setFinalWarningDismissed] = useState(false)
  const hasHandledExpiry = useRef(false)

  const handleSessionExpired = useCallback(async () => {
    if (hasHandledExpiry.current) {
      return
    }

    hasHandledExpiry.current = true

    try {
      await axiosPublic.post('/auth/logout', {})
    } catch (error) {
      console.error('Error al cerrar sesión por expiración:', error)
    }

    Cookies.remove('expiresIn')
    localStorage.removeItem('sessionExpiresAt')
    localStorage.clear()
    sessionStorage.clear()
    navigate('/login', { replace: true })
  }, [navigate])

  useEffect(() => {
    const updateBanner = () => {
      const expirationTime = Number(
        Cookies.get('expiresIn') || localStorage.getItem('sessionExpiresAt')
      )
      const accessToken = localStorage.getItem('accessToken')

      if (!expirationTime || !accessToken) {
        setSecondsLeft(null)
        setWarningKey(null)
        setFinalWarningDismissed(false)
        hasHandledExpiry.current = false
        return
      }

      const nextWarningKey = expirationTime.toString()
      const timeLeft = expirationTime - Date.now()

      if (timeLeft <= 0) {
        setSecondsLeft(null)
        setWarningKey(nextWarningKey)
        void handleSessionExpired()
        return
      }

      if (warningKey !== nextWarningKey) {
        hasHandledExpiry.current = false
        setFinalWarningDismissed(false)
      }

      setWarningKey(nextWarningKey)

      if (dismissedKey && dismissedKey !== nextWarningKey) {
        sessionStorage.removeItem('session-expiry-banner-dismissed')
        setDismissedKey(null)
      }

      if (timeLeft <= warningMsBefore) {
        setSecondsLeft(Math.max(Math.ceil(timeLeft / 1000), 1))
      } else {
        setSecondsLeft(null)
      }
    }

    updateBanner()
    const intervalId = window.setInterval(updateBanner, 1000)

    return () => window.clearInterval(intervalId)
  }, [dismissedKey, handleSessionExpired, warningKey, warningMsBefore])

  const message = useMemo(() => {
    if (!secondsLeft) return ''

    return `Tu sesión está por expirar en ${formatTimeLeft(
      secondsLeft
    )}. Guarda tu trabajo para evitar perder cambios.`
  }, [secondsLeft])

  const showFinalWarning =
    !!secondsLeft &&
    secondsLeft * 1000 <= finalWarningMsBefore &&
    !finalWarningDismissed

  const showBanner =
    !!secondsLeft && !!warningKey && (!dismissedKey || dismissedKey !== warningKey)

  if (!warningKey) {
    return null
  }

  return (
    <>
      <Collapse in={showBanner && !showFinalWarning}>
        <Box sx={{ px: 3, pt: 2 }}>
          <Alert
            severity='warning'
            variant='filled'
            action={
              <Button
                color='inherit'
                size='small'
                onClick={() => {
                  sessionStorage.setItem(
                    'session-expiry-banner-dismissed',
                    warningKey
                  )
                  setDismissedKey(warningKey)
                }}
              >
                Entendido
              </Button>
            }
            sx={{
              alignItems: 'center',
              borderRadius: 3,
              boxShadow: '0 8px 24px rgba(180, 83, 9, 0.18)'
            }}
          >
            {message}
          </Alert>
        </Box>
      </Collapse>

      <Dialog
        open={showFinalWarning}
        maxWidth='xs'
        fullWidth
        disableEscapeKeyDown
      >
        <DialogTitle>Tu sesión está por expirar</DialogTitle>
        <DialogContent>
          <Typography variant='body1' sx={{ mb: 1.5 }}>
            La sesión se cerrará automáticamente en{' '}
            <strong>{formatTimeLeft(secondsLeft || 0)}</strong>.
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Guarda tu trabajo ahora para evitar perder cambios. Si la sesión
            expira, tendrás que iniciar sesión de nuevo.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant='contained'
            color='warning'
            onClick={() => setFinalWarningDismissed(true)}
          >
            Entendido
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default SessionExpiryBanner
