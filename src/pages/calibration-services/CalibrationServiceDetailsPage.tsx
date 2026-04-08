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
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined'
import { Toaster, toast } from 'react-hot-toast'
import { ReactNode, useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  CALIBRATION_SERVICE_ADJUSTMENT_REPORT_ROLES,
  CALIBRATION_SERVICE_ADJUSTMENT_REVIEW_ROLES,
  CALIBRATION_SERVICE_APPROVAL_ROLES,
  CALIBRATION_SERVICE_APPROVAL_COLORS,
  CALIBRATION_SERVICE_APPROVAL_LABELS,
  CALIBRATION_SERVICE_COMMERCIAL_VISIBILITY_ROLES,
  CALIBRATION_SERVICE_DOCUMENT_CONTROL_ROLES,
  CALIBRATION_SERVICE_DOCUMENT_UPLOAD_ROLES,
  CALIBRATION_SERVICE_EDIT_ROLES,
  CALIBRATION_SERVICE_EXECUTION_ROLES,
  CALIBRATION_SERVICE_INVOICING_ROLES,
  CALIBRATION_SERVICE_ODS_ROLES,
  CALIBRATION_SERVICE_SCHEDULE_ROLES,
  CALIBRATION_SERVICE_SLA_COLORS,
  CALIBRATION_SERVICE_STATUS_COLORS,
  CALIBRATION_SERVICE_STATUS_LABELS,
  CALIBRATION_SERVICE_TECHNICAL_ROLES
} from '../../constants/calibrationServices'
import {
  useCalibrationService,
  useCalibrationServiceSequenceConfig,
  useCalibrationServiceMutations
} from '../../hooks/useCalibrationServices'
import {
  CalibrationServiceAdjustment,
  CalibrationServiceCut,
  CalibrationServiceItemProgressEntryPayload
} from '../../types/calibrationService'
import { useHasRole } from '../../utils/functions'
import CalibrationServiceAdjustmentDialog from './CalibrationServiceAdjustmentDialog'
import CalibrationServiceAdjustmentReviewDialog from './CalibrationServiceAdjustmentReviewDialog'
import CalibrationServiceAdjustmentsPanel from './CalibrationServiceAdjustmentsPanel'
import CalibrationServiceApprovalDialog, {
  CalibrationServiceDecisionMode,
  CalibrationServiceDecisionValues
} from './CalibrationServiceApprovalDialog'
import CalibrationServiceOdsDialog, {
  CalibrationServiceOdsDialogValues
} from './CalibrationServiceOdsDialog'
import CalibrationServiceDocumentsPanel from './CalibrationServiceDocumentsPanel'
import CalibrationServiceOperationsPanel from './CalibrationServiceOperationsPanel'
import CalibrationServiceCutsPanel from './CalibrationServiceCutsPanel'
import CalibrationServiceCutDialog from './CalibrationServiceCutDialog'
import CalibrationServiceCutDocumentControlDialog from './CalibrationServiceCutDocumentControlDialog'
import CalibrationServiceCutInvoiceDialog from './CalibrationServiceCutInvoiceDialog'
import CalibrationServiceScheduleDialog, {
  CalibrationServiceScheduleDialogValues
} from './CalibrationServiceScheduleDialog'
import CalibrationServiceTimeline from './CalibrationServiceTimeline'
import CalibrationServiceSequenceConfigDialog from './CalibrationServiceSequenceConfigDialog'

type DetailTab =
  | 'summary'
  | 'items'
  | 'operations'
  | 'adjustments'
  | 'cuts'
  | 'documents'
  | 'history'

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

const getCustomerResponseType = (
  otherFields: Record<string, unknown> | undefined
) => {
  const value = otherFields?.customerResponseType
  return typeof value === 'string' ? value : null
}

const getLatestChangeRequest = (
  otherFields: Record<string, unknown> | undefined
) => {
  const value = otherFields?.latestChangeRequest
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

const getOperationsDetails = (
  otherFields: Record<string, unknown> | undefined
) => {
  const value = otherFields?.operations
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

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
  const canManageSequenceConfig = useHasRole([...CALIBRATION_SERVICE_ODS_ROLES])
  const {
    data: sequenceConfig,
    isLoading: isLoadingSequenceConfig
  } = useCalibrationServiceSequenceConfig(canManageSequenceConfig)
  const {
    requestApproval,
    approveService,
    rejectService,
    requestChanges,
    uploadDocument,
    issueOds,
    scheduleService,
    startExecution,
    completeExecution,
    updateItemProgress,
    createCut,
    createAdjustment,
    reviewAdjustment,
    markCutReadyForInvoicing,
    markCutInvoiced,
    updateCutDocumentControl,
    generateQuotePdf,
    generateOdsPdf,
    downloadDocument,
    upsertSequenceConfig
  } = useCalibrationServiceMutations()
  const [decisionMode, setDecisionMode] =
    useState<CalibrationServiceDecisionMode | null>(null)
  const [isOdsDialogOpen, setIsOdsDialogOpen] = useState(false)
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [isCutDialogOpen, setIsCutDialogOpen] = useState(false)
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false)
  const [isSequenceDialogOpen, setIsSequenceDialogOpen] = useState(false)
  const [selectedCutForInvoice, setSelectedCutForInvoice] =
    useState<CalibrationServiceCut | null>(null)
  const [selectedCutForDocumentControl, setSelectedCutForDocumentControl] =
    useState<CalibrationServiceCut | null>(null)
  const [selectedAdjustment, setSelectedAdjustment] =
    useState<CalibrationServiceAdjustment | null>(null)
  const [activeTab, setActiveTab] = useState<DetailTab>('summary')
  const canEditService = useHasRole([...CALIBRATION_SERVICE_EDIT_ROLES])
  const canTakeApprovalDecision = useHasRole([...CALIBRATION_SERVICE_APPROVAL_ROLES])
  const canIssueOdsRole = useHasRole([...CALIBRATION_SERVICE_ODS_ROLES])
  const canScheduleServiceRole = useHasRole([...CALIBRATION_SERVICE_SCHEDULE_ROLES])
  const canRunExecutionRole = useHasRole([...CALIBRATION_SERVICE_EXECUTION_ROLES])
  const canReportAdjustmentRole = useHasRole([
    ...CALIBRATION_SERVICE_ADJUSTMENT_REPORT_ROLES
  ])
  const canReviewAdjustmentRole = useHasRole([
    ...CALIBRATION_SERVICE_ADJUSTMENT_REVIEW_ROLES
  ])
  const canUpdateDocumentControlRole = useHasRole([
    ...CALIBRATION_SERVICE_DOCUMENT_CONTROL_ROLES
  ])
  const canInvoiceCutRole = useHasRole([...CALIBRATION_SERVICE_INVOICING_ROLES])
  const canUploadDocuments = useHasRole([
    ...CALIBRATION_SERVICE_DOCUMENT_UPLOAD_ROLES
  ])
  const hasTechnicalRole = useHasRole([...CALIBRATION_SERVICE_TECHNICAL_ROLES])
  const hasCommercialVisibility = useHasRole([
    ...CALIBRATION_SERVICE_COMMERCIAL_VISIBILITY_ROLES
  ])
  const canGenerateQuotePdf = useHasRole([...CALIBRATION_SERVICE_EDIT_ROLES])
  const canGenerateOdsPdf = useHasRole([...CALIBRATION_SERVICE_ODS_ROLES])
  const requestedAction = searchParams.get('open')
  const isTechnicalOnlyView = hasTechnicalRole && !hasCommercialVisibility
  const canIssueOds =
    canIssueOdsRole &&
    service?.status === 'approved' &&
    service?.approvalStatus === 'approved' &&
    !service?.odsCode &&
    Boolean(sequenceConfig?.initialized)
  const canScheduleService =
    canScheduleServiceRole &&
    ['ods_issued', 'pending_programming'].includes(service?.status || '')
  const canStartExecution =
    canRunExecutionRole && service?.status === 'scheduled'
  const allItemsOperationallyCompleted = (service?.items || []).every((item) => {
    const status = item.otherFields?.operationalStatus
    return status === 'completed'
  })
  const hasReleasableItems = (service?.items || []).some((item) => {
    const operationalStatus = item.otherFields?.operationalStatus
    const releasedQuantity = Number(item.otherFields?.releasedQuantity || 0)
    const quantity = Number(item.quantity || 0)

    return operationalStatus === 'completed' && Math.max(quantity - releasedQuantity, 0) > 0
  })
  const canCompleteExecution =
    canRunExecutionRole &&
    service?.status === 'in_execution' &&
    allItemsOperationallyCompleted
  const canCreateCut =
    canRunExecutionRole &&
    ['in_execution', 'technically_completed'].includes(service?.status || '') &&
    hasReleasableItems
  const canReportAdjustment =
    canReportAdjustmentRole &&
    ['in_execution', 'technically_completed'].includes(service?.status || '')
  const canReviewAdjustment = canReviewAdjustmentRole
  const canUpdateOperationalProgress =
    canRunExecutionRole &&
    ['scheduled', 'in_execution'].includes(service?.status || '')
  const canInvoiceCuts = canInvoiceCutRole
  const canUpdateDocumentControl = canUpdateDocumentControlRole
  const canStillRegisterAdjustmentsAfterTechnicalCompletion =
    service?.status === 'technically_completed' && canReportAdjustment
  const hasCuts = Boolean(service?.cuts?.length)
  const shouldShowPostTechnicalCompletionGuidance =
    service?.status === 'technically_completed'
  const shouldShowCutsNextStepGuidance =
    service?.status === 'technically_completed' && !hasCuts

  useEffect(() => {
    if (!canManageSequenceConfig || isLoadingSequenceConfig) {
      return
    }

    if (!sequenceConfig?.initialized) {
      setIsSequenceDialogOpen(true)
    }
  }, [canManageSequenceConfig, isLoadingSequenceConfig, sequenceConfig?.initialized])

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

  useEffect(() => {
    if (requestedAction !== 'schedule' || !canScheduleService || isScheduleDialogOpen) {
      return
    }

    setIsScheduleDialogOpen(true)
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('open')
    setSearchParams(nextSearchParams, { replace: true })
  }, [
    canScheduleService,
    isScheduleDialogOpen,
    requestedAction,
    searchParams,
    setSearchParams
  ])

  if (isLoading || isLoadingSequenceConfig) {
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
    service.status === 'draft'
  const canRequestApproval =
    canEditService && service.status === 'draft'
  const canDecideApproval =
    canTakeApprovalDecision && service.status === 'pending_approval'
  const approvalNotes = getOtherFieldText(service.otherFields, 'approvalNotes')
  const customerResponseType = getCustomerResponseType(service.otherFields)
  const latestChangeRequest = getLatestChangeRequest(service.otherFields)
  const latestChangeRequestReason =
    typeof latestChangeRequest?.changeRequestReason === 'string'
      ? latestChangeRequest.changeRequestReason
      : ''
  const commercialCustomerName = service.customer?.nombre || 'Sin registrar'
  const executionCustomerName =
    service.executionCustomerName || service.customer?.nombre || 'Sin registrar'
  const executionSiteName =
    service.executionSiteName || service.customerSite || 'Sin registrar'
  const hasDifferentExecutionCustomer =
    Boolean(service.executionCustomerName) &&
    service.executionCustomerName !== service.customer?.nombre
  const odsDetails = getOtherFieldRecord(service.otherFields, 'ods')
  const operationsDetails = getOperationsDetails(service.otherFields)
  const odsScheduleWindow =
    typeof odsDetails?.scheduleWindow === 'string' ? odsDetails.scheduleWindow : ''
  const odsSignerName =
    typeof odsDetails?.signerName === 'string' ? odsDetails.signerName : ''
  const odsCustomerAgreements =
    typeof odsDetails?.customerAgreements === 'string'
      ? odsDetails.customerAgreements
      : ''
  const operationsCommitmentDate =
    typeof operationsDetails?.commitmentDate === 'string'
      ? operationsDetails.commitmentDate
      : ''
  const operationsScheduledDate =
    typeof operationsDetails?.scheduledDate === 'string'
      ? operationsDetails.scheduledDate
      : typeof odsDetails?.scheduledFor === 'string'
        ? odsDetails.scheduledFor
        : ''
  const operationsResponsibleName =
    typeof operationsDetails?.operationalResponsibleName === 'string'
      ? operationsDetails.operationalResponsibleName
      : ''
  const operationsResponsibleRole =
    typeof operationsDetails?.operationalResponsibleRole === 'string'
      ? operationsDetails.operationalResponsibleRole
      : ''
  const operationsProgrammingNotes =
    typeof operationsDetails?.programmingNotes === 'string'
      ? operationsDetails.programmingNotes
      : ''
  const operationsCompletionNotes =
    typeof operationsDetails?.completionNotes === 'string'
      ? operationsDetails.completionNotes
      : ''
  const approvedAdjustmentsImpact = (service.adjustments || []).reduce(
    (accumulator, adjustment) => {
      if (!['approved', 'applied_to_cut'].includes(adjustment.status)) {
        return accumulator
      }

      if (
        adjustment.changeType === 'extra_item' &&
        adjustment.serviceItemId &&
        (service.items || []).some((item) => item.id === adjustment.serviceItemId)
      ) {
        return accumulator
      }

      const taxTotalFromOtherFields =
        adjustment.approvedTaxTotal ??
        (adjustment.otherFields &&
        typeof adjustment.otherFields.approvedTaxTotal === 'number'
          ? adjustment.otherFields.approvedTaxTotal
          : adjustment.otherFields &&
              typeof adjustment.otherFields.approvedTaxTotal === 'string'
            ? adjustment.otherFields.approvedTaxTotal
            : 0)

      return {
        subtotal: accumulator.subtotal + toNumber(adjustment.approvedSubtotal),
        taxTotal: accumulator.taxTotal + toNumber(taxTotalFromOtherFields),
        grandTotal: accumulator.grandTotal + toNumber(adjustment.approvedTotal)
      }
    },
    { subtotal: 0, taxTotal: 0, grandTotal: 0 }
  )
  const baseSubtotal = (service.items || []).reduce(
    (accumulator, item) => accumulator + toNumber(item.subtotal),
    0
  )
  const baseTaxTotal = (service.items || []).reduce(
    (accumulator, item) => accumulator + toNumber(item.taxTotal),
    0
  )
  const baseGrandTotal = (service.items || []).reduce(
    (accumulator, item) => accumulator + toNumber(item.total),
    0
  )
  const subtotal = baseSubtotal + approvedAdjustmentsImpact.subtotal
  const taxTotal = baseTaxTotal + approvedAdjustmentsImpact.taxTotal
  const grandTotal = baseGrandTotal + approvedAdjustmentsImpact.grandTotal
  const isDecisionLoading =
    requestApproval.isLoading ||
    approveService.isLoading ||
    rejectService.isLoading ||
    requestChanges.isLoading ||
    uploadDocument.isLoading
  const isOdsLoading = issueOds.isLoading || generateOdsPdf.isLoading
  const isOperationalBusy =
    scheduleService.isLoading ||
    startExecution.isLoading ||
    completeExecution.isLoading ||
    updateItemProgress.isLoading ||
    createCut.isLoading ||
    createAdjustment.isLoading ||
    reviewAdjustment.isLoading ||
    markCutReadyForInvoicing.isLoading ||
    markCutInvoiced.isLoading ||
    updateCutDocumentControl.isLoading
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
  const unresolvedCommercialAdjustments = (service.adjustments || []).filter(
    (adjustment) =>
      adjustment.requiresCommercialAdjustment && adjustment.status === 'reported'
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
  const scheduleDialogInitialValues: CalibrationServiceScheduleDialogValues = {
    commitmentDate: operationsCommitmentDate
      ? operationsCommitmentDate.slice(0, 10)
      : '',
    scheduledDate: operationsScheduledDate
      ? operationsScheduledDate.slice(0, 10)
      : '',
    operationalResponsibleName: operationsResponsibleName,
    operationalResponsibleRole: operationsResponsibleRole,
    programmingNotes: operationsProgrammingNotes
  }

  const handleRequestApproval = async () => {
    try {
      await requestApproval.mutateAsync({ serviceId: String(service.id) })
      toast.success('La cotización quedó enviada al cliente.')
    } catch (requestError) {
      console.error(requestError)
      toast.error('No pudimos marcar la cotización como enviada al cliente.')
    }
  }

  const handleDecisionSubmit = async (
    values: CalibrationServiceDecisionValues
  ) => {
    try {
      if (decisionMode === 'approve') {
        if (!values.approvalChannel.trim()) {
          toast.error('Selecciona el medio por el que respondió el cliente.')
          return
        }

        if (!values.approvalReference.trim()) {
          toast.error('Indica el email o teléfono del contacto que aprobó la cotización.')
          return
        }
      }

      if (decisionMode === 'reject') {
        if (!values.approvalChannel.trim()) {
          toast.error('Selecciona el medio por el que respondió el cliente.')
          return
        }

        if (!values.notes.trim() || values.notes.trim().length < 5) {
          toast.error('Describe brevemente el motivo del rechazo.')
          return
        }
      }

      if (decisionMode === 'request_changes') {
        if (!values.approvalChannel.trim()) {
          toast.error('Selecciona el medio por el que respondió el cliente.')
          return
        }

        if (!values.notes.trim() || values.notes.trim().length < 5) {
          toast.error('Describe brevemente qué pidió modificar el cliente.')
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
              : decisionMode === 'reject'
                ? 'rejection_evidence'
                : 'supporting_attachment',
          title:
            decisionMode === 'approve'
              ? `Aprobación cliente ${service.serviceCode}`
              : decisionMode === 'reject'
                ? `Rechazo cliente ${service.serviceCode}`
                : `Solicitud modificación cliente ${service.serviceCode}`,
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

        toast.success('La aprobación del cliente quedó registrada.')
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

        toast.success('El rechazo del cliente quedó registrado.')
      }

      if (decisionMode === 'request_changes') {
        await requestChanges.mutateAsync({
          serviceId: String(service.id),
          approvalChannel: values.approvalChannel.trim(),
          approvalReference: values.approvalReference.trim() || null,
          changeRequestReason: values.notes.trim(),
          requestedAt: decisionIsoDate,
          evidenceDocumentId
        })

        toast.success('La solicitud de modificación del cliente quedó registrada.')
      }

      setDecisionMode(null)
    } catch (decisionError) {
      console.error(decisionError)
      toast.error(
        decisionMode === 'approve'
          ? 'No pudimos registrar la aprobación del cliente.'
          : decisionMode === 'reject'
            ? 'No pudimos registrar el rechazo del cliente.'
            : 'No pudimos registrar la solicitud de modificación.'
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

  const handleScheduleService = async (
    values: CalibrationServiceScheduleDialogValues
  ) => {
    try {
      if (!values.commitmentDate) {
        toast.error('Define la fecha compromiso del servicio.')
        return
      }

      if (!values.scheduledDate) {
        toast.error('Define la fecha programada del servicio.')
        return
      }

      if (!values.operationalResponsibleName.trim()) {
        toast.error('Indica el responsable operativo del servicio.')
        return
      }

      await scheduleService.mutateAsync({
        serviceId: String(service.id),
        commitmentDate: new Date(
          `${values.commitmentDate}T12:00:00`
        ).toISOString(),
        scheduledDate: new Date(
          `${values.scheduledDate}T12:00:00`
        ).toISOString(),
        operationalResponsibleName: values.operationalResponsibleName.trim(),
        operationalResponsibleRole:
          values.operationalResponsibleRole.trim() || null,
        programmingNotes: values.programmingNotes.trim() || null
      })

      toast.success('El servicio quedó programado.')
      setIsScheduleDialogOpen(false)
      setActiveTab('operations')
    } catch (scheduleError) {
      console.error(scheduleError)
      toast.error('No pudimos guardar la programación del servicio.')
    }
  }

  const handleStartExecution = async () => {
    try {
      await startExecution.mutateAsync({
        serviceId: String(service.id),
        startedAt: new Date().toISOString(),
        executionNotes: null
      })
      toast.success('La ejecución del servicio quedó iniciada.')
      setActiveTab('operations')
    } catch (executionError) {
      console.error(executionError)
      toast.error('No pudimos iniciar la ejecución del servicio.')
    }
  }

  const handleCompleteExecution = async () => {
    try {
      await completeExecution.mutateAsync({
        serviceId: String(service.id),
        technicallyCompletedAt: new Date().toISOString(),
        completionNotes: operationsCompletionNotes || null
      })
      toast.success('La ejecución técnica quedó finalizada.')
      setActiveTab('operations')
    } catch (completeError) {
      console.error(completeError)
      toast.error('No pudimos finalizar técnicamente el servicio.')
    }
  }

  const handleCreateCut = async (values: {
    cutType: 'partial' | 'final'
    notes: string
    items: Array<{ serviceItemId: number; quantity: number }>
  }) => {
    try {
      if (!values.items.length) {
        toast.error('Selecciona al menos un ítem para el corte.')
        return
      }

      await createCut.mutateAsync({
        serviceId: String(service.id),
        cutType: values.cutType,
        notes: values.notes.trim() || null,
        items: values.items
      })
      toast.success('El corte quedó creado.')
      setIsCutDialogOpen(false)
      setActiveTab('cuts')
    } catch (cutError) {
      console.error(cutError)
      toast.error('No pudimos crear el corte.')
    }
  }

  const handleCreateAdjustment = async (values: {
    serviceItemId?: number | null
    changeType:
      | 'quantity_less'
      | 'quantity_more'
      | 'extra_item'
      | 'not_received'
      | 'scope_change'
    itemName?: string | null
    quotedQuantity?: number
    actualQuantity: number
    description: string
    technicalNotes?: string | null
    requiresCommercialAdjustment: boolean
  }) => {
    try {
      await createAdjustment.mutateAsync({
        serviceId: String(service.id),
        ...values
      })
      toast.success('La novedad quedó registrada.')
      setIsAdjustmentDialogOpen(false)
      setActiveTab('adjustments')
    } catch (adjustmentError) {
      console.error(adjustmentError)
      const serverMessage =
        typeof adjustmentError === 'object' &&
        adjustmentError !== null &&
        'response' in adjustmentError &&
        adjustmentError.response &&
        typeof adjustmentError.response === 'object' &&
        'data' in adjustmentError.response &&
        adjustmentError.response.data &&
        typeof adjustmentError.response.data === 'object' &&
        'details' in adjustmentError.response.data &&
        typeof adjustmentError.response.data.details === 'string'
          ? adjustmentError.response.data.details
          : typeof adjustmentError === 'object' &&
              adjustmentError !== null &&
              'response' in adjustmentError &&
              adjustmentError.response &&
              typeof adjustmentError.response === 'object' &&
              'data' in adjustmentError.response &&
              adjustmentError.response.data &&
              typeof adjustmentError.response.data === 'object' &&
              'error' in adjustmentError.response.data &&
              typeof adjustmentError.response.data.error === 'string'
            ? adjustmentError.response.data.error
            : null

      toast.error(
        serverMessage
          ? `No pudimos registrar la novedad. ${serverMessage}`
          : 'No pudimos registrar la novedad.'
      )
    }
  }

  const handleReviewAdjustment = async (values: {
    decision: 'approved' | 'rejected'
    commercialNotes?: string | null
    pricingNotes?: string | null
    approvedUnitPrice?: number | null
    approvedTaxRate?: number | null
    approvedTaxTotal?: number | null
    approvedSubtotal?: number | null
    approvedTotal?: number | null
    useQuotedPrice?: boolean
    applyDiscount?: boolean
  }) => {
    if (!selectedAdjustment) {
      return
    }

    try {
      await reviewAdjustment.mutateAsync({
        serviceId: String(service.id),
        adjustmentId: String(selectedAdjustment.id),
        ...values
      })
      toast.success('La revisión de la novedad quedó guardada.')
      setSelectedAdjustment(null)
      setActiveTab('adjustments')
    } catch (adjustmentError) {
      console.error(adjustmentError)
      toast.error('No pudimos guardar la revisión de la novedad.')
    }
  }

  const handleMarkCutReady = async (cutId: number) => {
    try {
      await markCutReadyForInvoicing.mutateAsync({
        serviceId: String(service.id),
        cutId: String(cutId),
        readyForInvoicingAt: new Date().toISOString()
      })
      toast.success('El corte quedó listo para facturar.')
    } catch (cutError) {
      console.error(cutError)
      toast.error('No pudimos mover el corte a listo para facturar.')
    }
  }

  const handleMarkCutInvoiced = async (values: {
    invoiceReference: string
    invoicedAt: string
    invoiceNotes?: string | null
  }) => {
    if (!selectedCutForInvoice) {
      return
    }

    try {
      await markCutInvoiced.mutateAsync({
        serviceId: String(service.id),
        cutId: String(selectedCutForInvoice.id),
        ...values
      })
      toast.success('El corte quedó marcado como facturado.')
      setSelectedCutForInvoice(null)
      setActiveTab('cuts')
    } catch (cutError) {
      console.error(cutError)
      toast.error('No pudimos registrar la facturación del corte.')
    }
  }

  const handleUpdateCutDocumentControl = async (values: {
    expectedCertificates: number
    uploadedCertificates: number
    reviewedCertificates: number
    sentCertificates: number
    sendChannel?: string | null
    sentTo?: string | null
    sentAt?: string | null
    evidenceFile?: File | null
    notes?: string | null
  }) => {
    if (!selectedCutForDocumentControl) {
      return
    }

    try {
      if (
        values.sentCertificates > 0 &&
        (!values.sendChannel?.trim() || !values.sentTo?.trim())
      ) {
        toast.error(
          'Cuando ya hay certificados enviados, indica el canal y el destinatario.'
        )
        return
      }

      let evidenceDocumentIds =
        selectedCutForDocumentControl.otherFields?.documentControl?.evidenceDocumentIds ||
        []

      if (values.evidenceFile) {
        const uploadedDocument = await uploadDocument.mutateAsync({
          serviceId: String(service.id),
          cutId: selectedCutForDocumentControl.id,
          file: values.evidenceFile,
          documentType: 'supporting_attachment',
          title: `Soporte de envío ${selectedCutForDocumentControl.cutCode}`,
          notes: values.notes || 'Soporte de envío documental del corte'
        })

        evidenceDocumentIds = [...new Set([...evidenceDocumentIds, uploadedDocument.id])]
      }

      await updateCutDocumentControl.mutateAsync({
        serviceId: String(service.id),
        cutId: String(selectedCutForDocumentControl.id),
        expectedCertificates: values.expectedCertificates,
        uploadedCertificates: values.uploadedCertificates,
        reviewedCertificates: values.reviewedCertificates,
        sentCertificates: values.sentCertificates,
        sendChannel: values.sendChannel,
        sentTo: values.sentTo,
        sentAt: values.sentAt,
        notes: values.notes,
        evidenceDocumentIds
      })
      toast.success('El control documental del corte quedó actualizado.')
      setSelectedCutForDocumentControl(null)
      setActiveTab('cuts')
    } catch (cutError) {
      console.error(cutError)
      toast.error('No pudimos actualizar el control documental del corte.')
    }
  }

  const handleSaveOperationalProgress = async (
    items: CalibrationServiceItemProgressEntryPayload[]
  ) => {
    try {
      await updateItemProgress.mutateAsync({
        serviceId: String(service.id),
        items: items.map((item) => ({
          ...item,
          technicalNotes: item.technicalNotes?.trim() || null
        }))
      })
      toast.success('El avance técnico por ítem quedó actualizado.')
    } catch (progressError) {
      console.error(progressError)
      toast.error('No pudimos guardar el avance técnico por ítem.')
    }
  }

  const handleSaveSequenceConfig = async (values: {
    nextQuoteNumber: number
    nextOdsNumber: number
  }) => {
    try {
      await upsertSequenceConfig.mutateAsync(values)
      toast.success('Los consecutivos iniciales quedaron configurados.')
      setIsSequenceDialogOpen(false)
    } catch (configError) {
      console.error(configError)
      toast.error('No pudimos guardar la configuración inicial del módulo.')
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
          {customerResponseType === 'changes_requested' ? (
            <Chip color='warning' variant='outlined' label='Cliente pidió modificación' />
          ) : null}
          {canRequestApproval ? (
            <Button
              variant='contained'
              startIcon={<SendOutlinedIcon />}
              onClick={() => void handleRequestApproval()}
              disabled={isDecisionLoading}
            >
              Enviar cotización
            </Button>
          ) : null}
          {canDecideApproval ? (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                variant='outlined'
                color='warning'
                startIcon={<AutorenewOutlinedIcon />}
                onClick={() => setDecisionMode('request_changes')}
                disabled={isDecisionLoading}
              >
                Registrar solicitud de modificación
              </Button>
              <Button
                variant='outlined'
                color='warning'
                startIcon={<HighlightOffOutlinedIcon />}
                onClick={() => setDecisionMode('reject')}
                disabled={isDecisionLoading}
              >
                Registrar rechazo cliente
              </Button>
              <Button
                variant='contained'
                color='success'
                startIcon={<CheckCircleOutlineOutlinedIcon />}
                onClick={() => setDecisionMode('approve')}
                disabled={isDecisionLoading}
              >
                Registrar aprobación cliente
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
          {canScheduleService ? (
            <Button
              variant='contained'
              color='primary'
              startIcon={<DescriptionOutlinedIcon />}
              onClick={() => setIsScheduleDialogOpen(true)}
              disabled={isOperationalBusy}
            >
              Programar servicio
            </Button>
          ) : null}
          {canStartExecution ? (
            <Button
              variant='contained'
              color='success'
              startIcon={<CheckCircleOutlineOutlinedIcon />}
              onClick={() => void handleStartExecution()}
              disabled={isOperationalBusy}
            >
              Iniciar ejecución
            </Button>
          ) : null}
          {canCompleteExecution ? (
            <Button
              variant='contained'
              color='secondary'
              startIcon={<CheckCircleOutlineOutlinedIcon />}
              onClick={() => void handleCompleteExecution()}
              disabled={isOperationalBusy}
            >
              Finalizar ejecución
            </Button>
          ) : null}
          {canCreateCut ? (
            <Button
              variant='outlined'
              color='primary'
              startIcon={<DescriptionOutlinedIcon />}
              onClick={() => setIsCutDialogOpen(true)}
              disabled={isOperationalBusy}
            >
              Crear corte
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
            {!isTechnicalOnlyView ? (
              <Chip
                color={
                  CALIBRATION_SERVICE_APPROVAL_COLORS[service.approvalStatus]
                }
                label={
                  CALIBRATION_SERVICE_APPROVAL_LABELS[service.approvalStatus]
                }
              />
            ) : null}
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

      {canManageSequenceConfig && sequenceConfig && !sequenceConfig.initialized ? (
        <Alert
          severity='warning'
          sx={{ mb: 2 }}
          action={
            <Button color='inherit' size='small' onClick={() => setIsSequenceDialogOpen(true)}>
              Configurar
            </Button>
          }
        >
          Antes de emitir la primera ODS, define el consecutivo inicial de
          oferta y ODS para este módulo.
        </Alert>
      ) : null}

      <Card sx={{ borderRadius: 3, mb: 2 }}>
        <CardContent>
          {isTechnicalOnlyView ? (
            <Alert severity='info' sx={{ mb: 2 }}>
              Vista técnica activa: aquí solo ves la ODS, el semáforo y los
              datos operativos del servicio.
            </Alert>
          ) : null}
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
                <Tab label='Operación' value='operations' />
                <Tab
                  label={`Novedades (${service.adjustments?.length || 0})`}
                  value='adjustments'
                />
                <Tab label={`Cortes (${service.cuts?.length || 0})`} value='cuts' />
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
                {!isTechnicalOnlyView && customerResponseType === 'changes_requested' ? (
                  <Alert severity='warning' sx={{ mb: 2 }}>
                    El cliente pidió modificar la cotización. El servicio volvió a edición para
                    ajustar la propuesta y reenviarla sin perder la trazabilidad.
                  </Alert>
                ) : null}
                <Grid container spacing={2}>
                  {!isTechnicalOnlyView ? (
                    <>
                      <Grid item xs={12} md={6}>
                        <Typography variant='caption' color='text.secondary'>
                          Cliente de la oferta
                        </Typography>
                        <Typography variant='body1'>
                          {commercialCustomerName}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant='caption' color='text.secondary'>
                          Destino del servicio
                        </Typography>
                        <Typography variant='body1'>
                          {hasDifferentExecutionCustomer
                            ? 'Cliente diferente a la oferta'
                            : 'Mismo cliente de la oferta'}
                        </Typography>
                      </Grid>
                      {hasDifferentExecutionCustomer ? (
                        <>
                          <Grid item xs={12} md={6}>
                            <Typography variant='caption' color='text.secondary'>
                              Cliente de ejecución
                            </Typography>
                            <Typography variant='body1'>
                              {executionCustomerName}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography variant='caption' color='text.secondary'>
                              Sede o referencia de ejecución
                            </Typography>
                            <Typography variant='body1'>
                              {executionSiteName}
                            </Typography>
                          </Grid>
                        </>
                      ) : null}
                    </>
                  ) : null}
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
                      Sede
                    </Typography>
                    <Typography variant='body1'>
                      {service.customerSite ||
                        service.executionSiteName ||
                        'Sin sede definida'}
                    </Typography>
                  </Grid>
                  {!isTechnicalOnlyView ? (
                    <Grid item xs={12} md={6}>
                      <Typography variant='caption' color='text.secondary'>
                        Canal de solicitud
                      </Typography>
                      <Typography variant='body1'>
                        {service.requestChannel || 'Sin definir'}
                      </Typography>
                    </Grid>
                  ) : null}
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
                      Teléfono de contacto
                    </Typography>
                    <Typography variant='body1'>
                      {service.contactPhone || 'Sin registrar'}
                    </Typography>
                  </Grid>
                  {!isTechnicalOnlyView ? (
                    <Grid item xs={12} md={6}>
                      <Typography variant='caption' color='text.secondary'>
                        Forma de pago
                      </Typography>
                      <Typography variant='body1'>
                        {service.paymentMethod || 'Sin definir'}
                      </Typography>
                    </Grid>
                  ) : null}
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

                {!isTechnicalOnlyView &&
                (service.approvalStatus !== 'pending' ||
                  customerResponseType === 'changes_requested') ? (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant='subtitle2' fontWeight={700} gutterBottom>
                      Respuesta del cliente
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant='caption' color='text.secondary'>
                          Medio de respuesta
                        </Typography>
                        <Typography variant='body1'>
                          {service.approvalChannel || 'Sin registrar'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant='caption' color='text.secondary'>
                          Contacto de referencia
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
                      {customerResponseType === 'changes_requested' &&
                      latestChangeRequestReason ? (
                        <Grid item xs={12}>
                          <Typography variant='caption' color='text.secondary'>
                            Solicitud de modificación
                          </Typography>
                          <Typography variant='body1'>
                            {latestChangeRequestReason}
                          </Typography>
                        </Grid>
                      ) : null}
                      {approvalNotes ? (
                        <Grid item xs={12}>
                          <Typography variant='caption' color='text.secondary'>
                            Observación de la respuesta
                          </Typography>
                          <Typography variant='body1'>
                            {approvalNotes}
                          </Typography>
                        </Grid>
                      ) : null}
                    </Grid>
                  </>
                ) : null}

                {!isTechnicalOnlyView && service.commercialComments ? (
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
                          {!isTechnicalOnlyView ? (
                            <TableCell align='right'>Subtotal</TableCell>
                          ) : null}
                          {!isTechnicalOnlyView ? (
                            <TableCell align='right'>Total</TableCell>
                          ) : null}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {service.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.itemName}</TableCell>
                            <TableCell>{item.instrumentName || 'N/A'}</TableCell>
                            <TableCell>{item.serviceType || 'N/A'}</TableCell>
                            <TableCell align='right'>{item.quantity}</TableCell>
                            {!isTechnicalOnlyView ? (
                              <TableCell align='right'>
                                {currencyFormatter.format(toNumber(item.subtotal))}
                              </TableCell>
                            ) : null}
                            {!isTechnicalOnlyView ? (
                              <TableCell align='right'>
                                {currencyFormatter.format(toNumber(item.total))}
                              </TableCell>
                            ) : null}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                ) : (
                  <Alert severity='info'>Este servicio aún no tiene ítems.</Alert>
                )}
              </DetailTabPanel>

              <DetailTabPanel value={activeTab} tab='operations'>
                {service.odsCode ? (
                  <>
                    {service.status === 'in_execution' &&
                    !allItemsOperationallyCompleted ? (
                      <Alert severity='info' sx={{ mb: 2 }}>
                        Para finalizar la ejecución técnica, primero marca todos los ítems como
                        <strong> Completado</strong>.
                      </Alert>
                    ) : null}
                    {shouldShowPostTechnicalCompletionGuidance ? (
                      <Alert severity='success' sx={{ mb: 2 }}>
                        El servicio ya quedó <strong>finalizado técnicamente</strong>. Aún puedes
                        registrar novedades si apareció alguna diferencia final, y después sacar
                        el corte parcial o final según lo que realmente vaya a salir.
                      </Alert>
                    ) : null}
                    <CalibrationServiceOperationsPanel
                      service={service}
                      canEditProgress={canUpdateOperationalProgress}
                      isBusy={isOperationalBusy}
                      onSaveProgress={handleSaveOperationalProgress}
                    />
                  </>
                ) : (
                  <Alert severity='info'>
                    La vista operativa se habilita una vez la ODS ha sido emitida.
                  </Alert>
                )}
              </DetailTabPanel>

              <DetailTabPanel value={activeTab} tab='adjustments'>
                {canStillRegisterAdjustmentsAfterTechnicalCompletion ? (
                  <Alert severity='info' sx={{ mb: 2 }}>
                    Aunque la ejecución ya terminó, todavía puedes registrar novedades para dejar
                    trazabilidad de diferencias finales antes de sacar el corte administrativo.
                  </Alert>
                ) : null}
                <CalibrationServiceAdjustmentsPanel
                  service={service}
                  canReport={canReportAdjustment}
                  canReview={canReviewAdjustment}
                  isTechnicalOnlyView={isTechnicalOnlyView}
                  isBusy={isOperationalBusy}
                  onCreate={() => setIsAdjustmentDialogOpen(true)}
                  onReview={(adjustment) => setSelectedAdjustment(adjustment)}
                />
              </DetailTabPanel>

              <DetailTabPanel value={activeTab} tab='cuts'>
                {shouldShowCutsNextStepGuidance ? (
                  <Alert severity='info' sx={{ mb: 2 }}>
                    El servicio ya terminó técnicamente y todavía no tiene cortes. Este es el paso
                    para definir qué sale ahora: puedes crear un corte parcial si quedan
                    pendientes, o un corte final si todo ya está listo.
                  </Alert>
                ) : null}
                {unresolvedCommercialAdjustments.length ? (
                  <Alert severity='warning' sx={{ mb: 2 }}>
                    Antes de dejar un corte listo para facturar, revisa las novedades con
                    impacto económico pendientes.
                  </Alert>
                ) : null}
                <CalibrationServiceCutsPanel
                  cuts={service.cuts || []}
                  canMarkReady={canCreateCut}
                  canMarkInvoiced={canInvoiceCuts}
                  canUpdateDocumentControl={canUpdateDocumentControl}
                  isBusy={isOperationalBusy}
                  onMarkReady={handleMarkCutReady}
                  onMarkInvoiced={(cut) => setSelectedCutForInvoice(cut)}
                  onUpdateDocumentControl={(cut) =>
                    setSelectedCutForDocumentControl(cut)
                  }
                />
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
                {!isTechnicalOnlyView ? (
                  <>
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
                  </>
                ) : null}
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
      {isScheduleDialogOpen ? (
        <CalibrationServiceScheduleDialog
          open={isScheduleDialogOpen}
          serviceCode={service.serviceCode}
          initialValues={scheduleDialogInitialValues}
          isLoading={isOperationalBusy}
          onClose={() => setIsScheduleDialogOpen(false)}
          onSubmit={handleScheduleService}
        />
      ) : null}
      {isCutDialogOpen ? (
        <CalibrationServiceCutDialog
          open={isCutDialogOpen}
          service={service}
          isLoading={isOperationalBusy}
          onClose={() => setIsCutDialogOpen(false)}
          onSubmit={handleCreateCut}
        />
      ) : null}
      {selectedCutForInvoice ? (
        <CalibrationServiceCutInvoiceDialog
          open={Boolean(selectedCutForInvoice)}
          cut={selectedCutForInvoice}
          isLoading={isOperationalBusy}
          onClose={() => setSelectedCutForInvoice(null)}
          onSubmit={handleMarkCutInvoiced}
        />
      ) : null}
      {selectedCutForDocumentControl ? (
        <CalibrationServiceCutDocumentControlDialog
          open={Boolean(selectedCutForDocumentControl)}
          cut={selectedCutForDocumentControl}
          isLoading={isOperationalBusy}
          onClose={() => setSelectedCutForDocumentControl(null)}
          onSubmit={handleUpdateCutDocumentControl}
        />
      ) : null}
      {isAdjustmentDialogOpen ? (
        <CalibrationServiceAdjustmentDialog
          open={isAdjustmentDialogOpen}
          service={service}
          isLoading={isOperationalBusy}
          onClose={() => setIsAdjustmentDialogOpen(false)}
          onSubmit={handleCreateAdjustment}
        />
      ) : null}
      {selectedAdjustment ? (
        <CalibrationServiceAdjustmentReviewDialog
          open={Boolean(selectedAdjustment)}
          adjustment={selectedAdjustment}
          isLoading={isOperationalBusy}
          onClose={() => setSelectedAdjustment(null)}
          onSubmit={handleReviewAdjustment}
        />
      ) : null}
      {canManageSequenceConfig ? (
        <CalibrationServiceSequenceConfigDialog
          open={isSequenceDialogOpen}
          isLoading={upsertSequenceConfig.isLoading}
          config={sequenceConfig}
          onClose={() => setIsSequenceDialogOpen(false)}
          onSubmit={handleSaveSequenceConfig}
        />
      ) : null}
    </Box>
  )
}

export default CalibrationServiceDetailsPage
