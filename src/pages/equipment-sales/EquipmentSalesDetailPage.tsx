import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '@nanostores/react'
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
  Typography
} from '@mui/material'
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined'
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import { Toaster, toast } from 'react-hot-toast'
import { userStore } from 'src/store/userStore'
import { useHasRole } from '../../utils/functions'
import EquipmentSalesSequenceConfigDialog from './EquipmentSalesSequenceConfigDialog'
import {
  useEquipmentQuotation,
  useEquipmentQuotationDocuments,
  useEquipmentSalesMutations,
  useEquipmentSequenceConfig
} from '../../hooks/useEquipmentSales'
import {
  EQUIPMENT_QUOTATION_STATUS_COLORS,
  EQUIPMENT_QUOTATION_STATUS_LABELS,
  EQUIPMENT_SALES_INVOICE_ROLES
} from '../../constants/equipmentSales'
import { EquipmentQuotationDocumentType } from '../../types/equipmentSales'
import EquipmentQuotationApprovalDialog, {
  EquipmentQuotationDecisionMode,
  EquipmentQuotationDecisionValues
} from './EquipmentQuotationApprovalDialog'
import EquipmentSalesDocumentsPanel from './EquipmentSalesDocumentsPanel'
import { EQUIPMENT_QUOTE_TERM_LABELS } from './equipmentQuoteTerms'

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

const EquipmentSalesDetailPage = () => {
  const navigate = useNavigate()
  const { quotationId } = useParams<{ quotationId?: string }>()
  const $user = useStore(userStore)
  const { data: quotation, isLoading } = useEquipmentQuotation(quotationId)
  const { data: documentsData } = useEquipmentQuotationDocuments(quotationId)
  const mutations = useEquipmentSalesMutations()
  const [decisionMode, setDecisionMode] = useState<EquipmentQuotationDecisionMode | null>(null)
  const [isSequenceDialogOpen, setIsSequenceDialogOpen] = useState(false)
  const isAdmin = useHasRole(['admin', 'super_admin'])

  const canEdit = useMemo(
    () => ['admin', 'super_admin', 'comp_admin', 'comp_requester', 'comp_supervisor'].some((r) => $user.rol?.includes(r)),
    [$user.rol]
  )

  const { data: sequenceConfig } = useEquipmentSequenceConfig(canEdit)

  const documents = documentsData?.documents || []
  const officialPdfDocuments = documents.filter((d) => d.documentType === 'quote_pdf')
  const decisionDocuments = documents.filter((d) =>
    ['approval_evidence', 'rejection_evidence'].includes(d.documentType)
  )
  const supportDocuments = documents.filter((d) =>
    ['request_evidence', 'supporting_attachment'].includes(d.documentType)
  )

  const handleRequestApproval = async () => {
    const result = await window.confirm('¿Marcar la cotización como enviada al cliente?')
    if (!result || !quotation) return
    try {
      await mutations.requestApproval.mutateAsync(quotation.id)
      toast.success('La cotización quedó marcada como enviada al cliente.')
    } catch (error) {
      console.error(error)
      toast.error('No pudimos enviar la cotización.')
    }
  }

  const handleDecisionSubmit = async (values: EquipmentQuotationDecisionValues) => {
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
        toast.success('La solicitud de modificación del cliente quedó registrada.')
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
      const document = await mutations.generateQuotePdf.mutateAsync(quotation.id)
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

  const handleDownloadDocument = async (documentId: number, fileName: string) => {
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
    const result = await window.confirm('¿Marcar esta cotización como lista para facturar?')
    if (!result || !quotation) return
    try {
      await mutations.readyForInvoice.mutateAsync(quotation.id)
      toast.success('La cotización quedó lista para facturar.')
    } catch (error) {
      console.error(error)
      toast.error('No pudimos marcar la cotización.')
    }
  }

  const handleInvoice = async () => {
    const result = await window.confirm('¿Marcar esta cotización como facturada?')
    if (!result || !quotation) return
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
      await mutations.cancelQuotation.mutateAsync({ id: quotation.id, reason: reason || undefined })
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
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='55vh'>
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
  const termEntries = Object.entries(quoteTerms).filter(([, value]) => value && String(value).trim())
  const latestChangeRequest =
    quotation.otherFields?.latestChangeRequest &&
    typeof quotation.otherFields.latestChangeRequest === 'object' &&
    !Array.isArray(quotation.otherFields.latestChangeRequest)
      ? (quotation.otherFields.latestChangeRequest as Record<string, unknown>)
      : null

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 }, minHeight: '100vh', backgroundColor: '#f8fafb' }}>
      <Toaster position='top-center' />

      {/* ── Header banner ── */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0f766e 0%, #059669 50%, #047857 100%)',
          borderRadius: '20px',
          p: { xs: 3, md: 4 },
          mb: 3,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent='space-between' alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
          <Box>
            <Button
              startIcon={<ArrowBackOutlinedIcon />}
              onClick={() => navigate('/equipment-sales')}
              sx={{ mb: 1, color: 'rgba(255,255,255,0.8)', textTransform: 'none', fontWeight: 600, borderRadius: '10px', fontSize: '0.85rem', '&:hover': { backgroundColor: 'rgba(255,255,255,0.10)', color: '#fff' } }}
            >
              Volver
            </Button>
            <Typography variant='h4' fontWeight={800} sx={{ color: '#fff', lineHeight: 1.15, letterSpacing: '-0.025em', fontSize: { xs: '1.6rem', md: '2rem' } }}>
              {quotation.quoteCode}
            </Typography>
            <Typography variant='body2' sx={{ mt: 1, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, fontSize: '0.9rem' }}>
              {quotation.customer?.nombre || 'Cliente no especificado'} · Emitida {formatDate(quotation.createdAt)}
              {quotation.approvalChannel ? ` · Aprobada vía ${quotation.approvalChannel}` : ''}
            </Typography>
          </Box>
          <Stack spacing={1} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
            <Chip
              label={EQUIPMENT_QUOTATION_STATUS_LABELS[quotation.status]}
              sx={{ fontWeight: 700, borderRadius: '8px', backgroundColor: EQUIPMENT_QUOTATION_STATUS_COLORS[quotation.status], color: '#fff' }}
            />
            {quotation.otherFields?.quoteRevision ? (
              <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Revisión {String(quotation.otherFields.quoteRevision)}
              </Typography>
            ) : null}
          </Stack>
        </Stack>
      </Box>

      {canEdit && sequenceConfig ? (
        <Alert
          severity={sequenceConfig.initialized ? 'info' : 'warning'}
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
          {sequenceConfig.initialized
            ? 'Puedes ajustar el consecutivo de cotizaciones desde la configuración.'
            : 'Sin consecutivo configurado: el código se deriva automáticamente. Puedes definir uno manualmente desde la configuración.'}
        </Alert>
      ) : null}

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
          <Card elevation={0} sx={{ mb: 3, borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)' }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant='h6' fontWeight={800} sx={{ mb: 2 }}>Información del cliente</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant='body2'><strong>Cliente:</strong> {quotation.customer?.nombre || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant='body2'><strong>NIT:</strong> {quotation.customer?.identificacion || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant='body2'><strong>Sede:</strong> {quotation.customerSite || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant='body2'><strong>Vía solicitud:</strong> {quotation.requestChannel || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant='body2'><strong>Contacto:</strong> {quotation.contactName || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant='body2'><strong>Email:</strong> {quotation.contactEmail || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant='body2'><strong>Teléfono:</strong> {quotation.contactPhone || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant='body2'>
                    <strong>Dirección:</strong> {[quotation.address, quotation.city, quotation.department].filter(Boolean).join(', ') || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ mb: 3, borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)' }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant='h6' fontWeight={800} sx={{ mb: 2 }}>Condiciones comerciales</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant='body2'><strong>Validez:</strong> {quotation.validityDays ? `${quotation.validityDays} días` : 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant='body2'><strong>Forma de pago:</strong> {quotation.paymentMethod || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant='body2'><strong>Entrega:</strong> {quotation.deliveryTime || 'N/A'}</Typography>
                </Grid>
                {quotation.warrantyTerms ? (
                  <Grid item xs={12}>
                    <Typography variant='body2'><strong>Garantía:</strong> {quotation.warrantyTerms}</Typography>
                  </Grid>
                ) : null}
                {quotation.status === 'approved' && quotation.approvalReference ? (
                  <Grid item xs={12}>
                    <Typography variant='body2'>
                      <strong>Aprobación:</strong> {formatDate(quotation.acceptedAt)} · {quotation.approvalChannel}
                      {quotation.approvalReference ? ` · ${quotation.approvalReference}` : ''}
                    </Typography>
                  </Grid>
                ) : null}
              </Grid>
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ mb: 3, borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)' }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant='h6' fontWeight={800} sx={{ mb: 2 }}>
                Productos cotizados ({quotation.items?.length || 0})
              </Typography>
              {quotation.items?.length ? (
                <Stack spacing={1.5}>
                  {quotation.items.map((item, index) => (
                    <Box key={item.id ?? index} sx={{ border: '1px solid rgba(0,0,0,0.06)', borderRadius: '12px', p: 2 }}>
                      <Stack direction='row' justifyContent='space-between' alignItems='flex-start' spacing={2}>
                        <Box>
                          <Typography variant='body2' fontWeight={700}>
                            {index + 1}. {item.itemName}
                          </Typography>
                          {[item.brand, item.model].filter(Boolean).length ? (
                            <Typography variant='caption' color='text.secondary'>
                              {[item.brand, item.model].filter(Boolean).join(' · ')}
                            </Typography>
                          ) : null}
                          {item.characteristics ? (
                            <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.5 }}>
                              {item.characteristics}
                            </Typography>
                          ) : null}
                          {item.notes ? (
                            <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.5 }}>
                              {item.notes}
                            </Typography>
                          ) : null}
                          <Stack direction='row' spacing={1} sx={{ mt: 0.5 }}>
                            {item.warrantyMonths ? (
                              <Chip size='small' variant='outlined' label={`Garantía: ${item.warrantyMonths} meses`} sx={{ height: 20, '& .MuiChip-label': { fontSize: '0.65rem' } }} />
                            ) : null}
                            {item.deliveryTime ? (
                              <Chip size='small' variant='outlined' label={`Entrega: ${item.deliveryTime}`} sx={{ height: 20, '& .MuiChip-label': { fontSize: '0.65rem' } }} />
                            ) : null}
                          </Stack>
                        </Box>
                        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                          <Typography variant='body2' color='text.secondary'>
                            {item.quantity} × {currencyFormatter.format(item.unitPrice)}
                            {Number(item.taxRate) > 0 ? ` · IVA ${item.taxRate}%` : ''}
                          </Typography>
                          <Typography variant='body2' fontWeight={800} sx={{ color: '#059669' }}>
                            {currencyFormatter.format(item.total)}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Alert severity='info'>Aún no hay productos registrados.</Alert>
              )}
            </CardContent>
          </Card>

          {termEntries.length ? (
            <Card elevation={0} sx={{ mb: 3, borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)' }}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Typography variant='h6' fontWeight={800} sx={{ mb: 2 }}>Términos de la cotización</Typography>
                <Stack spacing={2}>
                  {termEntries.map(([key, value]) => (
                    <Box key={key}>
                      <Typography variant='subtitle2' fontWeight={700} sx={{ mb: 0.5 }}>
                        {EQUIPMENT_QUOTE_TERM_LABELS[key as keyof typeof EQUIPMENT_QUOTE_TERM_LABELS] || key}
                      </Typography>
                      <Box
                        sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', p: 1.5, backgroundColor: '#fafafa' }}
                        dangerouslySetInnerHTML={{ __html: String(value) }}
                      />
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          ) : null}

          <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)' }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant='h6' fontWeight={800} sx={{ mb: 2 }}>Documentos</Typography>
              <EquipmentSalesDocumentsPanel
                quoteCode={quotation.quoteCode}
                hasCustomer={Boolean(quotation.customerId)}
                hasItems={Boolean(quotation.items?.length)}
                canUploadDocuments={canEdit}
                canGenerateQuotePdf={canEdit && quotation.status === 'draft'}
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
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card elevation={0} sx={{ position: 'sticky', top: 24, borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant='h6' fontWeight={800} sx={{ mb: 2 }}>Totales</Typography>
              <Stack spacing={1} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='body2' color='text.secondary'>Subtotal</Typography>
                  <Typography variant='body2' fontWeight={700}>{currencyFormatter.format(quotation.subtotal)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='body2' color='text.secondary'>IVA</Typography>
                  <Typography variant='body2' fontWeight={700}>{currencyFormatter.format(quotation.taxTotal)}</Typography>
                </Box>
                {Number(quotation.discountTotal) > 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant='body2' color='text.secondary'>Descuento</Typography>
                    <Typography variant='body2' fontWeight={700} sx={{ color: '#dc2626' }}>-{currencyFormatter.format(quotation.discountTotal)}</Typography>
                  </Box>
                ) : null}
                <Box sx={{ borderTop: '1px dashed rgba(0,0,0,0.12)', pt: 1.5, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='subtitle1' fontWeight={800}>TOTAL</Typography>
                  <Typography variant='h6' fontWeight={800} sx={{ color: '#059669' }}>{currencyFormatter.format(quotation.grandTotal)}</Typography>
                </Box>
              </Stack>

              {quotation.status === 'draft' ? (
                <Stack spacing={1}>
                  <Button variant='contained' startIcon={<SendOutlinedIcon />} onClick={handleRequestApproval} disabled={isBusy} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}>
                    Enviar cotización
                  </Button>
                  <Button variant='outlined' startIcon={<EditOutlinedIcon />} onClick={() => navigate(`/equipment-sales/${quotation.id}/edit`)} disabled={isBusy} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}>
                    Editar
                  </Button>
                </Stack>
              ) : null}

              {quotation.status === 'pending_approval' ? (
                <Stack spacing={1}>
                  <Button variant='contained' color='success' startIcon={<CheckCircleOutlineOutlinedIcon />} onClick={() => setDecisionMode('approve')} disabled={isBusy} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}>
                    Registrar aprobación cliente
                  </Button>
                  <Button variant='outlined' color='error' startIcon={<BlockOutlinedIcon />} onClick={() => setDecisionMode('reject')} disabled={isBusy} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}>
                    Registrar rechazo cliente
                  </Button>
                  <Button variant='outlined' onClick={() => setDecisionMode('request_changes')} disabled={isBusy} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}>
                    Solicitar modificación
                  </Button>
                  <Button variant='outlined' startIcon={<EditOutlinedIcon />} onClick={() => navigate(`/equipment-sales/${quotation.id}/edit`)} disabled={isBusy} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}>
                    Editar
                  </Button>
                </Stack>
              ) : null}

              {quotation.status === 'approved' ? (
                <Button variant='contained' color='success' startIcon={<CheckCircleOutlineOutlinedIcon />} onClick={handleReadyForInvoice} disabled={isBusy} fullWidth sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}>
                  Lista para facturar
                </Button>
              ) : null}

              {quotation.status === 'ready_for_invoicing' && EQUIPMENT_SALES_INVOICE_ROLES.some((r) => $user.rol?.includes(r)) ? (
                <Button variant='contained' startIcon={<ReceiptLongOutlinedIcon />} onClick={handleInvoice} disabled={isBusy} fullWidth sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}>
                  Facturar
                </Button>
              ) : null}

              {['draft', 'pending_approval'].includes(quotation.status) ? (
                <Button variant='text' color='error' startIcon={<BlockOutlinedIcon />} onClick={handleCancel} disabled={isBusy} fullWidth sx={{ mt: 1, borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}>
                  Cancelar cotización
                </Button>
              ) : null}

              {quotation.internalNotes ? (
                <Box sx={{ mt: 3 }}>
                  <Typography variant='subtitle2' fontWeight={700}>Notas internas</Typography>
                  <Typography variant='body2' color='text.secondary'>{quotation.internalNotes}</Typography>
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
        isLoading={mutations.approveQuotation.isLoading || mutations.rejectQuotation.isLoading || mutations.requestChanges.isLoading}
        onClose={() => setDecisionMode(null)}
        onSubmit={handleDecisionSubmit}
      />

      <EquipmentSalesSequenceConfigDialog
        open={isSequenceDialogOpen}
        config={sequenceConfig}
        isAdmin={isAdmin}
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
