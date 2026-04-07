import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Typography
} from '@mui/material'
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined'
import { Toaster, toast } from 'react-hot-toast'
import { ReactNode, useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  CALIBRATION_SERVICE_APPROVAL_ROLES,
  CALIBRATION_SERVICE_APPROVAL_COLORS,
  CALIBRATION_SERVICE_APPROVAL_LABELS,
  CALIBRATION_SERVICE_DOCUMENT_UPLOAD_ROLES,
  CALIBRATION_SERVICE_EDIT_ROLES,
  CALIBRATION_SERVICE_ODS_ROLES,
  CALIBRATION_SERVICE_SLA_COLORS,
  CALIBRATION_SERVICE_STATUS_COLORS,
  CALIBRATION_SERVICE_STATUS_LABELS
} from '../../constants/calibrationServices'
import {
  useCalibrationService,
  useCalibrationServiceMutations
} from '../../hooks/useCalibrationServices'
import { useHasRole } from '../../utils/functions'
import CalibrationServiceApprovalDialog, {
  CalibrationServiceDecisionMode,
  CalibrationServiceDecisionValues
} from './CalibrationServiceApprovalDialog'
import CalibrationServiceOdsDialog, {
  CalibrationServiceOdsDialogValues
} from './CalibrationServiceOdsDialog'
import CalibrationServiceDocumentsPanel from './CalibrationServiceDocumentsPanel'
import CalibrationServiceTimeline from './CalibrationServiceTimeline'

type DetailTab = 'summary' | 'items' | 'documents' | 'history'

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
})

const toNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) {
    return 0
  }

  const parsed = typeof value === 'string' ? parseFloat(value) : value
  return Number.isFinite(parsed) ? parsed : 0
}

const getOtherFieldText = (
  otherFields: Record<string, unknown> | undefined,
  fieldName: string
) => {
  const fieldValue = otherFields?.[fieldName]
  return typeof fieldValue === 'string' ? fieldValue : ''
}

const getOtherFieldRecord = (
  otherFields: Record<string, unknown> | undefined,
  fieldName: string
) => {
  const fieldValue = otherFields?.[fieldName]
  return fieldValue && typeof fieldValue === 'object' && !Array.isArray(fieldValue)
    ? (fieldValue as Record<string, unknown>)
    : undefined
}

const formatDateValue = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('es-CO') : 'Sin registrar'

const buildTodayValue = () => new Date().toISOString().slice(0, 10)

const DetailTabPanel = ({
  value,
  tab,
  children
}: {
  value: DetailTab
  tab: DetailTab
  children: ReactNode
}) => {
  if (value !== tab) {
    return null
  }

  return <Box sx={{ pt: 3 }}>{children}</Box>
}

const CalibrationServiceDetailsPage = () => {
  const navigate = useNavigate()
  const { serviceId } = useParams<{ serviceId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: service, isLoading, isError, error } =
    useCalibrationService(serviceId)
  const {
    requestApproval,
    approveService,
    rejectService,
    uploadDocument,
    issueOds,
    generateQuotePdf,
    generateOdsPdf,
    downloadDocument
  } = useCalibrationServiceMutations()
  const [decisionMode, setDecisionMode] =
    useState<CalibrationServiceDecisionMode | null>(null)
  const [isOdsDialogOpen, setIsOdsDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<DetailTab>('summary')
  const canEditService = useHasRole([...CALIBRATION_SERVICE_EDIT_ROLES])
  const canTakeApprovalDecision = useHasRole([...CALIBRATION_SERVICE_APPROVAL_ROLES])
  const canIssueOdsRole = useHasRole([...CALIBRATION_SERVICE_ODS_ROLES])
  const canUploadDocuments = useHasRole([
    ...CALIBRATION_SERVICE_DOCUMENT_UPLOAD_ROLES
  ])
  const canGenerateQuotePdf = useHasRole([...CALIBRATION_SERVICE_EDIT_ROLES])
  const canGenerateOdsPdf = useHasRole([...CALIBRATION_SERVICE_ODS_ROLES])
  const requestedAction = searchParams.get('open')
  const canIssueOds =
    canIssueOdsRole &&
    service?.status === 'approved' &&
    service?.approvalStatus === 'approved' &&
    !service?.odsCode

  useEffect(() => {
    if (requestedAction !== 'ods' || !canIssueOds || isOdsDialogOpen) {
      return
    }

    setIsOdsDialogOpen(true)
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('open')
    setSearchParams(nextSearchParams, { replace: true })
  }, [
    canIssueOds,
    isOdsDialogOpen,
    requestedAction,
    searchParams,
    setSearchParams
  ])

  if (isLoading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='55vh'
      >
        <CircularProgress />
      </Box>
    )
  }

  if (isError || !service) {
    return (
      <Box p={3}>
        <Alert severity='error'>
          No pudimos cargar el detalle del servicio.
          {error instanceof Error ? ` ${error.message}` : ''}
        </Alert>
      </Box>
    )
  }

  const canEdit =
    canEditService &&
    ['draft', 'pending_approval'].includes(service.status)
  const canRequestApproval =
    canEditService && service.status === 'draft'
  const canDecideApproval =
    canTakeApprovalDecision && service.status === 'pending_approval'
  const approvalNotes = getOtherFieldText(service.otherFields, 'approvalNotes')
  const odsDetails = getOtherFieldRecord(service.otherFields, 'ods')
  const odsScheduleWindow =
    typeof odsDetails?.scheduleWindow === 'string' ? odsDetails.scheduleWindow : ''
  const odsSignerName =
    typeof odsDetails?.signerName === 'string' ? odsDetails.signerName : ''
  const odsCustomerAgreements =
    typeof odsDetails?.customerAgreements === 'string'
      ? odsDetails.customerAgreements
      : ''
  const subtotal = (service.items || []).reduce(
    (accumulator, item) => accumulator + toNumber(item.subtotal),
    0
  )
  const taxTotal = (service.items || []).reduce(
    (accumulator, item) => accumulator + toNumber(item.taxTotal),
    0
  )
  const grandTotal = (service.items || []).reduce(
    (accumulator, item) => accumulator + toNumber(item.total),
    0
  )
  const isDecisionLoading =
    requestApproval.isLoading ||
    approveService.isLoading ||
    rejectService.isLoading ||
    uploadDocument.isLoading
  const isOdsLoading = issueOds.isLoading || generateOdsPdf.isLoading
  const isDocumentBusy =
    uploadDocument.isLoading ||
    generateQuotePdf.isLoading ||
    generateOdsPdf.isLoading ||
    downloadDocument.isLoading
  const decisionDocuments = service.documents?.filter((document) =>
    ['approval_evidence', 'rejection_evidence'].includes(document.documentType)
  )
  const officialPdfDocuments = service.documents?.filter((document) =>
    ['quote_pdf', 'ods_pdf'].includes(document.documentType)
  )
  const supportDocuments = service.documents?.filter(
    (document) => !['quote_pdf', 'ods_pdf'].includes(document.documentType)
  )
  const odsDialogInitialValues: CalibrationServiceOdsDialogValues = {
    issuedAt: buildTodayValue(),
    executionCustomerName:
      service.executionCustomerName || service.customer?.nombre || '',
    executionSiteName:
      service.executionSiteName || service.customerSite || '',
    contactName: service.contactName || '',
    contactEmail: service.contactEmail || '',
    contactPhone: service.contactPhone || '',
    city: service.city || '',
    department: service.department || '',
    address: service.address || '',
    internalNotes: service.internalNotes || '',
    scheduledFor:
      typeof odsDetails?.scheduledFor === 'string'
        ? odsDetails.scheduledFor.slice(0, 10)
        : '',
    scheduleWindow: odsScheduleWindow,
    serviceComments:
      typeof odsDetails?.serviceComments === 'string'
        ? odsDetails.serviceComments
        : '',
    modificationReason:
      typeof odsDetails?.modificationReason === 'string'
        ? odsDetails.modificationReason
        : '',
    customerAgreements: odsCustomerAgreements,
    signerName: odsSignerName,
    signerRole:
      typeof odsDetails?.signerRole === 'string' ? odsDetails.signerRole : '',
    externalReference:
      typeof odsDetails?.externalReference === 'string'
        ? odsDetails.externalReference
        : '',
    receptionNotes:
      typeof odsDetails?.receptionNotes === 'string'
        ? odsDetails.receptionNotes
        : '',
    generatePdfImmediately: true
  }

  const handleRequestApproval = async () => {
    try {
      await requestApproval.mutateAsync({ serviceId: String(service.id) })
      toast.success('El servicio quedó enviado a aprobación.')
    } catch (requestError) {
      console.error(requestError)
      toast.error('No pudimos enviar el servicio a aprobación.')
    }
  }

  const handleDecisionSubmit = async (
    values: CalibrationServiceDecisionValues
  ) => {
    try {
      if (decisionMode === 'approve') {
        if (!values.approvalChannel.trim()) {
          toast.error('Selecciona el medio de aprobación.')
          return
        }

        if (!values.approvalReference.trim()) {
          toast.error('Indica el email o teléfono que aprobó la cotización.')
          return
        }
      }

      if (decisionMode === 'reject') {
        if (!values.approvalChannel.trim()) {
          toast.error('Selecciona el medio de rechazo.')
          return
        }

        if (!values.notes.trim() || values.notes.trim().length < 5) {
          toast.error('Describe brevemente el motivo del rechazo.')
          return
        }
      }

      let evidenceDocumentId: number | null = null

      if (values.evidenceFile) {
        const uploadedDocument = await uploadDocument.mutateAsync({
          serviceId: String(service.id),
          file: values.evidenceFile,
          documentType:
            decisionMode === 'approve'
              ? 'approval_evidence'
              : 'rejection_evidence',
          title:
            decisionMode === 'approve'
              ? `Aprobación ${service.serviceCode}`
              : `Rechazo ${service.serviceCode}`,
          notes: values.notes?.trim() || undefined
        })

        evidenceDocumentId = uploadedDocument.id
      }

      const decisionIsoDate = values.decisionDate
        ? new Date(`${values.decisionDate}T12:00:00`).toISOString()
        : undefined

      if (decisionMode === 'approve') {
        await approveService.mutateAsync({
          serviceId: String(service.id),
          approvalChannel: values.approvalChannel.trim(),
          approvalReference: values.approvalReference.trim(),
          approvalNotes: values.notes.trim() || null,
          approvedAt: decisionIsoDate,
          evidenceDocumentId
        })

        toast.success('La cotización quedó aprobada formalmente.')
      }

      if (decisionMode === 'reject') {

        await rejectService.mutateAsync({
          serviceId: String(service.id),
          approvalChannel: values.approvalChannel.trim(),
          approvalReference: values.approvalReference.trim() || null,
          rejectionReason: values.notes.trim(),
          rejectedAt: decisionIsoDate,
          evidenceDocumentId
        })

        toast.success('La cotización quedó rechazada formalmente.')
      }

      setDecisionMode(null)
    } catch (decisionError) {
      console.error(decisionError)
      toast.error(
        decisionMode === 'approve'
          ? 'No pudimos registrar la aprobación.'
          : 'No pudimos registrar el rechazo.'
      )
    }
  }

  const handleIssueOds = async (values: CalibrationServiceOdsDialogValues) => {
    try {
      const updatedService = await issueOds.mutateAsync({
        serviceId: String(service.id),
        issuedAt: values.issuedAt
          ? new Date(`${values.issuedAt}T12:00:00`).toISOString()
          : undefined,
        executionCustomerName: values.executionCustomerName.trim() || null,
        executionSiteName: values.executionSiteName.trim() || null,
        contactName: values.contactName.trim() || null,
        contactEmail: values.contactEmail.trim() || null,
        contactPhone: values.contactPhone.trim() || null,
        city: values.city.trim() || null,
        department: values.department.trim() || null,
        address: values.address.trim() || null,
        internalNotes: values.internalNotes.trim() || null,
        scheduledFor: values.scheduledFor
          ? new Date(`${values.scheduledFor}T12:00:00`).toISOString()
          : null,
        scheduleWindow: values.scheduleWindow.trim() || null,
        serviceComments: values.serviceComments.trim() || null,
        modificationReason: values.modificationReason.trim() || null,
        customerAgreements: values.customerAgreements.trim() || null,
        signerName: values.signerName.trim() || null,
        signerRole: values.signerRole.trim() || null,
        externalReference: values.externalReference.trim() || null,
        receptionNotes: values.receptionNotes.trim() || null
      })

      if (values.generatePdfImmediately) {
        try {
          const document = await generateOdsPdf.mutateAsync({
            serviceId: String(service.id)
          })
          toast.success('La ODS quedó emitida y el PDF oficial ya está listo.')
          await handleDownloadDocument(
            document.id,
            document.originalFileName ||
              `ods-${updatedService.odsCode || service.serviceCode}.pdf`
          )
        } catch (pdfError) {
          console.error(pdfError)
          toast.success('La ODS quedó emitida y el semáforo ya está activo.')
          toast.error(
            'La ODS se emitió, pero no pudimos generar el PDF oficial.'
          )
        }
      } else {
        toast.success('La ODS quedó emitida y el semáforo ya está activo.')
      }

      setIsOdsDialogOpen(false)
    } catch (odsError) {
      console.error(odsError)
      toast.error('No pudimos emitir la ODS.')
    }
  }

  const handleDownloadDocument = async (
    documentId: number,
    fileName: string
  ) => {
    try {
      const fileBlob = await downloadDocument.mutateAsync({
        serviceId: String(service.id),
        documentId: String(documentId)
      })

      const objectUrl = window.URL.createObjectURL(fileBlob)
      const anchor = window.document.createElement('a')
      anchor.href = objectUrl
      anchor.download = fileName
      anchor.target = '_blank'
      anchor.rel = 'noopener'
      anchor.click()
      window.URL.revokeObjectURL(objectUrl)
    } catch (downloadError) {
      console.error(downloadError)
      toast.error('No pudimos descargar el documento.')
    }
  }

  const handleGenerateQuotePdf = async () => {
    try {
      const document = await generateQuotePdf.mutateAsync({
        serviceId: String(service.id)
      })
      toast.success('La cotización PDF quedó generada.')
      await handleDownloadDocument(
        document.id,
        document.originalFileName || `cotizacion-${service.serviceCode}.pdf`
      )
    } catch (pdfError) {
      console.error(pdfError)
      toast.error('No pudimos generar la cotización PDF.')
    }
  }

  const handleGenerateOdsPdf = async () => {
    try {
      const document = await generateOdsPdf.mutateAsync({
        serviceId: String(service.id)
      })
      toast.success('La ODS PDF quedó generada.')
      await handleDownloadDocument(
        document.id,
        document.originalFileName || `ods-${service.serviceCode}.pdf`
      )
    } catch (pdfError) {
      console.error(pdfError)
      toast.error('No pudimos generar la ODS PDF.')
    }
  }

  const handleUploadSupportDocument = async ({
    file,
    documentType,
    title,
    notes
  }: {
    file: File
    documentType:
      | 'request_evidence'
      | 'approval_evidence'
      | 'rejection_evidence'
      | 'supporting_attachment'
    title?: string
    notes?: string
  }) => {
    try {
      await uploadDocument.mutateAsync({
        serviceId: String(service.id),
        file,
        documentType,
        title,
        notes
      })
      toast.success('El documento quedó cargado al servicio.')
    } catch (uploadError) {
      console.error(uploadError)
      toast.error('No pudimos cargar el documento.')
      throw uploadError
    }
  }

  return (
    <Box p={{ xs: 2, md: 3 }}>
      <Toaster position='top-center' />
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent='space-between'
        spacing={2}
        mb={3}
      >
        <Box>
          <Button
            startIcon={<ArrowBackOutlinedIcon />}
            onClick={() => navigate('/calibration-services')}
            sx={{ mb: 1 }}
          >
            Volver a la bandeja
          </Button>
          <Typography variant='h4' fontWeight={700}>
            {service.serviceCode}
          </Typography>
          <Typography variant='body1' color='text.secondary' sx={{ mt: 1 }}>
            {service.customer?.nombre ||
              service.executionCustomerName ||
              'Cliente pendiente'}
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
            {service.customerSite ||
              service.executionSiteName ||
              'Sede pendiente'}{' '}
            · {service.contactName || 'Sin contacto principal'}
          </Typography>
        </Box>

        <Stack spacing={1} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
          {canRequestApproval ? (
            <Button
              variant='contained'
              startIcon={<SendOutlinedIcon />}
              onClick={() => void handleRequestApproval()}
              disabled={isDecisionLoading}
            >
              Solicitar aprobación
            </Button>
          ) : null}
          {canDecideApproval ? (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                variant='outlined'
                color='warning'
                startIcon={<HighlightOffOutlinedIcon />}
                onClick={() => setDecisionMode('reject')}
                disabled={isDecisionLoading}
              >
                Rechazar cotización
              </Button>
              <Button
                variant='contained'
                color='success'
                startIcon={<CheckCircleOutlineOutlinedIcon />}
                onClick={() => setDecisionMode('approve')}
                disabled={isDecisionLoading}
              >
                Aprobar cotización
              </Button>
            </Stack>
          ) : null}
          {canIssueOds ? (
            <Button
              variant='contained'
              color='info'
              startIcon={<DescriptionOutlinedIcon />}
              onClick={() => setIsOdsDialogOpen(true)}
              disabled={isOdsLoading}
            >
              Emitir ODS
            </Button>
          ) : null}
          {canEdit ? (
            <Button
              variant='outlined'
              startIcon={<EditOutlinedIcon />}
              onClick={() =>
                navigate(`/calibration-services/${service.id}/edit`)
              }
            >
              Editar servicio
            </Button>
          ) : null}
          <Stack direction='row' spacing={1} flexWrap='wrap'>
            <Chip
              color={CALIBRATION_SERVICE_STATUS_COLORS[service.status]}
              label={CALIBRATION_SERVICE_STATUS_LABELS[service.status]}
            />
            <Chip
              color={
                CALIBRATION_SERVICE_APPROVAL_COLORS[service.approvalStatus]
              }
              label={
                CALIBRATION_SERVICE_APPROVAL_LABELS[service.approvalStatus]
              }
            />
            <Chip
              color={
                CALIBRATION_SERVICE_SLA_COLORS[
                  service.slaIndicator?.color || 'gray'
                ]
              }
              label={service.slaIndicator?.label || 'SLA no iniciado'}
            />
          </Stack>
        </Stack>
      </Stack>

      <Card sx={{ borderRadius: 3, mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems='center'>
            <Grid item xs={12} md={7}>
              <Typography variant='subtitle2' color='text.secondary'>
                Semáforo actual
              </Typography>
              <Typography variant='h6' fontWeight={700}>
                {service.slaIndicator?.label || 'SLA no iniciado'}
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                {service.slaIndicator?.message ||
                  'Todavía no hay un SLA activo para este servicio.'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={5}>
              <Stack spacing={0.75}>
                <Typography variant='body2' color='text.secondary'>
                  Días hábiles transcurridos: {service.slaIndicator?.businessDaysElapsed || 0}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Umbral de alerta: {service.slaIndicator?.warningBusinessDays || 2}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  SLA objetivo: {service.slaIndicator?.targetBusinessDays || 3}
                </Typography>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Tabs
                value={activeTab}
                onChange={(_, value: DetailTab) => setActiveTab(value)}
                variant='scrollable'
                allowScrollButtonsMobile
              >
                <Tab label='Resumen' value='summary' />
                <Tab
                  label={`Ítems (${service.items?.length || 0})`}
                  value='items'
                />
                <Tab
                  label={`Documentos (${service.documents?.length || 0})`}
                  value='documents'
                />
                <Tab
                  label={`Historial (${service.events?.length || 0})`}
                  value='history'
                />
              </Tabs>

              <DetailTabPanel value={activeTab} tab='summary'>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant='caption' color='text.secondary'>
                      Contacto
                    </Typography>
                    <Typography variant='body1'>
                      {service.contactName || 'Sin contacto'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant='caption' color='text.secondary'>
                      Canal de solicitud
                    </Typography>
                    <Typography variant='body1'>
                      {service.requestChannel || 'Sin definir'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant='caption' color='text.secondary'>
                      Sede
                    </Typography>
                    <Typography variant='body1'>
                      {service.customerSite ||
                        service.executionSiteName ||
                        'Sin sede definida'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant='caption' color='text.secondary'>
                      Forma de pago
                    </Typography>
                    <Typography variant='body1'>
                      {service.paymentMethod || 'Sin definir'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant='caption' color='text.secondary'>
                      Fecha creación
                    </Typography>
                    <Typography variant='body1'>
                      {formatDateValue(service.createdAt)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant='caption' color='text.secondary'>
                      Email de contacto
                    </Typography>
                    <Typography variant='body1'>
                      {service.contactEmail || 'Sin registrar'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant='caption' color='text.secondary'>
                      Código ODS
                    </Typography>
                    <Typography variant='body1'>
                      {service.odsCode || 'ODS pendiente'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant='caption' color='text.secondary'>
                      Fecha emisión ODS
                    </Typography>
                    <Typography variant='body1'>
                      {formatDateValue(service.odsGeneratedAt)}
                    </Typography>
                  </Grid>
                </Grid>

                {service.approvalStatus !== 'pending' ? (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant='subtitle2' fontWeight={700} gutterBottom>
                      Decisión comercial
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant='caption' color='text.secondary'>
                          Medio
                        </Typography>
                        <Typography variant='body1'>
                          {service.approvalChannel || 'Sin registrar'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant='caption' color='text.secondary'>
                          Referencia
                        </Typography>
                        <Typography variant='body1'>
                          {service.approvalReference || 'Sin registrar'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant='caption' color='text.secondary'>
                          Fecha
                        </Typography>
                        <Typography variant='body1'>
                          {formatDateValue(service.approvedAt || service.rejectedAt)}
                        </Typography>
                      </Grid>
                      {service.rejectionReason ? (
                        <Grid item xs={12}>
                          <Typography variant='caption' color='text.secondary'>
                            Motivo de rechazo
                          </Typography>
                          <Typography variant='body1'>
                            {service.rejectionReason}
                          </Typography>
                        </Grid>
                      ) : null}
                      {approvalNotes ? (
                        <Grid item xs={12}>
                          <Typography variant='caption' color='text.secondary'>
                            Observación de aprobación
                          </Typography>
                          <Typography variant='body1'>
                            {approvalNotes}
                          </Typography>
                        </Grid>
                      ) : null}
                    </Grid>
                  </>
                ) : null}

                {service.commercialComments ? (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant='caption' color='text.secondary'>
                      Comentarios comerciales
                    </Typography>
                    <Typography variant='body1' sx={{ mt: 0.5 }}>
                      {service.commercialComments}
                    </Typography>
                  </>
                ) : null}

                {service.odsCode ? (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant='subtitle2' fontWeight={700} gutterBottom>
                      Datos ODS
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant='caption' color='text.secondary'>
                          Programada para
                        </Typography>
                        <Typography variant='body1'>
                          {formatDateValue(
                            typeof odsDetails?.scheduledFor === 'string'
                              ? odsDetails.scheduledFor
                              : null
                          )}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant='caption' color='text.secondary'>
                          Franja
                        </Typography>
                        <Typography variant='body1'>
                          {odsScheduleWindow || 'Sin registrar'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant='caption' color='text.secondary'>
                          Firmante
                        </Typography>
                        <Typography variant='body1'>
                          {odsSignerName || 'Sin registrar'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant='caption' color='text.secondary'>
                          Referencia externa
                        </Typography>
                        <Typography variant='body1'>
                          {typeof odsDetails?.externalReference === 'string'
                            ? odsDetails.externalReference
                            : 'Sin registrar'}
                        </Typography>
                      </Grid>
                      {odsCustomerAgreements ? (
                        <Grid item xs={12}>
                          <Typography variant='caption' color='text.secondary'>
                            Acuerdos con el cliente
                          </Typography>
                          <Typography variant='body1'>
                            {odsCustomerAgreements}
                          </Typography>
                        </Grid>
                      ) : null}
                    </Grid>
                  </>
                ) : null}
              </DetailTabPanel>

              <DetailTabPanel value={activeTab} tab='items'>
                {service.items?.length ? (
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell>Ítem</TableCell>
                          <TableCell>Instrumento</TableCell>
                          <TableCell>Tipo servicio</TableCell>
                          <TableCell align='right'>Cantidad</TableCell>
                          <TableCell align='right'>Subtotal</TableCell>
                          <TableCell align='right'>Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {service.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.itemName}</TableCell>
                            <TableCell>{item.instrumentName || 'N/A'}</TableCell>
                            <TableCell>{item.serviceType || 'N/A'}</TableCell>
                            <TableCell align='right'>{item.quantity}</TableCell>
                            <TableCell align='right'>
                              {currencyFormatter.format(toNumber(item.subtotal))}
                            </TableCell>
                            <TableCell align='right'>
                              {currencyFormatter.format(toNumber(item.total))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                ) : (
                  <Alert severity='info'>Este servicio aún no tiene ítems.</Alert>
                )}
              </DetailTabPanel>

              <DetailTabPanel value={activeTab} tab='documents'>
                <CalibrationServiceDocumentsPanel
                  serviceCode={service.serviceCode}
                  hasCustomer={Boolean(service.customerId)}
                  hasItems={Boolean(service.items?.length)}
                  hasOds={Boolean(service.odsCode)}
                  canUploadDocuments={canUploadDocuments}
                  canGenerateQuotePdf={canGenerateQuotePdf}
                  canGenerateOdsPdf={canGenerateOdsPdf}
                  officialPdfDocuments={officialPdfDocuments || []}
                  supportDocuments={supportDocuments || []}
                  decisionDocuments={decisionDocuments || []}
                  isBusy={isDocumentBusy}
                  onGenerateQuotePdf={handleGenerateQuotePdf}
                  onGenerateOdsPdf={handleGenerateOdsPdf}
                  onDownloadDocument={handleDownloadDocument}
                  onUploadDocument={handleUploadSupportDocument}
                />
              </DetailTabPanel>

              <DetailTabPanel value={activeTab} tab='history'>
                <CalibrationServiceTimeline events={service.events || []} />
              </DetailTabPanel>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: 3, position: { lg: 'sticky' }, top: { lg: 24 } }}>
            <CardContent>
              <Typography variant='h6' fontWeight={700} gutterBottom>
                Resumen compacto
              </Typography>
              <Stack spacing={1.25}>
                <Stack direction='row' justifyContent='space-between'>
                  <Typography color='text.secondary'>Ítems</Typography>
                  <Typography fontWeight={600}>
                    {service.items?.length || 0}
                  </Typography>
                </Stack>
                <Stack direction='row' justifyContent='space-between'>
                  <Typography color='text.secondary'>Documentos</Typography>
                  <Typography fontWeight={600}>
                    {service.documents?.length || 0}
                  </Typography>
                </Stack>
                <Stack direction='row' justifyContent='space-between'>
                  <Typography color='text.secondary'>Eventos</Typography>
                  <Typography fontWeight={600}>
                    {service.events?.length || 0}
                  </Typography>
                </Stack>
                <Divider />
                <Stack direction='row' justifyContent='space-between'>
                  <Typography color='text.secondary'>Subtotal</Typography>
                  <Typography fontWeight={600}>
                    {currencyFormatter.format(subtotal)}
                  </Typography>
                </Stack>
                <Stack direction='row' justifyContent='space-between'>
                  <Typography color='text.secondary'>IVA</Typography>
                  <Typography fontWeight={600}>
                    {currencyFormatter.format(taxTotal)}
                  </Typography>
                </Stack>
                <Stack direction='row' justifyContent='space-between'>
                  <Typography variant='subtitle1'>Total</Typography>
                  <Typography variant='subtitle1' fontWeight={700}>
                    {currencyFormatter.format(grandTotal)}
                  </Typography>
                </Stack>
                <Divider />
                <Typography variant='subtitle2' fontWeight={700}>
                  Próximo foco
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {service.slaIndicator?.message ||
                    'Todavía no hay una alerta operativa activa.'}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Inicio SLA: {formatDateValue(service.slaIndicator?.startedAt)}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {decisionMode ? (
        <CalibrationServiceApprovalDialog
          open={Boolean(decisionMode)}
          mode={decisionMode}
          serviceCode={service.serviceCode}
          isLoading={isDecisionLoading}
          onClose={() => setDecisionMode(null)}
          onSubmit={handleDecisionSubmit}
        />
      ) : null}
      {isOdsDialogOpen ? (
        <CalibrationServiceOdsDialog
          open={isOdsDialogOpen}
          serviceCode={service.serviceCode}
          initialValues={odsDialogInitialValues}
          isLoading={isOdsLoading}
          onClose={() => setIsOdsDialogOpen(false)}
          onSubmit={handleIssueOds}
        />
      ) : null}
    </Box>
  )
}

export default CalibrationServiceDetailsPage
