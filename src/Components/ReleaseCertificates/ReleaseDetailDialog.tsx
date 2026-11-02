import React, { useEffect, useRef, useState } from 'react'
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
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material'
import SignalLoader from 'src/Components/Common/SignalLoader'
import useAxiosPrivate from '@utils/use-axios-private'
import { downloadPrivateFile } from '@utils/downloadBlob'
import { useStore } from '@nanostores/react'
import { hasPermission, PERMISSIONS } from 'src/constants/permissions'
import { userStore } from 'src/store/userStore'
import { getApiErrorReason } from 'src/utils/apiError'
import ReleaseEditForm from './ReleaseEditForm'
import ReleaseEquipmentDialog from './ReleaseEquipmentDialog'
import ReleaseSignatureDialog from './ReleaseSignatureDialog'
import {
  releaseFileUrl,
  ReleaseCorrections,
  useCustomerSuggestions,
  useMySignature,
  useSignReleaseCertificates,
  ReleaseReviewAction,
  useReleaseCertificate,
  useReleaseReview
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
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const axiosPrivate = useAxiosPrivate()
  const { data: certificate, isLoading } = useReleaseCertificate(certificateId)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const $userStore = useStore(userStore)
  const canReview = hasPermission(
    $userStore.permissions,
    PERMISSIONS.RELEASE_CERTIFICATE_REVIEW
  )
  const canUpload = hasPermission(
    $userStore.permissions,
    PERMISSIONS.RELEASE_CERTIFICATE_UPLOAD
  )
  const canRevert = hasPermission(
    $userStore.permissions,
    PERMISSIONS.RELEASE_CERTIFICATE_REVERT
  )
  const canSign = hasPermission(
    $userStore.permissions,
    PERMISSIONS.RELEASE_CERTIFICATE_SIGN
  )
  const canRelease = hasPermission(
    $userStore.permissions,
    PERMISSIONS.RELEASE_CERTIFICATE_RELEASE
  )
  const sign = useSignReleaseCertificates()
  const { data: mySignature } = useMySignature(canSign)
  const [signatureOpen, setSignatureOpen] = useState(false)
  const [releasing, setReleasing] = useState(false)
  const review = useReleaseReview()
  const versionInput = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState(false)
  const missingCustomer = Boolean(certificate && !certificate.customer)
  const { data: suggestions = [] } = useCustomerSuggestions(
    certificateId,
    missingCustomer && canReview
  )
  const [asking, setAsking] = useState(false)
  const [undoing, setUndoing] = useState<
    'discard' | 'reopen' | 'revert' | null
  >(null)
  const [observation, setObservation] = useState('')

  const run = (action: ReleaseReviewAction, done: string, after?: () => void) =>
    review.mutate(action, {
      onSuccess: () => {
        notify.success(done)
        after?.()
      },
      onError: (error) =>
        notify.error(
          'No se pudo completar la acción',
          getApiErrorReason(error) ?? undefined
        )
    })

  const signNow = () => {
    if (!certificate) return
    if (!mySignature?.configured) {
      notify.info(
        'Primero carga tu firma',
        'Se estampa en los certificados que firmas.'
      )
      setSignatureOpen(true)
      return
    }
    sign.mutate([certificate.id], {
      onSuccess: ([result]) =>
        result.ok
          ? notify.success('Certificado firmado')
          : notify.error('No se pudo firmar', result.error),
      onError: (error) =>
        notify.error('No se pudo firmar', getApiErrorReason(error) ?? undefined)
    })
  }

  const save = (data: ReleaseCorrections) =>
    certificate &&
    run({ type: 'correct', id: certificate.id, data }, 'Datos guardados', () =>
      setEditing(false)
    )

  useEffect(() => {
    setEditing(false)
    setAsking(false)
    setObservation('')
    setUndoing(null)
    setReleasing(false)
  }, [certificateId])

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
      fullScreen={fullScreen}
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
              {certificate.status === 'requiere_ajustes' &&
                certificate.history[0]?.observation && (
                  <Alert severity='error' sx={{ mb: 2 }}>
                    <Typography variant='body2' fontWeight={600}>
                      Ajustes pedidos
                    </Typography>
                    <Typography variant='body2'>
                      {certificate.history[0].observation}
                    </Typography>
                  </Alert>
                )}
              {!certificate.customer && !editing && (
                <Alert
                  severity='warning'
                  variant='outlined'
                  sx={{ mb: 2, borderWidth: 2 }}
                >
                  <Typography variant='body2' fontWeight={700}>
                    Cliente sin identificar en la plataforma
                  </Typography>
                  <Typography variant='body2' sx={{ mb: 1 }}>
                    El PDF dice «{certificate.customerName ?? 'sin dato'}».{' '}
                    {suggestions.length > 0
                      ? 'Puede que esté escrito distinto en la plataforma. ¿Es alguno de estos?'
                      : canReview
                        ? 'No hay un cliente parecido: puede que no exista todavía. Búscalo por otro nombre o créalo en Empresas.'
                        : 'Un analista debe identificarlo antes de verificar.'}
                  </Typography>
                  {canReview && (
                    <>
                      {suggestions.length > 0 && (
                        <Box
                          sx={{
                            display: 'flex',
                            gap: 1,
                            flexWrap: 'wrap',
                            mb: 1
                          }}
                        >
                          {suggestions.map((candidate) => (
                            <Chip
                              key={candidate.id}
                              clickable
                              color='warning'
                              variant='outlined'
                              disabled={
                                review.isLoading ||
                                ![
                                  'pendiente_revision',
                                  'requiere_ajustes'
                                ].includes(certificate.status)
                              }
                              label={candidate.nombre}
                              onClick={() =>
                                run(
                                  {
                                    type: 'correct',
                                    id: certificate.id,
                                    data: { customerId: candidate.id }
                                  },
                                  `Cliente identificado: ${candidate.nombre}`
                                )
                              }
                            />
                          ))}
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button size='small' onClick={() => setEditing(true)}>
                          Buscar otro cliente
                        </Button>
                        <Button
                          size='small'
                          component='a'
                          href='/customers'
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          Crear en Empresas
                        </Button>
                      </Box>
                    </>
                  )}
                </Alert>
              )}
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
              {editing && certificate ? (
                <ReleaseEditForm
                  certificate={certificate}
                  saving={review.isLoading}
                  onSave={save}
                  onCancel={() => setEditing(false)}
                />
              ) : (
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
                      value={
                        certificate.customer?.nombre ??
                        'Sin identificar en la plataforma'
                      }
                      warn={!certificate.customer}
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
                    <Field
                      label='Fabricante'
                      value={certificate.manufacturer}
                    />
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
              )}

              {certificate.status === 'liberado' && (
                <Alert
                  severity={
                    certificate.driveStatus === 'copiado'
                      ? 'success'
                      : certificate.driveStatus === 'error'
                        ? 'error'
                        : 'info'
                  }
                  sx={{ mt: 2 }}
                  action={
                    canRelease &&
                    (certificate.driveStatus === 'error' ||
                      !certificate.driveStatus) ? (
                      <Button
                        color='inherit'
                        size='small'
                        disabled={review.isLoading}
                        onClick={() =>
                          run(
                            { type: 'drive-retry', id: certificate.id },
                            'Copia al Drive en cola'
                          )
                        }
                      >
                        Copiar
                      </Button>
                    ) : undefined
                  }
                >
                  {certificate.driveStatus === 'copiado'
                    ? `En el Drive: ${certificate.drivePath}`
                    : certificate.driveStatus === 'pendiente'
                      ? 'Copia al Drive en curso' +
                        (certificate.driveError
                          ? ` (reintentando: ${certificate.driveError})`
                          : '')
                      : certificate.driveStatus === 'error'
                        ? `No se pudo copiar al Drive: ${certificate.driveError ?? 'error desconocido'}`
                        : 'Sin copia en el Drive (la conexión no estaba configurada)'}
                </Alert>
              )}

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
      {undoing === 'revert' && certificate && (
        <Box sx={{ px: 3, pt: 2 }}>
          <Alert severity='warning'>
            El equipo del cliente vuelve a como estaba antes de esta liberación
            (si lo creó, se elimina) y el certificado regresa a «
            {certificate.kind === 'principal' ? 'firmado' : 'verificado'}». La
            copia que ya se hizo en el Drive no se borra: hay que quitarla a
            mano si no corresponde.
          </Alert>
        </Box>
      )}
      {(asking || undoing) && certificate && (
        <Box sx={{ px: 3, pt: 2 }}>
          <TextField
            fullWidth
            multiline
            minRows={2}
            size='small'
            autoFocus
            label={
              undoing === 'discard'
                ? 'Motivo para descartar el certificado'
                : undoing === 'reopen'
                  ? 'Motivo para reabrir la revisión'
                  : undoing === 'revert'
                    ? 'Motivo para revertir la liberación'
                    : 'Observaciones para quien cargó el certificado'
            }
            value={observation}
            onChange={(event) => setObservation(event.target.value)}
            inputProps={{ maxLength: 2000 }}
          />
        </Box>
      )}
      <DialogActions sx={{ flexWrap: 'wrap', gap: 1 }}>
        <input
          ref={versionInput}
          type='file'
          accept='application/pdf,.pdf'
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file && certificate)
              run(
                { type: 'version', id: certificate.id, file },
                'PDF corregido cargado'
              )
          }}
        />
        {certificate &&
          canReview &&
          !editing &&
          !asking &&
          !undoing &&
          ['pendiente_revision', 'requiere_ajustes'].includes(
            certificate.status
          ) && (
            <Button
              onClick={() => setEditing(true)}
              disabled={review.isLoading}
            >
              Editar datos
            </Button>
          )}
        {certificate &&
          canReview &&
          !asking &&
          !undoing &&
          ['pendiente_revision', 'verificado'].includes(certificate.status) && (
            <Button
              color='error'
              onClick={() => setAsking(true)}
              disabled={review.isLoading || editing}
            >
              Pedir ajustes
            </Button>
          )}
        {asking && certificate && (
          <>
            <Button
              onClick={() => setAsking(false)}
              disabled={review.isLoading}
            >
              Cancelar
            </Button>
            <Button
              color='error'
              variant='contained'
              disabled={!observation.trim() || review.isLoading}
              onClick={() =>
                run(
                  { type: 'adjustments', id: certificate.id, observation },
                  'Se pidieron ajustes y se avisó al responsable',
                  () => {
                    setAsking(false)
                    setObservation('')
                  }
                )
              }
            >
              Enviar observaciones
            </Button>
          </>
        )}
        {certificate &&
          canUpload &&
          certificate.status === 'requiere_ajustes' && (
            <Button
              variant='outlined'
              onClick={() => versionInput.current?.click()}
              disabled={review.isLoading}
            >
              Subir PDF corregido
            </Button>
          )}
        {certificate &&
          canReview &&
          !asking &&
          !undoing &&
          certificate.status === 'pendiente_revision' && (
            <Button
              variant='contained'
              disabled={review.isLoading || editing}
              onClick={() =>
                run(
                  { type: 'verify', id: certificate.id },
                  'Certificado verificado'
                )
              }
              sx={{ bgcolor: '#00897B', '&:hover': { bgcolor: '#00695C' } }}
            >
              Verificar
            </Button>
          )}
        {certificate &&
          canSign &&
          !asking &&
          !undoing &&
          certificate.kind === 'principal' &&
          certificate.status === 'verificado' && (
            <Button
              variant='contained'
              disabled={sign.isLoading || editing}
              onClick={signNow}
              sx={{ bgcolor: '#00897B', '&:hover': { bgcolor: '#00695C' } }}
            >
              Firmar
            </Button>
          )}
        {certificate &&
          canRelease &&
          !asking &&
          !undoing &&
          !editing &&
          ((certificate.kind === 'principal' &&
            certificate.status === 'firmado') ||
            (certificate.kind !== 'principal' &&
              certificate.status === 'verificado')) && (
            <Button
              variant='contained'
              onClick={() => setReleasing(true)}
              sx={{ bgcolor: '#00BFA5', '&:hover': { bgcolor: '#00897B' } }}
            >
              Liberar
            </Button>
          )}
        {certificate &&
          !asking &&
          !undoing &&
          !editing &&
          (canReview || canUpload) &&
          [
            'pendiente_revision',
            'requiere_ajustes',
            'verificado',
            'firmado'
          ].includes(certificate.status) && (
            <Button
              color='error'
              onClick={() => setUndoing('discard')}
              disabled={review.isLoading}
            >
              Descartar
            </Button>
          )}
        {certificate &&
          canReview &&
          !asking &&
          !undoing &&
          !editing &&
          ['verificado', 'firmado', 'descartado'].includes(
            certificate.status
          ) && (
            <Button
              onClick={() => setUndoing('reopen')}
              disabled={review.isLoading}
            >
              {certificate.status === 'descartado'
                ? 'Restaurar (reabrir revisión)'
                : 'Reabrir revisión'}
            </Button>
          )}
        {certificate &&
          canRevert &&
          !asking &&
          !undoing &&
          certificate.status === 'liberado' && (
            <Button
              color='error'
              onClick={() => setUndoing('revert')}
              disabled={review.isLoading}
            >
              Revertir liberación
            </Button>
          )}
        {undoing && certificate && (
          <>
            <Button
              onClick={() => {
                setUndoing(null)
                setObservation('')
              }}
              disabled={review.isLoading}
            >
              Cancelar
            </Button>
            <Button
              color='error'
              variant='contained'
              disabled={!observation.trim() || review.isLoading}
              onClick={() =>
                run(
                  { type: undoing, id: certificate.id, observation },
                  undoing === 'discard'
                    ? 'Certificado descartado'
                    : undoing === 'reopen'
                      ? 'Revisión reabierta'
                      : 'Liberación revertida: el equipo volvió a como estaba',
                  () => {
                    setUndoing(null)
                    setObservation('')
                  }
                )
              }
            >
              {undoing === 'discard'
                ? 'Descartar certificado'
                : undoing === 'reopen'
                  ? 'Reabrir revisión'
                  : 'Revertir liberación'}
            </Button>
          </>
        )}
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
      <ReleaseSignatureDialog
        open={signatureOpen}
        onClose={() => setSignatureOpen(false)}
      />
      <ReleaseEquipmentDialog
        certificateId={releasing && certificate ? certificate.id : null}
        confirmOnly={false}
        releasing={review.isLoading}
        onClose={() => setReleasing(false)}
        onRelease={(target, saveEquivalence) =>
          certificate &&
          run(
            { type: 'release', id: certificate.id, target, saveEquivalence },
            'Certificado liberado y sincronizado con el equipo del cliente',
            () => setReleasing(false)
          )
        }
      />
    </Dialog>
  )
}

export default ReleaseDetailDialog
