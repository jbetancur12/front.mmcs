import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '@nanostores/react'
import {
  Box, Button, Card, CardContent, Chip, Grid, IconButton, Typography
} from '@mui/material'
import { ArrowBack, Edit, Send, CheckCircle, Cancel, Receipt, Block, PictureAsPdf } from '@mui/icons-material'
import { axiosPrivate } from '@utils/api'
import { userStore } from 'src/store/userStore'
import { useEquipmentQuotation, useEquipmentSalesMutations } from '../../hooks/useEquipmentSales'
import { EQUIPMENT_QUOTATION_STATUS_LABELS, EQUIPMENT_QUOTATION_STATUS_COLORS, EQUIPMENT_SALES_INVOICE_ROLES } from '../../constants/equipmentSales'
import Swal from 'sweetalert2'
import EquipmentQuotationItemsEditor, { FormItem } from './EquipmentQuotationItemsEditor'
import { EquipmentQuotationItemPayload } from '../../types/equipmentSales'

const EquipmentSalesDetailPage = () => {
  const navigate = useNavigate()
  const { quotationId } = useParams()
  const $user = useStore(userStore)
  const { data: quotation, isLoading } = useEquipmentQuotation(quotationId)
  const mutations = useEquipmentSalesMutations()

  const handleSend = async () => {
    const result = await Swal.fire({ title: 'Enviar cotización', text: '¿Marcar como enviada al cliente?', icon: 'question', showCancelButton: true, confirmButtonText: 'Sí, enviar' })
    if (result.isConfirmed) { mutations.sendQuotation.mutate(quotationId!, { onSuccess: () => Swal.fire('Enviada', '', 'success') }) }
  }
  const handleAccept = async () => {
    const result = await Swal.fire({ title: 'Aceptar', text: '¿Marcar como aceptada por el cliente?', icon: 'question', showCancelButton: true, confirmButtonText: 'Sí, aceptar' })
    if (result.isConfirmed) { mutations.acceptQuotation.mutate(quotationId!, { onSuccess: () => Swal.fire('Aceptada', '', 'success') }) }
  }
  const handleReject = async () => {
    const { value: reason } = await Swal.fire({ title: 'Rechazar', input: 'textarea', inputLabel: 'Motivo', showCancelButton: true, confirmButtonText: 'Rechazar', confirmButtonColor: '#d33' })
    if (reason !== undefined) mutations.rejectQuotation.mutate({ id: quotationId!, reason }, { onSuccess: () => Swal.fire('Rechazada', '', 'info') })
  }
  const handleInvoice = async () => {
    const result = await Swal.fire({ title: 'Facturar', text: '¿Marcar como facturada?', icon: 'question', showCancelButton: true, confirmButtonText: 'Sí, facturar' })
    if (result.isConfirmed) { mutations.invoiceQuotation.mutate(quotationId!, { onSuccess: () => Swal.fire('Facturada', '', 'success') }) }
  }
  const handleReadyForInvoice = async () => {
    const result = await Swal.fire({ title: 'Lista para facturar', text: '¿Marcar esta cotización como lista para facturar?', icon: 'question', showCancelButton: true, confirmButtonText: 'Sí, lista para facturar' })
    if (result.isConfirmed) { mutations.readyForInvoice.mutate(quotationId!, { onSuccess: () => Swal.fire('Lista para facturar', '', 'success') }) }
  }

  const handleCancel = async () => {
    const { value: reason } = await Swal.fire({ title: 'Cancelar', input: 'textarea', inputLabel: 'Motivo', showCancelButton: true, confirmButtonText: 'Cancelar', confirmButtonColor: '#d33' })
    if (reason !== undefined) mutations.cancelQuotation.mutate({ id: quotationId!, reason }, { onSuccess: () => Swal.fire('Cancelada', '', 'info') })
  }

  const handleDownloadPdf = async () => {
    try {
      const response = await axiosPrivate.post(`/equipment-sales/${quotationId}/generate-pdf`, {}, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `cotizacion-${quotation?.quoteCode}.pdf`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch {
      Swal.fire('Error', 'No se pudo generar el PDF', 'error')
    }
  }

  if (isLoading) return <Typography sx={{ p: 3 }}>Cargando...</Typography>
  if (!quotation) return <Typography sx={{ p: 3 }}>Cotización no encontrada</Typography>

  const totalItems = quotation.items?.length || 0
  const items = quotation.items?.map((i: EquipmentQuotationItemPayload, idx: number) => ({
    ...i,
    localId: `item-${idx}`,
    expanded: false,
    otherFields: {}
  } as FormItem)) || []

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/equipment-sales')}><ArrowBack /></IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant='h5' sx={{ fontWeight: 700 }}>{quotation.quoteCode}</Typography>
            <Chip label={EQUIPMENT_QUOTATION_STATUS_LABELS[quotation.status]}
              size='small' sx={{ backgroundColor: EQUIPMENT_QUOTATION_STATUS_COLORS[quotation.status], color: '#fff' }} />
          </Box>
          <Typography variant='body2' color='text.secondary'>
            {quotation.customer?.nombre} · Creada {new Date(quotation.createdAt).toLocaleDateString('es-CO')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<PictureAsPdf />} variant='outlined' color='error' onClick={handleDownloadPdf}>
            PDF
          </Button>
          {quotation.status === 'draft' && (
            <>
              <Button startIcon={<Edit />} variant='outlined' onClick={() => navigate(`/equipment-sales/${quotationId}/edit`)}>Editar</Button>
              <Button startIcon={<Send />} variant='contained' color='primary' onClick={handleSend}>Enviar</Button>
            </>
          )}
          {quotation.status === 'sent' && (
            <>
              <Button startIcon={<CheckCircle />} variant='contained' color='success' onClick={handleAccept}>Aceptar</Button>
              <Button startIcon={<Cancel />} variant='outlined' color='error' onClick={handleReject}>Rechazar</Button>
            </>
          )}
          {quotation.status === 'accepted' && (
            <Button startIcon={<CheckCircle />} variant='contained' color='success' onClick={handleReadyForInvoice}>Lista para facturar</Button>
          )}
          {quotation.status === 'ready_for_invoicing' && EQUIPMENT_SALES_INVOICE_ROLES.some((r) => $user.rol?.includes(r)) && (
            <Button startIcon={<Receipt />} variant='contained' onClick={handleInvoice}>Facturar</Button>
          )}
          {['draft', 'sent'].includes(quotation.status) && (
            <Button startIcon={<Block />} variant='outlined' color='error' onClick={handleCancel}>Cancelar</Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 2 }}>Información del cliente</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}><Typography variant='body2'><strong>Cliente:</strong> {quotation.customer?.nombre || 'N/A'}</Typography></Grid>
                <Grid item xs={6}><Typography variant='body2'><strong>NIT:</strong> {quotation.customer?.identificacion || 'N/A'}</Typography></Grid>
                <Grid item xs={6}><Typography variant='body2'><strong>Contacto:</strong> {quotation.contactName || 'N/A'}</Typography></Grid>
                <Grid item xs={6}><Typography variant='body2'><strong>Email:</strong> {quotation.contactEmail || 'N/A'}</Typography></Grid>
                <Grid item xs={6}><Typography variant='body2'><strong>Teléfono:</strong> {quotation.contactPhone || 'N/A'}</Typography></Grid>
                <Grid item xs={6}><Typography variant='body2'><strong>Ciudad:</strong> {quotation.city || 'N/A'}</Typography></Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 2 }}>Condiciones comerciales</Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}><Typography variant='body2'><strong>Vigencia:</strong> {quotation.validityDays || 'N/A'} días</Typography></Grid>
                <Grid item xs={4}><Typography variant='body2'><strong>Pago:</strong> {quotation.paymentMethod || 'N/A'}</Typography></Grid>
                <Grid item xs={4}><Typography variant='body2'><strong>Entrega:</strong> {quotation.deliveryTime || 'N/A'}</Typography></Grid>
                {quotation.warrantyTerms && <Grid item xs={12}><Typography variant='body2'><strong>Garantía:</strong> {quotation.warrantyTerms}</Typography></Grid>}
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 2 }}>Productos ({totalItems})</Typography>
              <EquipmentQuotationItemsEditor items={items} onChange={() => {}} readOnly />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 24 }}>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 2 }}>Totales</Typography>
              <Typography variant='body2' sx={{ mb: 1 }}>Subtotal: <strong>${Number(quotation.subtotal).toLocaleString('es-CO', { minimumFractionDigits: 2 })}</strong></Typography>
              <Typography variant='body2' sx={{ mb: 1 }}>IVA: <strong>${Number(quotation.taxTotal).toLocaleString('es-CO', { minimumFractionDigits: 2 })}</strong></Typography>
              {Number(quotation.discountTotal) > 0 && (
                <Typography variant='body2' sx={{ mb: 1 }}>Dto.: <strong>-${Number(quotation.discountTotal).toLocaleString('es-CO', { minimumFractionDigits: 2 })}</strong></Typography>
              )}
              <Typography variant='h5' sx={{ mb: 3, borderTop: 1, pt: 2, borderColor: 'divider' }}>
                Total: ${Number(quotation.grandTotal).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {quotation.status === 'draft' && (
                  <>
                    <Button variant='contained' startIcon={<Send />} onClick={handleSend}>Enviar cotización</Button>
                    <Button variant='outlined' startIcon={<Edit />} onClick={() => navigate(`/equipment-sales/${quotationId}/edit`)}>Editar</Button>
                  </>
                )}
                {quotation.status === 'sent' && (
                  <>
                    <Button variant='contained' color='success' startIcon={<CheckCircle />} onClick={handleAccept}>Aceptar</Button>
                    <Button variant='outlined' color='error' startIcon={<Cancel />} onClick={handleReject}>Rechazar</Button>
                    <Button variant='outlined' startIcon={<Edit />} onClick={() => navigate(`/equipment-sales/${quotationId}/edit`)}>Editar</Button>
                  </>
                )}
                {quotation.status === 'accepted' && (
                  <Button variant='contained' color='success' startIcon={<CheckCircle />} onClick={handleReadyForInvoice}>Lista para facturar</Button>
                )}
                {quotation.status === 'ready_for_invoicing' && EQUIPMENT_SALES_INVOICE_ROLES.some((r) => $user.rol?.includes(r)) && (
                  <Button variant='contained' startIcon={<Receipt />} onClick={handleInvoice}>Facturar</Button>
                )}
                {['draft', 'sent'].includes(quotation.status) && (
                  <Button variant='text' color='error' startIcon={<Block />} onClick={handleCancel}>Cancelar cotización</Button>
                )}
              </Box>

              {quotation.commercialComments && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant='subtitle2'>Comentarios:</Typography>
                  <Typography variant='body2' color='text.secondary'>{quotation.commercialComments}</Typography>
                </Box>
              )}

              {quotation.rejectedReason && (
                <Box sx={{ mt: 3, p: 2, bgcolor: '#ffebee', borderRadius: 1 }}>
                  <Typography variant='subtitle2' color='error'>Motivo de rechazo:</Typography>
                  <Typography variant='body2'>{quotation.rejectedReason}</Typography>
                </Box>
              )}

              {quotation.internalNotes && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant='subtitle2'>Notas internas:</Typography>
                  <Typography variant='body2' color='text.secondary'>{quotation.internalNotes}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default EquipmentSalesDetailPage
