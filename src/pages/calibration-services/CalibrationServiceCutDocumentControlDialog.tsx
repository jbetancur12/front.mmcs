import { useEffect, useMemo, useState } from 'react'
import {
  Divider,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { CalibrationServiceCut } from '../../types/calibrationService'
import {
  CALIBRATION_SERVICE_CUT_DOCUMENT_STATUS_LABELS
} from '../../constants/calibrationServices'

interface CalibrationServiceCutDocumentControlDialogProps {
  open: boolean
  cut: CalibrationServiceCut
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

const clampValue = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

const CalibrationServiceCutDocumentControlDialog = ({
  open,
  cut,
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
  }, [cut, open, suggestedCertificates])

  const normalizedUploaded = clampValue(uploadedCertificates, 0, expectedCertificates)
  const normalizedReviewed = clampValue(reviewedCertificates, 0, normalizedUploaded)
  const normalizedSent = clampValue(sentCertificates, 0, normalizedReviewed)

  const nextStatus = useMemo(() => {
    if (expectedCertificates > 0 && normalizedSent === expectedCertificates) {
      return 'sent'
    }
    if (expectedCertificates > 0 && normalizedReviewed === expectedCertificates) {
      return 'reviewed'
    }
    if (expectedCertificates > 0 && normalizedUploaded === expectedCertificates) {
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

  return (
    <Dialog open={open} onClose={isLoading ? undefined : onClose} fullWidth maxWidth='sm'>
      <DialogTitle>Actualizar control documental</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Typography variant='body2' color='text.secondary'>
            {cut.cutCode} · controla cuántos certificados esperas, cuántos ya están
            cargados, revisados y enviados para este corte.
          </Typography>
          <TextField
            label='Certificados esperados'
            type='number'
            value={expectedCertificates}
            onChange={(event) =>
              setExpectedCertificates(Math.max(0, Number(event.target.value) || 0))
            }
            fullWidth
            helperText={
              suggestedCertificates > 0
                ? `Sugerencia automática: ${suggestedCertificates} según la cantidad liberada en este corte. Puedes ajustarlo si no todos requieren certificado.`
                : 'Define manualmente cuántos certificados esperas para este corte.'
            }
          />
          {suggestedCertificates > 0 ? (
            <Button
              variant='text'
              onClick={() => setExpectedCertificates(suggestedCertificates)}
              disabled={isLoading}
              sx={{ alignSelf: 'flex-start', mt: -1 }}
            >
              Usar sugerencia ({suggestedCertificates})
            </Button>
          ) : null}
          <TextField
            label='Certificados cargados'
            type='number'
            value={uploadedCertificates}
            onChange={(event) =>
              setUploadedCertificates(Math.max(0, Number(event.target.value) || 0))
            }
            fullWidth
            helperText='No puede superar los certificados esperados.'
          />
          <TextField
            label='Certificados revisados'
            type='number'
            value={reviewedCertificates}
            onChange={(event) =>
              setReviewedCertificates(Math.max(0, Number(event.target.value) || 0))
            }
            fullWidth
            helperText='No puede superar los certificados cargados.'
          />
          <TextField
            label='Certificados enviados'
            type='number'
            value={sentCertificates}
            onChange={(event) =>
              setSentCertificates(Math.max(0, Number(event.target.value) || 0))
            }
            fullWidth
            helperText='No puede superar los certificados revisados.'
          />
          <Divider flexItem />
          <Typography variant='subtitle2'>Datos de envío</Typography>
          <TextField
            label='Canal de envío'
            value={sendChannel}
            onChange={(event) => setSendChannel(event.target.value)}
            fullWidth
            placeholder='Email, WhatsApp, físico, plataforma...'
            helperText='Obligatorio cuando ya registras certificados enviados.'
          />
          <TextField
            label='Destinatario'
            value={sentTo}
            onChange={(event) => setSentTo(event.target.value)}
            fullWidth
            placeholder='Nombre, correo o referencia del receptor'
            helperText='Indica a quién se enviaron o entregaron los certificados.'
          />
          <TextField
            label='Fecha de envío'
            type='date'
            value={sentAt}
            onChange={(event) => setSentAt(event.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <Stack spacing={0.75}>
            <Button component='label' variant='outlined' disabled={isLoading}>
              Adjuntar soporte de envío
              <input
                hidden
                type='file'
                onChange={(event) =>
                  setEvidenceFile(event.target.files?.[0] || null)
                }
              />
            </Button>
            <Typography variant='caption' color='text.secondary'>
              {evidenceFile
                ? `Nuevo soporte: ${evidenceFile.name}`
                : cut.otherFields?.documentControl?.evidenceDocumentIds?.length
                  ? `Soportes vinculados: ${cut.otherFields.documentControl.evidenceDocumentIds.length}`
                  : 'Sin soporte cargado todavía.'}
            </Typography>
          </Stack>
          <TextField
            label='Notas documentales'
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            fullWidth
            multiline
            minRows={3}
          />
          <Typography variant='body2' color='text.secondary'>
            Etapa resultante:{' '}
            {CALIBRATION_SERVICE_CUT_DOCUMENT_STATUS_LABELS[nextStatus]}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button variant='contained' onClick={handleSubmit} disabled={isLoading}>
          Guardar control
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CalibrationServiceCutDocumentControlDialog
