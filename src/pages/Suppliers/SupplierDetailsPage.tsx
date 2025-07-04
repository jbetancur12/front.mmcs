import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Box,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  DialogTitle,
  DialogContent,
  Dialog
} from '@mui/material'
import {
  UploadFile,
  Description,
  Edit,
  Visibility,
  Assessment,
  Close
} from '@mui/icons-material'
import useAxiosPrivate from '@utils/use-axios-private'
import Swal from 'sweetalert2'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { isAxiosError } from 'axios'
import SupplierEvaluationForm from 'src/Components/Purchases/SupplierEvaluationForm'
import SupplierPurchaseHistoryTable from 'src/Components/Purchases/SupplierPurchaseHistoryTable'

// Asumiendo que tienes una interfaz similar a esta para el proveedor
export interface Supplier {
  id: number
  name: string
  taxId: string
  typePerson: 0 | 1 // 0 Jurídico, 1 Natural
  contactName: string
  email: string
  phone: string
  applyRetention?: boolean
  documents?: Array<{
    documentType: string
    originalFileName: string // Asumimos que el backend devuelve el nombre original
    id: string // ID del documento para posible eliminación o referencia
    filePath: string // URL o identificador para descargar/ver
    fileMimeType?: string // MIME type del archivo, opcional
  }>
  purchaseType: 1 | 2
}

interface DocumentToUpload {
  id: string
  label: string
  file: File | null
}

interface EvaluationStatusSummary {
  lastEvaluationDate: string | null // Formato YYYY-MM-DD
  lastPurchaseDate: string | null // Formato YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss.sssZ
  hasActivityInLast6Months: boolean
}

const juridicalDocumentTypes: Array<Omit<DocumentToUpload, 'file'>> = [
  { id: 'rut_juridical', label: 'RUT' },
  {
    id: 'legalExistenceCertificate',
    label: 'Certificado de Existencia y Representación Legal'
  },
  { id: 'servicePortfolio', label: 'Portafolio de Servicios' },
  { id: 'bankCertification_juridical', label: 'Certificación Bancaria' }
]

const naturalDocumentTypes: Array<Omit<DocumentToUpload, 'file'>> = [
  { id: 'idCopy', label: 'Fotocopia de la Cédula' },
  { id: 'rut_natural', label: 'RUT' },
  { id: 'bankCertification_natural', label: 'Certificación Bancaria' },
  { id: 'commercialReferences', label: 'Referencias Comerciales' },
  {
    id: 'socialSecurityPayment',
    label: 'Soporte de Último Pago de Seguridad Social'
  }
]

const getEvaluationStatusAlertInfo = (
  summary?: EvaluationStatusSummary | null
): {
  type: 'success' | 'warning' | 'error' | 'info' // 'error' para la más crítica
  message: string
} | null => {
  if (!summary) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const sixMonthsAgoCutoff = new Date(today)
  sixMonthsAgoCutoff.setMonth(today.getMonth() - 6)

  const parseDate = (dateString?: string | null): Date | null => {
    if (!dateString) return null
    const datePart = dateString.substring(0, 10)
    const parts = datePart.split('-')
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      if (!isNaN(year) && !isNaN(month) && !isNaN(day))
        return new Date(year, month, day)
    }
    const parsedDate = new Date(dateString)
    if (!isNaN(parsedDate.getTime())) {
      parsedDate.setHours(0, 0, 0, 0)
      return parsedDate
    }
    return null
  }

  const lastEvalDate = parseDate(summary.lastEvaluationDate)
  const lastPurchaseDate = parseDate(summary.lastPurchaseDate)
  const isActiveRecently = summary.hasActivityInLast6Months === true

  if (lastEvalDate) {
    if (lastEvalDate < sixMonthsAgoCutoff) {
      return isActiveRecently
        ? {
            type: 'error',
            message: `Evaluación REQUERIDA (Vencida: ${lastEvalDate.toLocaleDateString('es-CO')}, Activo)`
          }
        : {
            type: 'warning',
            message: `Eval. Pendiente (Vencida: ${lastEvalDate.toLocaleDateString('es-CO')}, Inactivo)`
          }
    }
    return {
      type: 'success',
      message: `Evaluación Al Día (Última: ${lastEvalDate.toLocaleDateString('es-CO')})`
    }
  } else {
    if (isActiveRecently) {
      const GRACE_PERIOD_DAYS = 30
      const gracePeriodCutoff = new Date(today)
      gracePeriodCutoff.setDate(today.getDate() - GRACE_PERIOD_DAYS)
      if (lastPurchaseDate && lastPurchaseDate > gracePeriodCutoff) {
        return {
          type: 'info',
          message: `Actividad Reciente (Última compra: ${lastPurchaseDate.toLocaleDateString('es-CO')}). 1ra Eval. Próxima.`
        }
      } else if (lastPurchaseDate && lastPurchaseDate < sixMonthsAgoCutoff) {
        return {
          type: 'error',
          message: 'Requiere 1RA EVALUACIÓN (Actividad >6m sin eval.)'
        }
      }
      return { type: 'warning', message: 'Requiere 1RA EVALUACIÓN (Activo)' }
    } else {
      if (lastPurchaseDate) {
        return lastPurchaseDate < sixMonthsAgoCutoff
          ? {
              type: 'info',
              message: `Sin Eval. (Inactivo >6m, Últ. compra: ${lastPurchaseDate.toLocaleDateString('es-CO')})`
            }
          : {
              type: 'info',
              message: `Sin Eval. (Inactivo Reciente, Últ. compra: ${lastPurchaseDate.toLocaleDateString('es-CO')})`
            }
      }
      return { type: 'info', message: 'Sin Evaluar (Nuevo/Sin Compras)' }
    }
  }
}

const SupplierDetailsPage: React.FC = () => {
  const { supplierId } = useParams<{ supplierId: string }>()
  const navigate = useNavigate()
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()

  const [filesToUpload, setFilesToUpload] = useState<DocumentToUpload[]>([])
  const [applyRetention, setApplyRetention] = useState<boolean>(false)

  // --- NUEVO: Estado para el modal de evaluación ---
  const [evaluationModalOpen, setEvaluationModalOpen] = useState(false)
  // Opcional: si permites editar evaluaciones desde esta página, necesitarías algo así:
  // const [selectedEvaluationForEdit, setSelectedEvaluationForEdit] =
  //   useState<SupplierEvaluationData | null>(null)

  // Fetch supplier details using useQuery
  const {
    data: supplier,
    isLoading: isLoadingSupplier,
    error: supplierError
  } = useQuery<Supplier, Error>(
    ['supplierDetails', supplierId],
    async () => {
      const response = await axiosPrivate.get<Supplier>(
        `/suppliers/${supplierId}`
      )
      return response.data
    },
    {
      enabled: !!supplierId, // Only run query if supplierId exists
      onSuccess: (data) => {
        setApplyRetention(data.applyRetention || false)
        const currentDocTypes =
          data.typePerson === 1 ? naturalDocumentTypes : juridicalDocumentTypes
        setFilesToUpload(currentDocTypes.map((doc) => ({ ...doc, file: null })))
      },
      onError: (err) => {
        console.error('Error fetching supplier details:', err)
      }
    }
  )

  const { data: evalStatusSummary, isLoading: isLoadingEvalStatus } = useQuery<
    EvaluationStatusSummary,
    Error
  >(
    ['supplierEvaluationStatusSummary', supplierId],
    async () => {
      const response = await axiosPrivate.get<EvaluationStatusSummary>(
        `/suppliers/${supplierId}/evaluation-status-summary`
      )
      return response.data
    },
    {
      enabled: !!supplierId // Solo ejecutar si supplierId existe
      // staleTime: 1000 * 60 * 5 // Cachear por 5 minutos, por ejemplo
    }
  )

  const evaluationNotificationInfo =
    getEvaluationStatusAlertInfo(evalStatusSummary)

  useEffect(() => {
    // Si el supplierId cambia, react-query se encargará de re-fetch
    // y el onSuccess actualizará los estados dependientes.
    // Si el proveedor se carga correctamente y su tipo cambia,
    // actualizamos los tipos de documentos a subir.
    if (supplier) {
      const currentDocTypes =
        supplier.typePerson === 1
          ? naturalDocumentTypes
          : juridicalDocumentTypes
      // Solo actualiza si los tipos de documentos realmente necesitan cambiar
      // para evitar re-renders innecesarios o pérdida de archivos seleccionados si no es necesario.
      const currentDocIds = filesToUpload.map((f) => f.id).join(',')
      const newDocIds = currentDocTypes.map((d) => d.id).join(',')
      if (currentDocIds !== newDocIds) {
        setFilesToUpload(currentDocTypes.map((doc) => ({ ...doc, file: null })))
      }
      setApplyRetention(supplier.applyRetention || false)
    }
  }, [supplier])

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    docId: string
  ) => {
    const file = event.target.files?.[0] || null
    if (file) {
      if (file && file.type !== 'application/pdf') {
        Swal.fire('Error', 'Solo se permiten archivos PDF.', 'error')
        event.target.value = '' // Limpiar el input de archivo
        setFilesToUpload((prevSlots) =>
          prevSlots.map((slot) =>
            slot.id === docId ? { ...slot, file: null } : slot
          )
        )
        return
      }

      const maxSizeInBytes = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSizeInBytes) {
        Swal.fire(
          'Archivo Demasiado Grande',
          `El archivo seleccionado excede el tamaño máximo permitido de 5MB. Tamaño actual: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
          'error'
        )
        event.target.value = '' // Limpiar el input
        setFilesToUpload((prevFiles) =>
          prevFiles.map((doc) =>
            doc.id === docId ? { ...doc, file: null } : doc
          )
        )
        return
      }

      setFilesToUpload((prevSlots) =>
        prevSlots.map((slot) => (slot.id === docId ? { ...slot, file } : slot))
      )
    } else {
      setFilesToUpload((prevFiles) =>
        prevFiles.map((doc) =>
          doc.id === docId ? { ...doc, file: null } : doc
        )
      )
    }
  }

  // Mutation for uploading a document
  const uploadDocumentMutation = useMutation(
    async ({
      docId,
      file
    }: {
      docId: string
      file: File
      documentTypeLabel: string
    }) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', docId)
      formData.append('supplierId', supplierId!)
      formData.append('originalFileName', file.name)

      return axiosPrivate.post(`/suppliers/${supplierId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    },
    {
      onSuccess: (_, variables) => {
        Swal.fire(
          'Éxito',
          `Documento '${variables.documentTypeLabel}' subido correctamente.`,
          'success'
        )
        queryClient.invalidateQueries(['supplierDetails', supplierId]) // Invalidate para refrescar
        setFilesToUpload((prevFiles) =>
          prevFiles.map((doc) =>
            doc.id === variables.docId ? { ...doc, file: null } : doc
          )
        )
      },
      onError: (error, variables) => {
        console.error('Error uploading document:', error)
        Swal.fire(
          'Error',
          `Error al subir ${variables.documentTypeLabel}.`,
          'error'
        )
      }
    }
  )

  const handleUploadDocument = (docId: string) => {
    const documentToUpload = filesToUpload.find((doc) => doc.id === docId)

    if (!documentToUpload || !documentToUpload.file || !supplierId) {
      return
    }
    uploadDocumentMutation.mutate({
      docId,
      file: documentToUpload.file,
      documentTypeLabel: documentToUpload.label
    })
  }

  // Mutation for updating retention status
  const updateRetentionMutation = useMutation(
    (newRetentionValue: boolean) => {
      return axiosPrivate.patch(`/suppliers/${supplierId}/retention`, {
        applyRetention: newRetentionValue
      })
    },
    {
      onSuccess: (_, newRetentionValue) => {
        const message = newRetentionValue
          ? 'Se ha activado la retención en fuente para el proveedor.'
          : 'Se ha desactivado la retención en fuente para el proveedor.'
        Swal.fire('Actualizado', message, 'success')
        queryClient.invalidateQueries(['supplierDetails', supplierId]) // Invalidate para refrescar
        // El estado local 'applyRetention' se actualiza optimistamente o en el onSuccess de useQuery
      },
      onError: (error, newRetentionValue) => {
        console.error('Error updating retention status:', error)
        Swal.fire(
          'Error',
          'No se pudo actualizar el estado de retención.',
          'error'
        )
        setApplyRetention(!newRetentionValue) // Revertir cambio en UI
      }
    }
  )

  // --- NUEVO: Handlers para el modal de evaluación ---
  const handleOpenEvaluationModal = () => {
    // Si quisieras soportar edición desde aquí, aquí establecerías la evaluación a editar.
    // setSelectedEvaluationForEdit(null); // Para asegurar que se abra para una nueva evaluación
    setEvaluationModalOpen(true)
  }

  const handleCloseEvaluationModal = () => {
    setEvaluationModalOpen(false)
    // setSelectedEvaluationForEdit(null);
  }

  const handleEvaluationSuccess = () => {
    handleCloseEvaluationModal()
    Swal.fire(
      'Evaluación Guardada',
      'La evaluación del proveedor ha sido guardada con éxito.',
      'success'
    )
    // Opcional: Invalidar queries si esta página muestra una lista de evaluaciones o un resumen
    queryClient.invalidateQueries(['supplierEvaluations', supplierId])
    // queryClient.invalidateQueries(['supplierDetails', supplierId]); // Si la evaluación afecta detalles del proveedor
  }

  const handleRetentionChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newRetentionValue = event.target.checked
    setApplyRetention(newRetentionValue) // Actualización optimista en UI
    updateRetentionMutation.mutate(newRetentionValue)
  }

  const handleViewDocument = async (
    documentId: string,
    originalFileName: string,
    fileMimeType?: string
  ) => {
    if (!documentId) {
      console.error('handleViewDocument: No documentId provided')
      Swal.fire('Error', 'No se pudo obtener el ID del documento.', 'error')
      return
    }

    try {
      const apiUrl = `/suppliers/${documentId}/documents`

      const response = await axiosPrivate.get(apiUrl, {
        responseType: 'blob' // ¡Importante para manejar archivos!
      })

      const effectiveMimeType =
        response.headers['content-type'] ||
        fileMimeType ||
        'application/octet-stream'

      const blob = new Blob([response.data], { type: effectiveMimeType })
      const fileURL = URL.createObjectURL(blob)

      // Abrir en una nueva pestaña
      const newWindow = window.open(fileURL, '_blank')
      if (newWindow) {
        newWindow.focus()
        // Opcional: cambiar el título de la nueva pestaña si es posible (limitado por seguridad)
        setTimeout(() => {
          try {
            newWindow.document.title = originalFileName
          } catch (e) {}
        }, 500)
      } else {
        Swal.fire(
          'Error',
          'Tu navegador bloqueó la apertura de una nueva pestaña. Por favor, permite pop-ups para este sitio.',
          'warning'
        )
      }
    } catch (error) {
      // En TypeScript, 'error' aquí es de tipo 'unknown' por defecto
      let errorMessage = 'No se pudo cargar el documento para visualización.'

      if (isAxiosError(error)) {
        // Verifica si es un error específico de Axios
        // errorToLog = error.toJSON ? error.toJSON() : error; // .toJSON() da una representación más limpia para logs
        console.error(
          'Error de Axios al obtener el documento:',
          error.response?.data || error.message,
          error
        )

        if (error.response) {
          // El servidor respondió con un código de estado fuera del rango 2xx
          const status = error.response.status
          const responseData = error.response.data

          if (status === 401) {
            errorMessage =
              'No autorizado: Tu sesión puede haber expirado o no tienes los permisos requeridos.'
          } else if (status === 403) {
            errorMessage =
              'Prohibido: No tienes los permisos necesarios para ver este documento.'
          } else if (responseData && typeof responseData.message === 'string') {
            // Si el backend envía un JSON con una propiedad "message"
            errorMessage = responseData.message
          } else if (
            typeof responseData === 'string' &&
            responseData.trim() !== ''
          ) {
            // Si la respuesta del backend es directamente un string de error
            errorMessage = responseData
          } else {
            // Otro error del servidor (ej. 500, 404 no manejado específicamente)
            errorMessage = `Error del servidor (${status}). No se pudo obtener el documento.`
          }
        } else if (error.request) {
          // La petición se hizo pero no se recibió respuesta (ej. error de red)
          console.error(
            'Error de red o sin respuesta del servidor:',
            error.request
          )
          errorMessage =
            'No se pudo conectar con el servidor. Verifica tu conexión a internet e inténtalo de nuevo.'
        } else {
          // Algo ocurrió al configurar la petición que disparó un error
          errorMessage =
            error.message ||
            'Ocurrió un error al preparar la solicitud del documento.'
        }
      } else if (error instanceof Error) {
        // Es un error de JavaScript estándar (no de Axios)
        console.error(
          'Error general al obtener el documento:',
          error.message,
          error
        )
        errorMessage = error.message
      } else {
        // Se lanzó algo que no es un objeto Error (raro, pero posible)
        console.error('Error desconocido al obtener el documento:', error)
        errorMessage =
          'Ocurrió un error inesperado durante la solicitud del documento.'
      }

      Swal.fire('Error', errorMessage, 'error')
    }
  }

  if (isLoadingSupplier) {
    return (
      <Container sx={{ textAlign: 'center', mt: 5 }}>
        <CircularProgress />
        <Typography>Cargando detalles del proveedor...</Typography>
      </Container>
    )
  }

  if (supplierError) {
    return (
      <Alert severity='error'>
        Error al cargar el proveedor: {supplierError.message}
      </Alert>
    )
  }

  if (!supplier) {
    return <Alert severity='warning'>Proveedor no encontrado.</Alert>
  }

  return (
    <Container maxWidth='md' sx={{ mt: 4, mb: 4 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}
      >
        <Button onClick={() => navigate('/purchases/suppliers')}>
          {' '}
          {/* Navegación explícita */}
          &larr; Volver a la lista
        </Button>
        <Box>
          {' '}
          {/* Contenedor para los botones de acción */}
          <Button
            variant='outlined' // Estilo diferente para que no compita visualmente con "Editar"
            color='secondary'
            startIcon={<Assessment />}
            onClick={handleOpenEvaluationModal} // <--- NUEVO BOTÓN Y HANDLER
            sx={{ mr: 1 }} // Margen si tienes más botones
          >
            Evaluar Proveedor
          </Button>
          <Button
            variant='contained'
            color='primary'
            startIcon={<Edit />}
            onClick={() => navigate(`/purchases/suppliers/edit/${supplierId}`)} // Ajusta la ruta de edición
          >
            Editar Proveedor
          </Button>
        </Box>
      </Box>
      {isLoadingEvalStatus && (
        <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          <Typography variant='caption'>
            {' '}
            Verificando estado de evaluación...
          </Typography>
        </Box>
      )}
      {evaluationNotificationInfo && !isLoadingEvalStatus && (
        <Alert severity={evaluationNotificationInfo.type} sx={{ mt: 1, mb: 2 }}>
          {evaluationNotificationInfo.message}
        </Alert>
      )}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant='h4' gutterBottom>
          {supplier.name}
          {supplier.applyRetention && (
            <Chip
              label='Aplica Retención'
              color='info'
              size='small'
              sx={{ ml: 2 }}
            />
          )}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography>
              <strong>NIT/CC:</strong> {supplier.taxId}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography>
              <strong>Tipo:</strong>{' '}
              {supplier.typePerson === 1 ? 'Natural' : 'Jurídico'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography>
              <strong>Contacto:</strong>{' '}
              {supplier.typePerson === 1 ? supplier.name : supplier.contactName}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography>
              <strong>Email:</strong> {supplier.email}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography>
              <strong>Teléfono:</strong> {supplier.phone}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography>
              <strong>Tipo de Compra:</strong>{' '}
              {supplier.purchaseType === 1 ? 'I' : 'II'}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={applyRetention}
                  onChange={handleRetentionChange}
                  name='applyRetention'
                  color='primary'
                />
              }
              label='Aplicar Retención en Fuente'
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant='h5' gutterBottom>
          Documentos Requeridos (
          {supplier.typePerson === 1 ? 'Persona Natural' : 'Persona Jurídica'})
        </Typography>
        {supplier.documents && supplier.documents.length > 0 && (
          <>
            <Typography variant='subtitle1' sx={{ mt: 2, mb: 1 }}>
              Documentos Subidos:
            </Typography>
            <List dense>
              {supplier.documents.map((doc) => (
                <ListItem
                  key={doc.id}
                  secondaryAction={
                    <IconButton
                      edge='end'
                      aria-label='ver documento'
                      onClick={() =>
                        handleViewDocument(
                          doc.id,
                          doc.originalFileName,
                          doc.fileMimeType
                        )
                      }
                    >
                      <Visibility />
                    </IconButton>
                  }
                >
                  <ListItemIcon>
                    <Description color='success' />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      juridicalDocumentTypes.find(
                        (d) => d.id === doc.documentType
                      )?.label ||
                      naturalDocumentTypes.find(
                        (d) => d.id === doc.documentType
                      )?.label ||
                      doc.documentType
                    }
                    secondary={doc.originalFileName}
                  />
                </ListItem>
              ))}
            </List>
            <Divider sx={{ my: 2 }} />
          </>
        )}
        <List>
          {filesToUpload.map((doc) => {
            const existingUploadedDoc = supplier!.documents?.find(
              (uploadedDoc) => uploadedDoc.documentType === doc.id
            )
            const currentFileSelected = doc.file // Archivo seleccionado en el input para este docSlot

            return (
              <React.Fragment key={doc.id}>
                <ListItem
                  disableGutters // Deshabilitar si ya está subido
                >
                  <ListItemIcon>
                    <Description />
                  </ListItemIcon>
                  <ListItemText
                    primary={doc.label}
                    secondary={
                      doc.file ? doc.file.name : 'Ningún archivo seleccionado'
                    }
                  />
                  <Button
                    component='label'
                    variant='outlined'
                    size='small'
                    sx={{ mr: 1 }}
                    disabled={
                      uploadDocumentMutation.isLoading &&
                      uploadDocumentMutation.variables?.docId === doc.id
                    }
                  >
                    {existingUploadedDoc ? 'Reemplazar' : 'Seleccionar'} PDF
                    <input
                      type='file'
                      hidden
                      onChange={(e) => handleFileChange(e, doc.id)}
                      accept='.pdf'
                    />
                  </Button>
                  <Button
                    variant='contained'
                    size='small'
                    startIcon={
                      uploadDocumentMutation.isLoading &&
                      uploadDocumentMutation.variables?.docId === doc.id ? (
                        <CircularProgress color='inherit' size={16} />
                      ) : (
                        <UploadFile />
                      )
                    }
                    disabled={
                      !currentFileSelected || // Deshabilitado si no hay un NUEVO archivo seleccionado
                      (uploadDocumentMutation.isLoading &&
                        uploadDocumentMutation.variables?.docId === doc.id)
                    }
                    onClick={() => handleUploadDocument(doc.id)} // handleUploadDocument usa selectedFiles[docSlot.id]
                  >
                    {existingUploadedDoc ? 'Subir Reemplazo' : 'Subir'}
                  </Button>
                </ListItem>
                <Divider component='li' />
              </React.Fragment>
            )
          })}
        </List>
        {/* Aquí podrías listar los documentos ya subidos */}
      </Paper>
      {supplierId && <SupplierPurchaseHistoryTable supplierId={supplierId} />}
      {/* --- NUEVO: Modal/Dialog para el Formulario de Evaluación --- */}
      {evaluationModalOpen &&
        supplier && ( // Solo renderizar si el modal debe estar abierto Y supplier está cargado
          <Dialog
            open={evaluationModalOpen}
            onClose={handleCloseEvaluationModal}
            maxWidth='md' // Puedes ajustar el tamaño
            fullWidth
          >
            <DialogTitle
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              Nueva Evaluación para: {supplier.name}
              <IconButton onClick={handleCloseEvaluationModal}>
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              {' '}
              {/* dividers añade líneas de separación */}
              <SupplierEvaluationForm
                supplier={supplier}
                // existingEvaluation={selectedEvaluationForEdit} // Pasa esto si implementas edición
                onSuccess={handleEvaluationSuccess}
                onCancel={handleCloseEvaluationModal} // El form interno llamará a esto
              />
            </DialogContent>
            {/* Los DialogActions (botones Guardar/Cancelar) están dentro de SupplierEvaluationForm */}
          </Dialog>
        )}
    </Container>
  )
}

export default SupplierDetailsPage
