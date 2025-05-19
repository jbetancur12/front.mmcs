// src/pages/Suppliers/SupplierDetailsPage.tsx

import React, { useEffect, useState, FC } from 'react' // FC es opcional
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
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material'
import {
  UploadFile,
  Description,
  Edit,
  Visibility,
  Assessment as AssessmentIcon,
  Close as CloseIcon
} from '@mui/icons-material'
import useAxiosPrivate from '@utils/use-axios-private' // Ajusta la ruta
import Swal from 'sweetalert2'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { isAxiosError } from 'axios'

// Asume que estos componentes se importan correctamente desde sus ubicaciones
import SupplierEvaluationForm, {
  SupplierEvaluationData
} from 'src/Components/Purchases/SupplierEvaluationForm' // Ajusta la ruta
import SupplierPurchaseHistoryTable from 'src/Components/Purchases/SupplierPurchaseHistoryTable' // Ajusta la ruta

// Interfaz Supplier (asegúrate de que esta es la que usa tu query principal y que incluye los campos necesarios)
export interface ISupplier {
  // Renombrada a ISupplier para evitar colisión si hay un componente Supplier
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
    originalFileName: string
    id: string
    filePath: string
    fileMimeType?: string
  }>
  // Campos cruciales para la lógica de evaluación, deben venir del backend en el objeto Supplier principal
  purchaseType: 1 | 2 // 1: Semestral, 2: Anual
  lastEvaluationCoveredPeriod?: string | null // Ej: "2024-S1", "2024-ANUAL"
  hasActivityInLast6Months?: boolean
  lastPurchaseDate?: string | null // "YYYY-MM-DD" o ISO completo
  // lastEvaluationDate?: string | null; // Este no lo usa la lógica refinada si tenemos lastEvaluationCoveredPeriod
}

// Interfaz para el estado de los archivos a subir (si es específica de este componente)
interface DocumentToUpload {
  id: string
  label: string
  file: File | null
}

// Constantes para tipos de documentos (pueden ir en un archivo de constantes o utils)
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

// --- FUNCIÓN HELPER REFINADA PARA DETERMINAR EL ESTADO DE LA EVALUACIÓN ---
const getEvaluationStatusInfo = (
  supplier?: ISupplier | null // Ahora recibe el objeto Supplier completo (o null/undefined si no ha cargado)
): {
  text: string
  color: 'success' | 'warning' | 'error' | 'info'
  needsAction: boolean
} | null => {
  if (!supplier || !supplier.purchaseType) {
    // Necesitamos purchaseType para la lógica
    return null
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() // 0 (Ene) a 11 (Dic)

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
    const parsedD = new Date(dateString)
    if (!isNaN(parsedD.getTime())) {
      parsedD.setHours(0, 0, 0, 0)
      return parsedD
    }
    return null
  }

  const lastEvalCoveredPeriodStr = supplier.lastEvaluationCoveredPeriod
  const supplierPurchaseType = supplier.purchaseType
  const isActiveNow = supplier.hasActivityInLast6Months === true
  const lastPurchaseDate = parseDate(supplier.lastPurchaseDate)

  let periodToAssessName: string
  let periodToAssessStartDate: Date
  let periodToAssessEndDate: Date
  let evalWindowForPeriodStart: Date

  if (supplierPurchaseType === 1) {
    // SEMESTRAL
    if (currentMonth >= 6) {
      periodToAssessName = `${currentYear}-S1`
      periodToAssessStartDate = new Date(currentYear, 0, 1)
      periodToAssessEndDate = new Date(currentYear, 5, 30, 23, 59, 59)
      evalWindowForPeriodStart = new Date(currentYear, 6, 1)
    } else {
      periodToAssessName = `${currentYear - 1}-S2`
      periodToAssessStartDate = new Date(currentYear - 1, 6, 1)
      periodToAssessEndDate = new Date(currentYear - 1, 11, 31, 23, 59, 59)
      evalWindowForPeriodStart = new Date(currentYear, 0, 1)
    }
  } else if (supplierPurchaseType === 2) {
    // ANUAL
    periodToAssessName = `${currentYear - 1}-ANUAL`
    periodToAssessStartDate = new Date(currentYear - 1, 0, 1)
    periodToAssessEndDate = new Date(currentYear - 1, 11, 31, 23, 59, 59)
    evalWindowForPeriodStart = new Date(currentYear, 0, 1)
  } else {
    return {
      text: 'Tipo Compra Prov. Desc.',
      color: 'info',
      needsAction: false
    }
  }

  const isTimeToEvaluateThisPeriod = today >= evalWindowForPeriodStart

  if (
    lastEvalCoveredPeriodStr &&
    lastEvalCoveredPeriodStr >= periodToAssessName
  ) {
    return {
      text: `Evaluación Al Día (Cubre ${lastEvalCoveredPeriodStr})`,
      color: 'success',
      needsAction: false
    }
  }

  let hadActivityDuringPeriodToAssess = false
  if (
    lastPurchaseDate &&
    lastPurchaseDate >= periodToAssessStartDate &&
    lastPurchaseDate <= periodToAssessEndDate
  ) {
    hadActivityDuringPeriodToAssess = true
  }

  if (hadActivityDuringPeriodToAssess) {
    if (isTimeToEvaluateThisPeriod) {
      const prefix = lastEvalCoveredPeriodStr
        ? `REQUERIDA (${periodToAssessName})`
        : `Requiere 1RA EVAL. (${periodToAssessName})`
      return {
        text: `${prefix}, con Actividad en Periodo`,
        color: 'error',
        needsAction: true
      }
    } else {
      const prefix = lastEvalCoveredPeriodStr
        ? `Próxima Eval: ${periodToAssessName}`
        : `Pendiente 1RA Eval: ${periodToAssessName}`
      return {
        text: `${prefix}, con Actividad en Periodo`,
        color: 'info',
        needsAction: false
      }
    }
  } else {
    if (
      !lastEvalCoveredPeriodStr &&
      isActiveNow &&
      isTimeToEvaluateThisPeriod
    ) {
      return {
        text: `Requiere 1RA EVAL. (${periodToAssessName}, Activo Ahora)`,
        color: 'warning',
        needsAction: true
      }
    }
    if (
      lastEvalCoveredPeriodStr &&
      lastEvalCoveredPeriodStr < periodToAssessName
    ) {
      return isActiveNow
        ? {
            text: `Pendiente (${periodToAssessName}), Sin Act. en Periodo Eval.`,
            color: 'warning',
            needsAction: true
          }
        : {
            text: `Pendiente (${periodToAssessName}), Inactivo`,
            color: 'info',
            needsAction: true
          } // Era warning, cambiado a info si inactivo
    }
    return {
      text: 'Sin Evaluar (Sin Actividad Relevante)',
      color: 'info',
      needsAction: false
    }
  }
}
// --- FIN FUNCIÓN HELPER ---

const SupplierDetailsPage: React.FC = () => {
  const { supplierId } = useParams<{ supplierId: string }>()
  const navigate = useNavigate()
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()

  const [filesToUpload, setFilesToUpload] = useState<DocumentToUpload[]>([])
  const [applyRetention, setApplyRetention] = useState<boolean>(false)
  const [evaluationModalOpen, setEvaluationModalOpen] = useState(false)

  // Query principal para obtener los detalles del proveedor
  // Asumimos que este endpoint devuelve TODOS los campos necesarios para ISupplier,
  // incluyendo purchaseType, lastEvaluationCoveredPeriod, hasActivityInLast6Months, lastPurchaseDate
  const {
    data: supplier, // Este objeto 'supplier' se pasará a getEvaluationStatusInfo
    isLoading: isLoadingSupplier,
    error: supplierError
  } = useQuery<ISupplier, Error>(
    ['supplierDetails', supplierId],
    async () => {
      const response = await axiosPrivate.get<ISupplier>(
        `/suppliers/${supplierId}`
      )
      return response.data
    },
    {
      enabled: !!supplierId,
      onSuccess: (data) => {
        setApplyRetention(data.applyRetention || false)
        const currentDocTypes =
          data.typePerson === 1 ? naturalDocumentTypes : juridicalDocumentTypes
        // Prevenir loop si filesToUpload no cambia su referencia o contenido esencial
        const currentDocIds = filesToUpload.map((f) => f.id).join(',')
        const newDocIds = currentDocTypes.map((d) => d.id).join(',')
        if (currentDocIds !== newDocIds) {
          setFilesToUpload(
            currentDocTypes.map((doc) => ({ ...doc, file: null }))
          )
        }
      },
      onError: (err) => {
        console.error('Error fetching supplier details:', err)
      }
    }
  )

  // ELIMINADA: Query separada para evalStatusSummary, ya que 'supplier' debe tener esa info.

  // Derivar la notificación directamente usando el 'supplier' cargado
  const evaluationNotificationInfo = getEvaluationStatusInfo(supplier)

  useEffect(() => {
    if (supplier) {
      // Sincronizar applyRetention si cambia en el objeto supplier (ej. por otra actualización)
      // (ya se hace en onSuccess de la query, pero esto cubre si 'supplier' cambia por otra vía)
      setApplyRetention(supplier.applyRetention || false)

      // Lógica para actualizar filesToUpload si typePerson cambia (ya estaba)
      const currentDocTypes =
        supplier.typePerson === 1
          ? naturalDocumentTypes
          : juridicalDocumentTypes
      const currentDocIds = filesToUpload.map((f) => f.id).join(',')
      const newDocIds = currentDocTypes.map((d) => d.id).join(',')
      if (currentDocIds !== newDocIds) {
        setFilesToUpload(currentDocTypes.map((doc) => ({ ...doc, file: null })))
      }
    }
  }, [supplier]) // Solo depende de supplier ahora

  // --- TUS MUTACIONES Y HANDLERS (uploadDocumentMutation, updateRetentionMutation, etc.) ---
  // ... (Aquí va el código de tus mutaciones y handlers sin cambios estructurales importantes para esta tarea)
  const uploadDocumentMutation = useMutation(
    async (vars: { docId: string; file: File; documentTypeLabel: string }) => {
      /*...*/
    },
    {
      /* options */
    }
  )
  const updateRetentionMutation = useMutation(
    async (newRetentionValue: boolean) => {
      /*...*/
    },
    {
      /* options */
    }
  )
  const handleOpenEvaluationModal = () => setEvaluationModalOpen(true)
  const handleCloseEvaluationModal = () => setEvaluationModalOpen(false)
  const handleEvaluationSuccess = (evaluation: SupplierEvaluationData) => {
    handleCloseEvaluationModal()
    Swal.fire(
      'Evaluación Guardada',
      'La evaluación del proveedor ha sido guardada con éxito.',
      'success'
    )
    queryClient.invalidateQueries(['supplierDetails', supplierId]) // Para refrescar TODOS los datos del proveedor, incluyendo su nuevo lastEvaluationCoveredPeriod
    // queryClient.invalidateQueries(['supplierEvaluations', supplierId]); // Si listaras evaluaciones aquí
  }
  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    docId: string
  ) => {
    /* ... */
  }
  const handleUploadDocument = (docId: string) => {
    /* ... */
  }
  const handleRetentionChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    /* ... */
  }
  const handleViewDocument = async (
    documentId: string,
    originalFileName: string,
    fileMimeType?: string
  ) => {
    /* ... */
  }
  // --- FIN MUTACIONES Y HANDLERS ---

  if (isLoadingSupplier || !supplier) {
    // Si no hay supplier, no mostrar nada o un loader más genérico
    return (
      <Container sx={{ textAlign: 'center', mt: 5 }}>
        <CircularProgress />
        <Typography sx={{ mt: 1 }}>
          Cargando detalles del proveedor...
        </Typography>
      </Container>
    )
  }

  if (supplierError) {
    return (
      <Container sx={{ mt: 2 }}>
        <Alert severity='error'>
          Error al cargar el proveedor: {supplierError.message}
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth='lg' sx={{ mt: 4, mb: 4 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}
      >
        <Button onClick={() => navigate('/purchases/suppliers')}>
          &larr; Volver a Lista
        </Button>
        <Box>
          <Button
            variant='outlined'
            color='secondary'
            startIcon={<AssessmentIcon />}
            onClick={handleOpenEvaluationModal}
            sx={{ mr: 1 }}
          >
            Evaluar Proveedor
          </Button>
          <Button
            variant='contained'
            color='primary'
            startIcon={<Edit />}
            onClick={() => navigate(`/purchases/suppliers/edit/${supplierId}`)}
          >
            Editar Proveedor
          </Button>
        </Box>
      </Box>

      {/* --- MOSTRAR NOTIFICACIÓN DE EVALUACIÓN --- */}
      {/* Ya no necesitamos isLoadingEvalStatus porque la info viene con isLoadingSupplier */}
      {evaluationNotificationInfo && (
        <Alert
          severity={evaluationNotificationInfo.color}
          sx={{ mt: 1, mb: 2 }}
        >
          {evaluationNotificationInfo.text}
        </Alert>
      )}
      {/* --- FIN NOTIFICACIÓN --- */}

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
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
        <Grid container spacing={1}>
          <Grid item xs={12} sm={6} md={4}>
            <Typography>
              <strong>NIT/CC:</strong> {supplier.taxId}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography>
              <strong>Tipo:</strong>{' '}
              {supplier.typePerson === 1 ? 'Natural' : 'Jurídico'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography>
              <strong>Contacto:</strong>{' '}
              {supplier.typePerson === 1 ? supplier.name : supplier.contactName}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography>
              <strong>Email:</strong> {supplier.email}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography>
              <strong>Teléfono:</strong> {supplier.phone}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography>
              <strong>Tipo Compra (Eval):</strong>{' '}
              {supplier.purchaseType === 1 ? 'Semestral' : 'Anual'}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={applyRetention}
                  onChange={handleRetentionChange}
                  name='applyRetention'
                />
              }
              label='Aplicar Retención en Fuente'
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant='h5' gutterBottom>
          Documentos Requeridos (
          {supplier.typePerson === 1 ? 'Persona Natural' : 'Persona Jurídica'})
        </Typography>
        {/* ... (Tu JSX para listar y subir documentos) ... */}
      </Paper>

      {supplierId && <SupplierPurchaseHistoryTable supplierId={supplierId} />}

      {evaluationModalOpen && supplier && (
        <Dialog
          open={evaluationModalOpen}
          onClose={handleCloseEvaluationModal}
          maxWidth='md'
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
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <SupplierEvaluationForm
              supplier={supplier} // Pasamos el objeto supplier completo
              onSuccess={handleEvaluationSuccess}
              onCancel={handleCloseEvaluationModal}
            />
          </DialogContent>
        </Dialog>
      )}
    </Container>
  )
}

export default SupplierDetailsPage
