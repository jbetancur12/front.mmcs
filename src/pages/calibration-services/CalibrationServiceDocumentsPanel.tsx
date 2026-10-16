import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import {
  CALIBRATION_SERVICE_DOCUMENT_COLORS,
  CALIBRATION_SERVICE_DOCUMENT_LABELS
} from '../../constants/calibrationServices'
import { CalibrationServiceDocument } from '../../types/calibrationService'

type ManualCalibrationDocumentType =
  | 'request_evidence'
  | 'approval_evidence'
  | 'rejection_evidence'
  | 'supporting_attachment'

const MANUAL_DOCUMENT_TYPES: ManualCalibrationDocumentType[] = [
  'request_evidence',
  'approval_evidence',
  'rejection_evidence',
  'supporting_attachment'
]

interface CalibrationServiceDocumentsPanelProps {
  serviceCode: string
  hasCustomer: boolean
  hasItems: boolean
  hasOds: boolean
  canUploadDocuments?: boolean
  canGenerateQuotePdf?: boolean
  canGenerateOdsPdf?: boolean
  officialPdfDocuments: CalibrationServiceDocument[]
  adjustmentCustomerResponseDocuments: CalibrationServiceDocument[]
  supportDocuments: CalibrationServiceDocument[]
  decisionDocuments: CalibrationServiceDocument[]
  isBusy?: boolean
  onGenerateQuotePdf: () => Promise<void> | void
  onGenerateOdsPdf: () => Promise<void> | void
  onDownloadDocument: (
    documentId: number,
    fileName: string
  ) => Promise<void> | void
  onViewDocument: (documentId: number, fileName: string) => Promise<void> | void
  onUploadDocument: (payload: {
    file: File
    documentType: ManualCalibrationDocumentType
    title?: string
    notes?: string
  }) => Promise<void>
}

const formatDateValue = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Sin registrar'

const CalibrationServiceDocumentsPanel = ({
  serviceCode,
  hasCustomer,
  hasItems,
  hasOds,
  canUploadDocuments = false,
  canGenerateQuotePdf = false,
  canGenerateOdsPdf = false,
  officialPdfDocuments,
  adjustmentCustomerResponseDocuments,
  supportDocuments,
  decisionDocuments,
  isBusy = false,
  onGenerateQuotePdf,
  onGenerateOdsPdf,
  onDownloadDocument,
  onViewDocument,
  onUploadDocument
}: CalibrationServiceDocumentsPanelProps) => {
  const [selectedType, setSelectedType] =
    useState<ManualCalibrationDocumentType>('supporting_attachment')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')

  const resetUploadFields = () => {
    setSelectedFile(null)
    setTitle('')
    setNotes('')
    setSelectedType('supporting_attachment')
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      return
    }

    await onUploadDocument({
      file: selectedFile,
      documentType: selectedType,
      title: title.trim() || undefined,
      notes: notes.trim() || undefined
    })

    resetUploadFields()
  }

  const showQuotePdfAction =
    canGenerateQuotePdf ||
    officialPdfDocuments.some(
      (document) => document.documentType === 'quote_pdf'
    )
  const showOdsPdfAction =
    canGenerateOdsPdf ||
    officialPdfDocuments.some((document) => document.documentType === 'ods_pdf')

  const renderDocumentList = (
    unsortedDocuments: CalibrationServiceDocument[]
  ) => {
    if (!unsortedDocuments.length) {
      return null
    }

    // Más reciente primero; la versión vigente es la más alta de cada
    // documento (mismo tipo y título) cuando existen varias versiones.
    const documents = [...unsortedDocuments].sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )
    const documentKey = (document: CalibrationServiceDocument) =>
      `${document.documentType}|${document.title || document.originalFileName}`
    const latestVersionByKey = new Map<string, number>()
    const versionsByKey = new Map<string, number>()
    documents.forEach((document) => {
      const key = documentKey(document)
      latestVersionByKey.set(
        key,
        Math.max(latestVersionByKey.get(key) ?? 0, document.version)
      )
      versionsByKey.set(key, (versionsByKey.get(key) ?? 0) + 1)
    })

    return (
      <Stack spacing={1.25}>
        {documents.map((document) => {
          const key = documentKey(document)
          const hasVersions = (versionsByKey.get(key) ?? 0) > 1
          const isLatest = document.version === latestVersionByKey.get(key)
          const fileName = document.originalFileName || `${serviceCode}.pdf`

          return (
            <Paper
              key={document.id}
              variant='outlined'
              sx={{
                p: 1.5,
                borderRadius: '12px',
                borderColor: '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                opacity: hasVersions && !isLatest ? 0.7 : 1
              }}
            >
              <PictureAsPdfOutlinedIcon sx={{ color: '#00897B', flexShrink: 0 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant='body2' fontWeight={600} sx={{ wordBreak: 'break-word' }}>
                  {document.title || document.originalFileName}
                </Typography>
                <Stack direction='row' spacing={1} alignItems='center' useFlexGap flexWrap='wrap' sx={{ mt: 0.5 }}>
                  <Typography variant='caption' color='text.secondary'>
                    {`v${document.version} · ${formatDateValue(document.uploadedAt)}`}
                  </Typography>
                  {(document as CalibrationServiceDocument).otherFields?.wasDraft ? (
                    <Chip size='small' variant='outlined' color='warning' label='Borrador' />
                  ) : null}
                  <Chip
                    size='small'
                    variant='outlined'
                    color={CALIBRATION_SERVICE_DOCUMENT_COLORS[document.documentType]}
                    label={CALIBRATION_SERVICE_DOCUMENT_LABELS[document.documentType]}
                  />
                  {hasVersions ? (
                    <Chip
                      size='small'
                      variant={isLatest ? 'filled' : 'outlined'}
                      color={isLatest ? 'success' : 'default'}
                      label={isLatest ? 'Vigente' : 'Versión anterior'}
                    />
                  ) : null}
                </Stack>
              </Box>
              <Stack direction='row' spacing={0.5} sx={{ flexShrink: 0 }}>
                <Tooltip title='Ver'>
                  <span>
                    <IconButton
                      size='small'
                      aria-label={`Ver ${document.title || fileName}`}
                      onClick={() => void onViewDocument(document.id, fileName)}
                      disabled={isBusy}
                      sx={{ color: '#00897B' }}
                    >
                      <VisibilityOutlinedIcon fontSize='small' />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title='Descargar'>
                  <span>
                    <IconButton
                      size='small'
                      aria-label={`Descargar ${document.title || fileName}`}
                      onClick={() => void onDownloadDocument(document.id, fileName)}
                      disabled={isBusy}
                      sx={{ color: '#00897B' }}
                    >
                      <DownloadOutlinedIcon fontSize='small' />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            </Paper>
          )
        })}
      </Stack>
    )
  }

  return (
    <Stack spacing={3}>
      {showQuotePdfAction || showOdsPdfAction ? (
        <Stack direction='row' spacing={1} useFlexGap flexWrap='wrap'>
          {showQuotePdfAction ? (
            <Button
              variant='outlined'
              startIcon={<PictureAsPdfOutlinedIcon />}
              onClick={() => void onGenerateQuotePdf()}
              disabled={
                isBusy || !hasItems || !hasCustomer || !canGenerateQuotePdf
              }
              sx={{ color: '#00897B', borderColor: '#00BFA5', textTransform: 'none', fontWeight: 600, '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' } }}
            >
              Generar cotización PDF
            </Button>
          ) : null}
          {showOdsPdfAction ? (
            <Button
              variant='outlined'
              startIcon={<PictureAsPdfOutlinedIcon />}
              onClick={() => void onGenerateOdsPdf()}
              disabled={isBusy || !hasOds || !canGenerateOdsPdf}
              sx={{ color: '#00897B', borderColor: '#00BFA5', textTransform: 'none', fontWeight: 600, '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' } }}
            >
              Generar ODS PDF
            </Button>
          ) : null}
        </Stack>
      ) : null}

      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          p: 3
        }}
      >
        <Typography variant='h6' fontWeight={700} gutterBottom sx={{ mb: 2 }}>
          PDFs oficiales
        </Typography>
        {officialPdfDocuments.length ? (
          renderDocumentList(officialPdfDocuments)
        ) : (
          <Alert severity='info'>
            Aún no hay PDFs oficiales generados para este servicio.
          </Alert>
        )}
      </Box>

      {canUploadDocuments ? (
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            p: 3
          }}
        >
          <Typography variant='h6' fontWeight={700} gutterBottom sx={{ mb: 2 }}>
            Cargar evidencia o soporte
          </Typography>
          <Stack spacing={2}>
            <TextField
              select
              fullWidth
              label='Tipo documental'
              value={selectedType}
              onChange={(event) =>
                setSelectedType(
                  event.target.value as ManualCalibrationDocumentType
                )
              }
              disabled={isBusy}
            >
              {MANUAL_DOCUMENT_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {CALIBRATION_SERVICE_DOCUMENT_LABELS[type]}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label='Título'
              value={title}
              disabled={isBusy}
              onChange={(event) => setTitle(event.target.value)}
            />
            <TextField
              fullWidth
              multiline
              minRows={2}
              label='Notas'
              value={notes}
              disabled={isBusy}
              onChange={(event) => setNotes(event.target.value)}
            />
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={1}
              alignItems={{ xs: 'flex-start', md: 'center' }}
            >
              <Button
                component='label'
                variant='outlined'
                startIcon={<UploadFileOutlinedIcon />}
                disabled={isBusy}
                sx={{ color: '#00897B', borderColor: '#00BFA5', textTransform: 'none', fontWeight: 600, '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' } }}
              >
                Seleccionar archivo
                <input
                  hidden
                  type='file'
                  accept='.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx'
                  onChange={(event) =>
                    setSelectedFile(event.target.files?.[0] || null)
                  }
                />
              </Button>
              <Typography variant='body2' color='text.secondary'>
                {selectedFile
                  ? selectedFile.name
                  : 'Adjunta correo, captura, acta o cualquier soporte útil del servicio.'}
              </Typography>
            </Stack>
            <Button
              variant='contained'
              onClick={() => void handleUpload()}
              disabled={isBusy || !selectedFile}
              sx={{ bgcolor: '#00BFA5', textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#00ACC1' } }}
            >
              Subir documento
            </Button>
          </Stack>
        </Box>
      ) : (
        <Alert severity='info'>
          Tu rol actual puede consultar documentos, pero no cargar soportes en
          esta fase.
        </Alert>
      )}

      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          p: 3
        }}
      >
        <Typography variant='h6' fontWeight={700} gutterBottom sx={{ mb: 2 }}>
          Respuesta del cliente sobre novedades
        </Typography>
        {adjustmentCustomerResponseDocuments.length ? (
          <Alert severity='success' sx={{ mb: 2 }}>
            Este servicio ya tiene {adjustmentCustomerResponseDocuments.length}{' '}
            constancia(s) formal(es) de respuesta del cliente sobre novedades.
          </Alert>
        ) : (
          <Alert severity='info' sx={{ mb: 2 }}>
            Cuando el cliente responda una novedad desde el correo, de forma
            manual o por aceptación tácita, aquí verás la constancia PDF para
            auditoría.
          </Alert>
        )}
        {adjustmentCustomerResponseDocuments.length
          ? renderDocumentList(adjustmentCustomerResponseDocuments)
          : null}
      </Box>

      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          p: 3
        }}
      >
        <Typography variant='h6' fontWeight={700} gutterBottom sx={{ mb: 2 }}>
          Evidencias de decisión del servicio
        </Typography>
        {decisionDocuments.length
          ? renderDocumentList(decisionDocuments)
          : null}
        {!decisionDocuments.length ? (
          <Alert severity='info' sx={{ mb: 2 }}>
            Aquí aparecen las evidencias de aprobación o rechazo general de la
            cotización del servicio.
          </Alert>
        ) : null}
      </Box>

      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          p: 3
        }}
      >
        <Typography variant='h6' fontWeight={700} gutterBottom sx={{ mb: 2 }}>
          Evidencias y soportes
        </Typography>
        {supportDocuments.length ? (
          renderDocumentList(supportDocuments)
        ) : (
          <Alert severity='info'>
            Aún no hay evidencias ni soportes asociados al servicio.
          </Alert>
        )}
      </Box>
    </Stack>
  )
}

export default CalibrationServiceDocumentsPanel
