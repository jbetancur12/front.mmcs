// src/Components/Purchases/UploadQuotationModal.tsx
import React, { useEffect, useState, useCallback, FC, ChangeEvent } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Autocomplete,
  TextField,
  Paper,
  IconButton,
  Chip
} from '@mui/material'
import {
  CloudUpload,
  Visibility,
  CheckCircle,
  ErrorOutline,
  Add
} from '@mui/icons-material'
import CloseIcon from '@mui/icons-material/Close' // Icono para cerrar el modal
import useAxiosPrivate from '@utils/use-axios-private'
import Swal from 'sweetalert2'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { isAxiosError } from 'axios' // Importar AxiosResponse
import {
  PurchaseRequest as IPurchaseRequest, // Renombrado para evitar conflicto con el componente
  PurchaseRequestItem as IPurchaseRequestItem,
  Supplier as ISupplier
  // PurchaseOrder, // No se usa directamente en este modal más que para tipos internos
} from 'src/pages/Purchases/Types' // Asegúrate que estas rutas sean correctas
import debounce from 'lodash/debounce'
import { SuppliersAPIResponse } from './PurchaseRequestModal'

// Definir localmente si no está en Types.ts, pero idealmente debería estar allí
interface Quotation {
  id: string | number
  supplierId: number | string // Debe coincidir con ISupplier['id']
  filePath?: string
  originalFileName?: string
  accepted?: boolean
}

// Actualizar PurchaseRequest para incluir quotations
interface PurchaseRequestWithQuotations extends IPurchaseRequest {
  quotations: Quotation[]
  items?: IPurchaseRequestItemWithSuppliers[] // Items con sus proveedores
}

interface IPurchaseRequestItemWithSuppliers extends IPurchaseRequestItem {
  suppliers?: ISupplier[]
}

interface UploadQuotationModalProps {
  open: boolean
  onClose: () => void
  purchaseRequest: PurchaseRequestWithQuotations // Usar el tipo actualizado
  onSuccess: () => void
}

// Helper para obtener la lista inicial de proveedores únicos desde los ítems
const getInitialSuppliersFromItems = (
  pr: PurchaseRequestWithQuotations
): ISupplier[] => {
  const allSuppliersFromItems = (pr.items ?? []).flatMap(
    (item) => item.suppliers || []
  )
  const uniqueSuppliersMap = new Map<string | number, ISupplier>()
  allSuppliersFromItems.forEach((supplier) => {
    if (supplier && !uniqueSuppliersMap.has(supplier.id)) {
      uniqueSuppliersMap.set(supplier.id, supplier)
    }
  })
  return Array.from(uniqueSuppliersMap.values())
}

const UploadQuotationModal: FC<UploadQuotationModalProps> = ({
  open,
  onClose,
  purchaseRequest,
  onSuccess
}) => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()

  const [selectedFiles, setSelectedFiles] = useState<{
    [key: string]: File | null
  }>({})
  const [actionStates, setActionStates] = useState<{
    [key: string]: {
      uploading?: boolean
      accepting?: boolean
      error?: string
      pdfLoading?: boolean
      pdfUrl?: string | null
    }
  }>({})

  const [displayedSuppliers, setDisplayedSuppliers] = useState<ISupplier[]>([])
  const [showAddSupplierSection, setShowAddSupplierSection] = useState(false)
  const [autocompleteInputValue, setAutocompleteInputValue] = useState('') // Para el input directo del Autocomplete
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('') // Para la query de React Query
  const [selectedNewSuppliers, setSelectedNewSuppliers] = useState<ISupplier[]>(
    []
  )

  // Efecto para inicializar/resetear estados
  useEffect(() => {
    if (open) {
      const initialSuppliers = getInitialSuppliersFromItems(purchaseRequest)
      setDisplayedSuppliers(initialSuppliers)

      setSelectedFiles({})
      setShowAddSupplierSection(false)
      setSelectedNewSuppliers([])
      setAutocompleteInputValue('')
      setDebouncedSearchTerm('')

      const initialActionStates: typeof actionStates = {}
      initialSuppliers.forEach((supplier) => {
        initialActionStates[supplier.id.toString()] = { pdfUrl: null }
      })
      setActionStates(initialActionStates)
    }
  }, [open, purchaseRequest])

  const debouncedSetSearch = useCallback(
    debounce((value: string) => {
      setDebouncedSearchTerm(value)
    }, 500),
    []
  )

  useEffect(() => {
    debouncedSetSearch(autocompleteInputValue)
  }, [autocompleteInputValue, debouncedSetSearch])

  const {
    data: searchedSuppliersList = [],
    isLoading: isLoadingSearchedSuppliers
  } = useQuery<ISupplier[], Error>(
    ['searchSuppliersForQuotation', debouncedSearchTerm],
    async () => {
      if (!debouncedSearchTerm.trim() || debouncedSearchTerm.length < 2)
        return []
      const response = await axiosPrivate.get<
        SuppliersAPIResponse | ISupplier[]
      >('/suppliers', {
        params: {
          search: debouncedSearchTerm,
          limit: 15,
          //active: true,
          purchaseType: purchaseRequest.purchaseType
        } // Ejemplo de parámetros
      })
      return Array.isArray(response.data)
        ? response.data
        : response.data.suppliers || []
    },
    { enabled: debouncedSearchTerm.length >= 2, keepPreviousData: true }
  )

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
    supplierId: string
  ) => {
    const selectedFile = event.target.files?.[0]
    setActionStates((prev) => ({
      ...prev,
      [supplierId]: { ...prev[supplierId], error: undefined }
    }))
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setActionStates((prev) => ({
          ...prev,
          [supplierId]: {
            ...prev[supplierId],
            error: 'Solo se permiten archivos PDF.'
          }
        }))
        setSelectedFiles((prev) => ({ ...prev, [supplierId]: null }))
        event.target.value = '' // Limpiar el input de archivo
      } else {
        setSelectedFiles((prev) => ({ ...prev, [supplierId]: selectedFile }))
      }
    }
  }

  // --- MUTACIONES ---
  const commonMutationOptions = {
    onSuccessInvalidatePR: () => {
      queryClient.invalidateQueries([
        'purchaseRequestDetails',
        purchaseRequest.id.toString()
      ])
      onSuccess() // Llama al onSuccess general (ej. para refrescar lista de PRs)
    },
    onErrorDisplay: (error: unknown, defaultMessage: string) => {
      console.error(`Error: ${defaultMessage}`, error)
      let userMessage = defaultMessage
      if (isAxiosError(error) && error.response?.data?.message) {
        userMessage = error.response.data.message
      } else if (error instanceof Error) {
        userMessage = error.message
      }
      Swal.fire('Error', userMessage, 'error')
    }
  }

  const uploadMutation = useMutation(
    async (vars: { supplierId: string; file: File; supplierName?: string }) => {
      const { supplierId, file, supplierName } = vars
      setActionStates((prev) => ({
        ...prev,
        [supplierId]: { ...prev[supplierId], uploading: true, error: undefined }
      }))
      const formData = new FormData()
      formData.append('file', file)
      formData.append('supplierId', supplierId)
      formData.append('purchaseRequestId', purchaseRequest.id.toString())
      formData.append('purchaseRequestCode', purchaseRequest.purchaseCode || '')
      formData.append('supplierName', supplierName || 'Desconocido')
      for (const [key, value] of formData.entries()) {
  console.log(key, value);
}

      return axiosPrivate.post('/purchaseQuotations', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    {
      onSuccess: (_data, variables) => {
        Swal.fire(
          'Éxito',
          'La cotización ha sido subida correctamente.',
          'success'
        )
        setSelectedFiles((prev) => ({ ...prev, [variables.supplierId]: null }))
        commonMutationOptions.onSuccessInvalidatePR()
      },
      onError: (error, variables) => {
        setActionStates((prev) => ({
          ...prev,
          [variables.supplierId]: {
            ...prev[variables.supplierId],
            error: 'Error al subir la cotización.'
          }
        }))
        commonMutationOptions.onErrorDisplay(
          error,
          'No se pudo subir la cotización.'
        )
      },
      onSettled: (_data, _error, variables) => {
        setActionStates((prev) => ({
          ...prev,
          [variables.supplierId]: {
            ...prev[variables.supplierId],
            uploading: false
          }
        }))
      }
    }
  )

  const fetchPdfForView = async (supplierId: string) => {
    const currentPdfUrl = actionStates[supplierId]?.pdfUrl
    if (currentPdfUrl) {
      URL.revokeObjectURL(currentPdfUrl) // Limpiar URL de objeto anterior
      setActionStates((prev) => ({
        ...prev,
        [supplierId]: { ...prev[supplierId], pdfUrl: null }
      }))
      return
    }
    setActionStates((prev) => ({
      ...prev,
      [supplierId]: {
        ...prev[supplierId],
        pdfLoading: true,
        error: undefined,
        pdfUrl: null
      }
    }))
    try {
      const quotation = purchaseRequest.quotations.find(
        (q) => q.supplierId.toString() === supplierId
      )
      if (!quotation || (!quotation.filePath && !quotation.id)) {
        // Asumimos que necesitamos filePath o un ID de cotización
        throw new Error('Datos de cotización insuficientes para visualización.')
      }
      // Ejemplo: Si filePath es una URL directa y pública
      // if (quotation.filePath?.startsWith('http')) {
      //   window.open(quotation.filePath, '_blank');
      //   setActionStates(prev => ({ ...prev, [supplierId]: { ...prev[supplierId], pdfLoading: false } }));
      //   return;
      // }
      // O si necesitas un endpoint para obtener el blob por ID de cotización (más seguro)
      const response = await axiosPrivate.get(
        // Ajusta este endpoint: puede ser por ID de cotización o PR_ID + Supplier_ID
        `/purchaseQuotations?purchaseRequestId=${purchaseRequest.id}&supplierId=${supplierId}`,

        { responseType: 'blob' }
      )
      if (response.headers['content-type'] !== 'application/pdf')
        throw new Error('El archivo no es un PDF.')
      const url = URL.createObjectURL(
        new Blob([response.data], { type: 'application/pdf' })
      )
      setActionStates((prev) => ({
        ...prev,
        [supplierId]: { ...prev[supplierId], pdfUrl: url, pdfLoading: false }
      }))
    } catch (error) {
      console.error('Error fetching PDF:', error)
      setActionStates((prev) => ({
        ...prev,
        [supplierId]: {
          ...prev[supplierId],
          error: 'Error al cargar PDF.',
          pdfLoading: false
        }
      }))
    }
  }

  const acceptQuotationMutation = useMutation(
    async (supplierId: string) => {
      setActionStates((prev) => ({
        ...prev,
        [supplierId]: { ...prev[supplierId], accepting: true, error: undefined }
      }))
      return axiosPrivate.post('/purchaseQuotations/accept', {
        purchaseRequestId: purchaseRequest.id,
        supplierId
      })
    },
    {
      onSuccess: () => {
        Swal.fire('Aceptado', 'La cotización ha sido aceptada.', 'success')
        commonMutationOptions.onSuccessInvalidatePR()
      },
      onError: (error, supplierId) => {
        setActionStates((prev) => ({
          ...prev,
          [supplierId]: { ...prev[supplierId], error: 'Error al aceptar.' }
        }))
        commonMutationOptions.onErrorDisplay(
          error,
          'Ocurrió un error al aceptar la cotización.'
        )
      },
      onSettled: (_data, _error, supplierId) => {
        setActionStates((prev) => ({
          ...prev,
          [supplierId]: { ...prev[supplierId], accepting: false }
        }))
      }
    }
  )

  const associateSuppliersToPRItemsMutation = useMutation(
    async (newSupplierIds: (string | number)[]) => {
      if (newSupplierIds.length === 0) return
      const numericSupplierIds = newSupplierIds.map((id) => Number(id))
      return axiosPrivate.post(
        `/purchaseRequests/${purchaseRequest.id}/suppliers`,
        { supplierIds: numericSupplierIds }
      )
    },
    {
      onSuccess: () => {
        Swal.fire({
          title: 'Proveedores Asociados',
          text: 'Los nuevos proveedores se han vinculado a los ítems de la solicitud.',
          icon: 'success',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        })
        commonMutationOptions.onSuccessInvalidatePR() // Esto refrescará purchaseRequest y el useEffect actualizará displayedSuppliers
      },
      onError: (error) => {
        commonMutationOptions.onErrorDisplay(
          error,
          'No se pudo asociar los proveedores a los ítems de la Solicitud de Compra.'
        )
      }
    }
  )

  const handleUpload = (supplierId: string) => {
    const fileToUpload = selectedFiles[supplierId]
    const supplier = displayedSuppliers.find(
      (s) => s.id.toString() === supplierId
    )
    if (!fileToUpload || !supplier) return
    uploadMutation.mutate({
      supplierId,
      file: fileToUpload,
      supplierName: supplier.name
    })
  }

  const handleAcceptQuotation = async (supplierId: string) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas aceptar esta cotización?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, aceptar',
      cancelButtonText: 'Cancelar'
    })
    if (result.isConfirmed) acceptQuotationMutation.mutate(supplierId)
  }

  const handleAddSelectedSuppliers = () => {
    const newlyAddedToUIDisplay = selectedNewSuppliers.filter(
      (newSup) =>
        !displayedSuppliers.some((dispSup) => dispSup.id === newSup.id)
    )

    if (newlyAddedToUIDisplay.length > 0) {
      // Actualizar UI localmente primero para respuesta rápida
      setDisplayedSuppliers((prev) => {
        const existingIds = new Set(prev.map((s) => s.id))
        const trulyNewForDisplay = newlyAddedToUIDisplay.filter(
          (s) => !existingIds.has(s.id)
        )
        return [...prev, ...trulyNewForDisplay]
      })

      const newActionStatesToAdd: typeof actionStates = {}
      newlyAddedToUIDisplay.forEach((sup) => {
        newActionStatesToAdd[sup.id.toString()] = { pdfUrl: null }
      })
      setActionStates((prev) => ({ ...prev, ...newActionStatesToAdd }))
      setSelectedFiles((prev) => {
        // Asegurar que no haya archivos seleccionados para estos nuevos
        const updated = { ...prev }
        newlyAddedToUIDisplay.forEach((sup) => {
          updated[sup.id.toString()] = null
        })
        return updated
      })

      const idsToAssociateBackend = newlyAddedToUIDisplay.map((s) => s.id)
      associateSuppliersToPRItemsMutation.mutate(idsToAssociateBackend)
    }
    setSelectedNewSuppliers([])
    setShowAddSupplierSection(false)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='lg' fullWidth>
      {' '}
      {/* Aumentado a lg para más espacio */}
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        Gestionar Cotizaciones para SR-{purchaseRequest.purchaseCode}
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {' '}
        {/* dividers para mejor separación */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
          <Button
            variant={showAddSupplierSection ? 'outlined' : 'contained'}
            startIcon={<Add />}
            onClick={() => setShowAddSupplierSection(!showAddSupplierSection)}
            size='small'
          >
            {showAddSupplierSection
              ? 'Cancelar Añadir Proveedor'
              : 'Añadir Proveedor a Lista'}
          </Button>
        </Box>
        {showAddSupplierSection && (
          <Paper elevation={1} sx={{ p: 2, mb: 3, mt: 1 }}>
            <Typography variant='subtitle1' gutterBottom>
              Buscar y seleccionar proveedores adicionales
            </Typography>
            <Autocomplete
              multiple
              filterSelectedOptions
              options={searchedSuppliersList}
              value={selectedNewSuppliers}
              onInputChange={(_event, newInputValue) =>
                setAutocompleteInputValue(newInputValue)
              }
              onChange={(_event, newValue) => setSelectedNewSuppliers(newValue)}
              getOptionLabel={(option) => `${option.name} (${option.taxId})`}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              loading={isLoadingSearchedSuppliers}
              loadingText='Buscando...'
              noOptionsText={
                autocompleteInputValue.length < 2
                  ? 'Escribe al menos 2 caracteres...'
                  : 'No se encontraron proveedores'
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label='Buscar Proveedores'
                  placeholder='Nombre o NIT/CC'
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isLoadingSearchedSuppliers ? (
                          <CircularProgress color='inherit' size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    )
                  }}
                />
              )}
              sx={{ mb: 1 }}
            />
            <Button
              variant='contained'
              onClick={handleAddSelectedSuppliers}
              disabled={selectedNewSuppliers.length === 0}
              size='small'
            >
              Añadir Seleccionados a Gestión
            </Button>
          </Paper>
        )}
        {displayedSuppliers.length === 0 && !showAddSupplierSection && (
          <Alert severity='info' sx={{ mt: 2 }}>
            No hay proveedores asociados o añadidos a esta solicitud. Puedes
            añadir proveedores usando el botón de arriba.
          </Alert>
        )}
        {displayedSuppliers.map((supplier, index) => {
          if (!supplier) return null
          const supplierIdStr = supplier.id.toString()
          const existingQuotation = purchaseRequest.quotations.find(
            (q) => q.supplierId.toString() === supplierIdStr
          )
          const currentActionState = actionStates[supplierIdStr] || {}

          return (
            <React.Fragment key={supplier.id}>
              <Paper elevation={2} sx={{ mb: 3, p: 2, borderRadius: 2 }}>
                <Typography variant='h6' gutterBottom>
                  {supplier.name}{' '}
                  <Typography
                    component='span'
                    variant='body2'
                    color='textSecondary'
                  >
                    ({supplier.taxId})
                  </Typography>
                </Typography>
                <Grid container spacing={2} alignItems='flex-start'>
                  <Grid item xs={12} md={existingQuotation ? 5 : 12}>
                    {' '}
                    {/* Columna para subir */}
                    <Button
                      variant='outlined'
                      component='label'
                      startIcon={<CloudUpload />}
                      fullWidth
                      disabled={
                        !!existingQuotation ||
                        currentActionState.uploading ||
                        uploadMutation.isLoading
                      }
                      sx={{
                        textTransform: 'none',
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        minHeight: 56
                      }} // Para consistencia altura
                    >
                      <Box
                        component='span'
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {selectedFiles[supplierIdStr]?.name ||
                          (existingQuotation
                            ? 'Cotización Ya Subida'
                            : 'Seleccionar PDF...')}
                      </Box>
                      <input
                        type='file'
                        hidden
                        accept='application/pdf'
                        onChange={(e) => handleFileChange(e, supplierIdStr)}
                        disabled={
                          !!existingQuotation ||
                          currentActionState.uploading ||
                          uploadMutation.isLoading
                        }
                      />
                    </Button>
                    {!existingQuotation && selectedFiles[supplierIdStr] && (
                      <Button
                        variant='contained'
                        onClick={() => handleUpload(supplierIdStr)}
                        disabled={
                          currentActionState.uploading ||
                          uploadMutation.isLoading
                        }
                        startIcon={
                          currentActionState.uploading ? (
                            <CircularProgress color='inherit' size={20} />
                          ) : (
                            <CloudUpload />
                          )
                        }
                        sx={{ mt: 1 }}
                        fullWidth
                      >
                        Subir Cotización
                      </Button>
                    )}
                  </Grid>

                  {existingQuotation && (
                    <Grid item xs={12} md={7}>
                      {' '}
                      {/* Columna para acciones de cotización existente */}
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1,
                          width: '100%'
                        }}
                      >
                        <Alert
                          severity='info'
                          sx={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          Cotización subida:{' '}
                          {existingQuotation.originalFileName ||
                            `Archivo de ${supplier.name}`}
                        </Alert>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Button
                            variant='outlined'
                            onClick={() => fetchPdfForView(supplierIdStr)}
                            startIcon={
                              currentActionState.pdfLoading ? (
                                <CircularProgress size={20} />
                              ) : (
                                <Visibility />
                              )
                            }
                            disabled={
                              currentActionState.pdfLoading ||
                              currentActionState.accepting
                            }
                            size='small'
                          >
                            {currentActionState.pdfUrl
                              ? 'Ocultar PDF'
                              : 'Ver Cotización'}
                          </Button>
                          {!existingQuotation.accepted ? (
                            <Button
                              variant='contained'
                              color='success'
                              onClick={() =>
                                handleAcceptQuotation(supplierIdStr)
                              }
                              startIcon={
                                currentActionState.accepting ||
                                (acceptQuotationMutation.isLoading &&
                                  acceptQuotationMutation.variables ===
                                    supplierIdStr) ? (
                                  <CircularProgress color='inherit' size={20} />
                                ) : (
                                  <CheckCircle />
                                )
                              }
                              disabled={
                                currentActionState.accepting ||
                                (acceptQuotationMutation.isLoading &&
                                  acceptQuotationMutation.variables ===
                                    supplierIdStr) ||
                                currentActionState.pdfLoading
                              }
                              size='small'
                            >
                              Aceptar
                            </Button>
                          ) : (
                            <Chip
                              icon={<CheckCircle />}
                              label='Aceptada'
                              color='success'
                              variant='outlined'
                              size='small'
                            />
                          )}
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </Grid>
                {currentActionState.error && (
                  <Alert
                    severity='error'
                    icon={<ErrorOutline fontSize='inherit' />}
                    sx={{ mt: 1 }}
                  >
                    {currentActionState.error}
                  </Alert>
                )}
                {currentActionState.pdfUrl && (
                  <Box
                    sx={{
                      mt: 2,
                      border: '1px solid #ccc',
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}
                  >
                    {/* <Typography variant="subtitle2" sx={{p:1, backgroundColor:'#f5f5f5'}}>Visualizando cotización de: {supplier.name}</Typography> */}
                    <iframe
                      src={currentActionState.pdfUrl}
                      width='100%'
                      height='500px'
                      title={`Cotización PDF ${supplier.name}`}
                      style={{ border: 'none', display: 'block' }}
                    />
                  </Box>
                )}
              </Paper>
              {/* No añadir Divider si es el último elemento o si la sección de añadir está visible y no hay más proveedores */}
              {(index < displayedSuppliers.length - 1 ||
                showAddSupplierSection) &&
                displayedSuppliers.length > 0 && <Divider sx={{ my: 3 }} />}
            </React.Fragment>
          )
        })}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color='inherit'>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default UploadQuotationModal
