import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Checkbox,
  FormControlLabel,
  Box,
  Typography,
  MenuItem
} from '@mui/material'
import useAxiosPrivate from '@utils/use-axios-private'
import {
  PurchaseOrderData,
  PurchaseVerificationItem
} from 'src/pages/Purchases/Types'

export interface PurchaseVerificationData {
  receivedDate: string
  invoiceNumber: string
  observations?: string
  purchaseOrderId: number
  purchaseRequestId: number
  items: Omit<PurchaseVerificationItem, 'orderItem'>[]
  technicalVerification: string
  verifiedBy?: string
  dateVerified?: string
}

interface CreatePurchaseVerificationModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (newVerification: PurchaseVerificationData) => void
  purchaseOrder: PurchaseOrderData
}

const CreatePurchaseVerificationModal: React.FC<
  CreatePurchaseVerificationModalProps
> = ({ open, onClose, onSuccess, purchaseOrder }) => {
  const axiosPrivate = useAxiosPrivate()

  // Inicializamos los items de verificación basados en la orden
  const initialItems = purchaseOrder.items.map((item) => ({
    purchaseOrderItemId: item.id,
    sensorialInspection: '',
    technicalVerification: '',
    devliveryTime: '',
    quality: '',
    meetsRequirements: false
  }))

  const [formData, setFormData] = React.useState<
    Partial<PurchaseVerificationData>
  >({
    receivedDate: new Date().toISOString().split('T')[0],
    invoiceNumber: '',
    observations: '',
    purchaseOrderId: purchaseOrder.id,
    purchaseRequestId: purchaseOrder.purchaseRequestId,
    items: initialItems,
    technicalVerification: '',
    verifiedBy: '',
    dateVerified: new Date().toISOString().split('T')[0]
  })

  const [error, setError] = React.useState('')

  const handleChange = (field: keyof PurchaseVerificationData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleItemChange = (
    index: number,
    field: keyof PurchaseVerificationItem,
    value: any
  ) => {
    if (!formData.items) return
    const updatedItems = formData.items.map((item, idx) =>
      idx === index ? { ...item, [field]: value } : item
    )
    setFormData((prev) => ({ ...prev, items: updatedItems }))
  }

  const handleSubmit = async () => {
    // Validar campos generales
    if (
      !formData.receivedDate ||
      !formData.invoiceNumber ||
      !formData.verifiedBy ||
      !formData.dateVerified
    ) {
      setError(
        'Complete all required fields (Received Date and Invoice Number).'
      )
      return
    }

    try {
      const response = await axiosPrivate.post<PurchaseVerificationData>(
        '/purchaseVerifications',
        formData
      )
      onSuccess(response.data)
      handleClose()
    } catch (err: any) {
      setError('Error creating verification.')
      console.error(err)
    }
  }

  const handleClose = () => {
    setFormData({
      receivedDate: new Date().toISOString().split('T')[0],
      invoiceNumber: '',
      observations: '',
      purchaseOrderId: purchaseOrder.id,
      purchaseRequestId: purchaseOrder.purchaseRequestId,
      items: initialItems
    })
    setError('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
      <DialogTitle>
        Crear Verificación de Productos y Servicios para Orden{' '}
        {purchaseOrder.code}
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          {/* Campos generales */}
          <Grid item xs={12} sm={6}>
            <TextField
              label='Fecha de Recibo *'
              type='date'
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.receivedDate || ''}
              onChange={(e) => handleChange('receivedDate', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label='Número de Factura *'
              fullWidth
              value={formData.invoiceNumber || ''}
              onChange={(e) => handleChange('invoiceNumber', e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label='Observaciones'
              fullWidth
              multiline
              rows={3}
              value={formData.observations || ''}
              onChange={(e) => handleChange('observations', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label='Verificado por *'
              fullWidth
              value={formData.verifiedBy || ''}
              onChange={(e) => handleChange('verifiedBy', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label='Fecha de Verificación *'
              type='date'
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.dateVerified || ''}
              onChange={(e) => handleChange('dateVerified', e.target.value)}
            />
          </Grid>

          {error && (
            <Grid item xs={12}>
              <Typography color='error'>{error}</Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button variant='outlined' onClick={handleClose}>
          Cancelar
        </Button>
        <Button
          variant='contained'
          onClick={handleSubmit}
          sx={{
            backgroundColor: '#9CF08B',
            color: '#2D4A27',
            '&:hover': { backgroundColor: '#6DC662' }
          }}
        >
          Crear Verificación
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreatePurchaseVerificationModal
