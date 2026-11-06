import { Alert, Box, LinearProgress, Typography } from '@mui/material'
import ReleaseStatusPill from 'src/Components/ReleaseCertificates/ReleaseStatusPill'
import { ReleaseStatus } from 'src/Components/ReleaseCertificates/ReleaseCertificates.types'
import { CalibrationServiceReleaseCertificates } from '../../types/calibrationService'
import { brand, neutral } from 'src/theme/designTokens'

interface CalibrationServiceReleaseCertificatesProps {
  summary?: CalibrationServiceReleaseCertificates | null
  cuts?: { id: number; cutCode: string }[]
}

/**
 * Certificados de este servicio que ya pasaron por «Certificados a liberar». Solo informa: no cambia el corte ni la
 * facturación, que siguen su propio flujo.
 */
const CalibrationServiceReleaseCertificatesCard = ({
  summary,
  cuts
}: CalibrationServiceReleaseCertificatesProps) => {
  if (!summary || summary.total === 0) return null
  const cutCodes = new Map((cuts ?? []).map((cut) => [cut.id, cut.cutCode]))
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
          bgcolor: neutral.border,
          '& .MuiLinearProgress-bar': { bgcolor: brand.main }
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
              flexWrap: 'wrap',
              gap: 1,
              py: 0.5
            }}
          >
            <Typography variant='body2' sx={{ minWidth: 0 }}>
              {[
                item.documentNumber ?? 'Sin número',
                item.instrument,
                item.serie,
                cutCodes.get(item.cutId ?? 0)
              ]
                .filter(Boolean)
                .join(' · ')}
            </Typography>
            <ReleaseStatusPill status={item.status as ReleaseStatus} />
            {item.observation && (
              <Typography
                variant='caption'
                color='error'
                sx={{ flexBasis: '100%' }}
              >
                Observación: {item.observation}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  )
}

export default CalibrationServiceReleaseCertificatesCard

/** Aviso arriba del servicio: certificados a los que el laboratorio les pidió ajustes. */
export const CalibrationServiceReleaseCertificatesAlert = ({
  summary
}: CalibrationServiceReleaseCertificatesProps) => {
  const flagged = (summary?.items ?? []).filter(
    (item) => item.status === 'requiere_ajustes'
  )
  if (flagged.length === 0) return null

  return (
    <Alert severity='warning' sx={{ mb: 2 }}>
      <Typography variant='body2' fontWeight={700}>
        {flagged.length === 1
          ? '1 certificado con observaciones del laboratorio'
          : `${flagged.length} certificados con observaciones del laboratorio`}
      </Typography>
      <Box component='ul' sx={{ m: 0, pl: 2 }}>
        {flagged.map((item) => (
          <li key={item.id}>
            <Typography variant='body2'>
              {item.documentNumber ?? 'Sin número'}
              {item.observation ? `: ${item.observation}` : ''}
            </Typography>
          </li>
        ))}
      </Box>
      <Typography variant='caption'>
        Quien lo cargó debe subir el PDF corregido en «Certificados a liberar».
      </Typography>
    </Alert>
  )
}
