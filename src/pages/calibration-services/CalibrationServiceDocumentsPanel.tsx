import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined'
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
  supportDocuments: CalibrationServiceDocument[]
  decisionDocuments: CalibrationServiceDocument[]
  isBusy?: boolean
  onGenerateQuotePdf: () => Promise<void> | void
  onGenerateOdsPdf: () => Promise<void> | void
  onDownloadDocument: (documentId: number, fileName: string) => Promise<void> | void
  onUploadDocument: (payload: {
    file: File
    documentType: ManualCalibrationDocumentType
    title?: string
    notes?: string
  }) => Promise<void>
}

const formatDateValue = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('es-CO') : 'Sin registrar'

const CalibrationServiceDocumentsPanel = ({
  serviceCode,
  hasCustomer,
  hasItems,
  hasOds,
  canUploadDocuments = false,
  canGenerateQuotePdf = false,
  canGenerateOdsPdf = false,
  officialPdfDocuments,
  supportDocuments,
  decisionDocuments,
  isBusy = false,
  onGenerateQuotePdf,
  onGenerateOdsPdf,
  onDownloadDocument,
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
    officialPdfDocuments.some((document) => document.documentType === 'quote_pdf')
  const showOdsPdfAction =
    canGenerateOdsPdf ||
    officialPdfDocuments.some((document) => document.documentType === 'ods_pdf')

  const renderDocumentList = (documents: CalibrationServiceDocument[]) => {
    if (!documents.length) {
      return null
    }

    return (
      <List dense disablePadding>
        {documents.map((document) => (
          <ListItem
            key={document.id}
            disableGutters
            secondaryAction={
              <Button
                size='small'
                startIcon={<DownloadOutlinedIcon />}
                onClick={() =>
                  void onDownloadDocument(
                    document.id,
                    document.originalFileName || `${serviceCode}.pdf`
                  )
                }
                disabled={isBusy}
              >
                Descargar
              </Button>
            }
          >
            <ListItemText
              primary={
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={1}
                  alignItems={{ xs: 'flex-start', md: 'center' }}
                >
                  <Typography variant='body2' fontWeight={600}>
                    {document.title || document.originalFileName}
                  </Typography>
                  <Chip
                    size='small'
                    color={CALIBRATION_SERVICE_DOCUMENT_COLORS[document.documentType]}
                    label={CALIBRATION_SERVICE_DOCUMENT_LABELS[document.documentType]}
                  />
                </Stack>
              }
              secondary={`v${document.version} · ${formatDateValue(document.uploadedAt)}`}
            />
          </ListItem>
        ))}
      </List>
    )
  }

  return (
    <Stack spacing={3}>
      {showQuotePdfAction || showOdsPdfAction ? (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
          {showQuotePdfAction ? (
            <Button
              variant='outlined'
              startIcon={<PictureAsPdfOutlinedIcon />}
              onClick={() => void onGenerateQuotePdf()}
              disabled={isBusy || !hasItems || !hasCustomer || !canGenerateQuotePdf}
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
            >
              Generar ODS PDF
            </Button>
          ) : null}
        </Stack>
      ) : null}

      <Box>
        <Typography variant='subtitle2' fontWeight={700} gutterBottom>
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
        <Box>
          <Typography variant='subtitle2' fontWeight={700} gutterBottom>
            Cargar evidencia o soporte
          </Typography>
          <Stack spacing={2}>
            <TextField
              select
              fullWidth
              label='Tipo documental'
              value={selectedType}
              onChange={(event) =>
                setSelectedType(event.target.value as ManualCalibrationDocumentType)
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

      <Box>
        <Typography variant='subtitle2' fontWeight={700} gutterBottom>
          Evidencias y soportes
        </Typography>
        {decisionDocuments.length ? (
          <Alert severity='success' sx={{ mb: 2 }}>
            Este servicio ya tiene {decisionDocuments.length} evidencia(s) de
            respuesta del cliente.
          </Alert>
        ) : null}
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
