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
  Typography,
  Autocomplete,
  CircularProgress,
  MenuItem
} from '@mui/material'
import { Add, Close, Delete, Edit } from '@mui/icons-material'
import {
  PurchaseRequest as IPurchaseRequest,
  PurchaseRequestItem
} from 'src/pages/Purchases/Types'
import useAxiosPrivate from '@utils/use-axios-private'
import { PurchaseRequestStatus } from 'src/pages/Purchases/Enums'
import { debounce } from 'lodash'
import {
  calibrationServiceRequirements,
  equipmentPurchaseRequirements,
  proficiencyTestingServiceRequirements,
  internalAuditServiceRequirements
} from 'src/utils/requirements'

interface CreatePurchaseRequestModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (newRequest: IPurchaseRequest) => void
}

const PurchaseRequestModal: React.FC<CreatePurchaseRequestModalProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const axiosPrivate = useAxiosPrivate()
  const [formData, setFormData] = React.useState<Partial<IPurchaseRequest>>({
    status: PurchaseRequestStatus.Pending,
    requirements: [],
    items: [],
    elaborationDate: new Date(new Date().getTime() - 5 * 60 * 60 * 1000)
  })

  const [currentItem, setCurrentItem] = React.useState<
    Partial<PurchaseRequestItem>
  >({
    quantity: 1,
    description: '',
    motive: '',
    supplierIds: []
  })

  // Estados para el autocomplete de proveedores
  const [providers, setProviders] = React.useState<any[]>([])
  const [searchTerm, setSearchTerm] = React.useState('')
  const [loadingProviders, setLoadingProviders] = React.useState(false)
  const [initialLoad, setInitialLoad] = React.useState(true)

  const [newRequirement, setNewRequirement] = React.useState('')
  const [error, setError] = React.useState('')
  const [requirementType, setRequirementType] = React.useState('')

  const [editingRequirementIndex, setEditingRequirementIndex] = React.useState<
    number | null
  >(null)
  const [editingRequirementValue, setEditingRequirementValue] =
    React.useState<string>('')

  // Función debounce para búsquedas
  const fetchProviders = React.useCallback(
    debounce(async (search: string) => {
      try {
        setLoadingProviders(true)
        const { data } = await axiosPrivate.get('/suppliers', {
          params: { search }
        })
        setProviders(data)
        if (initialLoad) setInitialLoad(false)
      } catch (error) {
        console.error('Error fetching providers:', error)
      } finally {
        setLoadingProviders(false)
      }
    }, 300),
    []
  )

  // Cargar proveedores al abrir el modal
  React.useEffect(() => {
    if (open) {
      fetchProviders('')
    }
  }, [open])

  // Manejar cambio de búsqueda
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    fetchProviders(value)
  }

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
    try {
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
      items: [],
      elaborationDate: new Date(new Date().getTime() - 5 * 60 * 60 * 1000)
    })
    setCurrentItem({
      quantity: 1,
      description: '',
      motive: '',
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
      currentItem.motive &&
      (currentItem.supplierIds?.length ?? 0) > 0
    ) {
      setFormData((prev) => ({
        ...prev,
        items: [
          ...(prev.items || []),
          {
            ...currentItem,
            supplierIds: currentItem.supplierIds // Enviamos array de IDs
          } as PurchaseRequestItem
        ]
      }))
      setCurrentItem({
        quantity: 1,
        description: '',
        motive: '',
        supplierIds: []
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
          {/* Campos básicos */}
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

                <Grid item xs={4}>
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

                <Grid item xs={3}>
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

                <Grid item xs={3}>
                  <Autocomplete
                    multiple
                    options={providers}
                    autoComplete={false}
                    getOptionLabel={(option) => option.name}
                    loading={loadingProviders}
                    onInputChange={(_, value) => handleSearchChange(value)}
                    onChange={(_, newValues) => {
                      setCurrentItem((prev) => ({
                        ...prev,
                        supplierIds: newValues.map((v) => v.id) // Guardar array de IDs
                      }))
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label='Proveedor *'
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingProviders ? (
                                <CircularProgress color='inherit' size={20} />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                    filterOptions={(x) => x}
                    noOptionsText={
                      initialLoad
                        ? 'Cargando proveedores...'
                        : searchTerm
                          ? 'No se encontraron proveedores'
                          : 'Escribe para buscar'
                    }
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    variant='outlined'
                    onClick={addItem}
                    startIcon={<Add />}
                    disabled={
                      !currentItem.description ||
                      !currentItem.motive ||
                      !currentItem.supplierIds?.length
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
                      <div>Motivo: {item.motive}</div>
                      <div>
                        Proveedores:{' '}
                        {item.supplierIds?.map((id) => (
                          <span key={id} style={{ marginRight: '8px' }}>
                            {providers.find((p) => p.id === id)?.name ||
                              'Desconocido'}
                          </span>
                        ))}
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
              <Grid item xs={12} md={4} sx={{ mb: 2 }}>
                <TextField
                  select
                  fullWidth
                  label='Tipo de Requerimientos'
                  value={requirementType}
                  onChange={handleRequirementTypeChange}
                >
                  <MenuItem value='calibration'>
                    Servicios de Calibración
                  </MenuItem>
                  <MenuItem value='equipment'>Compra de Equipos</MenuItem>
                  <MenuItem value='proficiency'>Ensayos de Aptitud</MenuItem>
                  <MenuItem value='audit'>Auditoría Interna</MenuItem>
                  <MenuItem value='others'>Otros</MenuItem>
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
          Crear Solicitud
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PurchaseRequestModal
