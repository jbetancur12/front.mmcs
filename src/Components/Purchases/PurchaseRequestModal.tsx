import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  InputAdornment,
  IconButton,
  Box,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Typography
} from '@mui/material'
import { Add, Close, Delete } from '@mui/icons-material'
import {
  PurchaseRequest as IPurchaseRequest,
  PurchaseRequestItem
} from 'src/pages/Purchases/Types'
import useAxiosPrivate from '@utils/use-axios-private'
import { PurchaseRequestStatus } from 'src/pages/Purchases/Enums'

interface CreatePurchaseRequestModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (newRequest: IPurchaseRequest) => void
  providers: any[] // Asume que tienes una lista de proveedores
}

const PurchaseRequestModal: React.FC<CreatePurchaseRequestModalProps> = ({
  open,
  onClose,
  onSuccess,
  providers
}) => {
  const axiosPrivate = useAxiosPrivate()
  const [formData, setFormData] = React.useState<Partial<IPurchaseRequest>>({
    status: PurchaseRequestStatus.Pending,
    requirements: [],
    items: []
  })

  const [currentItem, setCurrentItem] = React.useState<
    Partial<PurchaseRequestItem>
  >({
    item: '',
    quantity: 1,
    description: '',
    motive: '',
    supplierId: 0
  })
  const [newRequirement, setNewRequirement] = React.useState('')
  const [error, setError] = React.useState('')

  const handleSubmit = async () => {
    try {
      // Validación básica
      if (
        !formData.elaborationDate ||
        !formData.applicantName ||
        !formData.applicantPosition ||
        formData.items?.length === 0
      ) {
        setError(
          'Complete todos los campos obligatorios y agregue al menos un ítem'
        )
        return
      }

      const ttt = {
        ...formData,
        items: formData.items?.map((item) => ({
          ...item,
          quantity: Number(item.quantity)
        }))
      }
      console.log('🚀 ~ handleSubmit ~ ttt:', ttt)

      const response = await axiosPrivate.post<IPurchaseRequest>(
        '/purchaseRequests',
        {
          ...formData,
          items: formData.items?.map((item) => ({
            ...item,
            quantity: Number(item.quantity)
          }))
        }
      )

      onSuccess(response.data)
      handleClose()
    } catch (err) {
      setError('Error al crear la solicitud')
      console.error('Error creating purchase request:', err)
    }
  }

  const handleClose = () => {
    setFormData({
      status: PurchaseRequestStatus.Pending,
      requirements: [],
      items: []
    })
    setCurrentItem({
      item: '',
      quantity: 1,
      description: '',
      motive: '',
      supplierId: 0
    })
    setNewRequirement('')
    setError('')
    onClose()
  }

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData((prev) => ({
        ...prev,
        requirements: [...(prev.requirements || []), newRequirement.trim()]
      }))
      setNewRequirement('')
    }
  }

  const addItem = () => {
    if (
      currentItem.item &&
      currentItem.description &&
      currentItem.motive &&
      currentItem.supplierId
    ) {
      setFormData((prev) => ({
        ...prev,
        items: [...(prev.items || []), currentItem as PurchaseRequestItem]
      }))
      setCurrentItem({
        item: '',
        quantity: 1,
        description: '',
        motive: '',
        supplierId: 0
      })
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between' }}>
        Nueva Solicitud de Compra
        <IconButton onClick={handleClose}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3} sx={{ pt: 2 }}>
          {/* Sección de información básica */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label='Fecha de Elaboración *'
              type='date'
              InputLabelProps={{ shrink: true }}
              value={
                formData.elaborationDate
                  ? new Date(formData.elaborationDate)
                      .toISOString()
                      .split('T')[0] // Formato YYYY-MM-DD
                  : ''
              }
              onChange={(e) => {
                const dateValue = new Date(e.target.value)
                if (!isNaN(dateValue.getTime())) {
                  // Validar que sea una fecha válida
                  setFormData({
                    ...formData,
                    elaborationDate: dateValue
                  })
                }
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label='Nombre del Solicitante *'
              value={formData.applicantName || ''}
              onChange={(e) =>
                setFormData({ ...formData, applicantName: e.target.value })
              }
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label='Cargo del Solicitante *'
              value={formData.applicantPosition || ''}
              onChange={(e) =>
                setFormData({ ...formData, applicantPosition: e.target.value })
              }
            />
          </Grid>

          {/* Sección de ítems */}
          <Grid item xs={12}>
            <Box sx={{ border: '1px solid #ddd', p: 2, borderRadius: 1 }}>
              <Typography variant='subtitle1' sx={{ mb: 2 }}>
                Ítems Solicitados
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label='Item *'
                    value={currentItem.item}
                    onChange={(e) =>
                      setCurrentItem((prev) => ({
                        ...prev,
                        item: e.target.value
                      }))
                    }
                  />
                </Grid>

                <Grid item xs={2}>
                  <TextField
                    fullWidth
                    label='Cantidad *'
                    type='number'
                    value={currentItem.quantity}
                    onChange={(e) =>
                      setCurrentItem((prev) => ({
                        ...prev,
                        quantity: Number(e.target.value)
                      }))
                    }
                  />
                </Grid>

                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label='Descripción *'
                    value={currentItem.description}
                    onChange={(e) =>
                      setCurrentItem((prev) => ({
                        ...prev,
                        description: e.target.value
                      }))
                    }
                  />
                </Grid>

                <Grid item xs={2}>
                  <TextField
                    fullWidth
                    label='Motivo *'
                    value={currentItem.motive}
                    onChange={(e) =>
                      setCurrentItem((prev) => ({
                        ...prev,
                        motive: e.target.value
                      }))
                    }
                  />
                </Grid>

                <Grid item xs={2}>
                  <FormControl fullWidth>
                    <InputLabel>Proveedor *</InputLabel>
                    <Select
                      value={currentItem.supplierId}
                      label='Proveedor *'
                      onChange={(e) =>
                        setCurrentItem((prev) => ({
                          ...prev,
                          supplierId: Number(e.target.value)
                        }))
                      }
                    >
                      {providers.map((provider) => (
                        <MenuItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Button
                    variant='outlined'
                    onClick={addItem}
                    startIcon={<Add />}
                    disabled={
                      !currentItem.item ||
                      !currentItem.description ||
                      !currentItem.motive ||
                      !currentItem.supplierId
                    }
                  >
                    Agregar Ítem
                  </Button>
                </Grid>
              </Grid>

              {/* Lista de ítems agregados */}
              <Box sx={{ mt: 2 }}>
                {formData.items?.map((item, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      mb: 1,
                      p: 1,
                      border: '1px solid #eee',
                      borderRadius: 1
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <strong>{item.item}</strong> (Cant: {item.quantity})
                      <div>{item.description}</div>
                      <div>Motivo: {item.motive}</div>
                      <div>
                        Proveedor:{' '}
                        {providers.find((p) => p.id === item.supplierId)?.name}
                      </div>
                    </Box>
                    <IconButton
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          items: prev.items?.filter((_, i) => i !== index)
                        }))
                      }
                    >
                      <Delete color='error' />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ border: '1px solid #ddd', p: 2, borderRadius: 1 }}>
              <TextField
                fullWidth
                label='Agregar Requisito'
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addRequirement()}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton onClick={addRequirement}>
                        <Add />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <Box
                sx={{
                  mt: 2,
                  display: 'flex',
                  gap: 1,
                  flexWrap: 'wrap'
                }}
              >
                {formData.requirements?.map((req, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexDirection: 'columns',
                      py: 1,
                      borderBottom:
                        index < (formData.requirements?.length ?? 0) - 1
                          ? '1px solid #eee'
                          : 'none'
                    }}
                  >
                    <Typography variant='body2' sx={{ flexGrow: 1 }}>
                      • {req}
                    </Typography>

                    <IconButton
                      size='small'
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          requirements: (prev.requirements || []).filter(
                            (_, i) => i !== index
                          )
                        }))
                      }
                    >
                      <Delete fontSize='small' color='error' />
                    </IconButton>
                  </Box>
                ))}

                {formData.requirements?.length === 0 && (
                  <Typography
                    variant='body2'
                    sx={{ pt: 1, color: 'text.secondary' }}
                  >
                    No se han agregado requisitos
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>

          {error && (
            <Grid item xs={12}>
              <Box color='error.main'>{error}</Box>
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
          Crear Solicitud
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PurchaseRequestModal
