import React from 'react'
import { Box, LinearProgress, Paper, Stack, Typography } from '@mui/material'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined'

const TEAL = '#00BFA5'
const TEAL_INK = '#00695C'

export interface StageTrackerStage {
  key: string
  label: string
}

interface StageTrackerProps {
  /** Etapas del ciclo, en el orden en que ocurren. */
  stages: StageTrackerStage[]
  /** Etapa actual (`key`). */
  current: string
  /** Nombre del ciclo para lectores de pantalla: "Etapas del servicio". */
  ariaLabel: string
  /** Si el registro se detuvo (rechazo, cancelación) no hay etapas: se muestra esto. */
  stopped?: { title: string; message: string }
  /** Contenido bajo las etapas, separado por una línea (p. ej. el plazo). */
  children?: React.ReactNode
}

/**
 * En qué etapa de un ciclo fijo va un registro: hechas con check, la actual
 * con punto y halo, las siguientes en gris. En móvil, "Etapa 3 de 5" con
 * una barra de avance.
 */
const StageTracker: React.FC<StageTrackerProps> = ({
  stages,
  current,
  ariaLabel,
  stopped,
  children
}) => {
  const currentIndex = stages.findIndex((stage) => stage.key === current)

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, p: { xs: 2, md: 3 }, mb: 2 }}>
      {stopped ? (
        <Stack direction='row' spacing={1.5} alignItems='center'>
          <BlockOutlinedIcon sx={{ color: '#ef4444' }} />
          <Box>
            <Typography fontWeight={700}>{stopped.title}</Typography>
            <Typography variant='body2' color='text.secondary'>
              {stopped.message}
            </Typography>
          </Box>
        </Stack>
      ) : (
        <>
          {/* Escritorio: todas las etapas */}
          <Box
            component='ol'
            aria-label={ariaLabel}
            sx={{
              display: { xs: 'none', md: 'flex' },
              listStyle: 'none',
              m: 0,
              p: 0
            }}
          >
            {stages.map((stage, index) => {
              const done = currentIndex > index
              const isCurrent = currentIndex === index
              return (
                <Box
                  component='li'
                  key={stage.key}
                  aria-current={isCurrent ? 'step' : undefined}
                  sx={{
                    flex: 1,
                    position: 'relative',
                    textAlign: 'center',
                    minWidth: 0
                  }}
                >
                  {index > 0 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 13,
                        left: '-50%',
                        width: '100%',
                        height: 2,
                        bgcolor: currentIndex >= index ? TEAL : '#e5e7eb'
                      }}
                    />
                  )}
                  <Box
                    sx={{
                      position: 'relative',
                      zIndex: 1,
                      mx: 'auto',
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: done ? TEAL : '#fff',
                      border: '2px solid',
                      borderColor: done || isCurrent ? TEAL : '#d1d5db',
                      color: done ? '#fff' : '#00897B',
                      boxShadow: isCurrent
                        ? '0 0 0 4px rgba(0,191,165,0.18)'
                        : 'none'
                    }}
                  >
                    {done ? (
                      <CheckRoundedIcon sx={{ fontSize: 16 }} />
                    ) : isCurrent ? (
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          bgcolor: TEAL
                        }}
                      />
                    ) : null}
                  </Box>
                  <Typography
                    variant='caption'
                    sx={{
                      display: 'block',
                      mt: 0.75,
                      px: 0.5,
                      lineHeight: 1.25,
                      fontWeight: isCurrent ? 700 : 500,
                      color: isCurrent ? TEAL_INK : done ? '#374151' : '#6b7280'
                    }}
                  >
                    {stage.label}
                  </Typography>
                </Box>
              )
            })}
          </Box>

          {/* Móvil: una línea con la etapa actual y el avance */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <Stack
              direction='row'
              justifyContent='space-between'
              alignItems='baseline'
              mb={0.75}
            >
              <Typography fontWeight={700} sx={{ color: TEAL_INK }}>
                {stages[currentIndex]?.label ?? 'Sin etapa'}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                Etapa {Math.max(currentIndex + 1, 1)} de {stages.length}
              </Typography>
            </Stack>
            <LinearProgress
              variant='determinate'
              value={
                stages.length
                  ? ((Math.max(currentIndex, 0) + 1) / stages.length) * 100
                  : 0
              }
              aria-label={ariaLabel}
              sx={{
                height: 8,
                borderRadius: '999px',
                bgcolor: '#E0F7F4',
                '& .MuiLinearProgress-bar': {
                  borderRadius: '999px',
                  bgcolor: TEAL
                }
              }}
            />
          </Box>
        </>
      )}

      {children && (
        <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px solid #e5e7eb' }}>
          {children}
        </Box>
      )}
    </Paper>
  )
}

export default StageTracker
