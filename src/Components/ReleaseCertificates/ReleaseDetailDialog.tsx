import React, { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Typography
} from '@mui/material'
import SignalLoader from 'src/Components/Common/SignalLoader'
import useAxiosPrivate from '@utils/use-axios-private'
import { downloadPrivateFile } from '@utils/downloadBlob'
import {
  releaseFileUrl,
  useReleaseCertificate
} from 'src/hooks/releaseCertificates/useReleaseCertificates'
import { notify } from 'src/utils/notify'
import ReleaseStatusPill from './ReleaseStatusPill'
import {
  RELEASE_KIND_LABELS,
  RELEASE_READ_LABELS,
  RELEASE_STATUS_LABELS
} from './ReleaseCertificates.types'

interface ReleaseDetailDialogProps {
  certificateId: number | null
  onClose: () => void
}

const formatDate = (value: string | null | undefined) =>
  value ? value.split('-').reverse().join('/') : '—'

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })

interface FieldProps {
  label: string
  value?: string | null
  warn?: boolean
}

const Field: React.FC<FieldProps> = ({ label, value, warn = false }) => (
  <Box>
    <Typography variant='caption' color='text.secondary'>
      {label}
    </Typography>
    <Typography
      variant='body2'
      sx={{
        fontWeight: 600,
        color: warn ? '#b45309' : undefined,
        wordBreak: 'break-word'
      }}
    >
      {value || '—'}
    </Typography>
  </Box>
)

/** Datos leídos del PDF, rarezas resaltadas, versiones e historial junto al visor del PDF. */
const ReleaseDetailDialog: React.FC<ReleaseDetailDialogProps> = ({
  certificateId,
  onClose
}) => {
  const axiosPrivate = useAxiosPrivate()
  const { data: certificate, isLoading } = useReleaseCertificate(certificateId)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  useEffect(() => {
    if (certificateId === null) return
    let url: string | null = null
    let cancelled = false
    setPdfUrl(null)
    axiosPrivate
      .get(releaseFileUrl(certificateId), { responseType: 'blob' })
      .then((response) => {
        if (cancelled) return
        url = window.URL.createObjectURL(
          new Blob([response.data], { type: 'application/pdf' })
        )
        setPdfUrl(url)
      })
      .catch(() => {
        if (!cancelled) notify.error('No se pudo abrir el PDF')
      })
    return () => {
      cancelled = true
      if (url) window.URL.revokeObjectURL(url)
    }
    // El visor se recarga solo cuando cambia el certificado abierto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certificateId])

  const warnFields = new Set(certificate?.anomalies.map((a) => a.field))
  const allCalibrationDates = certificate?.detected?.calibrationDates ?? []

  return (
    <Dialog
      open={certificateId !== null}
      onClose={onClose}
      fullWidth
      maxWidth='xl'
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          flexWrap: 'wrap'
        }}
      >
        {certificate?.documentNumber ?? 'Certificado sin número'}
        {certificate && <ReleaseStatusPill status={certificate.status} />}
        {certificate && (
          <Chip size='small' label={RELEASE_KIND_LABELS[certificate.kind]} />
        )}
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {isLoading || !certificate ? (
          <SignalLoader message='Cargando certificado' />
        ) : (
          <Grid container sx={{ minHeight: '70vh' }}>
            <Grid
              item
              xs={12}
              md={5}
              sx={{ p: 2.5, overflow: 'auto', maxHeight: '75vh' }}
            >
              {certificate.anomalies.length > 0 && (
                <Alert severity='warning' sx={{ mb: 2 }}>
                  <Typography variant='body2' fontWeight={600}>
                    Para revisar con el PDF
                  </Typography>
                  <Box component='ul' sx={{ m: 0, pl: 2.5 }}>
                    {certificate.anomalies.map((anomaly, index) => (
                      <li key={`${anomaly.code}-${index}`}>
                        <Typography variant='body2'>
                          {anomaly.message}
                        </Typography>
                      </li>
                    ))}
                  </Box>
                </Alert>
              )}
              <Typography variant='caption' color='text.secondary'>
                {RELEASE_READ_LABELS[certificate.readStatus]}. Los datos se
                leyeron del PDF; la analista los confirma o corrige.
              </Typography>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item xs={6}>
                  <Field
                    label='Cliente (solicitante)'
                    value={certificate.customerName}
                    warn={warnFields.has('customerName')}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Field
                    label='Cliente en la plataforma'
                    value={certificate.customer?.nombre ?? 'Sin identificar'}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Field
                    label='Instrumento'
                    value={certificate.instrument}
                    warn={warnFields.has('instrument')}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Field label='Magnitud' value={certificate.magnitude} />
                </Grid>
                <Grid item xs={6}>
                  <Field label='Fabricante' value={certificate.manufacturer} />
                </Grid>
                <Grid item xs={6}>
                  <Field label='Modelo' value={certificate.model} />
                </Grid>
                <Grid item xs={6}>
                  <Field
                    label='Serie'
                    value={certificate.serie}
                    warn={warnFields.has('serie')}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Field
                    label='Activo fijo (código interno)'
                    value={certificate.activoFijo}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Field label='Ubicación' value={certificate.location} />
                </Grid>
                <Grid item xs={6}>
                  <Field
                    label='Fecha de calibración'
                    value={formatDate(certificate.calibrationDate)}
                    warn={warnFields.has('calibrationDate')}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Field
                    label='Fecha de emisión'
                    value={formatDate(certificate.issueDate)}
                    warn={warnFields.has('issueDate')}
                  />
                </Grid>
                {allCalibrationDates.length > 1 && (
                  <Grid item xs={12}>
                    <Field
                      label='Todas las fechas de calibración del PDF'
                      value={allCalibrationDates.map(formatDate).join(' · ')}
                    />
                  </Grid>
                )}
              </Grid>

              <Divider sx={{ my: 2 }} />
              <Typography variant='subtitle2' gutterBottom>
                Versiones del PDF
              </Typography>
              {certificate.versions.map((version) => (
                <Box
                  key={version.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 1,
                    py: 0.25
                  }}
                >
                  <Typography variant='body2' sx={{ wordBreak: 'break-word' }}>
                    v{version.versionNumber} · {version.originalName}
                  </Typography>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    {formatDateTime(version.createdAt)}
                    {version.uploader ? ` · ${version.uploader.nombre}` : ''}
                  </Typography>
                </Box>
              ))}

              <Divider sx={{ my: 2 }} />
              <Typography variant='subtitle2' gutterBottom>
                Historial
              </Typography>
              {certificate.history.map((entry) => (
                <Box key={entry.id} sx={{ py: 0.5 }}>
                  <Typography variant='body2'>
                    {entry.fromStatus
                      ? `${RELEASE_STATUS_LABELS[entry.fromStatus]} → `
                      : ''}
                    <strong>{RELEASE_STATUS_LABELS[entry.toStatus]}</strong>
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {formatDateTime(entry.createdAt)}
                    {entry.user ? ` · ${entry.user.nombre}` : ''}
                    {entry.observation ? ` · ${entry.observation}` : ''}
                  </Typography>
                </Box>
              ))}
            </Grid>
            <Grid
              item
              xs={12}
              md={7}
              sx={{ bgcolor: '#f3f4f6', minHeight: 420 }}
            >
              {pdfUrl ? (
                <Box
                  component='iframe'
                  src={pdfUrl}
                  title={certificate.documentNumber ?? 'Certificado'}
                  sx={{
                    width: '100%',
                    height: '100%',
                    minHeight: '70vh',
                    border: 0
                  }}
                />
              ) : (
                <SignalLoader message='Abriendo PDF' />
              )}
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
        <Button
          variant='contained'
          disabled={!certificate}
          onClick={() =>
            certificate &&
            downloadPrivateFile(
              releaseFileUrl(certificate.id),
              `${certificate.documentNumber ?? 'certificado'}.pdf`
            ).catch(() => notify.error('No se pudo descargar el PDF'))
          }
          sx={{ bgcolor: '#00BFA5', '&:hover': { bgcolor: '#00897B' } }}
        >
          Descargar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ReleaseDetailDialog
