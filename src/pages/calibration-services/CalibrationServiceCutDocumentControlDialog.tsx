import { useEffect, useMemo, useState } from 'react'
import { Box, Button, TextField, Typography } from '@mui/material'
import FormDialog, {
  FormDialogSection
} from '../../Components/Common/FormDialog'
import FileDropZone from '../../Components/Common/FileDropZone'
import { CalibrationServiceCut } from '../../types/calibrationService'
import { CALIBRATION_SERVICE_CUT_DOCUMENT_STATUS_LABELS } from '../../constants/calibrationServices'

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

const FULL_ROW = { gridColumn: { sm: '1 / -1' } }

const clampValue = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

/** Control documental de un corte: certificados cargados, revisados y enviados. */
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

  const normalizedUploaded = clampValue(
    uploadedCertificates,
    0,
    expectedCertificates
  )
  const normalizedReviewed = clampValue(
    reviewedCertificates,
    0,
    normalizedUploaded
  )
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
              sx={{ textTransform: 'none', color: '#00695C', mt: 0.5 }}
            >
              Usar sugerencia ({suggestedCertificates})
            </Button>
          ) : null}
        </Box>
        <TextField
          label='Cargados'
          type='number'
          value={uploadedCertificates}
          onChange={numberField(setUploadedCertificates)}
          helperText='No pueden superar los esperados.'
        />
        <TextField
          label='Revisados'
          type='number'
          value={reviewedCertificates}
          onChange={numberField(setReviewedCertificates)}
          helperText='No pueden superar los cargados.'
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
    </FormDialog>
  )
}

export default CalibrationServiceCutDocumentControlDialog
