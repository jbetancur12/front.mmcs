import React from 'react'
import {
  Box,
  Card,
  CardContent,
  LinearProgress,
  Typography
} from '@mui/material'
import { CustomerIndicators } from 'src/types/customerIndicators'
import {
  TEAL,
  TEAL_TEXT,
  formatCount,
  formatDate,
  formatPct
} from './indicatorFormat'

const RING_SIZE = 148
const RING_STROKE = 14
const RADIUS = (RING_SIZE - RING_STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface Props {
  indicators: CustomerIndicators
}

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value
}) => (
  <Box
    sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.5 }}
  >
    <Typography variant='body2' color='text.secondary'>
      {label}
    </Typography>
    <Typography
      variant='body2'
      fontWeight={600}
      sx={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}
    >
      {value}
    </Typography>
  </Box>
)

/** Indicador 1: avance de la meta con anillo, resumen y barra con escala 0–meta. */
const IndicatorGoalProgressCard: React.FC<Props> = ({ indicators }) => {
  const { goal, calibrated, pending, progressPct, lastCalibrationDate } =
    indicators
  const filled = Math.min(Math.max(progressPct ?? 0, 0), 100)

  return (
    <Card
      elevation={0}
      sx={{ height: '100%', borderRadius: '16px', border: '1px solid #e5e7eb' }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant='h6' fontWeight='bold' gutterBottom>
          Avance de la meta
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            gap: 3,
            mt: 2
          }}
        >
          <Box
            role='img'
            aria-label={
              progressPct === null
                ? 'Sin meta para calcular el avance'
                : `Avance de la meta: ${formatPct(progressPct)}`
            }
            sx={{
              position: 'relative',
              width: RING_SIZE,
              height: RING_SIZE,
              flexShrink: 0
            }}
          >
            <svg width={RING_SIZE} height={RING_SIZE} aria-hidden>
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                fill='none'
                stroke='#e5e7eb'
                strokeWidth={RING_STROKE}
              />
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                fill='none'
                stroke={TEAL}
                strokeWidth={RING_STROKE}
                strokeLinecap='round'
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE * (1 - filled / 100)}
                transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography
                variant={progressPct === null ? 'subtitle1' : 'h4'}
                fontWeight='bold'
                sx={{ color: TEAL_TEXT, fontVariantNumeric: 'tabular-nums' }}
              >
                {formatPct(progressPct)}
              </Typography>
              {progressPct !== null && (
                <Typography variant='caption' color='text.secondary'>
                  de la meta
                </Typography>
              )}
            </Box>
          </Box>
          <Box sx={{ flex: 1, width: '100%' }}>
            <Row label='Meta' value={formatCount(goal.value)} />
            <Row label='Calibrados' value={formatCount(calibrated)} />
            <Row label='Pendientes' value={formatCount(pending)} />
            <Row
              label='Último certificado'
              value={formatDate(lastCalibrationDate)}
            />
          </Box>
        </Box>
        {goal.value > 0 && (
          <Box sx={{ mt: 3 }}>
            <LinearProgress
              variant='determinate'
              value={filled}
              aria-label='Avance frente a la meta'
              sx={{
                height: 10,
                borderRadius: 5,
                bgcolor: '#e5e7eb',
                '& .MuiLinearProgress-bar': { bgcolor: TEAL, borderRadius: 5 }
              }}
            />
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}
            >
              <Typography variant='caption' color='text.secondary'>
                0
              </Typography>
              <Typography
                variant='caption'
                color='text.secondary'
                sx={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatCount(goal.value)}
              </Typography>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default IndicatorGoalProgressCard
