import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from 'react-query'
import { Alert, Box, Button, TextField, Typography } from '@mui/material'
import FormDialog, {
  FormDialogSection
} from '../../Components/Common/FormDialog'
import FileDropZone from '../../Components/Common/FileDropZone'
import {
  CalibrationService,
  CalibrationServiceCut
} from '../../types/calibrationService'
import CalibrationServiceCertificateRows from './CalibrationServiceCertificateRows'
import ReleaseUploadDialog from '../../Components/ReleaseCertificates/ReleaseUploadDialog'
import { releaseCertificatesEnabled } from '../../features/releaseCertificatesFlags'
import { CALIBRATION_SERVICE_QUERY_KEYS } from '../../hooks/useCalibrationServices'
import { PERMISSIONS } from '../../constants/permissions'
import { useCan } from '../../utils/functions'
import { CALIBRATION_SERVICE_CUT_DOCUMENT_STATUS_LABELS } from '../../constants/calibrationServices'
import { brand } from 'src/theme/designTokens'

interface CalibrationServiceCutDocumentControlDialogProps {
  open: boolean
  cut: CalibrationServiceCut
  /** Servicio del corte: permite subir certificados ya ligados a él. */
  service?: CalibrationService
  isLoading?: boolean
  onClose: () => void
  onSubmit: (values: {
    expectedCertificates: number
    uploadedCertificates: number
    reviewedCertificates: number
    sentCertificates: number
    sendChannel?: string | null
    sentTo?: string | null
    sentAt?: string | null
    evidenceFile?: File | null
    notes?: string | null
  }) => void | Promise<void>
}

const FULL_ROW = { gridColumn: { sm: '1 / -1' } }

const clampValue = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

/** Control documental de un corte: certificados cargados, revisados y enviados. */
const CalibrationServiceCutDocumentControlDialog = ({
  open,
  cut,
  service,
  isLoading = false,
  onClose,
  onSubmit
}: CalibrationServiceCutDocumentControlDialogProps) => {
  const [expectedCertificates, setExpectedCertificates] = useState(0)
  const [uploadedCertificates, setUploadedCertificates] = useState(0)
  const [reviewedCertificates, setReviewedCertificates] = useState(0)
  const [sentCertificates, setSentCertificates] = useState(0)
  const [sendChannel, setSendChannel] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [sentAt, setSentAt] = useState('')
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)
  const [notes, setNotes] = useState('')
  const [uploading, setUploading] = useState(false)
  const queryClient = useQueryClient()
  const canUploadCertificates =
    useCan(PERMISSIONS.RELEASE_CERTIFICATE_UPLOAD) &&
    releaseCertificatesEnabled &&
    Boolean(service)
  const cutCount = service?.cuts?.length ?? 1
  // Con varios cortes cuenta lo ligado a este corte; con uno solo, también lo que no tiene corte.
  const allItems = service?.releaseCertificates?.items ?? []
  const platformItems = allItems.filter(
    (item) => item.cutId === cut.id || (cutCount <= 1 && item.cutId === null)
  )
  const platform = {
    total: platformItems.length,
    released: platformItems.filter((item) => item.status === 'liberado').length
  }
  const withoutCut =
    cutCount > 1 ? allItems.filter((item) => item.cutId === null).length : 0
  const hasPlatform = platform.total > 0
  const canAutofill = hasPlatform
  const [manualCounts, setManualCounts] = useState(false)
  const autoCounts = canAutofill && !manualCounts
  const suggestedCertificates = useMemo(
    () =>
      (cut.items || []).reduce(
        (accumulator, item) => accumulator + (Number(item.quantity) || 0),
        0
      ),
    [cut.items]
  )

  useEffect(() => {
    if (!open) {
      return
    }

    const current = cut.otherFields?.documentControl
    setExpectedCertificates(
      current?.expectedCertificates || suggestedCertificates || 0
    )
    setUploadedCertificates(current?.uploadedCertificates || 0)
    setReviewedCertificates(current?.reviewedCertificates || 0)
    setSentCertificates(current?.sentCertificates || 0)
    setSendChannel(current?.sendChannel || '')
    setSentTo(current?.sentTo || '')
    setSentAt(
      current?.sentAt ? new Date(current.sentAt).toISOString().slice(0, 10) : ''
    )
    setEvidenceFile(null)
    setNotes(current?.notes || '')
    setManualCounts(false)
  }, [cut, open, suggestedCertificates])

  const normalizedUploaded = clampValue(
    autoCounts ? platform.total : uploadedCertificates,
    0,
    expectedCertificates
  )
  const normalizedReviewed = clampValue(
    autoCounts ? platform.released : reviewedCertificates,
    0,
    normalizedUploaded
  )
  const allReviewed =
    expectedCertificates > 0 && normalizedReviewed === expectedCertificates
  const pendingReview = Math.max(0, expectedCertificates - normalizedReviewed)
  const normalizedSent = clampValue(sentCertificates, 0, normalizedReviewed)

  const nextStatus = useMemo(() => {
    if (expectedCertificates > 0 && normalizedSent === expectedCertificates) {
      return 'sent'
    }
    if (
      expectedCertificates > 0 &&
      normalizedReviewed === expectedCertificates
    ) {
      return 'reviewed'
    }
    if (
      expectedCertificates > 0 &&
      normalizedUploaded === expectedCertificates
    ) {
      return 'certificates_ready'
    }
    if (normalizedUploaded > 0) {
      return 'certificates_partial'
    }
    return 'pending_certificates'
  }, [
    expectedCertificates,
    normalizedReviewed,
    normalizedSent,
    normalizedUploaded
  ])

  const handleSubmit = () => {
    void onSubmit({
      expectedCertificates,
      uploadedCertificates: normalizedUploaded,
      reviewedCertificates: normalizedReviewed,
      sentCertificates: normalizedSent,
      sendChannel: sendChannel.trim() || null,
      sentTo: sentTo.trim() || null,
      sentAt: sentAt ? new Date(`${sentAt}T12:00:00`).toISOString() : null,
      evidenceFile,
      notes: notes.trim() || null
    })
  }

  const numberField =
    (setter: (value: number) => void) =>
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setter(Math.max(0, Number(event.target.value) || 0))

  const linkedEvidence =
    cut.otherFields?.documentControl?.evidenceDocumentIds?.length

  return (
    <FormDialog
      open={open}
      onClose={isLoading ? () => undefined : onClose}
      title='Actualizar control documental'
      subtitle={cut.cutCode}
      submitLabel='Guardar control'
      onSubmit={handleSubmit}
      loading={isLoading}
      maxWidth='md'
    >
      <FormDialogSection
        title='Certificados'
        description={`Etapa resultante: ${CALIBRATION_SERVICE_CUT_DOCUMENT_STATUS_LABELS[nextStatus]}`}
      >
        <Box>
          <TextField
            fullWidth
            label='Esperados'
            type='number'
            value={expectedCertificates}
            onChange={numberField(setExpectedCertificates)}
            helperText={
              suggestedCertificates > 0
                ? `Sugerido: ${suggestedCertificates}, según lo liberado en el corte.`
                : 'Cuántos certificados esperas para este corte.'
            }
          />
          {suggestedCertificates > 0 &&
          expectedCertificates !== suggestedCertificates ? (
            <Button
              size='small'
              onClick={() => setExpectedCertificates(suggestedCertificates)}
              disabled={isLoading}
              sx={{ textTransform: 'none', color: brand.ink, mt: 0.5 }}
            >
              Usar sugerencia ({suggestedCertificates})
            </Button>
          ) : null}
        </Box>
        {(canUploadCertificates || platform) && (
          <Box
            sx={{
              ...FULL_ROW,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              flexWrap: 'wrap',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              p: 1.5
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant='body2' fontWeight={600}>
                {!hasPlatform
                  ? 'Aún no hay certificados cargados en la plataforma para este servicio.'
                  : allReviewed
                    ? `Los ${expectedCertificates} certificados están liberados: listos para enviar.`
                    : `${platform.released} de ${platform.total} cargados están liberados.`}
              </Typography>
              {hasPlatform && (
                <Typography
                  variant='caption'
                  color='text.secondary'
                  display='block'
                >
                  {autoCounts
                    ? 'Emitidos y revisados se toman de la plataforma.'
                    : 'Estás editando emitidos y revisados a mano.'}
                </Typography>
              )}
              {withoutCut > 0 && (
                <Typography
                  variant='caption'
                  color='warning.main'
                  display='block'
                >
                  Hay {withoutCut} certificado(s) del servicio sin corte
                  asignado: asígnalos en «Certificados a liberar» para que
                  cuenten en su corte.
                </Typography>
              )}
            </Box>
            {canUploadCertificates && (
              <Button
                size='small'
                variant='outlined'
                disabled={isLoading}
                onClick={() => setUploading(true)}
                sx={{
                  textTransform: 'none',
                  color: brand.ink,
                  borderColor: brand.main
                }}
              >
                Subir certificados
              </Button>
            )}
          </Box>
        )}
        <CalibrationServiceCertificateRows items={platformItems} />
        {platformItems.some((item) => item.status === 'requiere_ajustes') && (
          <Alert severity='warning' sx={FULL_ROW}>
            <Typography variant='body2' fontWeight={700}>
              Hay certificados con observaciones del laboratorio
            </Typography>
            <Typography variant='caption'>
              No cuentan como revisados hasta que se corrijan y se liberen.
            </Typography>
          </Alert>
        )}
        <Box
          sx={{
            ...FULL_ROW,
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
            alignItems: 'center'
          }}
        >
          {autoCounts ? null : (
            <Button
              size='small'
              variant='outlined'
              disabled={isLoading || expectedCertificates <= 0}
              onClick={() => {
                setUploadedCertificates(expectedCertificates)
                setReviewedCertificates(expectedCertificates)
              }}
              sx={{
                textTransform: 'none',
                color: brand.ink,
                borderColor: brand.main
              }}
            >
              Todos emitidos y revisados ({expectedCertificates})
            </Button>
          )}
          <Button
            size='small'
            variant='outlined'
            disabled={isLoading || !allReviewed}
            onClick={() => {
              if (!autoCounts) {
                setUploadedCertificates(expectedCertificates)
                setReviewedCertificates(expectedCertificates)
              }
              setSentCertificates(expectedCertificates)
            }}
            sx={{
              textTransform: 'none',
              color: brand.ink,
              borderColor: brand.main
            }}
          >
            Todos enviados ({expectedCertificates})
          </Button>
          {expectedCertificates > 0 && !allReviewed && (
            <Typography variant='caption' color='text.secondary'>
              Faltan {pendingReview} por revisar para poder enviarlos todos.
            </Typography>
          )}
          {canAutofill && (
            <Button
              size='small'
              onClick={() => setManualCounts((value) => !value)}
              sx={{ textTransform: 'none', color: brand.ink, ml: 'auto' }}
            >
              {manualCounts ? 'Usar los de la plataforma' : 'Editar a mano'}
            </Button>
          )}
        </Box>
        <TextField
          label='Emitidos'
          type='number'
          value={autoCounts ? normalizedUploaded : uploadedCertificates}
          onChange={numberField(setUploadedCertificates)}
          disabled={autoCounts}
          helperText={
            autoCounts
              ? 'Cargados en la plataforma.'
              : 'No pueden superar los esperados.'
          }
        />
        <TextField
          label='Revisados'
          type='number'
          value={autoCounts ? normalizedReviewed : reviewedCertificates}
          onChange={numberField(setReviewedCertificates)}
          disabled={autoCounts}
          helperText={
            autoCounts
              ? 'Liberados en la plataforma.'
              : 'No pueden superar los emitidos.'
          }
        />
        <TextField
          label='Enviados'
          type='number'
          value={sentCertificates}
          onChange={numberField(setSentCertificates)}
          helperText='No pueden superar los revisados.'
        />
      </FormDialogSection>

      <FormDialogSection title='Datos de envío'>
        <TextField
          label='Canal de envío'
          value={sendChannel}
          onChange={(event) => setSendChannel(event.target.value)}
          placeholder='Email, WhatsApp, físico, plataforma…'
          helperText='Obligatorio si ya hay certificados enviados.'
        />
        <TextField
          label='Fecha de envío'
          type='date'
          value={sentAt}
          onChange={(event) => setSentAt(event.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label='Destinatario'
          sx={FULL_ROW}
          value={sentTo}
          onChange={(event) => setSentTo(event.target.value)}
          placeholder='Nombre, correo o referencia de quien recibe'
        />
        <Box sx={FULL_ROW}>
          <FileDropZone
            file={evidenceFile}
            onFileSelected={setEvidenceFile}
            accept=''
            title='Arrastra el soporte de envío aquí o haz clic para elegirlo'
            hint='Cualquier archivo · máximo 10 MB'
            disabled={isLoading}
          />
          {!evidenceFile && linkedEvidence ? (
            <Typography variant='caption' color='text.secondary'>
              Soportes vinculados: {linkedEvidence}
            </Typography>
          ) : null}
        </Box>
      </FormDialogSection>

      <FormDialogSection title='Notas'>
        <TextField
          label='Notas documentales'
          sx={FULL_ROW}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          multiline
          minRows={3}
        />
      </FormDialogSection>
      {service && (
        <ReleaseUploadDialog
          open={uploading}
          onClose={() => setUploading(false)}
          initialCutId={cut.id}
          initialService={{
            id: service.id,
            serviceCode: service.serviceCode,
            status: service.status,
            customerId: service.customerId ?? null,
            customerName: null,
            certificates: {
              total: platform.total,
              released: platform.released
            }
          }}
          onUploaded={() =>
            queryClient.invalidateQueries(CALIBRATION_SERVICE_QUERY_KEYS.detail)
          }
        />
      )}
    </FormDialog>
  )
}

export default CalibrationServiceCutDocumentControlDialog
