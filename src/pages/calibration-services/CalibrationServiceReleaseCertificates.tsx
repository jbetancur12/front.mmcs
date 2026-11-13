import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  LinearProgress,
  Link,
  Typography
} from '@mui/material'
import { CloudUploadOutlined } from '@mui/icons-material'
import ReleaseUploadDialog from 'src/Components/ReleaseCertificates/ReleaseUploadDialog'
import { releaseCertificatesEnabled } from 'src/features/releaseCertificatesFlags'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from 'src/utils/functions'
import ReleaseStatusPill from 'src/Components/ReleaseCertificates/ReleaseStatusPill'
import { ReleaseStatus } from 'src/Components/ReleaseCertificates/ReleaseCertificates.types'
import {
  CalibrationService,
  CalibrationServiceReleaseCertificates
} from '../../types/calibrationService'
import { brand, neutral } from 'src/theme/designTokens'

interface CalibrationServiceReleaseCertificatesProps {
  summary?: CalibrationServiceReleaseCertificates | null
  cuts?: { id: number; cutCode: string }[]
  /** Con el servicio, se ofrece cargar certificados ya ligados a él. */
  service?: Pick<
    CalibrationService,
    'id' | 'serviceCode' | 'status' | 'customerId'
  > | null
}

const certificateHref = (id: number) => `/release-certificates?id=${id}`

/** Botón «Cargar certificados» con el servicio preelegido; solo con el permiso y el módulo encendido. */
const UploadForServiceButton = ({
  service,
  summary
}: {
  service?: CalibrationServiceReleaseCertificatesProps['service']
  summary?: CalibrationServiceReleaseCertificates | null
}) => {
  const [open, setOpen] = useState(false)
  const canUpload = useCan(PERMISSIONS.RELEASE_CERTIFICATE_UPLOAD)
  if (!service || !canUpload || !releaseCertificatesEnabled) return null
  return (
    <>
      <Button
        size='small'
        variant='outlined'
        startIcon={<CloudUploadOutlined />}
        onClick={() => setOpen(true)}
        sx={{
          textTransform: 'none',
          color: brand.ink,
          borderColor: brand.main
        }}
      >
        Cargar certificados
      </Button>
      <ReleaseUploadDialog
        open={open}
        onClose={() => setOpen(false)}
        initialService={{
          id: service.id,
          serviceCode: service.serviceCode,
          status: service.status,
          customerId: service.customerId ?? null,
          customerName: null,
          certificates: {
            total: summary?.total ?? 0,
            released: summary?.released ?? 0
          }
        }}
      />
    </>
  )
}

/** Número del certificado como enlace a la bandeja (abre su detalle). */
const CertificateLink = ({ id, label }: { id: number; label: string }) =>
  releaseCertificatesEnabled ? (
    <Link
      component={RouterLink}
      to={certificateHref(id)}
      underline='hover'
      sx={{ color: brand.ink }}
    >
      {label}
    </Link>
  ) : (
    <>{label}</>
  )

/**
 * Certificados de este servicio que ya pasaron por «Certificados a liberar». Solo informa: no cambia el corte ni la
 * facturación, que siguen su propio flujo.
 */
const CalibrationServiceReleaseCertificatesCard = ({
  summary,
  cuts,
  service
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant='body2' color='text.secondary'>
            {summary.released} de {summary.total} liberados
          </Typography>
          <UploadForServiceButton service={service} summary={summary} />
        </Box>
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
              <CertificateLink
                id={item.id}
                label={item.documentNumber ?? 'Sin número'}
              />
              {[item.instrument, item.serie, cutCodes.get(item.cutId ?? 0)]
                .filter(Boolean)
                .map((part) => ` · ${part}`)
                .join('')}
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
  summary,
  service
}: CalibrationServiceReleaseCertificatesProps) => {
  const flagged = (summary?.items ?? []).filter(
    (item) => item.status === 'requiere_ajustes'
  )
  if (flagged.length === 0) return null

  return (
    <Alert
      severity='warning'
      sx={{ mb: 2 }}
      action={<UploadForServiceButton service={service} summary={summary} />}
    >
      <Typography variant='body2' fontWeight={700}>
        {flagged.length === 1
          ? '1 certificado con observaciones del laboratorio'
          : `${flagged.length} certificados con observaciones del laboratorio`}
      </Typography>
      <Box component='ul' sx={{ m: 0, pl: 2 }}>
        {flagged.map((item) => (
          <li key={item.id}>
            <Typography variant='body2'>
              <CertificateLink
                id={item.id}
                label={item.documentNumber ?? 'Sin número'}
              />
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
