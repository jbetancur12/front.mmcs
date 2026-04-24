import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useStore } from '@nanostores/react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import AddBusinessOutlinedIcon from '@mui/icons-material/AddBusinessOutlined'
import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ExpandLessOutlinedIcon from '@mui/icons-material/ExpandLessOutlined'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined'
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined'
import ViewKanbanOutlinedIcon from '@mui/icons-material/ViewKanbanOutlined'
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined'
import { alpha } from '@mui/material/styles'
import { Toaster, toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import {
  CALIBRATION_SERVICE_ALLOWED_ROLES,
  CALIBRATION_SERVICE_ANALYTICS_ROLES,
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
const CALIBRATION_SERVICES_VIEW_STORAGE_KEY = 'calibrationServicesViewMode'
const CALIBRATION_SERVICES_KANBAN_COLLAPSED_STORAGE_KEY =
  'calibrationServicesKanbanCollapsedColumns'

type CalibrationServicesViewMode = 'list' | 'kanban'

type KanbanColumnDefinition = {
  key: string
  title: string
  description: string
  accent: string
}

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

const ui = {
  green: '#10b981',
  greenDark: '#059669',
  greenLight: '#f0fdf4',
  success: '#059669',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  text: '#111827',
  textSecondary: '#4b5563',
  muted: '#9ca3af',
  border: '#e5e7eb',
  surface: '#f3f4f6', // Slightly darker to make glass cards pop
  white: '#ffffff',
  glass: 'rgba(255, 255, 255, 0.75)'
}

const softCardSx = {
  background: ui.glass,
  backdropFilter: 'blur(12px)',
  border: `1px solid rgba(255, 255, 255, 0.5)`,
  borderRadius: '16px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  animation: 'fadeUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) both',
  '&:hover': {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.1), 0 4px 6px -2px rgba(16, 185, 129, 0.05)',
    transform: 'translateY(-2px)'
  }
}

const primaryButtonSx = {
  background: `linear-gradient(135deg, ${ui.green} 0%, ${ui.greenDark} 100%)`,
  borderRadius: '12px',
  textTransform: 'none',
  fontWeight: 700,
  color: ui.white,
  boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2), 0 2px 4px -1px rgba(16, 185, 129, 0.1)',
  minHeight: 44,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(rgba(255,255,255,0.2), transparent)',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  '&:hover': {
    background: `linear-gradient(135deg, ${ui.green} 0%, #047857 100%)`,
    boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3), 0 4px 6px -2px rgba(16, 185, 129, 0.1)',
    transform: 'translateY(-1px)'
  },
  '&:hover::after': {
    opacity: 1
  }
}

const secondaryButtonSx = {
  borderRadius: '12px',
  textTransform: 'none',
  fontWeight: 700,
  minHeight: 44,
  borderColor: ui.border,
  color: ui.textSecondary,
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(8px)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  '&:hover': {
    borderColor: ui.green,
    color: ui.greenDark,
    backgroundColor: ui.greenLight,
    boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.1)',
    transform: 'translateY(-1px)'
  }
}

const getStoredViewMode = (): CalibrationServicesViewMode => {
  if (typeof window === 'undefined') {
    return 'list'
  }

  const storedValue = window.localStorage.getItem(
    CALIBRATION_SERVICES_VIEW_STORAGE_KEY
  )

  return storedValue === 'kanban' ? 'kanban' : 'list'
}

const getStoredCollapsedKanbanColumns = (): string[] => {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const rawValue = window.localStorage.getItem(
      CALIBRATION_SERVICES_KANBAN_COLLAPSED_STORAGE_KEY
    )

    if (!rawValue) {
      return []
    }

    const parsedValue = JSON.parse(rawValue)
    return Array.isArray(parsedValue)
      ? parsedValue.filter((value): value is string => typeof value === 'string')
      : []
  } catch (_error) {
    return []
  }
}

const getSlaVisualTone = (color?: CalibrationServiceSlaIndicatorColor) => {
  switch (color) {
    case 'red':
      return {
        accent: '#ef4444',
        background: 'linear-gradient(180deg, rgba(239,68,68,0.14) 0%, rgba(255,255,255,0.96) 28%)',
        border: 'rgba(239,68,68,0.24)',
        glow: '0 6px 18px rgba(239,68,68,0.12)'
      }
    case 'yellow':
      return {
        accent: '#f59e0b',
        background: 'linear-gradient(180deg, rgba(245,158,11,0.14) 0%, rgba(255,255,255,0.96) 28%)',
        border: 'rgba(245,158,11,0.24)',
        glow: '0 6px 18px rgba(245,158,11,0.12)'
      }
    case 'green':
      return {
        accent: '#10b981',
        background: 'linear-gradient(180deg, rgba(16,185,129,0.1) 0%, rgba(255,255,255,0.96) 28%)',
        border: 'rgba(16,185,129,0.18)',
        glow: '0 6px 18px rgba(16,185,129,0.08)'
      }
    case 'blue':
      return {
        accent: '#3b82f6',
        background: 'linear-gradient(180deg, rgba(59,130,246,0.1) 0%, rgba(255,255,255,0.96) 28%)',
        border: 'rgba(59,130,246,0.18)',
        glow: '0 6px 18px rgba(59,130,246,0.08)'
      }
    default:
      return {
        accent: '#94a3b8',
        background: 'linear-gradient(180deg, rgba(148,163,184,0.08) 0%, rgba(255,255,255,0.96) 28%)',
        border: 'rgba(148,163,184,0.16)',
        glow: '0 4px 12px rgba(148,163,184,0.08)'
      }
  }
}

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

const getKanbanColumns = (
  isTechnicalOnlyView: boolean
): KanbanColumnDefinition[] => {
  if (isTechnicalOnlyView) {
    return [
      {
        key: 'pre_operational',
        title: 'Preoperativo',
        description: 'Aún no liberados al frente técnico',
        accent: '#64748b'
      },
      {
        key: 'ods_issued',
        title: 'ODS emitida',
        description: 'Listos para entrar a coordinación',
        accent: '#3b82f6'
      },
      {
        key: 'pending_programming',
        title: 'Pendiente programación',
        description: 'Falta agenda o asignación operativa',
        accent: '#f59e0b'
      },
      {
        key: 'scheduled',
        title: 'Programada',
        description: 'Con agenda confirmada',
        accent: '#8b5cf6'
      },
      {
        key: 'in_execution',
        title: 'En ejecución',
        description: 'Trabajo activo en campo o laboratorio',
        accent: '#10b981'
      },
      {
        key: 'technically_completed',
        title: 'Finalizada técnicamente',
        description: 'Pendiente frente administrativo o documental',
        accent: '#0ea5e9'
      },
      {
        key: 'closed',
        title: 'Cerrada',
        description: 'Servicio completamente terminado',
        accent: '#059669'
      }
    ]
  }

  return [
    {
      key: 'draft',
      title: 'Borradores',
      description: 'Cotizaciones en preparación',
      accent: '#64748b'
    },
    {
      key: 'pending_customer',
      title: 'Pendiente cliente',
      description: 'Esperando respuesta del cliente',
      accent: '#f59e0b'
    },
    {
      key: 'changes_requested',
      title: 'Con cambios',
      description: 'Requieren ajuste comercial o técnico',
      accent: '#ef4444'
    },
    {
      key: 'ready_for_ods',
      title: 'Lista para ODS',
      description: 'Aprobadas y listas para liberar',
      accent: '#10b981'
    },
    {
      key: 'technical_flow',
      title: 'Flujo técnico',
      description: 'ODS, programación, ejecución y cierre técnico',
      accent: '#3b82f6'
    },
    {
      key: 'closed',
      title: 'Cerradas',
      description: 'Servicios completados',
      accent: '#059669'
    }
  ]
}

const getKanbanColumnKey = (
  service: CalibrationService,
  isTechnicalOnlyView: boolean
) => {
  if (isTechnicalOnlyView) {
    switch (service.status) {
      case 'ods_issued':
        return 'ods_issued'
      case 'pending_programming':
        return 'pending_programming'
      case 'scheduled':
        return 'scheduled'
      case 'in_execution':
        return 'in_execution'
      case 'technically_completed':
        return 'technically_completed'
      case 'closed':
        return 'closed'
      default:
        return 'pre_operational'
    }
  }

  if (service.status === 'draft') {
    return 'draft'
  }

  if (service.status === 'pending_approval') {
    return 'pending_customer'
  }

  if (
    service.status === 'rejected' ||
    service.approvalStatus === 'rejected' ||
    hasCustomerChangeRequest(service)
  ) {
    return 'changes_requested'
  }

  if (service.status === 'approved') {
    return 'ready_for_ods'
  }

  if (service.status === 'closed') {
    return 'closed'
  }

  return 'technical_flow'
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
  const canViewAnalytics = useHasRole([...CALIBRATION_SERVICE_ANALYTICS_ROLES])
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
  const [areFiltersOpen, setAreFiltersOpen] = useState(false)
  const [viewMode, setViewMode] = useState<CalibrationServicesViewMode>(
    getStoredViewMode
  )
  const [showOnlyMyLoad, setShowOnlyMyLoad] = useState(false)
  const [collapsedKanbanColumns, setCollapsedKanbanColumns] = useState<string[]>(
    getStoredCollapsedKanbanColumns
  )

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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(
      CALIBRATION_SERVICES_VIEW_STORAGE_KEY,
      viewMode
    )
  }, [viewMode])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(
      CALIBRATION_SERVICES_KANBAN_COLLAPSED_STORAGE_KEY,
      JSON.stringify(collapsedKanbanColumns)
    )
  }, [collapsedKanbanColumns])

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

    if (showOnlyMyLoad) {
      const currentUserEmail = $userStore.email?.trim().toLowerCase()
      if (!currentUserEmail || assignedMetrologistEmail.toLowerCase() !== currentUserEmail) {
        return false
      }
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
  const activeFiltersCount = [
    search.trim(),
    statusFilter !== FILTER_ALL,
    !isTechnicalOnlyView && approvalFilter !== FILTER_ALL,
    scopeFilter !== FILTER_ALL,
    slaFilter !== FILTER_ALL,
    siteFilter.trim(),
    customerFilter !== FILTER_ALL,
    metrologistFilter !== FILTER_ALL,
    showOnlyMyLoad
  ].filter(Boolean).length

  const clearFilters = () => {
    setSearch('')
    setStatusFilter(FILTER_ALL)
    setApprovalFilter(FILTER_ALL)
    setScopeFilter(FILTER_ALL)
    setSlaFilter(FILTER_ALL)
    setSiteFilter('')
    setCustomerFilter(FILTER_ALL)
    setMetrologistFilter(FILTER_ALL)
    setShowOnlyMyLoad(false)
  }

  const kanbanColumns = useMemo(
    () => getKanbanColumns(isTechnicalOnlyView),
    [isTechnicalOnlyView]
  )

  const kanbanServices = useMemo(() => {
    const groupedServices = visibleServices.reduce<Record<string, CalibrationService[]>>(
      (accumulator, service) => {
        const columnKey = getKanbanColumnKey(service, isTechnicalOnlyView)

        if (!accumulator[columnKey]) {
          accumulator[columnKey] = []
        }

        accumulator[columnKey].push(service)
        return accumulator
      },
      {}
    )

    return kanbanColumns.map((column) => ({
      ...column,
      services: (groupedServices[column.key] || []).sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
      )
    }))
  }, [isTechnicalOnlyView, kanbanColumns, visibleServices])

  const currentUserHasAssignedLoad = useMemo(() => {
    const currentUserEmail = $userStore.email?.trim().toLowerCase()

    if (!currentUserEmail) {
      return false
    }

    return services.some((service) => {
      const operations = getOperationsDetails(service)
      const assignedMetrologistEmail =
        typeof operations.assignedMetrologistEmail === 'string'
          ? operations.assignedMetrologistEmail.trim().toLowerCase()
          : ''

      return assignedMetrologistEmail === currentUserEmail
    })
  }, [$userStore.email, services])

  const myLoadCount = useMemo(() => {
    const currentUserEmail = $userStore.email?.trim().toLowerCase()

    if (!currentUserEmail) {
      return 0
    }

    return services.filter((service) => {
      const operations = getOperationsDetails(service)
      const assignedMetrologistEmail =
        typeof operations.assignedMetrologistEmail === 'string'
          ? operations.assignedMetrologistEmail.trim().toLowerCase()
          : ''

      return assignedMetrologistEmail === currentUserEmail
    }).length
  }, [$userStore.email, services])

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
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: ui.surface,
        px: { xs: 2, md: 3 },
        py: { xs: 2, md: 3 },
        color: ui.text,
        '@keyframes fadeUp': {
          from: { opacity: 0, transform: 'translateY(15px)' },
          to: { opacity: 1, transform: 'translateY(0)' }
        }
      }}
    >
      <Toaster position='top-center' />

      {/* ── Header banner (inspirado en /calibraciones/certificados) ── */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
          borderRadius: '20px',
          p: { xs: 3, md: 4 },
          mb: 3,
          position: 'relative',
          overflow: 'hidden',
          animation: 'fadeUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) both',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '40%',
            height: '100%',
            background: 'radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.12) 0%, transparent 70%)',
            pointerEvents: 'none'
          }
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent='space-between'
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
        >
          <Box>
            <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 1 }}>
              <Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                Metromédica
              </Typography>
              <Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.4)' }}>
                /
              </Typography>
              <Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                Servicios
              </Typography>
            </Stack>
            <Typography
              variant='h4'
              fontWeight={800}
              sx={{ color: '#fff', lineHeight: 1.2, letterSpacing: '-0.02em' }}
            >
              Servicios de calibración
            </Typography>
            <Typography
              variant='body2'
              sx={{ mt: 1, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, maxWidth: 780 }}
            >
              {isTechnicalOnlyView
                ? 'Bandeja técnica para ODS, programación y seguimiento operativo del servicio.'
                : 'Bandeja operativa para cotización, respuesta del cliente, emisión de ODS y seguimiento base del servicio.'}
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            {canViewAnalytics ? (
              <Button
                variant='outlined'
                startIcon={<AnalyticsOutlinedIcon />}
                onClick={() => navigate('/calibration-services/analytics')}
                sx={{ ...secondaryButtonSx, borderColor: 'rgba(255,255,255,0.35)', color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', '&:hover': { borderColor: '#fff', color: '#fff', backgroundColor: 'rgba(255,255,255,0.2)' } }}
              >
                Analíticas
              </Button>
            ) : null}
            {canCreateServices ? (
              <Button
                variant='outlined'
                startIcon={<AddBusinessOutlinedIcon />}
                onClick={() => navigate('/calibration-services/customers')}
                sx={{ ...secondaryButtonSx, borderColor: 'rgba(255,255,255,0.35)', color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', '&:hover': { borderColor: '#fff', color: '#fff', backgroundColor: 'rgba(255,255,255,0.2)' } }}
              >
                Clientes
              </Button>
            ) : null}
            {canManageSlaConfig ? (
              <Button
                variant='outlined'
                startIcon={<SettingsOutlinedIcon />}
                onClick={() => setIsSlaConfigDialogOpen(true)}
                sx={{ ...secondaryButtonSx, borderColor: 'rgba(255,255,255,0.35)', color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', '&:hover': { borderColor: '#fff', color: '#fff', backgroundColor: 'rgba(255,255,255,0.2)' } }}
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
              sx={{ ...secondaryButtonSx, borderColor: 'rgba(255,255,255,0.35)', color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', '&:hover': { borderColor: '#fff', color: '#fff', backgroundColor: 'rgba(255,255,255,0.2)' } }}
            >
              Actualizar
            </Button>
            {canCreateServices ? (
              <Button
                variant='contained'
                startIcon={<AddIcon />}
                onClick={() => navigate('/calibration-services/new')}
                disabled={canManageSequenceConfig && !sequenceConfig?.initialized}
                sx={{ ...primaryButtonSx, background: '#fff', color: ui.greenDark, '&:hover': { background: 'rgba(255,255,255,0.9)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.15)' } }}
              >
                Nuevo servicio
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </Box>

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
          <Card elevation={0} sx={{ ...softCardSx, height: '100%' }}>
            <CardContent sx={{ p: 2 }}>
              <Stack direction='row' justifyContent='space-between' alignItems='flex-start'>
                <Typography variant='overline' sx={{ color: ui.muted, fontWeight: 700, letterSpacing: 0.8 }}>
                  Servicios visibles
                </Typography>
                <Box sx={{ width: 42, height: 42, borderRadius: '14px', background: `linear-gradient(135deg, ${alpha(ui.info, 0.15)} 0%, ${alpha(ui.info, 0.08)} 100%)`, color: ui.info, display: 'grid', placeItems: 'center', boxShadow: `0 2px 8px ${alpha(ui.info, 0.12)}` }}>
                  <VisibilityOutlinedIcon fontSize='small' />
                </Box>
              </Stack>
              <Typography variant='h3' fontWeight={700} sx={{ mt: 1.5, mb: 0.5, color: ui.text, lineHeight: 1.2 }}>
                {visibleServices.length}
              </Typography>
              <Typography variant='caption' sx={{ color: ui.muted, fontWeight: 500 }}>
                Total cargados: {data?.totalItems ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ ...softCardSx, height: '100%' }}>
            <CardContent sx={{ p: 2 }}>
              <Stack direction='row' justifyContent='space-between' alignItems='flex-start'>
                <Typography variant='overline' sx={{ color: ui.muted, fontWeight: 700, letterSpacing: 0.8 }}>
                  {isTechnicalOnlyView ? 'ODS emitidas' : 'Pendientes respuesta'}
                </Typography>
                <Box sx={{ width: 42, height: 42, borderRadius: '14px', background: `linear-gradient(135deg, ${alpha(ui.warning, 0.15)} 0%, ${alpha(ui.warning, 0.08)} 100%)`, color: ui.warning, display: 'grid', placeItems: 'center', boxShadow: `0 2px 8px ${alpha(ui.warning, 0.12)}` }}>
                  <WarningAmberOutlinedIcon fontSize='small' />
                </Box>
              </Stack>
              <Typography variant='h3' fontWeight={700} sx={{ mt: 1.5, mb: 0.5, color: ui.text, lineHeight: 1.2 }}>
                {isTechnicalOnlyView ? odsIssuedCount : pendingApprovalCount}
              </Typography>
              <Typography variant='caption' sx={{ color: ui.muted, fontWeight: 500, lineHeight: 1.5, display: 'block' }}>
                {isTechnicalOnlyView
                  ? 'Servicios ya liberados al frente técnico'
                  : 'Cotizaciones enviadas esperando respuesta'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ ...softCardSx, height: '100%' }}>
            <CardContent sx={{ p: 2 }}>
              <Stack direction='row' justifyContent='space-between' alignItems='flex-start'>
                <Typography variant='overline' sx={{ color: ui.muted, fontWeight: 700, letterSpacing: 0.8 }}>
                  {isTechnicalOnlyView ? 'Requieren agenda' : 'Listos para ODS'}
                </Typography>
                <Box sx={{ width: 42, height: 42, borderRadius: '14px', background: `linear-gradient(135deg, ${alpha(ui.green, 0.15)} 0%, ${alpha(ui.green, 0.08)} 100%)`, color: ui.greenDark, display: 'grid', placeItems: 'center', boxShadow: `0 2px 8px ${alpha(ui.green, 0.12)}` }}>
                  <DescriptionOutlinedIcon fontSize='small' />
                </Box>
              </Stack>
              <Typography variant='h3' fontWeight={700} sx={{ mt: 1.5, mb: 0.5, color: ui.text, lineHeight: 1.2 }}>
                {isTechnicalOnlyView ? pendingProgrammingCount : readyForOdsCount}
              </Typography>
              <Typography variant='caption' sx={{ color: ui.muted, fontWeight: 500, lineHeight: 1.5, display: 'block' }}>
                {isTechnicalOnlyView
                  ? 'Servicios que requieren coordinación'
                  : 'Aprobados y pendientes de emisión ODS'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ ...softCardSx, height: '100%' }}>
            <CardContent sx={{ p: 2 }}>
              <Stack direction='row' justifyContent='space-between' alignItems='flex-start'>
                <Typography variant='overline' sx={{ color: ui.muted, fontWeight: 700, letterSpacing: 0.8 }}>
                  En riesgo o vencidos
                </Typography>
                <Box sx={{ width: 42, height: 42, borderRadius: '14px', background: `linear-gradient(135deg, ${alpha(ui.error, 0.15)} 0%, ${alpha(ui.error, 0.08)} 100%)`, color: ui.error, display: 'grid', placeItems: 'center', boxShadow: `0 2px 8px ${alpha(ui.error, 0.12)}` }}>
                  <ReportProblemOutlinedIcon fontSize='small' />
                </Box>
              </Stack>
              <Typography variant='h3' fontWeight={700} sx={{ mt: 1.5, mb: 0.5, color: urgentCount > 0 ? ui.error : ui.text, lineHeight: 1.2 }}>
                {urgentCount}
              </Typography>
              <Typography variant='caption' sx={{ color: ui.muted, fontWeight: 500, lineHeight: 1.5, display: 'block' }}>
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
          <Alert
            severity='info'
            sx={{
              borderRadius: '16px',
              border: `1px solid ${alpha(ui.info, 0.18)}`,
              bgcolor: alpha(ui.info, 0.06),
              color: ui.textSecondary,
              animation: 'fadeUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both',
              '& .MuiAlert-icon': { color: ui.info }
            }}
          >
            {pendingDocumentControlCount > 0
              ? `${pendingDocumentControlCount} servicios todavía requieren control documental o envío por corte.`
              : 'No hay servicios con frente documental pendiente en la bandeja actual.'}
          </Alert>
        </Grid>
        <Grid item xs={12} md={6}>
          <Alert
            severity='success'
            sx={{
              borderRadius: '16px',
              border: `1px solid ${alpha(ui.green, 0.18)}`,
              bgcolor: ui.greenLight,
              color: ui.textSecondary,
              animation: 'fadeUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.25s both',
              '& .MuiAlert-icon': { color: ui.green }
            }}
          >
            {readyToCloseCount > 0
              ? `${readyToCloseCount} servicios ya están listos para cierre final.`
              : 'Todavía no hay servicios listos para cierre final en la bandeja actual.'}
          </Alert>
        </Grid>
      </Grid>

      <Card elevation={0} sx={{ ...softCardSx, mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent='space-between'
            alignItems={{ xs: 'stretch', md: 'center' }}
            spacing={2}
          >
            <Box>
              <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap'>
                <Typography variant='h6' fontWeight={700} sx={{ color: ui.text, lineHeight: 1.2 }}>
                  Filtros operativos
                </Typography>
                {activeFiltersCount > 0 ? (
                  <Chip
                    size='small'
                    color='primary'
                    variant='outlined'
                    label={`${activeFiltersCount} activo${activeFiltersCount === 1 ? '' : 's'}`}
                  />
                ) : null}
              </Stack>
              <Typography variant='body2' sx={{ mt: 0.5, color: ui.muted, lineHeight: 1.5 }}>
                Reduce ruido y enfócate en los servicios que sí requieren acción.
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                variant={showOnlyMyLoad ? 'contained' : 'outlined'}
                color={showOnlyMyLoad ? 'success' : 'inherit'}
                onClick={() => setShowOnlyMyLoad((currentValue) => !currentValue)}
                disabled={!currentUserHasAssignedLoad}
                sx={
                  showOnlyMyLoad
                    ? {
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontWeight: 700,
                        minHeight: 44
                      }
                    : secondaryButtonSx
                }
              >
                {showOnlyMyLoad ? `Mi carga (${visibleServices.length})` : `Mi carga${myLoadCount > 0 ? ` (${myLoadCount})` : ''}`}
              </Button>
              <ToggleButtonGroup
                size='small'
                exclusive
                value={viewMode}
                onChange={(_event, nextViewMode: CalibrationServicesViewMode | null) => {
                  if (nextViewMode) {
                    setViewMode(nextViewMode)
                  }
                }}
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  borderRadius: '12px',
                  p: 0.4,
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  '& .MuiToggleButton-root': {
                    border: 0,
                    borderRadius: '10px',
                    px: 1.5,
                    py: 0.85,
                    textTransform: 'none',
                    fontWeight: 700,
                    color: ui.textSecondary,
                    gap: 0.75
                  },
                  '& .Mui-selected': {
                    backgroundColor: alpha(ui.green, 0.12),
                    color: ui.greenDark
                  }
                }}
              >
                <ToggleButton value='list'>
                  <ViewListOutlinedIcon fontSize='small' />
                  Lista
                </ToggleButton>
                <ToggleButton value='kanban'>
                  <ViewKanbanOutlinedIcon fontSize='small' />
                  Kanban
                </ToggleButton>
              </ToggleButtonGroup>
              <Button
                variant='outlined'
                color='inherit'
                onClick={clearFilters}
                disabled={activeFiltersCount === 0}
                sx={secondaryButtonSx}
              >
                Limpiar filtros
              </Button>
              <Button
                variant='contained'
                startIcon={<FilterListOutlinedIcon />}
                endIcon={
                  areFiltersOpen ? <ExpandLessOutlinedIcon /> : <ExpandMoreOutlinedIcon />
                }
                onClick={() => setAreFiltersOpen((currentValue) => !currentValue)}
                sx={primaryButtonSx}
              >
                {areFiltersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
              </Button>
            </Stack>
          </Stack>

          <Collapse in={areFiltersOpen} timeout='auto' unmountOnExit>
            <Grid container spacing={2.5} sx={{ mt: 1 }}>
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
          </Collapse>
        </CardContent>
      </Card>

      {visibleServices.length === 0 ? (
        <Alert severity='info'>
          No encontramos servicios con los filtros actuales.
        </Alert>
      ) : viewMode === 'list' ? (
        <Stack spacing={2}>
          {visibleServices.map((service) => {
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
            const canEdit = canCreateServices && service.status === 'draft'
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
              <Card key={service.id} elevation={0} sx={softCardSx}>
                <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
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
                        <Typography
                          variant='h6'
                          fontWeight={700}
                          sx={{ color: ui.text, lineHeight: 1.2 }}
                        >
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
                          <Chip size='small' variant='outlined' label={service.odsCode} />
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
                            variant={
                              isAssignedToCurrentMetrologist ? 'filled' : 'outlined'
                            }
                            label={
                              isAssignedToCurrentMetrologist
                                ? 'Asignado a ti'
                                : `Metrólogo: ${assignedMetrologistName}`
                            }
                          />
                        ) : null}
                      </Stack>

                      <Typography
                        variant='body1'
                        fontWeight={700}
                        sx={{ color: ui.textSecondary, lineHeight: 1.5 }}
                      >
                        {service.customer?.nombre ||
                          service.executionCustomerName ||
                          'Cliente pendiente'}
                      </Typography>
                      <Typography
                        variant='body2'
                        sx={{ mt: 0.5, color: ui.muted, lineHeight: 1.5 }}
                      >
                        {service.scopeType === 'site'
                          ? `Sede: ${getServiceSiteLabel(service)}`
                          : `Alcance general · ${getServiceSiteLabel(service)}`}
                      </Typography>
                      <Typography
                        variant='body2'
                        sx={{ mt: 1, color: ui.muted, lineHeight: 1.5 }}
                      >
                        {hasCustomerChangeRequest(service)
                          ? 'La cotización volvió a edición porque el cliente pidió cambios.'
                          : service.slaIndicator?.message ||
                            'Todavía no hay una alerta operativa activa.'}
                      </Typography>
                      {assignedMetrologistName ? (
                        <Typography
                          variant='body2'
                          sx={{ mt: 0.75, color: ui.muted, lineHeight: 1.5 }}
                        >
                          Responsable metrológico:{' '}
                          <strong>{assignedMetrologistName}</strong>
                          {assignedMetrologistEmail
                            ? ` · ${assignedMetrologistEmail}`
                            : ''}
                        </Typography>
                      ) : null}

                      <Divider sx={{ my: 2, borderColor: ui.border }} />

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography
                            variant='caption'
                            sx={{ color: ui.muted, fontWeight: 500 }}
                          >
                            Ítems del servicio
                          </Typography>
                          <Typography
                            variant='body1'
                            fontWeight={700}
                            sx={{ color: ui.text }}
                          >
                            {service.items?.length ?? 0}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography
                            variant='caption'
                            sx={{ color: ui.muted, fontWeight: 500 }}
                          >
                            {isTechnicalOnlyView ? 'ODS' : 'Total estimado'}
                          </Typography>
                          <Typography
                            variant='body1'
                            fontWeight={700}
                            sx={{ color: ui.success }}
                          >
                            {isTechnicalOnlyView
                              ? service.odsCode || 'Pendiente'
                              : currencyFormatter.format(getItemsTotal(service))}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography
                            variant='caption'
                            sx={{ color: ui.muted, fontWeight: 500 }}
                          >
                            Contacto
                          </Typography>
                          <Typography
                            variant='body1'
                            fontWeight={700}
                            sx={{ color: ui.text }}
                          >
                            {service.contactName || 'Sin contacto'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography
                            variant='caption'
                            sx={{ color: ui.muted, fontWeight: 500 }}
                          >
                            Actualizado
                          </Typography>
                          <Typography
                            variant='body1'
                            fontWeight={700}
                            sx={{ color: ui.text }}
                          >
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
                        sx={secondaryButtonSx}
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
                          sx={secondaryButtonSx}
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
                          sx={primaryButtonSx}
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
                          sx={{
                            borderRadius: '12px',
                            textTransform: 'none',
                            fontWeight: 700,
                            minHeight: 44
                          }}
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
                          sx={{
                            borderRadius: '12px',
                            textTransform: 'none',
                            fontWeight: 700,
                            minHeight: 44
                          }}
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
                          sx={{
                            borderRadius: '12px',
                            textTransform: 'none',
                            fontWeight: 700,
                            minHeight: 44
                          }}
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
                          sx={{
                            ...secondaryButtonSx,
                            color: ui.success,
                            borderColor: alpha(ui.success, 0.35)
                          }}
                        >
                          Operación
                        </Button>
                      ) : null}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            )
          })}
        </Stack>
      ) : (
        <Box sx={{ overflowX: 'auto', pb: 1 }}>
          <Stack
            direction='row'
            spacing={2}
            alignItems='flex-start'
            sx={{ minWidth: 'max-content' }}
          >
            {kanbanServices.map((column) => {
              const isEmptyColumn = column.services.length === 0
              const isCollapsed =
                isEmptyColumn && collapsedKanbanColumns.includes(column.key)

              return (
              <Box
                key={column.key}
                sx={{
                  width: isCollapsed ? 96 : 340,
                  minWidth: isCollapsed ? 96 : 340,
                  borderRadius: '20px',
                  border: `1px solid ${alpha(column.accent, 0.16)}`,
                  background: `linear-gradient(180deg, ${alpha(
                    column.accent,
                    0.08
                  )} 0%, rgba(255,255,255,0.88) 22%)`,
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 6px 18px rgba(15, 23, 42, 0.05)',
                  transition: 'width 0.25s ease, min-width 0.25s ease'
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    borderBottom: `1px solid ${alpha(column.accent, 0.14)}`
                  }}
                >
                  <Stack
                    direction='row'
                    justifyContent='space-between'
                    alignItems='flex-start'
                    spacing={1}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant='subtitle1'
                        fontWeight={800}
                        sx={{ color: ui.text, lineHeight: 1.2 }}
                      >
                        {column.title}
                      </Typography>
                      <Typography
                        variant='body2'
                        sx={{ mt: 0.5, color: ui.textSecondary, lineHeight: 1.45 }}
                      >
                        {column.description}
                      </Typography>
                    </Box>
                    <Stack spacing={1} alignItems='flex-end'>
                      <Chip
                        size='small'
                        label={column.services.length}
                        sx={{
                          bgcolor: alpha(column.accent, 0.14),
                          color: column.accent,
                          fontWeight: 800
                        }}
                      />
                      {isEmptyColumn ? (
                        <Button
                          size='small'
                          variant='text'
                          onClick={() =>
                            setCollapsedKanbanColumns((currentValue) =>
                              isCollapsed
                                ? currentValue.filter((value) => value !== column.key)
                                : [...currentValue, column.key]
                            )
                          }
                          sx={{
                            minWidth: 0,
                            px: 1,
                            color: column.accent,
                            textTransform: 'none',
                            fontWeight: 700
                          }}
                        >
                          {isCollapsed ? 'Abrir' : 'Colapsar'}
                        </Button>
                      ) : null}
                    </Stack>
                  </Stack>
                </Box>

                {isCollapsed ? (
                  <Stack
                    alignItems='center'
                    justifyContent='center'
                    spacing={1}
                    sx={{ p: 1.5, minHeight: 240 }}
                  >
                    <Typography
                      variant='caption'
                      sx={{
                        color: ui.textSecondary,
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)',
                        fontWeight: 700,
                        letterSpacing: 0.6
                      }}
                    >
                      Vacía
                    </Typography>
                  </Stack>
                ) : (
                <Stack spacing={1.5} sx={{ p: 1.5, minHeight: 240 }}>
                  {column.services.length === 0 ? (
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: '16px',
                        border: `1px dashed ${alpha(column.accent, 0.24)}`,
                        bgcolor: alpha(column.accent, 0.04)
                      }}
                    >
                      <Typography
                        variant='body2'
                        sx={{ color: ui.textSecondary, lineHeight: 1.5 }}
                      >
                        No hay servicios en esta etapa con los filtros actuales.
                      </Typography>
                    </Box>
                  ) : (
                    column.services.map((service) => {
                      const operations = getOperationsDetails(service)
                      const slaTone = getSlaVisualTone(service.slaIndicator?.color || 'gray')
                      const assignedMetrologistName =
                        typeof operations.assignedMetrologistName === 'string'
                          ? operations.assignedMetrologistName
                          : typeof operations.operationalResponsibleName === 'string'
                            ? operations.operationalResponsibleName
                            : ''
                      const canEdit =
                        canCreateServices && service.status === 'draft'
                      const canRequestApproval =
                        canCreateServices && service.status === 'draft'
                      const canResolveApproval =
                        canTakeApprovalDecision &&
                        service.status === 'pending_approval'
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
                        <Card
                          key={service.id}
                          elevation={0}
                          sx={{
                            borderRadius: '16px',
                            border: `1px solid ${slaTone.border}`,
                            background: slaTone.background,
                            boxShadow: slaTone.glow,
                            position: 'relative',
                            overflow: 'hidden',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: 4,
                              backgroundColor: slaTone.accent
                            }
                          }}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Stack spacing={1.25}>
                              <Stack
                                direction='row'
                                justifyContent='space-between'
                                spacing={1}
                                alignItems='flex-start'
                              >
                                <Box>
                                  <Typography
                                    variant='subtitle2'
                                    fontWeight={800}
                                    sx={{ color: ui.text, lineHeight: 1.25 }}
                                  >
                                    {service.serviceCode}
                                  </Typography>
                                  <Typography
                                    variant='body2'
                                    fontWeight={700}
                                    sx={{ color: ui.textSecondary, mt: 0.25 }}
                                  >
                                    {service.customer?.nombre ||
                                      service.executionCustomerName ||
                                      'Cliente pendiente'}
                                  </Typography>
                                </Box>
                                <Chip
                                  size='small'
                                  color={
                                    CALIBRATION_SERVICE_SLA_COLORS[
                                      service.slaIndicator?.color || 'gray'
                                    ]
                                  }
                                  label={
                                    service.slaIndicator?.label || 'SLA no iniciado'
                                  }
                                />
                              </Stack>

                              <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                                <Chip
                                  size='small'
                                  color={
                                    CALIBRATION_SERVICE_STATUS_COLORS[service.status]
                                  }
                                  label={
                                    CALIBRATION_SERVICE_STATUS_LABELS[service.status]
                                  }
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
                                {service.odsCode ? (
                                  <Chip
                                    size='small'
                                    variant='outlined'
                                    label={service.odsCode}
                                  />
                                ) : null}
                              </Stack>

                              <Typography
                                variant='body2'
                                sx={{ color: ui.muted, lineHeight: 1.45 }}
                              >
                                {hasCustomerChangeRequest(service)
                                  ? 'Cliente pidió cambios y el servicio requiere una nueva revisión.'
                                  : service.scopeType === 'site'
                                  ? `Sede: ${getServiceSiteLabel(service)}`
                                  : `Alcance general · ${getServiceSiteLabel(service)}`}
                              </Typography>

                              <Grid container spacing={1.25}>
                                <Grid item xs={6}>
                                  <Typography
                                    variant='caption'
                                    sx={{ color: ui.muted, fontWeight: 600 }}
                                  >
                                    Ítems
                                  </Typography>
                                  <Typography
                                    variant='body2'
                                    fontWeight={800}
                                    sx={{ color: ui.text }}
                                  >
                                    {service.items?.length ?? 0}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography
                                    variant='caption'
                                    sx={{ color: ui.muted, fontWeight: 600 }}
                                  >
                                    {isTechnicalOnlyView ? 'ODS' : 'Total'}
                                  </Typography>
                                  <Typography
                                    variant='body2'
                                    fontWeight={800}
                                    sx={{ color: ui.greenDark }}
                                  >
                                    {isTechnicalOnlyView
                                      ? service.odsCode || 'Pendiente'
                                      : currencyFormatter.format(
                                          getItemsTotal(service)
                                        )}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                  <Typography
                                    variant='caption'
                                    sx={{ color: ui.muted, fontWeight: 600 }}
                                  >
                                    Prioridad
                                  </Typography>
                                  <Typography
                                    variant='body2'
                                    fontWeight={800}
                                    sx={{ color: slaTone.accent }}
                                  >
                                    {service.slaIndicator?.color === 'red'
                                      ? 'Crítica'
                                      : service.slaIndicator?.color === 'yellow'
                                        ? 'Alta'
                                        : service.slaIndicator?.color === 'green'
                                          ? 'Normal'
                                          : service.slaIndicator?.color === 'blue'
                                            ? 'Completada'
                                            : 'Por iniciar'}
                                  </Typography>
                                </Grid>
                              </Grid>

                              {assignedMetrologistName ? (
                                <Typography
                                  variant='caption'
                                  sx={{ color: ui.textSecondary, lineHeight: 1.4 }}
                                >
                                  Metrólogo: <strong>{assignedMetrologistName}</strong>
                                </Typography>
                              ) : null}

                              <Stack spacing={1} sx={{ pt: 0.5 }}>
                                <Button
                                  fullWidth
                                  variant='outlined'
                                  startIcon={<VisibilityOutlinedIcon />}
                                  onClick={() => openServiceDetail(service.id)}
                                  sx={secondaryButtonSx}
                                >
                                  Ver detalle
                                </Button>
                                {canEdit ? (
                                  <Button
                                    fullWidth
                                    variant='outlined'
                                    startIcon={<EditOutlinedIcon />}
                                    onClick={() =>
                                      navigate(
                                        `/calibration-services/${service.id}/edit`
                                      )
                                    }
                                    sx={secondaryButtonSx}
                                  >
                                    Editar
                                  </Button>
                                ) : null}
                                {canRequestApproval ? (
                                  <Button
                                    fullWidth
                                    variant='contained'
                                    startIcon={<SendOutlinedIcon />}
                                    onClick={() => void handleRequestApproval(service)}
                                    disabled={requestApproval.isLoading}
                                    sx={primaryButtonSx}
                                  >
                                    Enviar cotización
                                  </Button>
                                ) : null}
                                {canResolveApproval ? (
                                  <Button
                                    fullWidth
                                    variant='contained'
                                    color='warning'
                                    startIcon={<WarningAmberOutlinedIcon />}
                                    onClick={() => openServiceDetail(service.id)}
                                    sx={{
                                      borderRadius: '12px',
                                      textTransform: 'none',
                                      fontWeight: 700,
                                      minHeight: 44
                                    }}
                                  >
                                    Registrar respuesta
                                  </Button>
                                ) : null}
                                {canOpenOds ? (
                                  <Button
                                    fullWidth
                                    variant='contained'
                                    color='info'
                                    startIcon={<DescriptionOutlinedIcon />}
                                    onClick={() => openOdsWorkflow(service.id)}
                                    sx={{
                                      borderRadius: '12px',
                                      textTransform: 'none',
                                      fontWeight: 700,
                                      minHeight: 44
                                    }}
                                  >
                                    Emitir ODS
                                  </Button>
                                ) : null}
                                {canOpenScheduling ? (
                                  <Button
                                    fullWidth
                                    variant='contained'
                                    color='primary'
                                    startIcon={<DescriptionOutlinedIcon />}
                                    onClick={() => openScheduleWorkflow(service.id)}
                                    sx={{
                                      borderRadius: '12px',
                                      textTransform: 'none',
                                      fontWeight: 700,
                                      minHeight: 44
                                    }}
                                  >
                                    Programar
                                  </Button>
                                ) : null}
                                {canManageExecution ? (
                                  <Button
                                    fullWidth
                                    variant='outlined'
                                    color='success'
                                    startIcon={<VisibilityOutlinedIcon />}
                                    onClick={() => openServiceDetail(service.id)}
                                    sx={{
                                      ...secondaryButtonSx,
                                      color: ui.success,
                                      borderColor: alpha(ui.success, 0.35)
                                    }}
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
                )}
              </Box>
            )})}
          </Stack>
        </Box>
      )}
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
