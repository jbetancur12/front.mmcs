import { Box, Link, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { PERMISSIONS } from '../../../constants/permissions'
import { useCan } from '../../../utils/functions'
import { summarizeCutDeliveries } from './cutDeliveries'

interface Props {
  summary: ReturnType<typeof summarizeCutDeliveries>
}

/** Cómo se entregaron los certificados del corte; se registra en Pendientes › Entregas, aquí solo se muestra. */
const CutDeliverySummary = ({ summary }: Props) => {
  const canDeliver = useCan(PERMISSIONS.RELEASE_CERTIFICATE_RELEASE)

  return (
    <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
      {summary.lines.length ? (
        summary.lines.map((line) => (
          <Typography variant='body2' key={line}>
            {line}
          </Typography>
        ))
      ) : (
        <Typography variant='body2' color='text.secondary'>
          Todavía no se ha entregado ningún certificado.
        </Typography>
      )}
      {summary.sentTo && (
        <Typography variant='caption' color='text.secondary' display='block'>
          Entregado a: {summary.sentTo}
        </Typography>
      )}
      {summary.pending > 0 && (
        <Typography variant='body2' sx={{ mt: 1 }}>
          Por entregar: {summary.pending}.{' '}
          {canDeliver ? (
            <Link
              component={RouterLink}
              to='/calibration-services/pendientes?tab=entregas'
            >
              Registrar en Pendientes › Entregas
            </Link>
          ) : (
            'Lo registra la analista en Pendientes › Entregas.'
          )}
        </Typography>
      )}
    </Box>
  )
}

export default CutDeliverySummary
