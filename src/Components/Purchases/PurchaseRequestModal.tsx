import React, { useCallback, useEffect } from 'react'
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
  MenuItem,
  Chip
} from '@mui/material'
import { Add, Close, Delete, Edit } from '@mui/icons-material'
import {
  PurchaseRequest as IPurchaseRequest,
  PurchaseRequestItem,
  Supplier
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

interface SuppliersAPIResponse {
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
  onSuccess
}) => {
  const axiosPrivate = useAxiosPrivate()
  const [formData, setFormData] = React.useState<Partial<IPurchaseRequest>>({
    status: PurchaseRequestStatus.Pending,
    requirements: [],
    items: [],
    elaborationDate: new Date(new Date().getTime() - 5 * 60 * 60 * 1000),
    purchaseType: 'I'
  })

  const [currentItem, setCurrentItem] =
    React.useState<CurrentPurchaseRequestItem>({
      quantity: 1,
      description: '',
      supplierIds: [],
      supplierInput: [] // Inicializar supplierInput como array vacío
    })

  // Estados para el autocomplete de proveedores
  const [providerOptions, setProviderOptions] = React.useState<Supplier[]>([]) // Tipado fuerte

  const [searchTerm, setSearchTerm] = React.useState('')
  const [loadingProviders, setLoadingProviders] = React.useState(false)

  const [initialFetchDone, setInitialFetchDone] = React.useState(false)

  const [newRequirement, setNewRequirement] = React.useState('')
  const [error, setError] = React.useState('')
  const [requirementType, setRequirementType] = React.useState('')

  const [editingRequirementIndex, setEditingRequirementIndex] = React.useState<
    number | null
  >(null)
  const [editingRequirementValue, setEditingRequirementValue] =
    React.useState<string>('')

  // Función debounce para búsquedas
  const debouncedFetchProviders = useCallback(
    debounce(
      async (
        currentSearchTerm: string,
        currentPurchaseType?: string | number
      ) => {
        if (!currentSearchTerm.trim() && currentSearchTerm !== '') {
          // No buscar si solo son espacios
          setProviderOptions([]) // Limpiar opciones si la búsqueda se borra a espacios
          setLoadingProviders(false)
          return
        }
        if (
          currentSearchTerm.trim().length > 0 &&
          currentSearchTerm.trim().length < 2
        ) {
          // No buscar si es muy corto
          setProviderOptions([])
          setLoadingProviders(false)
          return
        }

        setLoadingProviders(true)
        try {
          const response = await axiosPrivate.get<
            SuppliersAPIResponse | Supplier[]
          >('/suppliers', {
            params: {
              search: currentSearchTerm,
              purchaseType: currentPurchaseType,
              limit: 20
            }
          })

          // --- CORRECCIÓN IMPORTANTE: Extraer el array de la respuesta ---
          if (
            response.data &&
            Array.isArray((response.data as SuppliersAPIResponse).suppliers)
          ) {
            setProviderOptions(
              (response.data as SuppliersAPIResponse).suppliers
            )
          } else if (Array.isArray(response.data)) {
            setProviderOptions(response.data) // Si la API a veces devuelve un array directamente
          } else {
            console.warn(
              'Respuesta de proveedores no esperada o vacía:',
              response.data
            )
            setProviderOptions([])
          }
          // --- FIN CORRECCIÓN ---
        } catch (fetchError) {
          console.error('Error fetching providers:', fetchError)
          setProviderOptions([])
        } finally {
          setLoadingProviders(false)
          if (!initialFetchDone) setInitialFetchDone(true) // Marcar que la carga inicial (o intento) se hizo
        }
      },
      300
    ),
    [axiosPrivate, initialFetchDone] // axiosPrivate es estable, initialFetchDone para el primer mensaje
  )

  // Efecto para cargar proveedores cuando cambia el término de búsqueda o el tipo de compra
  useEffect(() => {
    if (open) {
      debouncedFetchProviders(searchTerm, formData.purchaseType as string)
    }
  }, [open, searchTerm, formData.purchaseType, debouncedFetchProviders])

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
      setFormData((prev) => ({
        ...prev,
        items: [
          ...(prev.items || []),
          {
            // Asegúrate que los campos obligatorios de PurchaseRequestItem estén aquí
            // description, quantity, y supplierIds son los clave para este item
            description: currentItem.description!,
            quantity: currentItem.quantity!,
            supplierIds: currentItem.supplierIds || [] // Viene de supplierInput
            // Otros campos de PurchaseRequestItem con valores por defecto si es necesario
          } as PurchaseRequestItem // Castear al tipo base que se guarda
        ]
      }))
      setCurrentItem({
        quantity: 1,
        description: '',
        supplierIds: [],
        supplierInput: []
      }) // Resetear currentItem
      setSearchTerm('') // Opcional: limpiar búsqueda de proveedores
      setProviderOptions([]) // Opcional: limpiar opciones
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

                <Grid item xs={7}>
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
                  <Autocomplete
                    multiple
                    fullWidth
                    options={providerOptions}
                    value={currentItem.supplierInput || []} // Usar supplierInput (array de objetos)
                    getOptionLabel={(option) => option.name || ''}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                    loading={loadingProviders}
                    loadingText='Cargando...'
                    onInputChange={(_event, newInputValue) =>
                      setSearchTerm(newInputValue)
                    }
                    onChange={(_event, newValue) => {
                      setCurrentItem((prev) => ({
                        ...prev,
                        supplierInput: newValue, // Guardar los objetos Supplier seleccionados
                        supplierIds: newValue.map((s) => s.id) // Actualizar el array de IDs
                      }))
                    }}
                    filterOptions={(options, params) => {
                      // Filtro básico del lado del cliente
                      const filtered = options.filter(
                        (option) =>
                          option.name
                            .toLowerCase()
                            .includes(params.inputValue.toLowerCase()) ||
                          option.taxId
                            ?.toLowerCase()
                            .includes(params.inputValue.toLowerCase())
                      )
                      return filtered
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label='Proveedores Sugeridos'
                        placeholder='Buscar...'
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
                    noOptionsText={
                      loadingProviders
                        ? 'Cargando...'
                        : !searchTerm.trim() && !initialFetchDone
                          ? 'Escriba para buscar...'
                          : providerOptions.length === 0
                            ? 'No se encontraron proveedores'
                            : 'No hay más opciones'
                    }
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => {
                        const { key, ...tagProps } = getTagProps({ index }) // Necesitas obtener la key de getTagProps
                        return (
                          <Chip key={key} label={option.name} {...tagProps} />
                        )
                      })
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
                      <div>
                        Proveedores:{' '}
                        {item.supplierIds?.map((id) => (
                          <span key={id} style={{ marginRight: '8px' }}>
                            {providerOptions.find((p) => p.id === id)?.name ||
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
          Crear Solicitud
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PurchaseRequestModal
