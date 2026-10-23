import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Badge,
  Box,
  Button,
  IconButton,
  Popover,
  Tooltip,
  Typography
} from '@mui/material'
import { Notifications as NotificationsIcon } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

import StatusPill from '../Common/StatusPill'
import {
  daysText,
  priorityOf,
  toAlertRows,
  useEquipmentAlerts,
  useNewAlerts
} from './equipmentAlerts'

interface AlertsBellProps {
  email?: string | null
}

const BUCKETS = [
  { key: 'year', label: 'Más de 1 año vencidos', tone: 'error' },
  { key: 'months', label: '3 a 12 meses vencidos', tone: 'warning' },
  { key: 'recent', label: 'Menos de 3 meses', tone: 'idle' },
  { key: 'soon', label: 'Por vencer', tone: 'warning' }
] as const

/**
 * Campana de alertas de equipos. El globo rojo cuenta solo lo nuevo desde la
 * última vez que se abrió la página de alertas, para que se apague cuando no
 * hay nada que mirar; el panel muestra el total y lo más atrasado.
 */
const AlertsBell: React.FC<AlertsBellProps> = ({ email }) => {
  const navigate = useNavigate()
  const { data: equipments = [] } = useEquipmentAlerts()
  const rows = useMemo(() => toAlertRows(equipments), [equipments])
  const newAlerts = useNewAlerts(email, equipments)
  const newCount = newAlerts.length
  const total = rows.length
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  // La campana se mueve una sola vez cuando aparecen alertas nuevas
  const lastNewCount = useRef<number | null>(null)
  const [ringKey, setRingKey] = useState(0)
  useEffect(() => {
    if (lastNewCount.current !== null && newCount > lastNewCount.current) {
      setRingKey((key) => key + 1)
    }
    lastNewCount.current = newCount
  }, [newCount])

  const counts = useMemo(() => {
    const byBucket: Record<string, number> = {}
    rows.forEach((row) => {
      const { bucket } = priorityOf(row.worstDays)
      byBucket[bucket] = (byBucket[bucket] ?? 0) + 1
    })
    return {
      byBucket,
      calibrations: rows.filter((row) => row.isCalibrationDueSoon).length,
      inspections: rows.filter((row) => row.isInspectionDueSoon).length
    }
  }, [rows])

  const hasNew = newCount > 0
  const label = hasNew
    ? `${newCount} ${newCount === 1 ? 'equipo con alerta nueva' : 'equipos con alertas nuevas'}`
    : total > 0
      ? `Sin alertas nuevas · ${total} pendientes`
      : 'Sin alertas pendientes'

  const goToAlerts = () => {
    setAnchorEl(null)
    navigate('/datasheets/alerts')
  }

  return (
    <>
      <Tooltip title={label}>
        <IconButton
          aria-label={`Alertas de equipos: ${label}`}
          aria-haspopup='dialog'
          onClick={(event) => setAnchorEl(event.currentTarget)}
          sx={{
            color: hasNew ? '#b91c1c' : '#4b5563',
            '&:hover': { bgcolor: hasNew ? '#fef2f2' : '#f3f4f6' }
          }}
        >
          <Badge
            badgeContent={newCount}
            max={99}
            sx={{
              '& .MuiBadge-badge': {
                bgcolor: '#dc2626',
                color: '#ffffff',
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums'
              }
            }}
          >
            <NotificationsIcon
              key={ringKey}
              sx={{
                animation: ringKey > 0 ? 'bellRing .9s ease-in-out 1' : 'none',
                '@keyframes bellRing': {
                  '0%, 100%': { transform: 'rotate(0deg)' },
                  '15%, 45%, 75%': { transform: 'rotate(-12deg)' },
                  '30%, 60%': { transform: 'rotate(12deg)' }
                },
                '@media (prefers-reduced-motion: reduce)': {
                  animation: 'none'
                }
              }}
            />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            width: 380,
            maxWidth: 'calc(100vw - 24px)',
            borderRadius: '16px',
            mt: 1
          }
        }}
      >
        <Box sx={{ p: 2.5 }} role='dialog' aria-label='Alertas de equipos'>
          <Typography variant='h6' fontWeight={700} sx={{ color: '#111827' }}>
            Alertas de equipos
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            {total === 0
              ? 'Todas las calibraciones e inspecciones están al día.'
              : `${total} equipos · ${counts.calibrations} calibraciones · ${counts.inspections} inspecciones`}
            {hasNew ? ` · ${newCount} nuevas` : ''}
          </Typography>

          {total > 0 ? (
            <>
              <Box sx={{ display: 'grid', gap: 0.75, mb: 2 }}>
                {BUCKETS.filter(({ key }) => counts.byBucket[key]).map(
                  ({ key, label: bucketLabel, tone }) => (
                    <Box
                      key={key}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Typography variant='body2'>{bucketLabel}</Typography>
                      <StatusPill
                        size='small'
                        tone={tone}
                        label={String(counts.byBucket[key])}
                      />
                    </Box>
                  )
                )}
              </Box>

              <Typography
                variant='caption'
                fontWeight={700}
                sx={{
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}
              >
                Las más atrasadas
              </Typography>
              <Box sx={{ mt: 0.5, mb: 2 }}>
                {rows.slice(0, 5).map((row) => (
                  <Box
                    key={row.id}
                    role='button'
                    tabIndex={0}
                    onClick={() => {
                      setAnchorEl(null)
                      navigate(`/datasheets/${row.id}`)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        setAnchorEl(null)
                        navigate(`/datasheets/${row.id}`)
                      }
                    }}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 1.5,
                      px: 1,
                      py: 0.75,
                      mx: -1,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: '#f6fcfb' },
                      '&:focus-visible': {
                        outline: '2px solid #00BFA5',
                        outlineOffset: -2
                      }
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant='body2' fontWeight={600} noWrap>
                        {row.equipmentName}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {row.internalCode}
                      </Typography>
                    </Box>
                    <Typography
                      variant='caption'
                      sx={{
                        color: '#b91c1c',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        pt: 0.25
                      }}
                    >
                      {daysText(row.worstDays)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </>
          ) : null}

          <Button
            fullWidth
            variant='contained'
            onClick={goToAlerts}
            sx={{
              bgcolor: '#00BFA5',
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              boxShadow: 'none',
              '&:hover': { bgcolor: '#00ACC1', boxShadow: 'none' }
            }}
          >
            Ver todas las alertas
          </Button>
        </Box>
      </Popover>
    </>
  )
}

export default AlertsBell
