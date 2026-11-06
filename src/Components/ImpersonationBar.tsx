import { Box, Button, Typography } from '@mui/material'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import React, { useLayoutEffect, useRef } from 'react'
import { intent } from 'src/theme/designTokens'

interface ImpersonationBarProps {
  impersonatorName: string
  targetName: string
  targetRoles?: string[]
  onStop: () => void
}

const ImpersonationBar: React.FC<ImpersonationBarProps> = ({
  impersonatorName,
  targetName,
  onStop
}) => {
  const ref = useRef<HTMLDivElement>(null)

  // Publica el alto del aviso para que el encabezado, el menú y el contenido
  // bajen lo mismo y no queden tapados (el aviso va fijo arriba).
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const root = document.documentElement
    const update = () =>
      root.style.setProperty('--imp-h', `${el.offsetHeight}px`)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => {
      observer.disconnect()
      root.style.removeProperty('--imp-h')
    }
  }, [])

  return (
    <Box
      ref={ref}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: { xs: 2, md: 3 },
        py: 0.75,
        minHeight: 40,
        backgroundColor: intent.warningSoft,
        borderBottom: `2px solid ${intent.warning}`,
        flexWrap: 'wrap',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999
      }}
    >
      <WarningAmberRoundedIcon sx={{ color: intent.warning, fontSize: 20 }} />
      <Typography
        variant='body2'
        sx={{ color: intent.warningInk, flex: 1, minWidth: 0 }}
      >
        Estás operando como <strong>{targetName}</strong>
        <Box component='span' sx={{ color: intent.dangerInk, ml: 1 }}>
          · suplantado por {impersonatorName}
        </Box>
      </Typography>
      <Button
        size='small'
        variant='contained'
        disableElevation
        onClick={onStop}
        sx={{
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.8rem',
          py: 0.25,
          bgcolor: intent.warningInk,
          color: '#fff',
          '&:hover': { bgcolor: intent.warningInk }
        }}
      >
        Volver a mi sesión
      </Button>
    </Box>
  )
}

export default ImpersonationBar
