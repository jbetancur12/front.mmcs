import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '@nanostores/react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined'
import ViewKanbanOutlinedIcon from '@mui/icons-material/ViewKanbanOutlined'
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined'
import TableViewIcon from '@mui/icons-material/TableView'
import CalibrationNotificationBell from './CalibrationNotificationBell'
import { alpha } from '@mui/material/styles'
import MaterialReactTable from 'material-react-table'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
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
  useCalibrationServiceQuoteTermsTemplate,
  useCalibrationServiceSequenceConfig,
  useCalibrationServiceSlaConfig,
  useCalibrationServices
} from '../../hooks/useCalibrationServices'
import {
  CalibrationService,
  CalibrationServiceApprovalStatus,
  CalibrationServiceFilters,
  CalibrationServiceQuoteTerms,
  CalibrationServiceScopeType,
  CalibrationServiceSlaConfigPayload,
  CalibrationServiceSlaIndicatorColor,
  CalibrationServiceStatus
} from '../../types/calibrationService'
import { userStore } from '../../store/userStore'
import { useHasRole } from '../../utils/functions'
import CalibrationServiceRichTextEditor from './CalibrationServiceRichTextEditor'
import CalibrationServiceSequenceConfigDialog from './CalibrationServiceSequenceConfigDialog'
import CalibrationServiceSlaConfigDialog from './CalibrationServiceSlaConfigDialog'
import {
  CALIBRATION_QUOTE_TERM_KEYS,
  CALIBRATION_QUOTE_TERM_LABELS,
  mergeCalibrationQuoteTerms
} from './calibrationQuoteTerms'

const FILTER_ALL = 'all'
const FILTER_UNASSIGNED = 'unassigned'
const CALIBRATION_SERVICES_VIEW_STORAGE_KEY = 'calibrationServicesViewMode'

type CalibrationServicesViewMode = 'list' | 'table' | 'kanban'

type KanbanColumnDefinition = {
  key: string
  title: string
  description: string
  accent: string
  priority: number
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
  { value: 'cancelled', label: 'Cancelado' },
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
  surface: '#f3f4f6',
  white: '#ffffff',
  glass: 'rgba(255, 255, 255, 0.75)'
}

const STATUS_BORDER_COLORS: Record<string, string> = {
  draft: '#d1d5db',
  pending_approval: '#f59e0b',
  rejected: '#ef4444',
  approved: '#10b981',
  ods_issued: '#3b82f6',
  pending_programming: '#8b5cf6',
  scheduled: '#6366f1',
  in_execution: '#10b981',
  technically_completed: '#3b82f6',
  cancelled: '#ef4444',
  closed: '#9ca3af'
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

  return storedValue === 'kanban' ? 'kanban' : storedValue === 'table' ? 'table' : 'list'
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

const getCompactSlaLabel = (color?: CalibrationServiceSlaIndicatorColor) => {
  switch (color) {
    case 'red':
      return 'Vencido'
    case 'yellow':
      return 'Alerta'
    case 'green':
      return 'En tiempo'
    case 'blue':
      return 'Completado'
    default:
      return 'Sin iniciar'
  }
}

const getCompactColumnTitle = (title: string) => {
  switch (title) {
    case 'Esperando respuesta cliente':
      return 'Cliente'
    case 'Listo para ODS':
      return 'Para ODS'
    case 'Pendiente programación':
      return 'Programar'
    case 'En servicio':
      return 'Servicio'
    case 'Pendiente administrativo':
      return 'Admin'
    default:
      return title
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

const getMetrologistNames = (service: CalibrationService): string[] => {
  const ops = getOperationsDetails(service)
  const arr: any = ops.assignedMetrologists
  if (Array.isArray(arr) && arr.length > 0) return arr.map((m: any) => String(m.name)).filter(Boolean)
  const legacy = ops.assignedMetrologistName
  return legacy ? [String(legacy)] : []
}

const getMetrologistEmails = (service: CalibrationService): string[] => {
  const ops = getOperationsDetails(service)
  const arr: any = ops.assignedMetrologists
  if (Array.isArray(arr) && arr.length > 0) return arr.map((m: any) => String(m.email)).filter(Boolean)
  const legacy = ops.assignedMetrologistEmail
  return legacy ? [String(legacy)] : []
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
        accent: '#64748b',
        priority: 5
      },
      {
        key: 'to_schedule',
        title: 'Por programar',
        description: 'ODS emitidas o pendientes de agenda',
        accent: '#f59e0b',
        priority: 2
      },
      {
        key: 'in_service',
        title: 'En ejecución',
        description: 'Programados o en trabajo activo',
        accent: '#10b981',
        priority: 1
      },
      {
        key: 'pending_close',
        title: 'Pendiente cierre',
        description: 'Finalizados técnicamente y pendientes de salida',
        accent: '#0ea5e9',
        priority: 3
      },
      {
        key: 'closed',
        title: 'Cerrados',
        description: 'Servicios completamente terminados',
        accent: '#059669',
        priority: 6
      }
    ]
  }

  return [
    {
      key: 'adjustments',
      title: 'Por ajustar',
      description: 'Borradores, rechazadas o con cambios pendientes',
      accent: '#64748b',
      priority: 6
    },
    {
      key: 'waiting_customer',
      title: 'Esperando respuesta cliente',
      description: 'Cotizaciones enviadas pendientes de respuesta',
      accent: '#f59e0b',
      priority: 4
    },
    {
      key: 'ready_for_ods',
      title: 'Listo para ODS',
      description: 'Aprobadas y listas para liberar',
      accent: '#10b981',
      priority: 5
    },
    {
      key: 'to_schedule',
      title: 'Pendiente programación',
      description: 'ODS emitidas o pendientes de agenda operativa',
      accent: '#3b82f6',
      priority: 3
    },
    {
      key: 'in_service',
      title: 'En servicio',
      description: 'Programados y en ejecución',
      accent: '#14b8a6',
      priority: 2
    },
    {
      key: 'pending_close',
      title: 'Pendiente administrativo',
      description: 'Finalizados técnicamente o pendientes administrativos',
      accent: '#3b82f6',
      priority: 1
    },
    {
      key: 'closed',
      title: 'Cerradas',
      description: 'Servicios completados',
      accent: '#059669',
      priority: 7
    }
  ]
}

const getKanbanColumnKey = (
  service: CalibrationService,
  isTechnicalOnlyView: boolean
) => {
  if (isTechnicalOnlyView) {
    if (
      ['draft', 'pending_approval', 'rejected', 'approved'].includes(service.status)
    ) {
      return 'pre_operational'
    }

    if (['ods_issued', 'pending_programming'].includes(service.status)) {
      return 'to_schedule'
    }

    if (['scheduled', 'in_execution'].includes(service.status)) {
      return 'in_service'
    }

    if (service.status === 'technically_completed') {
      return 'pending_close'
    }

    if (service.status === 'closed') {
      return 'closed'
    }

    return 'pre_operational'
  }

  if (
    service.status === 'draft' ||
    service.status === 'rejected' ||
    service.approvalStatus === 'rejected' ||
    hasCustomerChangeRequest(service)
  ) {
    return 'adjustments'
  }

  if (service.status === 'pending_approval') {
    return 'waiting_customer'
  }

  if (
    service.status === 'approved' &&
    service.approvalStatus === 'approved' &&
    !service.odsCode
  ) {
    return 'ready_for_ods'
  }

  if (['ods_issued', 'pending_programming'].includes(service.status)) {
    return 'to_schedule'
  }

  if (['scheduled', 'in_execution'].includes(service.status)) {
    return 'in_service'
  }

  if (service.status === 'technically_completed') {
    return 'pending_close'
  }

  if (service.status === 'closed') {
    return 'closed'
  }

  if (service.status === 'approved') {
    return 'ready_for_ods'
  }

  return 'adjustments'
}

const CalibrationServicesPage = () => {
  const navigate = useNavigate()
  const $userStore = useStore(userStore)
  const { requestApproval, upsertSequenceConfig, upsertSlaConfig, upsertQuoteTermsTemplate } =
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
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [templateTerms, setTemplateTerms] = useState<CalibrationServiceQuoteTerms>({})
  const { data: quoteTermsTemplate } = useCalibrationServiceQuoteTermsTemplate(canCreateServices)
  const [viewMode, setViewMode] = useState<CalibrationServicesViewMode>(
    getStoredViewMode
  )
  const [showOnlyMyLoad, setShowOnlyMyLoad] = useState(false)
  const [showOnlyReadyForInvoice, setShowOnlyReadyForInvoice] = useState(false)
  const kanbanScrollRef = useRef<HTMLDivElement | null>(null)
  const kanbanTopScrollRef = useRef<HTMLDivElement | null>(null)
  const [kanbanScrollWidth, setKanbanScrollWidth] = useState(0)

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
      const names = getMetrologistNames(service)
      const emails = getMetrologistEmails(service)

      if (names.length === 0) return accumulator

      names.forEach((name, idx) => {
        const email = emails[idx] || ''
        const optionId = email || name

        if (accumulator.some((metrologist) => metrologist.id === optionId)) {
          return
        }

        accumulator.push({
          id: optionId,
          label: email
            ? `${name} · ${email}`
            : name
        })
      })

      return accumulator
    }, [])
    .sort((left, right) => left.label.localeCompare(right.label, 'es'))

  const visibleServices = services.filter((service) => {
    const currentMetrologistNames = getMetrologistNames(service)
    const currentMetrologistEmails = getMetrologistEmails(service)

    if (scopeFilter !== FILTER_ALL && service.scopeType !== scopeFilter) {
      return false
    }

    if (
      slaFilter !== FILTER_ALL &&
      (service.slaIndicator?.color || 'gray') !== slaFilter
    ) {
      return false
    }

    if (metrologistFilter === FILTER_UNASSIGNED && currentMetrologistNames.length > 0) {
      return false
    }

    if (
      metrologistFilter !== FILTER_ALL &&
      metrologistFilter !== FILTER_UNASSIGNED &&
      !currentMetrologistEmails.includes(metrologistFilter) &&
      !currentMetrologistNames.includes(metrologistFilter)
    ) {
      return false
    }

    if (showOnlyMyLoad) {
      const currentUserEmail = $userStore.email?.trim().toLowerCase()
      if (!currentUserEmail || !currentMetrologistEmails.some(e => e.toLowerCase() === currentUserEmail)) {
        return false
      }
    }

    if (showOnlyReadyForInvoice && !(service.cuts || []).some(c => c.status === 'ready_for_invoicing')) {
      return false
    }

    return matchesSiteFilter(service, siteFilter)
  })

  const counts = useMemo(() => {
    let pendingApproval = 0, requestedChanges = 0, odsIssued = 0, pendingProgramming = 0
    let scheduled = 0, inExecution = 0, technicallyCompleted = 0, closed = 0
    let readyToClose = 0, pendingDocumentControl = 0, readyForOds = 0, urgent = 0
    let readyForInvoice = 0

    for (const service of visibleServices) {
      if (service.status === 'pending_approval') pendingApproval++
      if (service.status === 'ods_issued') odsIssued++
      if (service.status === 'pending_programming') pendingProgramming++
      if (service.status === 'scheduled') scheduled++
      if (service.status === 'in_execution') inExecution++
      if (service.status === 'technically_completed') technicallyCompleted++
      if (service.status === 'closed') closed++
      if (hasCustomerChangeRequest(service)) requestedChanges++
      if (service.status === 'technically_completed' && service.slaIndicator?.activePhase === 'document_control_closed') readyToClose++
      if (service.slaIndicator?.activePhase === 'document_control') pendingDocumentControl++
      if (service.status === 'approved' && service.approvalStatus === 'approved' && !service.odsCode) readyForOds++
      if (['yellow', 'red'].includes(service.slaIndicator?.color || 'gray')) urgent++
      if ((service.cuts || []).some(c => c.status === 'ready_for_invoicing')) readyForInvoice++
    }

    return { pendingApproval, requestedChanges, odsIssued, pendingProgramming, scheduled, inExecution, technicallyCompleted, closed, readyToClose, pendingDocumentControl, readyForOds, urgent, readyForInvoice }
  }, [visibleServices])

  const { pendingApproval: pendingApprovalCount, requestedChanges: requestedChangesCount, odsIssued: odsIssuedCount, pendingProgramming: pendingProgrammingCount, scheduled: scheduledCount, inExecution: inExecutionCount, technicallyCompleted: technicallyCompletedCount, closed: closedCount, readyToClose: readyToCloseCount, pendingDocumentControl: pendingDocumentControlCount, readyForOds: readyForOdsCount, urgent: urgentCount, readyForInvoice: readyForInvoiceCount } = counts
  const activeFiltersCount = [
    search.trim(),
    statusFilter !== FILTER_ALL,
    !isTechnicalOnlyView && approvalFilter !== FILTER_ALL,
    scopeFilter !== FILTER_ALL,
    slaFilter !== FILTER_ALL,
    siteFilter.trim(),
    customerFilter !== FILTER_ALL,
    metrologistFilter !== FILTER_ALL,
    showOnlyMyLoad,
    showOnlyReadyForInvoice
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
    setShowOnlyReadyForInvoice(false)
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

    const columnsWithServices = kanbanColumns.map((column) => {
      const servicesForColumn = (groupedServices[column.key] || []).sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
      )

      const urgentCount = servicesForColumn.filter((service) =>
        ['red', 'yellow'].includes(service.slaIndicator?.color || 'gray')
      ).length

      const currentUserEmail = $userStore.email?.trim().toLowerCase()
      const myLoadCount = currentUserEmail
        ? servicesForColumn.filter((service) => {
            const emails = getMetrologistEmails(service)
            return emails.some(e => e.toLowerCase() === currentUserEmail)
          }).length
        : 0

      return {
        ...column,
        services: servicesForColumn,
        urgentCount,
        myLoadCount
      }
    })

    const shouldPrioritizeOperationally =
      showOnlyMyLoad || activeFiltersCount > 0

    if (!shouldPrioritizeOperationally) {
      return columnsWithServices.sort(
        (left, right) => left.priority - right.priority
      )
    }

    return columnsWithServices.sort((left, right) => {
      if (right.urgentCount !== left.urgentCount) {
        return right.urgentCount - left.urgentCount
      }

      if (right.myLoadCount !== left.myLoadCount) {
        return right.myLoadCount - left.myLoadCount
      }

      if (right.services.length !== left.services.length) {
        return right.services.length - left.services.length
      }

      return left.priority - right.priority
    })
  }, [
    $userStore.email,
    activeFiltersCount,
    isTechnicalOnlyView,
    kanbanColumns,
    showOnlyMyLoad,
    visibleServices
  ])

  useEffect(() => {
    if (viewMode !== 'kanban') {
      return
    }

    const syncScrollMetrics = () => {
      setKanbanScrollWidth(kanbanScrollRef.current?.scrollWidth || 0)
    }

    syncScrollMetrics()
    window.addEventListener('resize', syncScrollMetrics)

    return () => {
      window.removeEventListener('resize', syncScrollMetrics)
    }
  }, [kanbanServices, viewMode])

  const renderServiceCard = (service: CalibrationService) => {
    const serviceOperationalFocus = getServiceOperationalFocus(service)
    const assignedMetrologistNames = getMetrologistNames(service)
    const assignedMetrologistName = assignedMetrologistNames[0] || ''
    const assignedMetrologistEmails = getMetrologistEmails(service)
    const assignedMetrologistEmail = assignedMetrologistEmails[0] || ''
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
      <Card key={service.id} elevation={0} sx={{
        ...softCardSx, position: 'relative', overflow: 'visible',
        '&::before': {
          content: '""', position: 'absolute', left: 0, top: 12, bottom: 12,
          width: 3, borderRadius: '2px',
          background: `linear-gradient(180deg, ${STATUS_BORDER_COLORS[service.status] || '#d1d5db'}, ${alpha(STATUS_BORDER_COLORS[service.status] || '#d1d5db', 0.3)})`
        }
      }}>
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
                  <Box component='span' title='Código interno del servicio (SCL)' sx={{ cursor: 'help' }}>
                    {service.serviceCode}
                  </Box>
                  {service.quoteCode ? (
                    <Box component='span' title='Consecutivo de cotización' sx={{ ml: 1, color: '#059669', fontWeight: 800, fontSize: '0.85rem', cursor: 'help' }}>
                      · {service.quoteCode}
                    </Box>
                  ) : null}
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
                {(service.cuts || []).some(c => c.status === 'ready_for_invoicing') ? (
                  <Chip size='small' color='info' variant='outlined' label='Por facturar' />
                ) : null}
                {(service.otherFields as any)?.hasEquipmentSale === true ? (
                  <Chip size='small' color='warning' variant='outlined' label='Venta Eq.' />
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
                        : assignedMetrologistNames.length > 1
                          ? `Metrólogos: ${assignedMetrologistNames.join(', ')}`
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
              {service.scopeType === 'site' ? (
                <Typography
                  variant='body2'
                  sx={{ mt: 0.5, color: ui.muted, lineHeight: 1.5 }}
                >
                  Sede: {getServiceSiteLabel(service)}
                </Typography>
              ) : null}
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
                  {assignedMetrologistNames.length > 1
                    ? `Metrólogos: ${assignedMetrologistNames.join(', ')}`
                    : `Responsable metrológico: <strong>${assignedMetrologistName}</strong>`}
                  {assignedMetrologistEmails.length > 0 && !isTechnicalOnlyView
                    ? ` · ${assignedMetrologistEmails.join(', ')}`
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
  }

  const groupedListServices = useMemo(() => {
    const grouped = visibleServices.reduce<Record<string, CalibrationService[]>>(
      (acc, service) => {
        const key = getKanbanColumnKey(service, isTechnicalOnlyView)
        if (!acc[key]) acc[key] = []
        acc[key].push(service)
        return acc
      },
      {}
    )

    return getKanbanColumns(isTechnicalOnlyView)
      .map(col => ({
        ...col,
        services: (grouped[col.key] || []).sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
      }))
      .filter(col => col.services.length > 0)
      .sort((a, b) => a.priority - b.priority)
  }, [visibleServices, isTechnicalOnlyView])

  const currentUserHasAssignedLoad = useMemo(() => {
    const currentUserEmail = $userStore.email?.trim().toLowerCase()

    if (!currentUserEmail) {
      return false
    }

    return services.some((service) => {
      const emails = getMetrologistEmails(service)
      return emails.some(e => e.toLowerCase() === currentUserEmail)
    })
  }, [$userStore.email, services])

  const myLoadCount = useMemo(() => {
    const currentUserEmail = $userStore.email?.trim().toLowerCase()

    if (!currentUserEmail) {
      return 0
    }

    return services.filter((service) => {
      const emails = getMetrologistEmails(service)
      return emails.some(e => e.toLowerCase() === currentUserEmail)
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

  const handleOpenTemplate = () => {
    setTemplateTerms(mergeCalibrationQuoteTerms(quoteTermsTemplate?.terms))
    setTemplateDialogOpen(true)
  }

  const handleSaveTemplate = async () => {
    try {
      await upsertQuoteTermsTemplate.mutateAsync(templateTerms)
      toast.success('Plantilla de términos actualizada correctamente.')
      setTemplateDialogOpen(false)
    } catch {
      toast.error('No se pudo guardar la plantilla de términos.')
    }
  }

  const setTemplateTerm = (key: string, value: string) => {
    setTemplateTerms((previous) => ({ ...previous, [key]: value }))
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
            {canCreateServices ? (
              <Button
                variant='outlined'
                startIcon={<Inventory2OutlinedIcon />}
                onClick={() => navigate('/calibration-services/productos-y-servicios')}
                sx={{ ...secondaryButtonSx, borderColor: 'rgba(255,255,255,0.35)', color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', '&:hover': { borderColor: '#fff', color: '#fff', backgroundColor: 'rgba(255,255,255,0.2)' } }}
              >
                Productos
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
            {canManageSequenceConfig ? (
              <Button
                variant='outlined'
                startIcon={<SettingsOutlinedIcon />}
                onClick={() => setIsSequenceDialogOpen(true)}
                sx={{ ...secondaryButtonSx, borderColor: 'rgba(255,255,255,0.35)', color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', '&:hover': { borderColor: '#fff', color: '#fff', backgroundColor: 'rgba(255,255,255,0.2)' } }}
              >
                Config. secuencia
              </Button>
            ) : null}
            {canCreateServices ? (
              <Button
                variant='outlined'
                startIcon={<SaveOutlinedIcon />}
                onClick={handleOpenTemplate}
                sx={{ ...secondaryButtonSx, borderColor: 'rgba(255,255,255,0.35)', color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', '&:hover': { borderColor: '#fff', color: '#fff', backgroundColor: 'rgba(255,255,255,0.2)' } }}
              >
                Plantilla términos
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
            <Box sx={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '10px', px: 0.5, backdropFilter: 'blur(8px)' }}>
              <CalibrationNotificationBell />
            </Box>
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

      {canManageSequenceConfig && sequenceConfig ? (
        <Alert
          severity={sequenceConfig.initialized ? 'info' : 'warning'}
          sx={{ mb: 3 }}
          action={
            <Button color='inherit' size='small' onClick={() => setIsSequenceDialogOpen(true)}>
              Configurar
            </Button>
          }
        >
          {sequenceConfig.initialized
            ? 'Puedes ajustar el metrólogo de laboratorio y los consecutivos desde la configuración.'
            : 'Antes de crear la primera oferta o emitir la primera ODS, define los consecutivos iniciales del módulo.'}
        </Alert>
      ) : null}

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ ...softCardSx, height: '100%', position: 'relative', overflow: 'visible', cursor: 'pointer', '&::before': { content: '""', position: 'absolute', left: 0, top: 12, bottom: 12, width: 3, borderRadius: '2px', background: `linear-gradient(180deg, ${ui.info}, ${alpha(ui.info, 0.4)})` } }} onClick={clearFilters}>
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
          <Card elevation={0} sx={{ ...softCardSx, height: '100%', position: 'relative', overflow: 'visible', cursor: 'pointer', '&::before': { content: '""', position: 'absolute', left: 0, top: 12, bottom: 12, width: 3, borderRadius: '2px', background: `linear-gradient(180deg, ${ui.warning}, ${alpha(ui.warning, 0.4)})` } }} onClick={() => { setStatusFilter(isTechnicalOnlyView ? 'ods_issued' : 'pending_approval'); setAreFiltersOpen(true) }}>
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
          <Card elevation={0} sx={{ ...softCardSx, height: '100%', position: 'relative', overflow: 'visible', cursor: 'pointer', '&::before': { content: '""', position: 'absolute', left: 0, top: 12, bottom: 12, width: 3, borderRadius: '2px', background: `linear-gradient(180deg, ${ui.greenDark}, ${alpha(ui.green, 0.4)})` } }} onClick={() => { setStatusFilter(isTechnicalOnlyView ? 'pending_programming' : 'approved'); setAreFiltersOpen(true) }}>
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
          <Card elevation={0} sx={{ ...softCardSx, height: '100%', position: 'relative', overflow: 'visible', cursor: 'pointer', '&::before': { content: '""', position: 'absolute', left: 0, top: 12, bottom: 12, width: 3, borderRadius: '2px', background: urgentCount > 0 ? `linear-gradient(180deg, ${ui.error}, ${alpha(ui.error, 0.4)})` : `linear-gradient(180deg, ${ui.muted}, ${alpha(ui.muted, 0.3)})` } }} onClick={() => { setSlaFilter('red'); setAreFiltersOpen(true) }}>
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
              <Button
                variant={showOnlyReadyForInvoice ? 'contained' : 'outlined'}
                color={showOnlyReadyForInvoice ? 'info' : 'inherit'}
                onClick={() => setShowOnlyReadyForInvoice((v) => !v)}
                disabled={readyForInvoiceCount === 0}
                sx={showOnlyReadyForInvoice ? { borderRadius: '12px', textTransform: 'none', fontWeight: 700, minHeight: 44 } : secondaryButtonSx}
              >
                {showOnlyReadyForInvoice ? `Por facturar (${visibleServices.length})` : `Por facturar${readyForInvoiceCount > 0 ? ` (${readyForInvoiceCount})` : ''}`}
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
                <ToggleButton value='table'>
                  <TableViewIcon fontSize='small' />
                  Tabla
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

          {activeFiltersCount > 0 ? (
            <Stack direction='row' spacing={1} sx={{ mt: 2, mb: 0, flexWrap: 'wrap' }}>
              {search.trim() ? (
                <Chip size='small' label={`Buscar: "${search}"`} onDelete={() => setSearch('')} variant='outlined' sx={{ borderRadius: '8px', '& .MuiChip-label': { fontSize: '0.75rem' } }} />
              ) : null}
              {statusFilter !== FILTER_ALL ? (
                <Chip size='small' label={`Estado: ${CALIBRATION_SERVICE_STATUS_LABELS[statusFilter] || statusFilter}`} onDelete={() => setStatusFilter(FILTER_ALL)} variant='outlined' sx={{ borderRadius: '8px', '& .MuiChip-label': { fontSize: '0.75rem' } }} />
              ) : null}
              {customerFilter !== FILTER_ALL ? (
                <Chip size='small' label={`Cliente: ${customerFilter}`} onDelete={() => setCustomerFilter(FILTER_ALL)} variant='outlined' sx={{ borderRadius: '8px', '& .MuiChip-label': { fontSize: '0.75rem' } }} />
              ) : null}
              {showOnlyMyLoad ? (
                <Chip size='small' label='Mi carga' onDelete={() => setShowOnlyMyLoad(false)} variant='outlined' color='success' sx={{ borderRadius: '8px', '& .MuiChip-label': { fontSize: '0.75rem' } }} />
              ) : null}
              {showOnlyReadyForInvoice ? (
                <Chip size='small' label='Por facturar' onDelete={() => setShowOnlyReadyForInvoice(false)} variant='outlined' color='info' sx={{ borderRadius: '8px', '& .MuiChip-label': { fontSize: '0.75rem' } }} />
              ) : null}
            </Stack>
          ) : null}

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
        <Stack spacing={1.5}>
          {groupedListServices.map((group) => {
            const isDefaultExpanded = group.key !== 'closed'
            return (
              <Accordion
                key={group.key}
                defaultExpanded={isDefaultExpanded}
                disableGutters
                elevation={0}
                sx={{
                  border: `1px solid ${alpha(group.accent, 0.16)}`,
                  borderRadius: '16px !important',
                  '&::before': { display: 'none' },
                  overflow: 'hidden'
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreOutlinedIcon />}
                  sx={{
                    background: `linear-gradient(90deg, ${alpha(group.accent, 0.06)} 0%, transparent 100%)`,
                    borderBottom: `1px solid ${alpha(group.accent, 0.1)}`,
                    minHeight: 48,
                    '&.Mui-expanded': { minHeight: 48 },
                    '& .MuiAccordionSummary-content': { my: 1 }
                  }}
                >
                  <Stack direction='row' spacing={1.5} alignItems='center'>
                    <Box sx={{ width: 4, height: 24, borderRadius: 2, backgroundColor: group.accent }} />
                    <Typography variant='subtitle1' fontWeight={800} sx={{ color: ui.text }}>
                      {group.title}
                    </Typography>
                    <Chip
                      size='small'
                      label={group.services.length}
                      sx={{ bgcolor: alpha(group.accent, 0.12), color: group.accent, fontWeight: 800 }}
                    />
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 2 }}>
                  <Stack spacing={2}>
                    {group.services.map(renderServiceCard)}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            )
          })}
        </Stack>
      ) : viewMode === 'table' ? (
        <MaterialReactTable
          columns={[
            {
              accessorKey: 'serviceCode',
              header: 'Código',
              size: 140,
              Cell: ({ row }) => (
                <Stack spacing={0.5}>
                  <Typography variant='body2' fontWeight={700} sx={{ color: ui.text, lineHeight: 1.2 }}>{row.original.serviceCode}</Typography>
                  {row.original.odsCode ? <Typography variant='caption' sx={{ color: ui.greenDark }}>{row.original.odsCode}</Typography> : null}
                </Stack>
              )
            },
            {
              accessorFn: (s) => s.customer?.nombre || s.executionCustomerName || '',
              header: 'Cliente',
              size: 200,
              Cell: ({ cell }) => <Typography variant='body2' sx={{ color: ui.textSecondary, fontWeight: 600 }}>{cell.getValue<string>()}</Typography>
            },
            {
              accessorKey: 'status',
              header: 'Estado',
              size: 130,
              filterVariant: 'select',
              filterSelectOptions: STATUS_OPTIONS.filter(o => o.value !== FILTER_ALL).map(o => ({ text: o.label, value: o.value })),
              Cell: ({ cell }) => <Chip size='small' color={CALIBRATION_SERVICE_STATUS_COLORS[cell.getValue<CalibrationServiceStatus>()]} label={CALIBRATION_SERVICE_STATUS_LABELS[cell.getValue<CalibrationServiceStatus>()]} />
            },
            {
              accessorKey: 'slaIndicator.color',
              header: 'SLA',
              size: 90,
              filterVariant: 'select',
              filterSelectOptions: SLA_OPTIONS.filter(o => o.value !== FILTER_ALL).map(o => ({ text: o.label, value: o.value })),
              Cell: ({ row }) => <Chip size='small' color={CALIBRATION_SERVICE_SLA_COLORS[row.original.slaIndicator?.color || 'gray']} label={row.original.slaIndicator?.label || '—'} />
            },
            ...(!isTechnicalOnlyView ? [{
              accessorKey: 'approvalStatus' as const,
              header: 'Respuesta cliente' as const,
              size: 130 as const,
              filterVariant: 'select' as const,
              filterSelectOptions: (APPROVAL_OPTIONS as any[]).filter((o: any) => o.value !== FILTER_ALL).map((o: any) => ({ text: o.label, value: o.value })),
              Cell: ({ cell }: any) => <Chip size='small' color={(CALIBRATION_SERVICE_APPROVAL_COLORS as any)[cell.getValue() as string]} label={(CALIBRATION_SERVICE_APPROVAL_LABELS as any)[cell.getValue() as string]} />
            }] : []),
            {
              accessorFn: (s) => {
                const names = getMetrologistNames(s)
                return names.length > 0 ? names.join(', ') : ''
              },
              header: 'Metrólogo(s)',
              size: 160,
              Cell: ({ cell }) => {
                const name = cell.getValue<string>()
                return name ? <Typography variant='body2' sx={{ color: ui.muted }}>{name}</Typography> : <Typography variant='body2' sx={{ color: ui.muted }}>—</Typography>
              }
            },
            {
              accessorFn: (s) => s.items?.length ?? 0,
              header: 'Ítems',
              size: 60
            },
            ...(!isTechnicalOnlyView ? [{
              accessorFn: (s: CalibrationService) => getItemsTotal(s),
              header: 'Valor' as const,
              size: 100 as const,
              Cell: ({ cell }: any) => <Typography variant='body2' fontWeight={700} sx={{ color: ui.greenDark }}>{currencyFormatter.format(cell.getValue() as number)}</Typography>
            }] : []),
            {
              accessorFn: (s) => new Date(s.updatedAt),
              header: 'Actualizado',
              size: 90,
              Cell: ({ cell }) => <Typography variant='body2' sx={{ color: ui.muted }}>{cell.getValue<Date>().toLocaleDateString('es-CO')}</Typography>
            },
            {
              id: 'actions',
              header: '',
              size: 80,
              Cell: ({ row }) => <Button size='small' variant='outlined' onClick={() => openServiceDetail(row.original.id)} sx={secondaryButtonSx}>Ver</Button>
            }
          ]}
          data={visibleServices}
          enableColumnActions={false}
          enableColumnFilters
          enableGlobalFilter
          enablePagination={false}
          enableSorting
          enableBottomToolbar={false}
          enableTopToolbar
          localization={MRT_Localization_ES}
          muiTableBodyRowProps={{
            sx: { cursor: 'pointer' }
          }}
          muiTableProps={{
            sx: { borderRadius: '16px', border: `1px solid ${ui.border}`, '& td': { py: 0.75 } }
          }}
        />
      ) : (
        <Stack spacing={1.25}>
          <Box
            ref={kanbanTopScrollRef}
            onScroll={(event) => {
              if (kanbanScrollRef.current) {
                kanbanScrollRef.current.scrollLeft = event.currentTarget.scrollLeft
              }
            }}
            sx={{
              overflowX: 'auto',
              overflowY: 'hidden',
              height: 12,
              borderRadius: '999px',
              bgcolor: alpha(ui.textSecondary, 0.08),
              '&::-webkit-scrollbar': {
                height: 10
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: alpha(ui.textSecondary, 0.28),
                borderRadius: '999px'
              }
            }}
          >
            <Box sx={{ width: Math.max(kanbanScrollWidth, 1), height: 1 }} />
          </Box>
          <Box
            ref={kanbanScrollRef}
            onScroll={(event) => {
              if (kanbanTopScrollRef.current) {
                kanbanTopScrollRef.current.scrollLeft = event.currentTarget.scrollLeft
              }
            }}
            sx={{ overflowX: 'auto', pb: 1 }}
          >
          <Stack
            direction='row'
            spacing={2}
            alignItems='flex-start'
            sx={{ minWidth: 'max-content' }}
          >
            {kanbanServices.map((column) => {
              const isEmptyColumn = column.services.length === 0

              return (
              <Box
                key={column.key}
                sx={{
                  width: isEmptyColumn ? 172 : 312,
                  minWidth: isEmptyColumn ? 172 : 312,
                  borderRadius: '20px',
                  border: `1px solid ${alpha(column.accent, 0.16)}`,
                  background: `linear-gradient(180deg, ${alpha(
                    column.accent,
                    0.08
                  )} 0%, rgba(255,255,255,0.88) 22%)`,
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 6px 18px rgba(15, 23, 42, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: 'calc(100vh - 220px)',
                  overflow: 'hidden'
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
                        {isEmptyColumn
                          ? getCompactColumnTitle(column.title)
                          : column.title}
                      </Typography>
                      {!isEmptyColumn ? (
                        <Typography
                          variant='body2'
                          sx={{ mt: 0.5, color: ui.textSecondary, lineHeight: 1.45 }}
                        >
                          {column.description}
                        </Typography>
                      ) : null}
                    </Box>
                    <Chip
                      size='small'
                      label={column.services.length}
                      sx={{
                        bgcolor: alpha(column.accent, 0.14),
                        color: column.accent,
                        fontWeight: 800
                      }}
                    />
                  </Stack>
                </Box>

                <Stack
                  spacing={1}
                  sx={{
                    p: 1.5,
                    minHeight: 0,
                    flex: 1,
                    overflowY: 'auto',
                    scrollbarWidth: 'thin'
                  }}
                >
                  {column.services.length === 0 ? (
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: '16px',
                        border: `1px dashed ${alpha(column.accent, 0.24)}`,
                        bgcolor: alpha(column.accent, 0.04),
                        minHeight: 72,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Typography
                        variant='caption'
                        sx={{ color: ui.textSecondary, lineHeight: 1.45 }}
                      >
                        Sin servicios.
                      </Typography>
                    </Box>
                  ) : (
                    column.services.map((service) => {
                      const slaTone = getSlaVisualTone(
                        service.slaIndicator?.color || 'gray'
                      )
                      const assignedMetrologistNames = getMetrologistNames(service)
                      const assignedMetrologistName = assignedMetrologistNames[0] || ''
                      const customerLabel =
                        service.customer?.nombre ||
                        service.executionCustomerName ||
                        'Cliente pendiente'

                      return (
                        <Card
                          key={service.id}
                          elevation={0}
                          onClick={() => openServiceDetail(service.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              openServiceDetail(service.id)
                            }
                          }}
                          role='button'
                          tabIndex={0}
                          sx={{
                            borderRadius: '14px',
                            border: `1px solid ${slaTone.border}`,
                            background: slaTone.background,
                            boxShadow: slaTone.glow,
                            position: 'relative',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            flexShrink: 0,
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-1px)',
                              boxShadow: `0 10px 22px ${alpha(slaTone.accent, 0.16)}`
                            },
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
                          <CardContent sx={{ p: 1.5 }}>
                            <Stack spacing={1.1}>
                              <Stack
                                direction='row'
                                justifyContent='space-between'
                                alignItems='flex-start'
                                spacing={1}
                              >
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography
                                    variant='subtitle2'
                                    fontWeight={800}
                                    sx={{ color: ui.text, lineHeight: 1.2 }}
                                  >
                                    <Box component='span' title='Código interno del servicio (SCL)' sx={{ cursor: 'help' }}>
                                      {service.serviceCode}
                                    </Box>
                                    {service.quoteCode ? (
                                      <Box component='span' title='Consecutivo de cotización' sx={{ ml: 1, color: '#059669', fontWeight: 700, fontSize: '0.75rem', cursor: 'help' }}>
                                        · {service.quoteCode}
                                      </Box>
                                    ) : null}
                                  </Typography>
                                  <Typography
                                    variant='caption'
                                    title={customerLabel}
                                    sx={{
                                      color: ui.textSecondary,
                                      mt: 0.25,
                                      fontWeight: 700,
                                      lineHeight: 1.35,
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                      minHeight: '2.7em'
                                    }}
                                  >
                                    {customerLabel}
                                  </Typography>
                                </Box>
                                <Chip
                                  size='small'
                                  label={getCompactSlaLabel(service.slaIndicator?.color)}
                                  sx={{
                                    bgcolor: alpha(slaTone.accent, 0.12),
                                    color: slaTone.accent,
                                    fontWeight: 800,
                                    height: 24
                                  }}
                                />
                              </Stack>

                              <Stack
                                direction='row'
                                spacing={0.75}
                                flexWrap='wrap'
                                useFlexGap
                              >
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
                              </Stack>

                              {service.scopeType === 'site' ? (
                                <Typography
                                  variant='caption'
                                  sx={{ color: ui.muted, lineHeight: 1.35 }}
                                >
                                  Sede: {getServiceSiteLabel(service)}
                                </Typography>
                              ) : null}

                              {assignedMetrologistName ? (
                                <Typography
                                  variant='caption'
                                  sx={{
                                    color: ui.textSecondary,
                                    lineHeight: 1.3,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 1,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}
                                >
                                  {assignedMetrologistNames.length > 1
                                    ? `Metrólogos: ${assignedMetrologistNames.join(', ')}`
                                    : `Metrólogo: ${assignedMetrologistName}`}
                                </Typography>
                              ) : null}

                              <Stack
                                direction='row'
                                justifyContent='space-between'
                                alignItems='center'
                                sx={{
                                  pt: 0.25,
                                  color: ui.textSecondary
                                }}
                              >
                                <Typography variant='caption' fontWeight={700}>
                                  {service.items?.length ?? 0} item
                                  {(service.items?.length ?? 0) === 1 ? '' : 's'}
                                </Typography>
                                {(service.cuts || []).some(c => c.status === 'ready_for_invoicing') ? (
                                  <Chip size='small' color='info' variant='outlined' label='Facturar' sx={{ height: 20, '& .MuiChip-label': { fontSize: '0.65rem', px: 0.5 } }} />
                                ) : null}
                                {(service.otherFields as any)?.hasEquipmentSale === true ? (
                                  <Chip size='small' color='warning' variant='outlined' label='Venta' sx={{ height: 20, '& .MuiChip-label': { fontSize: '0.65rem', px: 0.5 } }} />
                                ) : null}
                                <Typography
                                  variant='caption'
                                  fontWeight={800}
                                  sx={{ color: ui.greenDark }}
                                >
                                  {isTechnicalOnlyView
                                    ? service.odsCode || 'ODS pendiente'
                                    : currencyFormatter.format(
                                        getItemsTotal(service)
                                      )}
                                </Typography>
                              </Stack>

                            </Stack>
                          </CardContent>
                        </Card>
                      )
                    })
                  )}
                </Stack>
              </Box>
              )
            })}
          </Stack>
          </Box>
        </Stack>
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

      <Dialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>Plantilla global de términos y condiciones</DialogTitle>
        <DialogContent dividers>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            Edita los términos que se cargarán por defecto al crear una nueva cotización.
            Usa {'{{validityDays}}'}, {'{{paymentMethod}}'}, {'{{instrumentDeliveryTime}}'}, {'{{certificateDeliveryTime}}'} como variables dinámicas.
          </Typography>
          <Stack spacing={1.5}>
            {CALIBRATION_QUOTE_TERM_KEYS.map((termKey) => (
              <Accordion
                key={termKey}
                disableGutters
                elevation={0}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px !important' }}
              >
                <AccordionSummary expandIcon={<ExpandMoreOutlinedIcon />}>
                  <Typography fontWeight={800}>
                    {CALIBRATION_QUOTE_TERM_LABELS[termKey]}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <CalibrationServiceRichTextEditor
                    value={templateTerms[termKey] || ''}
                    placeholder={`Escribe ${CALIBRATION_QUOTE_TERM_LABELS[termKey].toLowerCase()}`}
                    onChange={(value) => setTemplateTerm(termKey, value)}
                  />
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateDialogOpen(false)}>Cancelar</Button>
          <Button
            variant='contained'
            startIcon={<SaveOutlinedIcon />}
            onClick={handleSaveTemplate}
            disabled={upsertQuoteTermsTemplate.isLoading}
          >
            Guardar plantilla
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default CalibrationServicesPage
