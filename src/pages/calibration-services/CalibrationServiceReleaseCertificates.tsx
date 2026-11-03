import { Box, LinearProgress, Typography } from '@mui/material'
import ReleaseStatusPill from 'src/Components/ReleaseCertificates/ReleaseStatusPill'
import { ReleaseStatus } from 'src/Components/ReleaseCertificates/ReleaseCertificates.types'
import { CalibrationServiceReleaseCertificates } from '../../types/calibrationService'

interface CalibrationServiceReleaseCertificatesProps {
  summary?: CalibrationServiceReleaseCertificates | null
}

/**
 * Certificados de este servicio que ya pasaron por «Certificados a liberar». Solo informa: no cambia el corte ni la
 * facturación, que siguen su propio flujo.
 */
const CalibrationServiceReleaseCertificatesCard = ({
  summary
}: CalibrationServiceReleaseCertificatesProps) => {
  if (!summary || summary.total === 0) return null
  const percent = Math.round((summary.released / summary.total) * 100)

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 2,
        mb: 2
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 1,
          flexWrap: 'wrap'
        }}
      >
        <Typography variant='subtitle2' fontWeight={700}>
          Certificados del servicio
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          {summary.released} de {summary.total} liberados
        </Typography>
      </Box>
      <LinearProgress
        variant='determinate'
        value={percent}
        sx={{
          my: 1,
          height: 6,
          borderRadius: 3,
          bgcolor: '#e5e7eb',
          '& .MuiLinearProgress-bar': { bgcolor: '#00BFA5' }
        }}
      />
      <Box component='ul' sx={{ listStyle: 'none', p: 0, m: 0 }}>
        {summary.items.map((item) => (
          <Box
            component='li'
            key={item.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              py: 0.5
            }}
          >
            <Typography variant='body2' sx={{ minWidth: 0 }}>
              {[
                item.documentNumber ?? 'Sin número',
                item.instrument,
                item.serie
              ]
                .filter(Boolean)
                .join(' · ')}
            </Typography>
            <ReleaseStatusPill status={item.status as ReleaseStatus} />
          </Box>
        ))}
      </Box>
    </Box>
  )
}

export default CalibrationServiceReleaseCertificatesCard
