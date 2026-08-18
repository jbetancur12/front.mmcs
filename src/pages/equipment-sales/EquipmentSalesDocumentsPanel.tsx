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
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import {
  EQUIPMENT_QUOTATION_DOCUMENT_COLORS,
  EQUIPMENT_QUOTATION_DOCUMENT_LABELS
} from '../../constants/equipmentSales'
import {
  EquipmentQuotationDocument,
  EquipmentQuotationDocumentType
} from '../../types/equipmentSales'

const MANUAL_DOCUMENT_TYPES: EquipmentQuotationDocumentType[] = [
  'request_evidence',
  'approval_evidence',
  'rejection_evidence',
  'supporting_attachment'
]

interface EquipmentSalesDocumentsPanelProps {
  quoteCode: string
  hasCustomer: boolean
  hasItems: boolean
  canUploadDocuments?: boolean
  canGenerateQuotePdf?: boolean
  officialPdfDocuments: EquipmentQuotationDocument[]
  decisionDocuments: EquipmentQuotationDocument[]
  supportDocuments: EquipmentQuotationDocument[]
  isBusy?: boolean
  onGenerateQuotePdf: () => Promise<void> | void
  onDownloadDocument: (documentId: number, fileName: string) => Promise<void> | void
  onViewDocument: (documentId: number, fileName: string) => Promise<void> | void
  onUploadDocument: (payload: {
    file: File
    documentType: EquipmentQuotationDocumentType
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

const EquipmentSalesDocumentsPanel = ({
  quoteCode,
  hasCustomer,
  hasItems,
  canUploadDocuments = false,
  canGenerateQuotePdf = false,
  officialPdfDocuments,
  decisionDocuments,
  supportDocuments,
  isBusy = false,
  onGenerateQuotePdf,
  onDownloadDocument,
  onViewDocument,
  onUploadDocument
}: EquipmentSalesDocumentsPanelProps) => {
  const [selectedType, setSelectedType] =
    useState<EquipmentQuotationDocumentType>('supporting_attachment')
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
    if (!selectedFile) return
    await onUploadDocument({
      file: selectedFile,
      documentType: selectedType,
      title: title.trim() || undefined,
      notes: notes.trim() || undefined
    })
    resetUploadFields()
  }

  const renderDocumentList = (documents: EquipmentQuotationDocument[]) => {
    if (!documents.length) return null

    return (
      <List dense disablePadding>
        {documents.map((document) => (
          <ListItem
            key={document.id}
            disableGutters
            secondaryAction={
              <Stack direction='row' spacing={1}>
                <Button
                  size='small'
                  startIcon={<VisibilityOutlinedIcon />}
                  onClick={() =>
                    void onViewDocument(
                      document.id,
                      document.originalFileName || `${quoteCode}.pdf`
                    )
                  }
                  disabled={isBusy}
                >
                  Ver
                </Button>
                <Button
                  size='small'
                  startIcon={<DownloadOutlinedIcon />}
                  onClick={() =>
                    void onDownloadDocument(
                      document.id,
                      document.originalFileName || `${quoteCode}.pdf`
                    )
                  }
                  disabled={isBusy}
                >
                  Descargar
                </Button>
              </Stack>
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
                  {document.otherFields?.wasDraft ? (
                    <Chip size='small' color='warning' label='BORRADOR' />
                  ) : null}
                  <Chip
                    size='small'
                    color={EQUIPMENT_QUOTATION_DOCUMENT_COLORS[document.documentType]}
                    label={EQUIPMENT_QUOTATION_DOCUMENT_LABELS[document.documentType]}
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
      {canGenerateQuotePdf || officialPdfDocuments.some((d) => d.documentType === 'quote_pdf') ? (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
          <Button
            variant='outlined'
            startIcon={<PictureAsPdfOutlinedIcon />}
            onClick={() => void onGenerateQuotePdf()}
            disabled={isBusy || !hasItems || !hasCustomer || !canGenerateQuotePdf}
          >
            Generar cotización PDF
          </Button>
        </Stack>
      ) : null}

      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 3 }}>
        <Typography variant='h6' fontWeight={800} gutterBottom sx={{ mb: 2 }}>
          PDFs oficiales
        </Typography>
        {officialPdfDocuments.length ? (
          renderDocumentList(officialPdfDocuments)
        ) : (
          <Alert severity='info'>
            Aún no hay PDFs oficiales generados para esta cotización.
          </Alert>
        )}
      </Box>

      {canUploadDocuments ? (
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 3 }}>
          <Typography variant='h6' fontWeight={800} gutterBottom sx={{ mb: 2 }}>
            Cargar evidencia o soporte
          </Typography>
          <Stack spacing={2}>
            <TextField
              select
              fullWidth
              label='Tipo documental'
              value={selectedType}
              onChange={(event) =>
                setSelectedType(event.target.value as EquipmentQuotationDocumentType)
              }
              disabled={isBusy}
            >
              {MANUAL_DOCUMENT_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {EQUIPMENT_QUOTATION_DOCUMENT_LABELS[type]}
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
                  : 'Adjunta correo, captura, acta o cualquier soporte útil de la cotización.'}
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

      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 3 }}>
        <Typography variant='h6' fontWeight={800} gutterBottom sx={{ mb: 2 }}>
          Evidencias de decisión del cliente
        </Typography>
        {decisionDocuments.length ? (
          renderDocumentList(decisionDocuments)
        ) : (
          <Alert severity='info'>
            Aquí aparecen las evidencias de aprobación o rechazo de la cotización.
          </Alert>
        )}
      </Box>

      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 3 }}>
        <Typography variant='h6' fontWeight={800} gutterBottom sx={{ mb: 2 }}>
          Evidencias y soportes
        </Typography>
        {supportDocuments.length ? (
          renderDocumentList(supportDocuments)
        ) : (
          <Alert severity='info'>
            Aún no hay evidencias ni soportes asociados a la cotización.
          </Alert>
        )}
      </Box>
    </Stack>
  )
}

export default EquipmentSalesDocumentsPanel
