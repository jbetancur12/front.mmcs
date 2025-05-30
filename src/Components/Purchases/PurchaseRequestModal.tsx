import React, { useEffect } from 'react'
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
  Typography,
  MenuItem
} from '@mui/material'
import { Add, Close, Delete, Edit } from '@mui/icons-material'
import {
  PurchaseRequest as IPurchaseRequest,
  PurchaseRequestItem,
  Supplier
} from 'src/pages/Purchases/Types'
import useAxiosPrivate from '@utils/use-axios-private'
import { PurchaseRequestStatus } from 'src/pages/Purchases/Enums'
import {
  calibrationServiceRequirements,
  equipmentPurchaseRequirements,
  proficiencyTestingServiceRequirements,
  internalAuditServiceRequirements
} from 'src/utils/requirements'
import Swal from 'sweetalert2'
import { isAxiosError } from 'axios'

interface CreatePurchaseRequestModalProps {
  // Renombrar a PurchaseRequestModalProps
  open: boolean
  onClose: () => void
  onSuccess: (request: IPurchaseRequest) => void // Cambiar 'newRequest' a 'request'
  existingRequest?: IPurchaseRequest | null // NUEVA PROP para la PR a editar
}

export interface SuppliersAPIResponse {
  totalItems: number
  suppliers: Supplier[]
  totalPages: number
  currentPage: number
}

interface CurrentPurchaseRequestItem extends Partial<PurchaseRequestItem> {
  supplierInput?: Supplier[] // Para el 'value' del Autocomplete
}

const PurchaseRequestModal: React.FC<CreatePurchaseRequestModalProps> = ({
  open,
  onClose,
  onSuccess,
  existingRequest
}) => {
  const axiosPrivate = useAxiosPrivate()
  const [formData, setFormData] = React.useState<Partial<IPurchaseRequest>>({})

  const [currentItem, setCurrentItem] =
    React.useState<CurrentPurchaseRequestItem>({
      quantity: 1,
      description: '',
      supplierIds: [],
      supplierInput: [] // Inicializar supplierInput como array vacío
    })

  const [newRequirement, setNewRequirement] = React.useState('')
  const [error, setError] = React.useState('')
  const [requirementType, setRequirementType] = React.useState('')

  const [editingRequirementIndex, setEditingRequirementIndex] = React.useState<
    number | null
  >(null)
  const [editingRequirementValue, setEditingRequirementValue] =
    React.useState<string>('')

  useEffect(() => {
    if (open) {
      if (existingRequest) {
        console.log('🚀 ~ useEffect ~ existingRequest:', existingRequest)
        // Modo Edición: Cargar datos de la PR existente
        setFormData({
          ...existingRequest,
          // Asegurar que elaborationDate sea un objeto Date si es necesario para el input,
          // o formatear a YYYY-MM-DD si el input lo espera así.
          // El backend usualmente devuelve fechas como strings ISO.
          elaborationDate: existingRequest.elaborationDate
            ? new Date(existingRequest.elaborationDate)
            : new Date(new Date().getTime() - 5 * 60 * 60 * 1000),
          // Asegurar que items y requirements sean arrays
          items: existingRequest.items || [],
          requirements: existingRequest.requirements || []
        })
        // Inicializar currentItem con los datos del primer ítem si se edita un ítem específico,
        // o dejarlo para añadir nuevos ítems.
        // Para el Autocomplete de proveedores en los ítems, necesitarías cargar los objetos Supplier
        // basados en los supplierIds de existingRequest.items.
        // Esto puede ser complejo si solo tienes los IDs.
        // Por simplicidad, el Autocomplete se reseteará o necesitará lógica adicional
        // para cargar los nombres de los proveedores de los ítems existentes.
        // Aquí nos enfocaremos en los datos principales de la PR y la estructura de los ítems.
        setCurrentItem({
          quantity: 1,
          description: '',
          supplierIds: [],
          supplierInput: []
        })
      } else {
        // Modo Creación: Valores por defecto
        setFormData({
          status: PurchaseRequestStatus.Pending,
          requirements: [],
          items: [],
          elaborationDate: new Date(new Date().getTime() - 5 * 60 * 60 * 1000),
          purchaseType: 'I'
        })
        setCurrentItem({
          quantity: 1,
          description: '',
          supplierIds: [],
          supplierInput: []
        })
      }
      setRequirementType('') // Resetear tipo de requerimiento también
      setNewRequirement('')
      setError('')
    }
  }, [open, existingRequest])

  const handleRequirementTypeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const type = event.target.value
    setRequirementType(type)

    let requirements: string[] = []
    switch (type) {
      case 'calibration':
        requirements = calibrationServiceRequirements
        break
      case 'equipment':
        requirements = equipmentPurchaseRequirements
        break
      case 'proficiency':
        requirements = proficiencyTestingServiceRequirements
        break
      case 'audit':
        requirements = internalAuditServiceRequirements
        break
      default:
        requirements = []
    }

    setFormData((prev) => ({
      ...prev,
      requirements
    }))
  }
  const handleEditRequirement = (index: number) => {
    if (formData.requirements) {
      setEditingRequirementIndex(index)
      setEditingRequirementValue(formData.requirements[index])
    }
  }

  const handleSaveRequirement = () => {
    if (editingRequirementIndex !== null) {
      setFormData((prev) => {
        const updatedRequirements = [...(prev.requirements || [])]
        updatedRequirements[editingRequirementIndex] = editingRequirementValue
        return {
          ...prev,
          requirements: updatedRequirements
        }
      })
      setEditingRequirementIndex(null)
      setEditingRequirementValue('')
    }
  }
  const handleSubmit = async () => {
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

    const payload = {
      ...formData,
      items: formData.items?.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        // Asegúrate que supplierIds se envíe correctamente
        supplierIds: item.supplierIds || []
      }))
    }

    try {
      let response
      if (existingRequest?.id) {
        // Modo Edición
        response = await axiosPrivate.put<IPurchaseRequest>( // O PATCH
          `/purchaseRequests/${existingRequest.id}`,
          payload
        )
        Swal.fire({
          icon: 'success',
          title: '¡Actualizado!',
          text: 'La Solicitud de Compra ha sido actualizada correctamente.',
          timer: 2000, // Cierra automáticamente después de 2 segundos
          showConfirmButton: false // No mostrar botón de confirmación
        })
      } else {
        // Modo Creación
        response = await axiosPrivate.post<IPurchaseRequest>(
          '/purchaseRequests',
          payload
        )
        Swal.fire({
          icon: 'success',
          title: '¡Creado!',
          text: 'La Solicitud de Compra ha sido creada correctamente.',
          timer: 2000,
          showConfirmButton: false
        })
      }
      onSuccess(response.data)
      handleClose()
    } catch (err) {
      setError('Error al crear/actualizar la solicitud') // Tu manejo de errores existente
      console.error('Error creating/updating purchase request:', err)
      // Aquí ya tienes un Swal.fire para errores, lo cual está bien.
      // Si no lo tuvieras, lo añadirías así:
      let message = `Error al ${existingRequest ? 'actualizar' : 'crear'} la solicitud.`
      if (isAxiosError(err) && err.response?.data?.message) {
        message =
          typeof err.response.data.message === 'string'
            ? err.response.data.message
            : JSON.stringify(err.response.data.message)
      } else if (err instanceof Error) {
        message = err.message
      }
      Swal.fire('Error', message, 'error')
    }
  }

  const handleClose = () => {
    setFormData({
      status: PurchaseRequestStatus.Pending,
      requirements: [],
      items: [],
      elaborationDate: new Date(new Date().getTime() - 5 * 60 * 60 * 1000)
    })
    setCurrentItem({
      quantity: 1,
      description: '',
      supplierIds: []
    })
    setNewRequirement('')
    setError('')
    setRequirementType('')
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
      currentItem.description &&
      currentItem.quantity &&
      currentItem.quantity > 0
    ) {
      setFormData((prev) => {
        const updatedFormData = {
          ...prev,
          items: [
            ...(prev.items || []),
            {
              description: currentItem.description!,
              quantity: currentItem.quantity!,
              supplierIds: currentItem.supplierIds || []
            } as PurchaseRequestItem
          ]
        }

        return updatedFormData
      })

      setCurrentItem({
        quantity: 1,
        description: '',
        supplierIds: [],
        supplierInput: []
      }) // Resetear currentItem
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between' }}>
        {existingRequest
          ? 'Editar Solicitud de Compra'
          : 'Nueva Solicitud de Compra'}
        <IconButton onClick={handleClose}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3} sx={{ pt: 2 }}>
          <Grid item xs={12}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
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
                      setFormData({
                        ...formData,
                        elaborationDate: dateValue
                      })
                    }
                  }}
                  inputProps={{
                    max: new Date(new Date().getTime() - 5 * 60 * 60 * 1000)
                      .toISOString()
                      .split('T')[0] // Deshabilitar días futuros
                  }} // Deshabilitar días futuros
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  select // Esto convierte el TextField en un Select
                  fullWidth
                  label='Tipo de Compra' // Asumiendo que es un campo requerido
                  value={formData.purchaseType || ''} // Es importante manejar el caso de valor indefinido
                  onChange={(e) =>
                    setFormData({ ...formData, purchaseType: e.target.value })
                  }
                  name='purchaseType' // Es buena práctica incluir el nombre del campo
                  required
                >
                  <MenuItem value='I'>Tipo I</MenuItem>
                  <MenuItem value='II'>Tipo II</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Nombre del Solicitante *'
                  value={formData.applicantName || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, applicantName: e.target.value })
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Cargo del Solicitante *'
                  value={formData.applicantPosition || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      applicantPosition: e.target.value
                    })
                  }
                />
              </Grid>
            </Grid>
          </Grid>
          {/* Select para tipo de requerimientos */}

          {/* Sección de ítems */}
          <Grid item xs={12}>
            <Box sx={{ border: '1px solid #ddd', p: 2, borderRadius: 1 }}>
              <Typography variant='subtitle1' sx={{ mb: 2 }}>
                Ítems Solicitados
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={2}>
                  <TextField
                    fullWidth
                    label='Cant *'
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

                <Grid item xs={10}>
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

                <Grid item xs={12}>
                  <Button
                    variant='outlined'
                    onClick={addItem}
                    startIcon={<Add />}
                    disabled={
                      !currentItem.description ||
                      !(currentItem.quantity && currentItem.quantity > 0)
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
                      (Cant: {item.quantity})<div>{item.description}</div>
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
              <Grid item xs={12} md={4} sx={{ mb: 2 }}>
                <TextField
                  select
                  fullWidth
                  label='Tipo de Requerimientos'
                  value={
                    formData.purchaseType === 'II' &&
                    requirementType !== 'equipment'
                      ? '' // Reset if type II and not equipment
                      : requirementType
                  }
                  onChange={handleRequirementTypeChange}
                >
                  <MenuItem value='equipment'>Compra de Equipos</MenuItem>
                  {formData.purchaseType === 'I' && [
                    <MenuItem value='calibration'>
                      Servicios de Calibración
                    </MenuItem>,
                    <MenuItem value='proficiency'>Ensayos de Aptitud</MenuItem>,
                    <MenuItem value='audit'>Auditoría Interna</MenuItem>,
                    <MenuItem value='others'>Otros</MenuItem>
                  ]}
                </TextField>
              </Grid>
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
                      width: '100%',
                      borderBottom:
                        index < (formData.requirements?.length ?? 0) - 1
                          ? '1px solid #eee'
                          : 'none'
                    }}
                  >
                    {editingRequirementIndex === index ? (
                      <TextField
                        multiline
                        fullWidth
                        value={editingRequirementValue}
                        onChange={(e) =>
                          setEditingRequirementValue(e.target.value)
                        }
                        onBlur={handleSaveRequirement}
                        onKeyPress={(e) =>
                          e.key === 'Enter' && handleSaveRequirement()
                        }
                        sx={{ flexGrow: 1 }}
                      />
                    ) : (
                      <Typography variant='body2' sx={{ flexGrow: 1 }}>
                        • {req}
                      </Typography>
                    )}

                    <IconButton
                      size='small'
                      onClick={() => handleEditRequirement(index)}
                    >
                      <Edit fontSize='small' />
                    </IconButton>

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
          {existingRequest ? 'Guardar Cambios' : 'Crear Solicitud'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PurchaseRequestModal
