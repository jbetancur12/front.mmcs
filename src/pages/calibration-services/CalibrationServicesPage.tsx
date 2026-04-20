import { useDeferredValue, useEffect, useState } from 'react'
import { useStore } from '@nanostores/react'
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
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined'
import { Toaster, toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import {
  CALIBRATION_SERVICE_ALLOWED_ROLES,
  CALIBRATION_SERVICE_APPROVAL_ROLES,
  CALIBRATION_SERVICE_APPROVAL_COLORS,
  CALIBRATION_SERVICE_APPROVAL_LABELS,
  CALIBRATION_SERVICE_COMMERCIAL_VISIBILITY_ROLES,
  CALIBRATION_SERVICE_EDIT_ROLES,
  CALIBRATION_SERVICE_EXECUTION_ROLES,
  CALIBRATION_SERVICE_ODS_ROLES,
  CALIBRATION_SERVICE_SCHEDULE_ROLES,
  CALIBRATION_SERVICE_SLA_COLORS,
  CALIBRATION_SERVICE_STATUS_COLORS,
  CALIBRATION_SERVICE_STATUS_LABELS,
  CALIBRATION_SERVICE_TECHNICAL_ROLES
} from '../../constants/calibrationServices'
import {
  useCalibrationServiceMutations,
  useCalibrationServiceSequenceConfig,
  useCalibrationServiceSlaConfig,
  useCalibrationServices
} from '../../hooks/useCalibrationServices'
import {
  CalibrationService,
  CalibrationServiceApprovalStatus,
  CalibrationServiceFilters,
  CalibrationServiceScopeType,
  CalibrationServiceSlaConfigPayload,
  CalibrationServiceSlaIndicatorColor,
  CalibrationServiceStatus
} from '../../types/calibrationService'
import { userStore } from '../../store/userStore'
import { useHasRole } from '../../utils/functions'
import CalibrationServiceSequenceConfigDialog from './CalibrationServiceSequenceConfigDialog'
import CalibrationServiceSlaConfigDialog from './CalibrationServiceSlaConfigDialog'

const FILTER_ALL = 'all'
const FILTER_UNASSIGNED = 'unassigned'

const STATUS_OPTIONS: Array<{
  value: CalibrationServiceStatus | typeof FILTER_ALL
  label: string
}> = [
  { value: FILTER_ALL, label: 'Todos los estados' },
  { value: 'draft', label: 'Borrador' },
  { value: 'pending_approval', label: 'Cotización enviada' },
  { value: 'rejected', label: 'Rechazada' },
  { value: 'approved', label: 'Aprobada por cliente' },
  { value: 'ods_issued', label: 'ODS emitida' },
  { value: 'pending_programming', label: 'Pendiente de programación' },
  { value: 'scheduled', label: 'Programada' },
  { value: 'in_execution', label: 'En ejecución' },
  { value: 'technically_completed', label: 'Finalizada técnicamente' },
  { value: 'closed', label: 'Cerrado' }
]

const TECHNICAL_STATUS_OPTIONS: Array<{
  value: CalibrationServiceStatus | typeof FILTER_ALL
  label: string
}> = [
  { value: FILTER_ALL, label: 'Todos los estados técnicos' },
  { value: 'ods_issued', label: 'ODS emitida' },
  { value: 'pending_programming', label: 'Pendiente de programación' },
  { value: 'scheduled', label: 'Programada' },
  { value: 'in_execution', label: 'En ejecución' },
  { value: 'technically_completed', label: 'Finalizada técnicamente' },
  { value: 'closed', label: 'Cerrado' }
]

const APPROVAL_OPTIONS: Array<{
  value: CalibrationServiceApprovalStatus | typeof FILTER_ALL
  label: string
}> = [
  { value: FILTER_ALL, label: 'Toda la respuesta cliente' },
  { value: 'pending', label: 'Pendiente respuesta' },
  { value: 'approved', label: 'Aprobada por cliente' },
  { value: 'rejected', label: 'Rechazada por cliente' }
]

const SCOPE_OPTIONS: Array<{
  value: CalibrationServiceScopeType | typeof FILTER_ALL
  label: string
}> = [
  { value: FILTER_ALL, label: 'Todos los alcances' },
  { value: 'general', label: 'Cliente general' },
  { value: 'site', label: 'Sede específica' }
]

const SLA_OPTIONS: Array<{
  value: CalibrationServiceSlaIndicatorColor | typeof FILTER_ALL
  label: string
}> = [
  { value: FILTER_ALL, label: 'Todo el semáforo' },
  { value: 'green', label: 'En tiempo' },
  { value: 'yellow', label: 'En alerta' },
  { value: 'red', label: 'Vencido' },
  { value: 'gray', label: 'Sin iniciar' },
  { value: 'blue', label: 'Completado' }
]

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
})

const getItemsTotal = (service: CalibrationService) => {
  return (service.items ?? []).reduce((accumulator, item) => {
    const value =
      typeof item.total === 'string' ? parseFloat(item.total) : item.total
    return accumulator + (typeof value === 'number' && Number.isFinite(value) ? value : 0)
  }, 0)
}

const getServiceSiteLabel = (service: CalibrationService) => {
  if (service.scopeType === 'site') {
    return service.customerSite || service.executionSiteName || 'Sede pendiente'
  }

  return service.executionSiteName || 'Alcance general del cliente'
}

const matchesSiteFilter = (service: CalibrationService, siteSearch: string) => {
  if (!siteSearch.trim()) {
    return true
  }

  const haystack = [
    service.customerSite,
    service.executionSiteName,
    service.city,
    service.department
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return haystack.includes(siteSearch.trim().toLowerCase())
}

const hasCustomerChangeRequest = (service: CalibrationService) =>
  service.otherFields?.customerResponseType === 'changes_requested'

const getOperationsDetails = (service: CalibrationService) => {
  const operations = service.otherFields?.operations

  return operations && typeof operations === 'object' && !Array.isArray(operations)
    ? (operations as Record<string, unknown>)
    : {}
}

const getNumberValue = (value: unknown) => {
  const parsedValue = typeof value === 'string' ? parseFloat(value) : value

  return typeof parsedValue === 'number' && Number.isFinite(parsedValue)
    ? parsedValue
    : 0
}

const hasPendingReleasableQuantities = (service: CalibrationService) =>
  (service.items || []).some((item) => {
    if (item.otherFields?.operationalStatus !== 'completed') {
      return false
    }

    const approvedDelta = (service.adjustments || []).reduce((accumulator, adjustment) => {
      if (adjustment.serviceItemId !== item.id) {
        return accumulator
      }

      if (!['approved', 'applied_to_cut'].includes(adjustment.status)) {
        return accumulator
      }

      if (adjustment.changeType === 'extra_item') {
        return accumulator
      }

      return accumulator + getNumberValue(adjustment.differenceQuantity)
    }, 0)
    const effectiveQuantity = Math.max(getNumberValue(item.quantity) + approvedDelta, 0)
    const releasedQuantity = getNumberValue(item.otherFields?.releasedQuantity)

    return Math.max(effectiveQuantity - releasedQuantity, 0) > 0
  })

const getServiceOperationalFocus = (service: CalibrationService) => {
  if (service.status === 'closed') {
    return { label: 'Cierre final completado', color: 'success' as const }
  }

  const cuts = service.cuts || []
  const allCutsInvoiced =
    cuts.length > 0 && cuts.every((cut) => cut.status === 'invoiced')
  const allCutsSent =
    cuts.length > 0 &&
    cuts.every((cut) => cut.otherFields?.documentControl?.status === 'sent')

  if (
    service.status === 'technically_completed' &&
    allCutsSent &&
    !hasPendingReleasableQuantities(service)
  ) {
    return { label: 'Listo para cierre final', color: 'success' as const }
  }

  if (service.status === 'technically_completed' && hasPendingReleasableQuantities(service)) {
    return { label: 'Pendiente corte', color: 'warning' as const }
  }

  if (service.status === 'technically_completed' && allCutsInvoiced) {
    return { label: 'Pendiente documental', color: 'warning' as const }
  }

  if (service.status === 'technically_completed' && cuts.length > 0) {
    return { label: 'Pendiente facturación', color: 'secondary' as const }
  }

  if (service.status === 'technically_completed') {
    return { label: 'Pendiente administrativo', color: 'info' as const }
  }

  return null
}

const CalibrationServicesPage = () => {
  const navigate = useNavigate()
  const $userStore = useStore(userStore)
  const { requestApproval, upsertSequenceConfig, upsertSlaConfig } =
    useCalibrationServiceMutations()
  const canCreateServices = useHasRole([...CALIBRATION_SERVICE_EDIT_ROLES])
  const canTakeApprovalDecision = useHasRole([
    ...CALIBRATION_SERVICE_APPROVAL_ROLES
  ])
  const canIssueOds = useHasRole([...CALIBRATION_SERVICE_ODS_ROLES])
  const canScheduleService = useHasRole([...CALIBRATION_SERVICE_SCHEDULE_ROLES])
  const canRunExecution = useHasRole([...CALIBRATION_SERVICE_EXECUTION_ROLES])
  const canViewModule = useHasRole([...CALIBRATION_SERVICE_ALLOWED_ROLES])
  const canManageSequenceConfig = canCreateServices
  const canManageSlaConfig = useHasRole(['admin', 'super_admin'])
  const hasTechnicalRole = useHasRole([...CALIBRATION_SERVICE_TECHNICAL_ROLES])
  const hasCommercialVisibility = useHasRole([
    ...CALIBRATION_SERVICE_COMMERCIAL_VISIBILITY_ROLES
  ])
  const isTechnicalOnlyView = hasTechnicalRole && !hasCommercialVisibility

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    CalibrationServiceStatus | typeof FILTER_ALL
  >(FILTER_ALL)
  const [approvalFilter, setApprovalFilter] = useState<
    CalibrationServiceApprovalStatus | typeof FILTER_ALL
  >(FILTER_ALL)
  const [scopeFilter, setScopeFilter] = useState<
    CalibrationServiceScopeType | typeof FILTER_ALL
  >(FILTER_ALL)
  const [slaFilter, setSlaFilter] = useState<
    CalibrationServiceSlaIndicatorColor | typeof FILTER_ALL
  >(FILTER_ALL)
  const [siteFilter, setSiteFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState<string>(FILTER_ALL)
  const [metrologistFilter, setMetrologistFilter] = useState<string>(FILTER_ALL)
  const [isSequenceDialogOpen, setIsSequenceDialogOpen] = useState(false)
  const [isSlaConfigDialogOpen, setIsSlaConfigDialogOpen] = useState(false)

  const deferredSearch = useDeferredValue(search)
  const queryFilters: CalibrationServiceFilters = {
    limit: 100
  }

  if (deferredSearch.trim()) {
    queryFilters.search = deferredSearch.trim()
  }

  if (statusFilter !== FILTER_ALL) {
    queryFilters.status = statusFilter
  }

  if (!isTechnicalOnlyView && approvalFilter !== FILTER_ALL) {
    queryFilters.approvalStatus = approvalFilter
  }

  if (customerFilter !== FILTER_ALL) {
    queryFilters.customerId = Number(customerFilter)
  }

  const {
    data: sequenceConfig,
    isLoading: isLoadingSequenceConfig
  } = useCalibrationServiceSequenceConfig(canManageSequenceConfig)
  const { data: slaConfig } = useCalibrationServiceSlaConfig(canManageSlaConfig)

  const { data, isLoading, isError, error, refetch, isFetching } =
    useCalibrationServices(queryFilters)

  useEffect(() => {
    if (!canManageSequenceConfig || isLoadingSequenceConfig) {
      return
    }

    if (!sequenceConfig?.initialized) {
      setIsSequenceDialogOpen(true)
    }
  }, [canManageSequenceConfig, isLoadingSequenceConfig, sequenceConfig?.initialized])

  const services = data?.services ?? []
  const customerOptions = services
    .filter((service) => service.customer?.id)
    .reduce<Array<{ id: string; label: string }>>((accumulator, service) => {
      const customerId = String(service.customer?.id)
      if (accumulator.some((customer) => customer.id === customerId)) {
        return accumulator
      }

      accumulator.push({
        id: customerId,
        label: service.customer?.nombre || service.executionCustomerName || 'Cliente'
      })
      return accumulator
    }, [])
    .sort((left, right) => left.label.localeCompare(right.label, 'es'))
  const metrologistOptions = services
    .reduce<Array<{ id: string; label: string }>>((accumulator, service) => {
      const operations = getOperationsDetails(service)
      const assignedMetrologistName =
        typeof operations.assignedMetrologistName === 'string'
          ? operations.assignedMetrologistName.trim()
          : ''
      const assignedMetrologistEmail =
        typeof operations.assignedMetrologistEmail === 'string'
          ? operations.assignedMetrologistEmail.trim()
          : ''

      if (!assignedMetrologistName) {
        return accumulator
      }

      const optionId = assignedMetrologistEmail || assignedMetrologistName

      if (accumulator.some((metrologist) => metrologist.id === optionId)) {
        return accumulator
      }

      accumulator.push({
        id: optionId,
        label: assignedMetrologistEmail
          ? `${assignedMetrologistName} · ${assignedMetrologistEmail}`
          : assignedMetrologistName
      })

      return accumulator
    }, [])
    .sort((left, right) => left.label.localeCompare(right.label, 'es'))

  const visibleServices = services.filter((service) => {
    const operations = getOperationsDetails(service)
    const assignedMetrologistName =
      typeof operations.assignedMetrologistName === 'string'
        ? operations.assignedMetrologistName.trim()
        : ''
    const assignedMetrologistEmail =
      typeof operations.assignedMetrologistEmail === 'string'
        ? operations.assignedMetrologistEmail.trim()
        : ''

    if (scopeFilter !== FILTER_ALL && service.scopeType !== scopeFilter) {
      return false
    }

    if (
      slaFilter !== FILTER_ALL &&
      (service.slaIndicator?.color || 'gray') !== slaFilter
    ) {
      return false
    }

    if (metrologistFilter === FILTER_UNASSIGNED && assignedMetrologistName) {
      return false
    }

    if (
      metrologistFilter !== FILTER_ALL &&
      metrologistFilter !== FILTER_UNASSIGNED &&
      assignedMetrologistEmail !== metrologistFilter &&
      assignedMetrologistName !== metrologistFilter
    ) {
      return false
    }

    return matchesSiteFilter(service, siteFilter)
  })

  const pendingApprovalCount = visibleServices.filter(
    (service) => service.status === 'pending_approval'
  ).length
  const requestedChangesCount = visibleServices.filter((service) =>
    hasCustomerChangeRequest(service)
  ).length
  const odsIssuedCount = visibleServices.filter(
    (service) => service.status === 'ods_issued'
  ).length
  const pendingProgrammingCount = visibleServices.filter(
    (service) => service.status === 'pending_programming'
  ).length
  const scheduledCount = visibleServices.filter(
    (service) => service.status === 'scheduled'
  ).length
  const inExecutionCount = visibleServices.filter(
    (service) => service.status === 'in_execution'
  ).length
  const technicallyCompletedCount = visibleServices.filter(
    (service) => service.status === 'technically_completed'
  ).length
  const closedCount = visibleServices.filter(
    (service) => service.status === 'closed'
  ).length
  const readyToCloseCount = visibleServices.filter(
    (service) =>
      service.status === 'technically_completed' &&
      service.slaIndicator?.activePhase === 'document_control_closed'
  ).length
  const pendingDocumentControlCount = visibleServices.filter(
    (service) => service.slaIndicator?.activePhase === 'document_control'
  ).length
  const readyForOdsCount = visibleServices.filter(
    (service) =>
      service.status === 'approved' &&
      service.approvalStatus === 'approved' &&
      !service.odsCode
  ).length
  const urgentCount = visibleServices.filter((service) =>
    ['yellow', 'red'].includes(service.slaIndicator?.color || 'gray')
  ).length

  const clearFilters = () => {
    setSearch('')
    setStatusFilter(FILTER_ALL)
    setApprovalFilter(FILTER_ALL)
    setScopeFilter(FILTER_ALL)
    setSlaFilter(FILTER_ALL)
    setSiteFilter('')
    setCustomerFilter(FILTER_ALL)
    setMetrologistFilter(FILTER_ALL)
  }

  const handleRequestApproval = async (service: CalibrationService) => {
    try {
      await requestApproval.mutateAsync({ serviceId: String(service.id) })
      toast.success(`${service.serviceCode} quedó marcado como cotización enviada al cliente.`)
    } catch (requestError) {
      console.error(requestError)
      toast.error('No pudimos marcar la cotización como enviada al cliente.')
    }
  }

  const openServiceDetail = (serviceId: number) => {
    navigate(`/calibration-services/${serviceId}`)
  }

  const openOdsWorkflow = (serviceId: number) => {
    navigate(`/calibration-services/${serviceId}?open=ods`)
  }

  const openScheduleWorkflow = (serviceId: number) => {
    navigate(`/calibration-services/${serviceId}?open=schedule`)
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

  const handleSaveSlaConfig = async (values: CalibrationServiceSlaConfigPayload) => {
    try {
      await upsertSlaConfig.mutateAsync(values)
      toast.success('Los tiempos SLA quedaron actualizados.')
      setIsSlaConfigDialogOpen(false)
      void refetch()
    } catch (configError) {
      console.error(configError)
      toast.error('No pudimos guardar los tiempos SLA.')
    }
  }

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

  if (isError) {
    return (
      <Box p={3}>
        <Alert severity='error'>
          No pudimos cargar los servicios de calibración.
          {error instanceof Error ? ` ${error.message}` : ''}
        </Alert>
      </Box>
    )
  }

  if (!canViewModule) {
    return (
      <Box p={3}>
        <Alert severity='warning'>
          Tu rol actual no tiene acceso a esta bandeja.
        </Alert>
      </Box>
    )
  }

  return (
    <Box p={{ xs: 2, md: 3 }}>
      <Toaster position='top-center' />
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent='space-between'
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={2}
        mb={3}
      >
        <Box>
          <Typography variant='h4' fontWeight={700}>
            Servicios de calibración
          </Typography>
          <Typography variant='body1' color='text.secondary' sx={{ mt: 1 }}>
            {isTechnicalOnlyView
              ? 'Bandeja técnica para ODS, programación y seguimiento operativo del servicio.'
              : 'Bandeja operativa para cotización, respuesta del cliente, emisión de ODS y seguimiento base del servicio.'}
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          {canManageSlaConfig ? (
            <Button
              variant='outlined'
              startIcon={<SettingsOutlinedIcon />}
              onClick={() => setIsSlaConfigDialogOpen(true)}
            >
              Configuración SLA
            </Button>
          ) : null}
          <Button
            variant='outlined'
            startIcon={<RefreshOutlinedIcon />}
            onClick={() => {
              void refetch()
            }}
            disabled={isFetching}
          >
            Actualizar
          </Button>
          {canCreateServices ? (
            <Button
              variant='contained'
              startIcon={<AddIcon />}
              onClick={() => navigate('/calibration-services/new')}
              disabled={canManageSequenceConfig && !sequenceConfig?.initialized}
            >
              Nuevo servicio
            </Button>
          ) : null}
        </Stack>
      </Stack>

      {canManageSequenceConfig && sequenceConfig && !sequenceConfig.initialized ? (
        <Alert
          severity='warning'
          sx={{ mb: 3 }}
          action={
            <Button color='inherit' size='small' onClick={() => setIsSequenceDialogOpen(true)}>
              Configurar
            </Button>
          }
        >
          Antes de crear la primera oferta o emitir la primera ODS, define los
          consecutivos iniciales del módulo.
        </Alert>
      ) : null}

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent>
              <Typography variant='overline' color='text.secondary' fontWeight={600} sx={{ letterSpacing: 1 }}>
                Servicios visibles
              </Typography>
              <Typography variant='h3' fontWeight={800} sx={{ mt: 1, mb: 1, color: 'primary.main' }}>
                {visibleServices.length}
              </Typography>
              <Typography variant='body2' color='text.secondary' fontWeight={500}>
                Total cargados: {data?.totalItems ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent>
              <Typography variant='overline' color='text.secondary' fontWeight={600} sx={{ letterSpacing: 1 }}>
                {isTechnicalOnlyView ? 'ODS emitidas' : 'Pendientes respuesta'}
              </Typography>
              <Typography variant='h3' fontWeight={800} sx={{ mt: 1, mb: 1 }}>
                {isTechnicalOnlyView ? odsIssuedCount : pendingApprovalCount}
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.3 }}>
                {isTechnicalOnlyView
                  ? 'Servicios ya liberados al frente técnico'
                  : 'Cotizaciones enviadas esperando respuesta'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent>
              <Typography variant='overline' color='text.secondary' fontWeight={600} sx={{ letterSpacing: 1 }}>
                {isTechnicalOnlyView ? 'Requieren agenda' : 'Listos para ODS'}
              </Typography>
              <Typography variant='h3' fontWeight={800} sx={{ mt: 1, mb: 1 }}>
                {isTechnicalOnlyView ? pendingProgrammingCount : readyForOdsCount}
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.3 }}>
                {isTechnicalOnlyView
                  ? 'Servicios que requieren coordinación'
                  : 'Aprobados y pendientes de emisión ODS'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent>
              <Typography variant='overline' color='error.main' fontWeight={600} sx={{ letterSpacing: 1 }}>
                En riesgo o vencidos
              </Typography>
              <Typography variant='h3' fontWeight={800} sx={{ mt: 1, mb: 1, color: urgentCount > 0 ? 'error.main' : 'text.primary' }}>
                {urgentCount}
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.3 }}>
                {isTechnicalOnlyView
                  ? `${scheduledCount} prog · ${inExecutionCount} ejec · ${technicallyCompletedCount} fin · ${closedCount} cerrados`
                  : `${requestedChangesCount} con cambios · ${pendingDocumentControlCount} documentales`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={6}>
          <Alert severity='info'>
            {pendingDocumentControlCount > 0
              ? `${pendingDocumentControlCount} servicios todavía requieren control documental o envío por corte.`
              : 'No hay servicios con frente documental pendiente en la bandeja actual.'}
          </Alert>
        </Grid>
        <Grid item xs={12} md={6}>
          <Alert severity='success'>
            {readyToCloseCount > 0
              ? `${readyToCloseCount} servicios ya están listos para cierre final.`
              : 'Todavía no hay servicios listos para cierre final en la bandeja actual.'}
          </Alert>
        </Grid>
      </Grid>

      <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent='space-between'
            spacing={2}
            mb={3}
          >
            <Box>
              <Typography variant='h6' fontWeight={800}>
                Filtros operativos
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                Reduce ruido y enfócate en los servicios que sí requieren acción.
              </Typography>
            </Box>
            <Button variant='outlined' color="inherit" onClick={clearFilters} sx={{ borderRadius: 2 }}>
              Limpiar filtros
            </Button>
          </Stack>

          <Grid container spacing={2.5}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label='Buscar servicio o cliente'
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder='Código, cliente, ODS, contacto...'
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label='Estado'
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as CalibrationServiceStatus | typeof FILTER_ALL
                  )
                }
              >
                {(isTechnicalOnlyView
                  ? TECHNICAL_STATUS_OPTIONS
                  : STATUS_OPTIONS
                ).map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            {!isTechnicalOnlyView ? (
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label='Respuesta cliente'
                  value={approvalFilter}
                  onChange={(event) =>
                    setApprovalFilter(
                      event.target.value as
                        | CalibrationServiceApprovalStatus
                        | typeof FILTER_ALL
                    )
                  }
                >
                  {APPROVAL_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            ) : null}
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label='Cliente'
                value={customerFilter}
                onChange={(event) => setCustomerFilter(event.target.value)}
              >
                <MenuItem value={FILTER_ALL}>Todos los clientes</MenuItem>
                {customerOptions.map((customer) => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {customer.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            {!isTechnicalOnlyView ? (
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label='Metrólogo asignado'
                  value={metrologistFilter}
                  onChange={(event) => setMetrologistFilter(event.target.value)}
                >
                  <MenuItem value={FILTER_ALL}>Todos los metrólogos</MenuItem>
                  <MenuItem value={FILTER_UNASSIGNED}>Sin asignar</MenuItem>
                  {metrologistOptions.map((metrologist) => (
                    <MenuItem key={metrologist.id} value={metrologist.id}>
                      {metrologist.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            ) : null}
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label='Alcance'
                value={scopeFilter}
                onChange={(event) =>
                  setScopeFilter(
                    event.target.value as
                      | CalibrationServiceScopeType
                      | typeof FILTER_ALL
                  )
                }
              >
                {SCOPE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label='Semáforo'
                value={slaFilter}
                onChange={(event) =>
                  setSlaFilter(
                    event.target.value as
                      | CalibrationServiceSlaIndicatorColor
                      | typeof FILTER_ALL
                  )
                }
              >
                {SLA_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Sede o ubicación'
                value={siteFilter}
                onChange={(event) => setSiteFilter(event.target.value)}
                placeholder='Filtra por sede, ciudad o departamento'
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Stack spacing={2}>
        {visibleServices.length === 0 ? (
          <Alert severity='info'>
            No encontramos servicios con los filtros actuales.
          </Alert>
        ) : (
          visibleServices.map((service) => {
            const serviceOperationalFocus = getServiceOperationalFocus(service)
            const operations = getOperationsDetails(service)
            const assignedMetrologistName =
              typeof operations.assignedMetrologistName === 'string'
                ? operations.assignedMetrologistName
                : typeof operations.operationalResponsibleName === 'string'
                  ? operations.operationalResponsibleName
                  : ''
            const assignedMetrologistEmail =
              typeof operations.assignedMetrologistEmail === 'string'
                ? operations.assignedMetrologistEmail
                : ''
            const isAssignedToCurrentMetrologist =
              Boolean(
                hasTechnicalRole &&
                  $userStore.email &&
                  assignedMetrologistEmail &&
                  assignedMetrologistEmail.toLowerCase() ===
                    $userStore.email.toLowerCase()
              )
            const shouldShowOperationalFocusBadge =
              serviceOperationalFocus &&
              serviceOperationalFocus.label !== service.slaIndicator?.label
            const canEdit =
              canCreateServices &&
              service.status === 'draft'
            const canRequestApproval =
              canCreateServices && service.status === 'draft'
            const canResolveApproval =
              canTakeApprovalDecision && service.status === 'pending_approval'
            const canOpenOds =
              canIssueOds &&
              service.status === 'approved' &&
              service.approvalStatus === 'approved' &&
              !service.odsCode
            const canOpenScheduling =
              canScheduleService &&
              ['ods_issued', 'pending_programming'].includes(service.status)
            const canManageExecution =
              canRunExecution &&
              ['scheduled', 'in_execution'].includes(service.status)

            return (
              <Card key={service.id} sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Stack
                    direction={{ xs: 'column', xl: 'row' }}
                    justifyContent='space-between'
                    spacing={2}
                  >
                    <Box flex={1}>
                      <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={1}
                        alignItems={{ xs: 'flex-start', md: 'center' }}
                        mb={1.5}
                        flexWrap='wrap'
                      >
                        <Typography variant='h6' fontWeight={700}>
                          {service.serviceCode}
                        </Typography>
                        <Chip
                          size='small'
                          color={CALIBRATION_SERVICE_STATUS_COLORS[service.status]}
                          label={CALIBRATION_SERVICE_STATUS_LABELS[service.status]}
                        />
                        {!isTechnicalOnlyView ? (
                          <Chip
                            size='small'
                            color={
                              CALIBRATION_SERVICE_APPROVAL_COLORS[
                                service.approvalStatus
                              ]
                            }
                            label={
                              CALIBRATION_SERVICE_APPROVAL_LABELS[
                                service.approvalStatus
                              ]
                            }
                          />
                        ) : null}
                        <Chip
                          size='small'
                          color={
                            CALIBRATION_SERVICE_SLA_COLORS[
                              service.slaIndicator?.color || 'gray'
                            ]
                          }
                          label={service.slaIndicator?.label || 'SLA no iniciado'}
                        />
                        {['yellow', 'red'].includes(
                          service.slaIndicator?.color || 'gray'
                        ) ? (
                          <Chip
                            size='small'
                            icon={
                              service.slaIndicator?.color === 'red' ? (
                                <ReportProblemOutlinedIcon />
                              ) : (
                                <WarningAmberOutlinedIcon />
                              )
                            }
                            color={
                              service.slaIndicator?.color === 'red'
                                ? 'error'
                                : 'warning'
                            }
                            label={
                              service.slaIndicator?.color === 'red'
                                ? 'Alerta vencida'
                                : 'Alerta activa'
                            }
                          />
                        ) : null}
                        {shouldShowOperationalFocusBadge ? (
                          <Chip
                            size='small'
                            color={serviceOperationalFocus.color}
                            variant='outlined'
                            label={serviceOperationalFocus.label}
                          />
                        ) : null}
                        {service.odsCode ? (
                          <Chip
                            size='small'
                            variant='outlined'
                            label={service.odsCode}
                          />
                        ) : null}
                        {!isTechnicalOnlyView && hasCustomerChangeRequest(service) ? (
                          <Chip
                            size='small'
                            color='warning'
                            variant='outlined'
                            label='Cliente pidió modificación'
                          />
                        ) : null}
                        {assignedMetrologistName ? (
                          <Chip
                            size='small'
                            color={isAssignedToCurrentMetrologist ? 'success' : 'default'}
                            variant={isAssignedToCurrentMetrologist ? 'filled' : 'outlined'}
                            label={
                              isAssignedToCurrentMetrologist
                                ? 'Asignado a ti'
                                : `Metrólogo: ${assignedMetrologistName}`
                            }
                          />
                        ) : null}
                      </Stack>

                      <Typography variant='body1' fontWeight={700}>
                        {service.customer?.nombre ||
                          service.executionCustomerName ||
                          'Cliente pendiente'}
                      </Typography>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ mt: 0.5 }}
                      >
                        {service.scopeType === 'site'
                          ? `Sede: ${getServiceSiteLabel(service)}`
                          : `Alcance general · ${getServiceSiteLabel(service)}`}
                      </Typography>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ mt: 1 }}
                      >
                        {hasCustomerChangeRequest(service)
                          ? 'La cotización volvió a edición porque el cliente pidió cambios.'
                          : service.slaIndicator?.message ||
                            'Todavía no hay una alerta operativa activa.'}
                      </Typography>
                      {assignedMetrologistName ? (
                        <Typography
                          variant='body2'
                          color='text.secondary'
                          sx={{ mt: 0.75 }}
                        >
                          Responsable metrológico:{' '}
                          <strong>{assignedMetrologistName}</strong>
                          {assignedMetrologistEmail ? ` · ${assignedMetrologistEmail}` : ''}
                        </Typography>
                      ) : null}

                      <Divider sx={{ my: 2 }} />

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant='caption' color='text.secondary'>
                            Ítems del servicio
                          </Typography>
                          <Typography variant='body1' fontWeight={600}>
                            {service.items?.length ?? 0}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant='caption' color='text.secondary'>
                            {isTechnicalOnlyView ? 'ODS' : 'Total estimado'}
                          </Typography>
                          <Typography variant='body1' fontWeight={600}>
                            {isTechnicalOnlyView
                              ? service.odsCode || 'Pendiente'
                              : currencyFormatter.format(getItemsTotal(service))}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant='caption' color='text.secondary'>
                            Contacto
                          </Typography>
                          <Typography variant='body1' fontWeight={600}>
                            {service.contactName || 'Sin contacto'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant='caption' color='text.secondary'>
                            Actualizado
                          </Typography>
                          <Typography variant='body1' fontWeight={600}>
                            {new Date(service.updatedAt).toLocaleDateString('es-CO')}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>

                    <Stack
                      direction={{ xs: 'column', sm: 'row', xl: 'column' }}
                      spacing={1}
                      justifyContent='flex-start'
                      alignItems={{ xs: 'stretch', sm: 'flex-start' }}
                    >
                      <Button
                        variant='outlined'
                        startIcon={<VisibilityOutlinedIcon />}
                        onClick={() => openServiceDetail(service.id)}
                      >
                        Ver detalle
                      </Button>
                      {canEdit ? (
                        <Button
                          variant='outlined'
                          startIcon={<EditOutlinedIcon />}
                          onClick={() =>
                            navigate(`/calibration-services/${service.id}/edit`)
                          }
                        >
                          Editar
                        </Button>
                      ) : null}
                      {canRequestApproval ? (
                        <Button
                          variant='contained'
                          startIcon={<SendOutlinedIcon />}
                          onClick={() => void handleRequestApproval(service)}
                          disabled={requestApproval.isLoading}
                        >
                          Enviar cotización
                        </Button>
                      ) : null}
                      {canResolveApproval ? (
                        <Button
                          variant='contained'
                          color='warning'
                          startIcon={<WarningAmberOutlinedIcon />}
                          onClick={() => openServiceDetail(service.id)}
                        >
                          Registrar respuesta cliente
                        </Button>
                      ) : null}
                      {canOpenOds ? (
                        <Button
                          variant='contained'
                          color='info'
                          startIcon={<DescriptionOutlinedIcon />}
                          onClick={() => openOdsWorkflow(service.id)}
                        >
                          Emitir ODS
                        </Button>
                      ) : null}
                      {canOpenScheduling ? (
                        <Button
                          variant='contained'
                          color='primary'
                          startIcon={<DescriptionOutlinedIcon />}
                          onClick={() => openScheduleWorkflow(service.id)}
                        >
                          Programar
                        </Button>
                      ) : null}
                      {canManageExecution ? (
                        <Button
                          variant='outlined'
                          color='success'
                          startIcon={<VisibilityOutlinedIcon />}
                          onClick={() => openServiceDetail(service.id)}
                        >
                          Operación
                        </Button>
                      ) : null}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            )
          })
        )}
      </Stack>
      {canManageSequenceConfig ? (
        <CalibrationServiceSequenceConfigDialog
          open={isSequenceDialogOpen}
          isLoading={upsertSequenceConfig.isLoading}
          config={sequenceConfig}
          onClose={() => setIsSequenceDialogOpen(false)}
          onSubmit={handleSaveSequenceConfig}
        />
      ) : null}
      {canManageSlaConfig ? (
        <CalibrationServiceSlaConfigDialog
          open={isSlaConfigDialogOpen}
          isLoading={upsertSlaConfig.isLoading}
          config={slaConfig}
          onClose={() => setIsSlaConfigDialogOpen(false)}
          onSubmit={handleSaveSlaConfig}
        />
      ) : null}
    </Box>
  )
}

export default CalibrationServicesPage
