import { useDeferredValue, useEffect, useState } from 'react'
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
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
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
  useCalibrationServices
} from '../../hooks/useCalibrationServices'
import {
  CalibrationService,
  CalibrationServiceApprovalStatus,
  CalibrationServiceFilters,
  CalibrationServiceScopeType,
  CalibrationServiceSlaIndicatorColor,
  CalibrationServiceStatus
} from '../../types/calibrationService'
import { useHasRole } from '../../utils/functions'
import CalibrationServiceSequenceConfigDialog from './CalibrationServiceSequenceConfigDialog'

const FILTER_ALL = 'all'

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
  { value: 'technically_completed', label: 'Finalizada técnicamente' }
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
  { value: 'technically_completed', label: 'Finalizada técnicamente' }
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

const CalibrationServicesPage = () => {
  const navigate = useNavigate()
  const { requestApproval, upsertSequenceConfig } =
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
  const [isSequenceDialogOpen, setIsSequenceDialogOpen] = useState(false)

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

  const visibleServices = services.filter((service) => {
    if (scopeFilter !== FILTER_ALL && service.scopeType !== scopeFilter) {
      return false
    }

    if (
      slaFilter !== FILTER_ALL &&
      (service.slaIndicator?.color || 'gray') !== slaFilter
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
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant='overline' color='text.secondary'>
                Servicios visibles
              </Typography>
              <Typography variant='h4' fontWeight={700}>
                {visibleServices.length}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Total cargados: {data?.totalItems ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant='overline' color='text.secondary'>
                {isTechnicalOnlyView ? 'ODS emitidas' : 'Pendientes respuesta cliente'}
              </Typography>
              <Typography variant='h4' fontWeight={700}>
                {isTechnicalOnlyView ? odsIssuedCount : pendingApprovalCount}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {isTechnicalOnlyView
                  ? 'Servicios ya liberados al frente técnico'
                  : 'Cotizaciones enviadas que aún esperan respuesta del cliente'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant='overline' color='text.secondary'>
                {isTechnicalOnlyView ? 'Pendientes programación' : 'Listos para ODS'}
              </Typography>
              <Typography variant='h4' fontWeight={700}>
                {isTechnicalOnlyView ? pendingProgrammingCount : readyForOdsCount}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {isTechnicalOnlyView
                  ? 'Requieren agenda o coordinación operativa'
                  : 'Con aprobación del cliente y pendientes de emisión'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant='overline' color='text.secondary'>
                En riesgo o vencidos
              </Typography>
              <Typography variant='h4' fontWeight={700}>
                {urgentCount}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {isTechnicalOnlyView
                  ? `${scheduledCount} programados · ${inExecutionCount} en ejecución · ${technicallyCompletedCount} finalizados`
                  : `${requestedChangesCount} con solicitud de modificación`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent='space-between'
            spacing={2}
            mb={2}
          >
            <Box>
              <Typography variant='h6' fontWeight={700}>
                Filtros operativos
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Reduce ruido y enfócate en los servicios que sí requieren acción.
              </Typography>
            </Box>
            <Button variant='text' onClick={clearFilters}>
              Limpiar filtros
            </Button>
          </Stack>

          <Grid container spacing={2}>
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
    </Box>
  )
}

export default CalibrationServicesPage
