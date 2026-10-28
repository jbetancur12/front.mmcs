import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Tab,
  Tabs,
  Typography
} from '@mui/material'
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined'
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import { toast } from 'react-hot-toast'
import { useCan } from '../../utils/functions'
import { PERMISSIONS } from 'src/constants/permissions'
import EquipmentSalesSequenceConfigDialog from './EquipmentSalesSequenceConfigDialog'
import {
  useEquipmentQuotation,
  useEquipmentQuotationDocuments,
  useEquipmentSalesMutations,
  useEquipmentSequenceConfig
} from '../../hooks/useEquipmentSales'
import {
  EQUIPMENT_QUOTATION_STATUS_TONES,
  EQUIPMENT_QUOTATION_STATUS_LABELS
} from '../../constants/equipmentSales'
import { EquipmentQuotationDocumentType } from '../../types/equipmentSales'
import EquipmentQuotationApprovalDialog, {
  EquipmentQuotationDecisionMode,
  EquipmentQuotationDecisionValues
} from './EquipmentQuotationApprovalDialog'
import EquipmentSalesDocumentsPanel from './EquipmentSalesDocumentsPanel'
import { EQUIPMENT_QUOTE_TERM_LABELS } from './equipmentQuoteTerms'

import StageTracker from 'src/Components/Common/StageTracker'
import StatusPill from 'src/Components/Common/StatusPill'
import {
  DetailCell,
  DetailField,
  DetailSection
} from 'src/Components/Common/DetailBlocks'
import { confirmDialog } from 'src/utils/confirm'
const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
})

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    : '—'

type DetailTab = 'summary' | 'items' | 'terms' | 'documents'

const detailTabs: readonly DetailTab[] = [
  'summary',
  'items',
  'terms',
  'documents'
]

const getStoredDetailTab = (quotationId?: string): DetailTab => {
  if (!quotationId || typeof window === 'undefined') return 'summary'
  const storedTab = window.sessionStorage.getItem(
    `equipment-quotation-detail-tab:${quotationId}`
  )
  return detailTabs.includes(storedTab as DetailTab)
    ? (storedTab as DetailTab)
    : 'summary'
}

const DetailTabPanel = ({
  value,
  tab,
  children
}: {
  value: DetailTab
  tab: DetailTab
  children: ReactNode
}) => {
  if (value !== tab) return null
  return <Box sx={{ pt: 3 }}>{children}</Box>
}

// Ciclo comercial de la cotización, en el orden en que ocurre.
const PIPELINE_STAGES = [
  'draft',
  'pending_approval',
  'approved',
  'ready_for_invoicing',
  'invoiced'
].map((key) => ({ key, label: EQUIPMENT_QUOTATION_STATUS_LABELS[key] }))

const EquipmentSalesDetailPage = () => {
  const navigate = useNavigate()
  const { quotationId } = useParams<{ quotationId?: string }>()
  const { data: quotation, isLoading } = useEquipmentQuotation(quotationId)
  const { data: documentsData } = useEquipmentQuotationDocuments(quotationId)
  const mutations = useEquipmentSalesMutations()
  const [decisionMode, setDecisionMode] =
    useState<EquipmentQuotationDecisionMode | null>(null)
  const [isSequenceDialogOpen, setIsSequenceDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<DetailTab>(() =>
    getStoredDetailTab(quotationId)
  )
  const canResetSequence = useCan(PERMISSIONS.SALES_CONFIG_SEQUENCE_RESET)

  useEffect(() => {
    setActiveTab(getStoredDetailTab(quotationId))
  }, [quotationId])

  useEffect(() => {
    if (!quotationId) return
    window.sessionStorage.setItem(
      `equipment-quotation-detail-tab:${quotationId}`,
      activeTab
    )
  }, [activeTab, quotationId])

  // Cada acción se muestra según la capacidad que el backend le pide a su endpoint
  const canEdit = useCan(PERMISSIONS.SALES_CONFIG_MANAGE)
  const canUpdate = useCan(PERMISSIONS.SALES_QUOTATION_UPDATE)
  const canWorkflow = useCan(PERMISSIONS.SALES_QUOTATION_WORKFLOW)
  const canInvoice = useCan(PERMISSIONS.SALES_QUOTATION_INVOICE)
  const canUploadDocuments = useCan(PERMISSIONS.SALES_QUOTATION_DOCUMENT_UPLOAD)
  const canGeneratePdf = useCan(PERMISSIONS.SALES_QUOTATION_PDF)

  const { data: sequenceConfig } = useEquipmentSequenceConfig(canEdit)

  const documents = documentsData?.documents || []
  // Solo la version vigente del PDF oficial: al enviar se regenera y las
  // versiones previas (con marca BORRADOR) quedan como historico.
  const officialPdfVersions = documents.filter(
    (d) => d.documentType === 'quote_pdf'
  )
  const latestOfficialPdfVersion = officialPdfVersions.reduce(
    (max, document) => Math.max(max, document.version || 0),
    0
  )
  const officialPdfDocuments = officialPdfVersions.filter(
    (document) => (document.version || 0) === latestOfficialPdfVersion
  )
  const decisionDocuments = documents.filter((d) =>
    ['approval_evidence', 'rejection_evidence'].includes(d.documentType)
  )
  const supportDocuments = documents.filter((d) =>
    ['request_evidence', 'supporting_attachment'].includes(d.documentType)
  )

  const handleRequestApproval = async () => {
    const result = await confirmDialog({ title: '¿Marcar la cotización como enviada al cliente?', confirmLabel: 'Sí, marcar como enviada', cancelLabel: 'Cancelar' })
    if (!result.isConfirmed || !quotation) return
    try {
      await mutations.requestApproval.mutateAsync(quotation.id)
      // Regenera el PDF oficial para que deje de llevar la marca de agua BORRADOR.
      try {
        await mutations.generateQuotePdf.mutateAsync(quotation.id)
      } catch (pdfError) {
        console.error(pdfError)
        toast.error('La cotización se envió, pero no se pudo regenerar el PDF.')
        return
      }
      toast.success('La cotización quedó marcada como enviada al cliente.')
    } catch (error) {
      console.error(error)
      toast.error('No pudimos enviar la cotización.')
    }
  }

  const handleDecisionSubmit = async (
    values: EquipmentQuotationDecisionValues
  ) => {
    if (!quotation) return
    try {
      let evidenceDocumentId: number | null = null

      if (values.evidenceFile) {
        const uploadedDocument = await mutations.uploadDocument.mutateAsync({
          quotationId: String(quotation.id),
          file: values.evidenceFile,
          documentType: (decisionMode === 'approve'
            ? 'approval_evidence'
            : decisionMode === 'reject'
              ? 'rejection_evidence'
              : 'supporting_attachment') as EquipmentQuotationDocumentType,
          title:
            decisionMode === 'approve'
              ? `Aprobación cliente ${quotation.quoteCode}`
              : decisionMode === 'reject'
                ? `Rechazo cliente ${quotation.quoteCode}`
                : `Solicitud modificación cliente ${quotation.quoteCode}`,
          notes: values.notes?.trim() || undefined
        })
        evidenceDocumentId = uploadedDocument.id
      }

      const decisionIsoDate = values.decisionDate
        ? new Date(`${values.decisionDate}T12:00:00`).toISOString()
        : undefined

      if (decisionMode === 'approve') {
        await mutations.approveQuotation.mutateAsync({
          quotationId: quotation.id,
          approvalChannel: values.approvalChannel.trim(),
          approvalReference: values.approvalReference.trim(),
          approvalNotes: values.notes.trim() || null,
          approvedAt: decisionIsoDate,
          evidenceDocumentId
        })
        toast.success('La aprobación del cliente quedó registrada.')
      }

      if (decisionMode === 'reject') {
        await mutations.rejectQuotation.mutateAsync({
          quotationId: quotation.id,
          approvalChannel: values.approvalChannel.trim(),
          approvalReference: values.approvalReference.trim() || null,
          rejectionReason: values.notes.trim(),
          rejectedAt: decisionIsoDate,
          evidenceDocumentId
        })
        toast.success('El rechazo del cliente quedó registrado.')
      }

      if (decisionMode === 'request_changes') {
        await mutations.requestChanges.mutateAsync({
          quotationId: quotation.id,
          approvalChannel: values.approvalChannel.trim(),
          approvalReference: values.approvalReference.trim() || null,
          changeRequestReason: values.notes.trim(),
          requestedAt: decisionIsoDate,
          evidenceDocumentId
        })
        toast.success(
          'La solicitud de modificación del cliente quedó registrada.'
        )
      }

      setDecisionMode(null)
    } catch (error) {
      console.error(error)
      toast.error(
        decisionMode === 'approve'
          ? 'No pudimos registrar la aprobación del cliente.'
          : decisionMode === 'reject'
            ? 'No pudimos registrar el rechazo del cliente.'
            : 'No pudimos registrar la solicitud de modificación.'
      )
    }
  }

  const handleGenerateQuotePdf = async () => {
    if (!quotation) return
    try {
      const document = await mutations.generateQuotePdf.mutateAsync(
        quotation.id
      )
      toast.success('La cotización PDF quedó generada.')
      await handleDownloadDocument(
        document.id,
        document.originalFileName || `cotizacion-${quotation.quoteCode}.pdf`
      )
    } catch (error) {
      console.error(error)
      toast.error('No pudimos generar la cotización PDF.')
    }
  }

  const handleDownloadDocument = async (
    documentId: number,
    fileName: string
  ) => {
    try {
      const blob = await mutations.downloadDocument.mutateAsync({
        quotationId: String(quotationId),
        documentId: String(documentId)
      })
      const objectUrl = window.URL.createObjectURL(blob as Blob)
      const anchor = window.document.createElement('a')
      anchor.href = objectUrl
      anchor.download = fileName
      anchor.click()
      window.URL.revokeObjectURL(objectUrl)
    } catch (error) {
      console.error(error)
      toast.error('No pudimos descargar el documento.')
    }
  }

  const handleViewDocument = async (documentId: number) => {
    try {
      const blob = await mutations.downloadDocument.mutateAsync({
        quotationId: String(quotationId),
        documentId: String(documentId)
      })
      const objectUrl = window.URL.createObjectURL(blob as Blob)
      window.open(objectUrl, '_blank', 'noopener,noreferrer')
    } catch (error) {
      console.error(error)
      toast.error('No pudimos abrir el documento.')
    }
  }

  const handleReadyForInvoice = async () => {
    const result = await confirmDialog({ title: '¿Marcar esta cotización como lista para facturar?', confirmLabel: 'Sí, continuar', cancelLabel: 'Cancelar' })
    if (!result.isConfirmed || !quotation) return
    try {
      await mutations.readyForInvoice.mutateAsync(quotation.id)
      toast.success('La cotización quedó lista para facturar.')
    } catch (error) {
      console.error(error)
      toast.error('No pudimos marcar la cotización.')
    }
  }

  const handleInvoice = async () => {
    const result = await confirmDialog({ title: '¿Marcar esta cotización como facturada?', confirmLabel: 'Sí, facturar', cancelLabel: 'Cancelar' })
    if (!result.isConfirmed || !quotation) return
    try {
      await mutations.invoiceQuotation.mutateAsync(quotation.id)
      toast.success('La cotización quedó facturada.')
    } catch (error) {
      console.error(error)
      toast.error('No pudimos facturar la cotización.')
    }
  }

  const handleCancel = async () => {
    const reason = window.prompt('Motivo de cancelación (opcional):')
    if (reason === null || !quotation) return
    try {
      await mutations.cancelQuotation.mutateAsync({
        id: quotation.id,
        reason: reason || undefined
      })
      toast.success('La cotización quedó cancelada.')
    } catch (error) {
      console.error(error)
      toast.error('No pudimos cancelar la cotización.')
    }
  }

  const isBusy =
    mutations.requestApproval.isLoading ||
    mutations.approveQuotation.isLoading ||
    mutations.rejectQuotation.isLoading ||
    mutations.requestChanges.isLoading ||
    mutations.generateQuotePdf.isLoading ||
    mutations.uploadDocument.isLoading ||
    mutations.downloadDocument.isLoading

  if (isLoading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='55vh'
      >
        <CircularProgress />
      </Box>
    )
  }

  if (!quotation) {
    return (
      <Box p={3}>
        <Alert severity='warning'>Cotización no encontrada</Alert>
      </Box>
    )
  }

  const quoteTerms = quotation.quoteTerms || {}
  const termEntries = Object.entries(quoteTerms).filter(
    ([, value]) => value && String(value).trim()
  )
  const latestChangeRequest =
    quotation.otherFields?.latestChangeRequest &&
    typeof quotation.otherFields.latestChangeRequest === 'object' &&
    !Array.isArray(quotation.otherFields.latestChangeRequest)
      ? (quotation.otherFields.latestChangeRequest as Record<string, unknown>)
      : null

  return (
    <Box
      sx={{
        px: { xs: 2, md: 3 },
        py: { xs: 2, md: 3 },
        minHeight: '100vh',
        backgroundColor: '#f8fafb'
      }}
    >

      {/* ── Header banner ── */}
      <Box
        sx={{
          background:
            'linear-gradient(135deg, #0f766e 0%, #059669 50%, #047857 100%)',
          borderRadius: '20px',
          p: { xs: 3, md: 4 },
          mb: 3,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent='space-between'
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
        >
          <Box>
            <Button
              startIcon={<ArrowBackOutlinedIcon />}
              onClick={() => navigate('/equipment-sales')}
              sx={{
                mb: 1,
                color: 'rgba(255,255,255,0.8)',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: '10px',
                fontSize: '0.85rem',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.10)',
                  color: '#fff'
                }
              }}
            >
              Volver
            </Button>
            <Typography
              variant='h4'
              fontWeight={800}
              sx={{
                color: '#fff',
                lineHeight: 1.15,
                letterSpacing: '-0.025em',
                fontSize: { xs: '1.6rem', md: '2rem' }
              }}
            >
              {quotation.quoteCode}
            </Typography>
            <Typography
              variant='body2'
              sx={{
                mt: 1,
                color: 'rgba(255,255,255,0.75)',
                lineHeight: 1.5,
                fontSize: '0.9rem'
              }}
            >
              {quotation.customer?.nombre || 'Cliente no especificado'}
              <br />
              Emitida el {formatDate(quotation.createdAt)}
              {quotation.createdBy ? ` por ${quotation.createdBy.nombre}` : ''}
              {quotation.approvalChannel
                ? `, aprobada vía ${quotation.approvalChannel}`
                : ''}
            </Typography>
          </Box>
          <Stack spacing={1} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
            <StatusPill
              label={EQUIPMENT_QUOTATION_STATUS_LABELS[quotation.status]}
              tone={
                EQUIPMENT_QUOTATION_STATUS_TONES[quotation.status] || 'idle'
              }
            />
            {quotation.otherFields?.quoteRevision ? (
              <Typography
                variant='caption'
                sx={{ color: 'rgba(255,255,255,0.7)' }}
              >
                Revisión {String(quotation.otherFields.quoteRevision)}
              </Typography>
            ) : null}
          </Stack>
        </Stack>
      </Box>

      {canEdit && sequenceConfig && !sequenceConfig.initialized ? (
        <Alert
          severity='warning'
          sx={{ mb: 3 }}
          action={
            <Button
              color='inherit'
              size='small'
              onClick={() => setIsSequenceDialogOpen(true)}
            >
              Configurar
            </Button>
          }
        >
          Sin consecutivo configurado: el código se genera automáticamente.
          Defínelo para que las cotizaciones sigan tu numeración.
        </Alert>
      ) : null}

      <StageTracker
        ariaLabel='Etapas de la cotización'
        current={quotation.status}
        stages={PIPELINE_STAGES}
        stopped={
          quotation.status === 'rejected'
            ? {
                title: 'Cotización rechazada por el cliente',
                message: 'La cotización no avanza a más etapas.'
              }
            : quotation.status === 'cancelled'
              ? {
                  title: 'Cotización cancelada',
                  message: 'La cotización no avanza a más etapas.'
                }
              : undefined
        }
      />

      {quotation.status === 'rejected' && quotation.rejectedReason ? (
        <Alert severity='error' sx={{ mb: 3 }}>
          <strong>Motivo de rechazo:</strong> {quotation.rejectedReason}
        </Alert>
      ) : null}

      {quotation.status === 'cancelled' && quotation.cancelledReason ? (
        <Alert severity='warning' sx={{ mb: 3 }}>
          <strong>Motivo de cancelación:</strong> {quotation.cancelledReason}
        </Alert>
      ) : null}

      {quotation.status === 'draft' && latestChangeRequest ? (
        <Alert severity='warning' sx={{ mb: 3 }}>
          El cliente pidió modificar esta cotización.
          {typeof latestChangeRequest.changeRequestReason === 'string'
            ? ` Motivo: ${latestChangeRequest.changeRequestReason}`
            : ''}
        </Alert>
      ) : null}

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card
            elevation={0}
            sx={{ borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)' }}
          >
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Tabs
                value={activeTab}
                onChange={(_, value: DetailTab) => setActiveTab(value)}
                variant='scrollable'
                allowScrollButtonsMobile
              >
                <Tab label='Resumen' value='summary' />
                <Tab
                  label={`Productos (${quotation.items?.length || 0})`}
                  value='items'
                />
                <Tab label='Términos' value='terms' />
                <Tab
                  label={`Documentos (${documents.length})`}
                  value='documents'
                />
              </Tabs>

              <DetailTabPanel value={activeTab} tab='summary'>
                <DetailSection title='Cliente y contacto'>
                  <DetailCell>
                    <DetailField label='Cliente'>
                      {quotation.customer?.nombre || 'Sin registrar'}
                    </DetailField>
                  </DetailCell>
                  <DetailCell>
                    <DetailField label='NIT'>
                      {quotation.customer?.identificacion || 'Sin registrar'}
                    </DetailField>
                  </DetailCell>
                  <DetailCell>
                    <DetailField label='Sede'>
                      {quotation.customerSite || 'Sin sede definida'}
                    </DetailField>
                  </DetailCell>
                  <DetailCell>
                    <DetailField label='Vía de solicitud'>
                      {quotation.requestChannel || 'Sin registrar'}
                    </DetailField>
                  </DetailCell>
                  <DetailCell>
                    <DetailField label='Contacto'>
                      {quotation.contactName || 'Sin registrar'}
                    </DetailField>
                  </DetailCell>
                  <DetailCell>
                    <DetailField label='Teléfono'>
                      {quotation.contactPhone || 'Sin registrar'}
                    </DetailField>
                  </DetailCell>
                  <DetailCell>
                    <DetailField label='Correo'>
                      {quotation.contactEmail || 'Sin registrar'}
                    </DetailField>
                  </DetailCell>
                  <DetailCell>
                    <DetailField label='Dirección'>
                      {[quotation.address, quotation.city, quotation.department]
                        .filter(Boolean)
                        .join(', ') || 'Sin registrar'}
                    </DetailField>
                  </DetailCell>
                  <DetailCell full>
                    <DetailField label='Creada por'>
                      {quotation.createdBy
                        ? `${quotation.createdBy.nombre} (${quotation.createdBy.email})`
                        : 'Sin registrar'}
                    </DetailField>
                  </DetailCell>
                </DetailSection>

                <DetailSection title='Condiciones comerciales'>
                  <DetailCell>
                    <DetailField label='Validez'>
                      {quotation.validityDays
                        ? `${quotation.validityDays} días`
                        : 'Sin registrar'}
                    </DetailField>
                  </DetailCell>
                  <DetailCell>
                    <DetailField label='Forma de pago'>
                      {quotation.paymentMethod || 'Sin registrar'}
                    </DetailField>
                  </DetailCell>
                  <DetailCell>
                    <DetailField label='Entrega'>
                      {quotation.deliveryTime || 'Sin registrar'}
                    </DetailField>
                  </DetailCell>
                  {quotation.warrantyTerms ? (
                    <DetailCell>
                      <DetailField label='Garantía'>
                        {quotation.warrantyTerms}
                      </DetailField>
                    </DetailCell>
                  ) : null}
                  {quotation.status === 'approved' &&
                  quotation.approvalReference ? (
                    <DetailCell full>
                      <DetailField label='Aprobación del cliente'>
                        {formatDate(quotation.acceptedAt)}, vía{' '}
                        {quotation.approvalChannel}
                        {quotation.approvalReference
                          ? ` (referencia ${quotation.approvalReference})`
                          : ''}
                      </DetailField>
                    </DetailCell>
                  ) : null}
                </DetailSection>
              </DetailTabPanel>

              <DetailTabPanel value={activeTab} tab='items'>
                <Typography variant='h6' fontWeight={800} sx={{ mb: 2 }}>
                  Productos cotizados ({quotation.items?.length || 0})
                </Typography>
                {quotation.items?.length ? (
                  <Stack spacing={1.5}>
                    {quotation.items.map((item, index) => (
                      <Box
                        key={item.id ?? index}
                        sx={{
                          border: '1px solid rgba(0,0,0,0.06)',
                          borderRadius: '12px',
                          p: 2
                        }}
                      >
                        <Stack
                          direction='row'
                          justifyContent='space-between'
                          alignItems='flex-start'
                          spacing={2}
                        >
                          <Box>
                            <Typography variant='body2' fontWeight={700}>
                              {index + 1}. {item.itemName}
                            </Typography>
                            {[item.brand, item.model].filter(Boolean).length ? (
                              <Typography
                                variant='caption'
                                color='text.secondary'
                              >
                                {[item.brand, item.model]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </Typography>
                            ) : null}
                            {item.characteristics ? (
                              <Typography
                                variant='caption'
                                color='text.secondary'
                                sx={{ display: 'block', mt: 0.5 }}
                              >
                                {item.characteristics}
                              </Typography>
                            ) : null}
                            {item.notes ? (
                              <Typography
                                variant='caption'
                                color='text.secondary'
                                sx={{ display: 'block', mt: 0.5 }}
                              >
                                {item.notes}
                              </Typography>
                            ) : null}
                            <Stack direction='row' spacing={1} sx={{ mt: 0.5 }}>
                              {item.warrantyMonths ? (
                                <Chip
                                  size='small'
                                  variant='outlined'
                                  label={`Garantía: ${item.warrantyMonths} meses`}
                                  sx={{
                                    height: 20,
                                    '& .MuiChip-label': { fontSize: '0.65rem' }
                                  }}
                                />
                              ) : null}
                              {item.deliveryTime ? (
                                <Chip
                                  size='small'
                                  variant='outlined'
                                  label={`Entrega: ${item.deliveryTime}`}
                                  sx={{
                                    height: 20,
                                    '& .MuiChip-label': { fontSize: '0.65rem' }
                                  }}
                                />
                              ) : null}
                            </Stack>
                          </Box>
                          <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                            <Typography variant='body2' color='text.secondary'>
                              {item.quantity} ×{' '}
                              {currencyFormatter.format(item.unitPrice)}
                              {Number(item.taxRate) > 0
                                ? ` · IVA ${item.taxRate}%`
                                : ''}
                            </Typography>
                            <Typography
                              variant='body2'
                              fontWeight={800}
                              sx={{ color: '#059669' }}
                            >
                              {currencyFormatter.format(item.total)}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Alert severity='info'>
                    Aún no hay productos registrados.
                  </Alert>
                )}
              </DetailTabPanel>

              <DetailTabPanel value={activeTab} tab='terms'>
                <Typography variant='h6' fontWeight={800} sx={{ mb: 2 }}>
                  Términos de la cotización
                </Typography>
                {termEntries.length ? (
                  <Stack spacing={2}>
                    {termEntries.map(([key, value]) => (
                      <Box key={key}>
                        <Typography
                          variant='subtitle2'
                          fontWeight={700}
                          sx={{ mb: 0.5 }}
                        >
                          {EQUIPMENT_QUOTE_TERM_LABELS[
                            key as keyof typeof EQUIPMENT_QUOTE_TERM_LABELS
                          ] || key}
                        </Typography>
                        <Box
                          sx={{
                            border: '1px solid rgba(0,0,0,0.08)',
                            borderRadius: '8px',
                            p: 1.5,
                            backgroundColor: '#fafafa'
                          }}
                          dangerouslySetInnerHTML={{ __html: String(value) }}
                        />
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Alert severity='info'>
                    Esta cotización no tiene términos registrados.
                  </Alert>
                )}
              </DetailTabPanel>

              <DetailTabPanel value={activeTab} tab='documents'>
                <EquipmentSalesDocumentsPanel
                  quoteCode={quotation.quoteCode}
                  hasCustomer={Boolean(quotation.customerId)}
                  hasItems={Boolean(quotation.items?.length)}
                  canUploadDocuments={canUploadDocuments}
                  canGenerateQuotePdf={
                    canGeneratePdf && quotation.status === 'draft'
                  }
                  officialPdfDocuments={officialPdfDocuments}
                  decisionDocuments={decisionDocuments}
                  supportDocuments={supportDocuments}
                  isBusy={isBusy}
                  onGenerateQuotePdf={handleGenerateQuotePdf}
                  onDownloadDocument={handleDownloadDocument}
                  onViewDocument={handleViewDocument}
                  onUploadDocument={async (payload) => {
                    await mutations.uploadDocument.mutateAsync({
                      quotationId: String(quotation.id),
                      ...payload
                    })
                  }}
                />
              </DetailTabPanel>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card
            elevation={0}
            sx={{
              position: 'sticky',
              top: 24,
              borderRadius: '16px',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
            }}
          >
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant='h6' fontWeight={800} sx={{ mb: 2 }}>
                Totales
              </Typography>
              <Stack spacing={1} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='body2' color='text.secondary'>
                    Subtotal
                  </Typography>
                  <Typography variant='body2' fontWeight={700}>
                    {currencyFormatter.format(quotation.subtotal)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='body2' color='text.secondary'>
                    IVA
                  </Typography>
                  <Typography variant='body2' fontWeight={700}>
                    {currencyFormatter.format(quotation.taxTotal)}
                  </Typography>
                </Box>
                {Number(quotation.discountTotal) > 0 ? (
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography variant='body2' color='text.secondary'>
                      Descuento
                    </Typography>
                    <Typography
                      variant='body2'
                      fontWeight={700}
                      sx={{ color: '#dc2626' }}
                    >
                      -{currencyFormatter.format(quotation.discountTotal)}
                    </Typography>
                  </Box>
                ) : null}
                <Box
                  sx={{
                    borderTop: '1px dashed rgba(0,0,0,0.12)',
                    pt: 1.5,
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >
                  <Typography variant='subtitle1' fontWeight={800}>
                    Total
                  </Typography>
                  <Typography
                    variant='h6'
                    fontWeight={800}
                    sx={{ color: '#059669' }}
                  >
                    {currencyFormatter.format(quotation.grandTotal)}
                  </Typography>
                </Box>
              </Stack>

              {quotation.status === 'draft' && (canWorkflow || canUpdate) ? (
                <Stack spacing={1}>
                  {canWorkflow ? (
                    <Button
                      variant='contained'
                      startIcon={<SendOutlinedIcon />}
                      onClick={handleRequestApproval}
                      disabled={isBusy}
                      sx={{
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 700
                      }}
                    >
                      Enviar cotización
                    </Button>
                  ) : null}
                  {canUpdate ? (
                    <Button
                      variant='outlined'
                      startIcon={<EditOutlinedIcon />}
                      onClick={() =>
                        navigate(`/equipment-sales/${quotation.id}/edit`)
                      }
                      disabled={isBusy}
                      sx={{
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 600
                      }}
                    >
                      Editar
                    </Button>
                  ) : null}
                </Stack>
              ) : null}

              {quotation.status === 'pending_approval' && canWorkflow ? (
                <Stack spacing={1}>
                  <Button
                    variant='contained'
                    color='success'
                    startIcon={<CheckCircleOutlineOutlinedIcon />}
                    onClick={() => setDecisionMode('approve')}
                    disabled={isBusy}
                    sx={{
                      borderRadius: '10px',
                      textTransform: 'none',
                      fontWeight: 700,
                      bgcolor: '#047857',
                      '&:hover': { bgcolor: '#065f46' }
                    }}
                  >
                    Registrar aprobación
                  </Button>
                  <Button
                    variant='outlined'
                    color='error'
                    startIcon={<BlockOutlinedIcon />}
                    onClick={() => setDecisionMode('reject')}
                    disabled={isBusy}
                    sx={{
                      borderRadius: '10px',
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                  >
                    Registrar rechazo
                  </Button>
                  <Button
                    variant='outlined'
                    onClick={() => setDecisionMode('request_changes')}
                    disabled={isBusy}
                    sx={{
                      borderRadius: '10px',
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                  >
                    Solicitar modificación
                  </Button>
                </Stack>
              ) : null}

              {quotation.status === 'approved' && canWorkflow ? (
                <Button
                  variant='contained'
                  color='success'
                  startIcon={<CheckCircleOutlineOutlinedIcon />}
                  onClick={handleReadyForInvoice}
                  disabled={isBusy}
                  fullWidth
                  sx={{
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 700,
                    bgcolor: '#047857',
                    '&:hover': { bgcolor: '#065f46' }
                  }}
                >
                  Marcar lista para facturar
                </Button>
              ) : null}

              {quotation.status === 'ready_for_invoicing' && canInvoice ? (
                <Button
                  variant='contained'
                  startIcon={<ReceiptLongOutlinedIcon />}
                  onClick={handleInvoice}
                  disabled={isBusy}
                  fullWidth
                  sx={{
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 700
                  }}
                >
                  Facturar
                </Button>
              ) : null}

              {quotation.status === 'draft' && canWorkflow ? (
                <Button
                  variant='text'
                  color='error'
                  startIcon={<BlockOutlinedIcon />}
                  onClick={handleCancel}
                  disabled={isBusy}
                  fullWidth
                  sx={{
                    mt: 1,
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  Cancelar cotización
                </Button>
              ) : null}

              {quotation.internalNotes ? (
                <Box sx={{ mt: 3 }}>
                  <Typography variant='subtitle2' fontWeight={700}>
                    Notas internas
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {quotation.internalNotes}
                  </Typography>
                </Box>
              ) : null}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <EquipmentQuotationApprovalDialog
        open={Boolean(decisionMode)}
        mode={decisionMode || 'approve'}
        quoteCode={quotation.quoteCode}
        isLoading={
          mutations.approveQuotation.isLoading ||
          mutations.rejectQuotation.isLoading ||
          mutations.requestChanges.isLoading
        }
        onClose={() => setDecisionMode(null)}
        onSubmit={handleDecisionSubmit}
      />

      <EquipmentSalesSequenceConfigDialog
        open={isSequenceDialogOpen}
        config={sequenceConfig}
        canResetSequence={canResetSequence}
        isLoading={mutations.upsertSequenceConfig.isLoading}
        onClose={() => setIsSequenceDialogOpen(false)}
        onSubmit={async (values) => {
          try {
            await mutations.upsertSequenceConfig.mutateAsync(values)
            toast.success('El consecutivo inicial quedó configurado.')
            setIsSequenceDialogOpen(false)
          } catch (error) {
            console.error(error)
            toast.error('No pudimos guardar la configuración.')
          }
        }}
      />
    </Box>
  )
}

export default EquipmentSalesDetailPage
