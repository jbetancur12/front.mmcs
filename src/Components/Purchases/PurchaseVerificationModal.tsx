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
    technicalVerification: ''
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
    if (!formData.receivedDate || !formData.invoiceNumber) {
      setError(
        'Complete all required fields (Received Date and Invoice Number).'
      )
      return
    }
    // Opcional: validar que cada item tenga sus campos completados
    for (const item of formData.items || []) {
      if (
        !item.sensorialInspection ||
        !item.technicalVerification ||
        !item.devliveryTime ||
        !item.quality
      ) {
        setError('Complete all required fields for each item.')
        return
      }
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
          {/* Sección de Requerimientos en dos columnas */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              {/* Columna izquierda: lista de requerimientos */}
              <Grid item xs={8}>
                <Typography variant='subtitle1'>
                  Requerimientos de Solicitud
                </Typography>
                {purchaseOrder.requirements &&
                purchaseOrder.requirements.length > 0 ? (
                  <ul style={{ listStyleType: 'disc', marginLeft: '1em' }}>
                    {purchaseOrder.requirements.map(
                      (req: string, index: number) => (
                        <li key={index}>{req}</li>
                      )
                    )}
                  </ul>
                ) : (
                  <Typography variant='body2' color='text.secondary'>
                    No hay requerimientos
                  </Typography>
                )}
              </Grid>
              {/* Columna derecha: checkbox de cumplimiento */}
              <Grid item xs={4}>
                <TextField
                  select
                  label='Verificación Tecnica'
                  fullWidth
                  value={formData.technicalVerification || ''}
                  onChange={(e) =>
                    handleChange('technicalVerification', e.target.value)
                  }
                >
                  <MenuItem value={'Bueno'}>Bueno</MenuItem>
                  <MenuItem value={'Regular'}>Regular</MenuItem>
                  <MenuItem value={'Malo'}>Malo</MenuItem>
                  <MenuItem value={'No Aplica'}>No Aplica</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Typography variant='h6' gutterBottom>
              Verificación de Items
            </Typography>
            {formData.items?.map((item, index) => (
              <Box
                key={item.purchaseOrderItemId}
                sx={{
                  border: '1px solid #ddd',
                  p: 2,
                  mb: 2,
                  borderRadius: 1
                }}
              >
                <Typography variant='subtitle1'>
                  {purchaseOrder.items[index].purchaseRequestItem.description}{' '}
                  (Cantidad:{' '}
                  {purchaseOrder.items[index].purchaseRequestItem.quantity})
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      select
                      label='Inspección Sensorial *'
                      fullWidth
                      value={item.sensorialInspection}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          'sensorialInspection',
                          e.target.value
                        )
                      }
                    >
                      <MenuItem value={'Bueno'}>Bueno</MenuItem>
                      <MenuItem value={'Regular'}>Regular</MenuItem>
                      <MenuItem value={'Malo'}>Malo</MenuItem>
                      <MenuItem value={'No Aplica'}>No Aplica</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={3} alignContent={'center'}>
                    <TextField
                      select
                      label='Verificación Técnica *'
                      fullWidth
                      value={item.technicalVerification}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          'technicalVerification',
                          e.target.value
                        )
                      }
                    >
                      <MenuItem value={'Bueno'}>Bueno</MenuItem>
                      <MenuItem value={'Regular'}>Regular</MenuItem>
                      <MenuItem value={'Malo'}>Malo</MenuItem>
                      <MenuItem value={'No Aplica'}>No Aplica</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      select
                      label='Tiempo de Entrega *'
                      fullWidth
                      value={item.devliveryTime}
                      onChange={(e) =>
                        handleItemChange(index, 'devliveryTime', e.target.value)
                      }
                    >
                      <MenuItem value={'Bueno'}>Bueno</MenuItem>
                      <MenuItem value={'Regular'}>Regular</MenuItem>
                      <MenuItem value={'Malo'}>Malo</MenuItem>
                      <MenuItem value={'No Aplica'}>No Aplica</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      select
                      label='Calidad *'
                      fullWidth
                      value={item.quality}
                      onChange={(e) =>
                        handleItemChange(index, 'quality', e.target.value)
                      }
                    >
                      <MenuItem value={'Bueno'}>Bueno</MenuItem>
                      <MenuItem value={'Regular'}>Regular</MenuItem>
                      <MenuItem value={'Malo'}>Malo</MenuItem>
                      <MenuItem value={'No Aplica'}>No Aplica</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={item.meetsRequirements}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              'meetsRequirements',
                              e.target.checked
                            )
                          }
                        />
                      }
                      label='Cumple'
                    />
                  </Grid>
                </Grid>
              </Box>
            ))}
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
