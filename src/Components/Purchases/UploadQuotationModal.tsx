import React, { useEffect, useState } from 'react'
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
  IconButton,
  Divider
} from '@mui/material'
import useAxiosPrivate from '@utils/use-axios-private'
import Swal from 'sweetalert2'
import {
  PurchaseRequest,
  PurchaseRequestItem,
  Supplier
} from 'src/pages/Purchases/Types' // Asegúrate de importar Supplier
import {
  CloudUpload,
  Visibility,
  CheckCircle,
  ErrorOutline
} from '@mui/icons-material'
import { useMutation } from 'react-query'

interface UploadQuotationModalProps {
  open: boolean
  onClose: () => void
  purchaseRequest: PurchaseRequest
  onSuccess: () => void
}

const UploadQuotationModal: React.FC<UploadQuotationModalProps> = ({
  open,
  onClose,
  purchaseRequest,
  onSuccess
}) => {
  const axiosPrivate = useAxiosPrivate()
  const [file, setFile] = useState<File | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
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

  const items: PurchaseRequestItem[] = purchaseRequest.items || []
  const uniqueSuppliers: (Supplier | undefined)[] = Array.from(
    new Set(
      items.flatMap((item) => item.suppliers?.map((supplier) => supplier.id))
    )
  ).map((id) =>
    items
      .flatMap((item) => item.suppliers)
      .find((supplier) => supplier?.id === id)
  )

  useEffect(() => {
    // Reset states when modal opens or purchase request changes
    if (open) {
      setSelectedFiles({})
      const initialActionStates: typeof actionStates = {}
      uniqueSuppliers.forEach((supplier) => {
        if (supplier) {
          initialActionStates[supplier.id.toString()] = { pdfUrl: null }
        }
      })
      setActionStates(initialActionStates)
    }
  }, [open, purchaseRequest])

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
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
      } else {
        setSelectedFiles((prev) => ({ ...prev, [supplierId]: selectedFile }))
      }
    }
  }

  const handleUpload = async (supplierId: string) => {
    const fileToUpload = selectedFiles[supplierId]
    if (!fileToUpload) return

    setActionStates((prev) => ({
      ...prev,
      [supplierId]: { ...prev[supplierId], uploading: true, error: undefined }
    }))

    const formData = new FormData()
    formData.append('file', fileToUpload)
    formData.append('supplierId', supplierId)
    formData.append('purchaseRequestId', purchaseRequest.id.toString())
    formData.append('purchaseRequestCode', purchaseRequest.purchaseCode || '')
    const supplier = uniqueSuppliers.find(
      (s) => s?.id.toString() === supplierId
    )
    formData.append('supplierName', supplier?.name || 'Desconocido')

    try {
      await axiosPrivate.post('/purchaseQuotations', formData)
      Swal.fire(
        'Éxito',
        'La cotización ha sido subida correctamente.',
        'success'
      )
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error uploading quotation:', error)
      setActionStates((prev) => ({
        ...prev,
        [supplierId]: {
          ...prev[supplierId],
          error: 'Error al subir la cotización.'
        }
      }))
    } finally {
      setActionStates((prev) => ({
        ...prev,
        [supplierId]: { ...prev[supplierId], uploading: false }
      }))
    }
  }

  const fetchPdfForView = async (supplierId: string) => {
    if (actionStates[supplierId]?.pdfUrl) {
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
      const response = await axiosPrivate.get(
        `/purchaseQuotations?purchaseRequestId=${purchaseRequest.id}&supplierId=${supplierId}`,
        { responseType: 'blob' }
      )
      if (response.headers['content-type'] !== 'application/pdf') {
        throw new Error('No es un PDF')
      }
      const url = window.URL.createObjectURL(
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
      return await axiosPrivate.post('/purchaseQuotations/accept', {
        purchaseRequestId: purchaseRequest.id,
        supplierId
      })
    },
    {
      onSuccess: (_, supplierId) => {
        Swal.fire('Aceptado', 'La cotización ha sido aceptada.', 'success')
        onSuccess() // Refreshes data
        setActionStates((prev) => ({
          ...prev,
          [supplierId]: { ...prev[supplierId], accepting: false }
        }))
      },
      onError: (error, supplierId) => {
        console.error('Error accepting quotation:', error)
        Swal.fire(
          'Error',
          'Ocurrió un error al aceptar la cotización.',
          'error'
        )
        setActionStates((prev) => ({
          ...prev,
          [supplierId]: {
            ...prev[supplierId],
            accepting: false,
            error: 'Error al aceptar.'
          }
        }))
      }
    }
  )

  const handleAcceptQuotation = async (supplierId: string) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas aceptar esta cotización?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, aceptar',
      cancelButtonText: 'Cancelar'
    })
    if (result.isConfirmed) {
      acceptQuotationMutation.mutate(supplierId)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle>
        Gestionar Cotizaciones para SR-{purchaseRequest.purchaseCode}
      </DialogTitle>{' '}
      <DialogContent>
        {uniqueSuppliers.map((supplier, index) => {
          if (!supplier) return null
          const supplierIdStr = supplier.id.toString()
          const existingQuotation = purchaseRequest.quotations.find(
            (q) => q.supplierId.toString() === supplierIdStr
          )
          const currentActionState = actionStates[supplierIdStr] || {}

          return (
            <Box
              key={supplier.id}
              sx={{ mb: 3, p: 2, border: '1px solid #ddd', borderRadius: 1 }}
            >
              <Typography variant='h6' gutterBottom>
                {supplier.name}
              </Typography>
              <Grid container spacing={2} alignItems='center'>
                <Grid item xs={12} md={6}>
                  <Button
                    variant='outlined'
                    component='label'
                    startIcon={<CloudUpload />}
                    fullWidth
                  >
                    {selectedFiles[supplierIdStr]?.name || 'Seleccionar PDF'}
                    <input
                      type='file'
                      hidden
                      accept='application/pdf'
                      onChange={(e) => handleFileChange(e, supplierIdStr)}
                    />
                  </Button>
                  <Button
                    variant='contained'
                    onClick={() => handleUpload(supplierIdStr)}
                    disabled={
                      !selectedFiles[supplierIdStr] ||
                      currentActionState.uploading
                    }
                    startIcon={
                      currentActionState.uploading ? (
                        <CircularProgress size={20} />
                      ) : null
                    }
                    sx={{ mt: 1 }}
                    fullWidth
                  >
                    Subir Cotización
                  </Button>
                </Grid>
                <Grid item xs={12} md={6}>
                  {existingQuotation && (
                    <Box>
                      <Alert severity='info' sx={{ mb: 1 }}>
                        Cotización subida.
                      </Alert>
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
                        disabled={currentActionState.pdfLoading}
                        sx={{ mr: 1 }}
                      >
                        Ver Cotización
                      </Button>
                      {!existingQuotation.accepted ? (
                        <Button
                          variant='contained'
                          color='success'
                          onClick={() => handleAcceptQuotation(supplierIdStr)}
                          startIcon={
                            currentActionState.accepting ? (
                              <CircularProgress size={20} />
                            ) : (
                              <CheckCircle />
                            )
                          }
                          disabled={currentActionState.accepting}
                        >
                          Aceptar
                        </Button>
                      ) : (
                        <Alert
                          severity='success'
                          icon={<CheckCircle fontSize='inherit' />}
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            p: 1
                          }}
                        >
                          Aceptada
                        </Alert>
                      )}
                    </Box>
                  )}
                </Grid>
                {currentActionState.error && (
                  <Grid item xs={12}>
                    <Alert
                      severity='error'
                      icon={<ErrorOutline fontSize='inherit' />}
                    >
                      {currentActionState.error}
                    </Alert>
                  </Grid>
                )}
                {currentActionState.pdfUrl && (
                  <Grid item xs={12} sx={{ mt: 2 }}>
                    <Typography variant='subtitle2'>
                      Visualizando: {supplier.name}
                    </Typography>
                    <iframe
                      src={currentActionState.pdfUrl}
                      width='100%'
                      height='400px'
                      title={`Cotización PDF ${supplier.name}`}
                      style={{ border: '1px solid #ccc' }}
                    />
                  </Grid>
                )}
              </Grid>
              {index < uniqueSuppliers.length - 1 && <Divider sx={{ my: 2 }} />}
            </Box>
          )
        })}
        {uniqueSuppliers.filter((s) => !!s).length === 0 && (
          <Typography>
            No hay proveedores asignados a los ítems de esta solicitud.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color='primary'>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default UploadQuotationModal
