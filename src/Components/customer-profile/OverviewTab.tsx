import SignalLoader from 'src/Components/Common/SignalLoader'
import { CheckCircleOutline, Download } from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Typography
} from '@mui/material'
import React from 'react'
import { useNavigate } from 'react-router-dom'

import EmptyState from '../Common/EmptyState'
import StatusPill, { StatusPillTone } from '../Common/StatusPill'

import { useCustomerOverview } from './useCustomerProfileData'
import { TabValue } from './types'

interface OverviewTabProps {
  customerId?: string
  handleTabChange: (tab: TabValue) => void
  isDownloading: boolean
  handleDownloadOverviewReport: () => void
}

const cardSx = {
  height: '100%',
  borderRadius: '16px',
  border: '1px solid #e5e7eb',
  boxShadow: 'none'
}

const sectionTitle = (title: string, hint?: string) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant='h6' fontWeight={700} sx={{ color: '#111827' }}>
      {title}
    </Typography>
    {hint ? (
      <Typography variant='body2' color='text.secondary'>
        {hint}
      </Typography>
    ) : null}
  </Box>
)

const dueStatus = (date?: string): { tone: StatusPillTone; label: string } => {
  if (!date) return { tone: 'idle', label: 'Sin fecha' }
  return new Date(date) < new Date()
    ? { tone: 'error', label: 'Vencido' }
    : { tone: 'warning', label: 'Próximo a vencer' }
}

/**
 * Resumen del cliente: lo que vence primero y cómo se reparten los equipos
 * por sede. Los totales ya están en los indicadores de arriba.
 */
const OverviewTab: React.FC<OverviewTabProps> = ({
  customerId,
  handleTabChange,
  isDownloading,
  handleDownloadOverviewReport
}) => {
  const navigate = useNavigate()
  const { data, isLoading } = useCustomerOverview(customerId)
  const dueSoon = data?.files ?? []
  const headquarters = data?.headquarters ?? []
  const maxCount = Math.max(1, ...headquarters.map((hq) => hq.count))

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
          mb: 3
        }}
      >
        <Typography variant='h5' fontWeight={700} sx={{ color: '#111827' }}>
          Resumen del cliente
        </Typography>
        <Button
          variant='contained'
          startIcon={
            isDownloading ? (
              <CircularProgress size={16} color='inherit' />
            ) : (
              <Download />
            )
          }
          onClick={handleDownloadOverviewReport}
          disabled={isDownloading}
          sx={{
            bgcolor: '#00BFA5',
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 700,
            boxShadow: 'none',
            '&:hover': { bgcolor: '#00ACC1', boxShadow: 'none' }
          }}
        >
          {isDownloading ? 'Generando reporte…' : 'Descargar reporte'}
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card elevation={0} sx={cardSx}>
            <CardContent sx={{ p: 3 }}>
              {sectionTitle(
                'Vencen primero',
                'Equipos vencidos o que vencen en los próximos 30 días.'
              )}
              {isLoading ? (
                <SignalLoader size='small' />
              ) : dueSoon.length === 0 ? (
                <EmptyState
                  compact
                  icon={<CheckCircleOutline />}
                  title='Nada por vencer pronto'
                  hint='Ningún equipo está vencido ni vence en los próximos 30 días.'
                />
              ) : (
                <>
                  {dueSoon.map((file) => {
                    const status = dueStatus(file.nextCalibrationDate)
                    return (
                      <Box
                        key={file.id}
                        role='button'
                        tabIndex={0}
                        onClick={() =>
                          navigate(`/calibraciones/certificados/${file.id}`)
                        }
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            navigate(`/calibraciones/certificados/${file.id}`)
                          }
                        }}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 2,
                          px: 1.5,
                          py: 1.25,
                          mx: -1.5,
                          borderRadius: '10px',
                          cursor: 'pointer',
                          '&:hover': { bgcolor: '#f6fcfb' },
                          '&:focus-visible': {
                            outline: '2px solid #00BFA5',
                            outlineOffset: -2
                          },
                          '& + &': { borderTop: '1px solid #f3f4f6' }
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant='body2' fontWeight={600} noWrap>
                            {file.device?.name || 'Equipo sin nombre'}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {[
                              file.headquarter,
                              file.serie && `Serie ${file.serie}`
                            ]
                              .filter(Boolean)
                              .join(' · ') || 'Sin sede'}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            flexShrink: 0
                          }}
                        >
                          <Typography
                            variant='body2'
                            sx={{ fontVariantNumeric: 'tabular-nums' }}
                          >
                            {file.nextCalibrationDate
                              ? new Date(
                                  file.nextCalibrationDate
                                ).toLocaleDateString('es-CO')
                              : '—'}
                          </Typography>
                          <StatusPill
                            size='small'
                            tone={status.tone}
                            label={status.label}
                          />
                        </Box>
                      </Box>
                    )
                  })}
                  {(data?.totalFiles ?? 0) > dueSoon.length ? (
                    <Button
                      onClick={() => handleTabChange('equipment')}
                      sx={{
                        mt: 1,
                        textTransform: 'none',
                        fontWeight: 600,
                        color: '#00695C'
                      }}
                    >
                      Ver los {data?.totalFiles} en Equipos
                    </Button>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card elevation={0} sx={cardSx}>
            <CardContent sx={{ p: 3 }}>
              {sectionTitle('Equipos por sede')}
              {isLoading ? (
                <SignalLoader size='small' />
              ) : headquarters.length === 0 ? (
                <Typography variant='body2' color='text.secondary'>
                  Este cliente aún no tiene equipos.
                </Typography>
              ) : (
                headquarters.map((hq) => (
                  <Box key={hq.name} sx={{ mb: 1.75 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 0.5
                      }}
                    >
                      <Typography variant='body2' fontWeight={600}>
                        {hq.name}
                      </Typography>
                      <Typography
                        variant='body2'
                        sx={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {hq.count.toLocaleString('es-CO')}
                      </Typography>
                    </Box>
                    <Box
                      role='img'
                      aria-label={`${hq.name}: ${hq.count} equipos`}
                      sx={{
                        height: 8,
                        borderRadius: '999px',
                        bgcolor: '#f3f4f6',
                        overflow: 'hidden'
                      }}
                    >
                      <Box
                        sx={{
                          height: '100%',
                          width: `${(hq.count / maxCount) * 100}%`,
                          bgcolor: '#00BFA5',
                          borderRadius: '999px'
                        }}
                      />
                    </Box>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default OverviewTab
