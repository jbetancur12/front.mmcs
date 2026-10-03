import React, { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Popover,
  InputAdornment,
  Tooltip,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Snackbar
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import {
  Warning as WarningIcon,
  Search as SearchIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Send as SendIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  School as SchoolIcon,
  EditCalendar as EditCalendarIcon
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { getRoleLabelEs } from 'src/constants/roles'
import { useStore } from '@nanostores/react'
import { userStore } from 'src/store/userStore'
import { hasLmsAdminAccess, hasTrainingManagerRole } from 'src/utils/lmsIdentity'
import {
  useMandatoryTrainingStatus,
  useTriggerManualReminders,
  useSetCourseCompletionDate,
  useSetUserAssignmentDates,
  useResetUserCourseProgress
} from '../../../hooks/useLms'
import { useNavigate, useSearchParams } from 'react-router-dom'

interface ComplianceRecord {
  id: number
  userId: number
  userName: string
  userEmail: string
  department: string
  courseId: number
  courseTitle: string
  assignedDate: string
  deadline: string
  completedDate?: string
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  progress: number
  daysUntilDeadline: number | null
  isOverdue: boolean
  reminderSummary?: {
    totalNotifications: number
    reminderNotifications: number
    manualReminderNotifications: number
    unreadReminderNotifications: number
    lastNotificationAt: string | null
    lastReminderAt: string | null
    lastManualReminderAt: string | null
    lastReminderType: string | null
  }
}

const hasUpcomingDeadline = (record: Pick<ComplianceRecord, 'isOverdue' | 'daysUntilDeadline' | 'status'>) =>
  !record.isOverdue
  && record.status !== 'completed'
  && typeof record.daysUntilDeadline === 'number'
  && record.daysUntilDeadline <= 7

const formatDeadlineLabel = (record: Pick<ComplianceRecord, 'deadline' | 'isOverdue' | 'daysUntilDeadline' | 'status'>) => {
  if (!record.deadline) {
    return 'Sin fecha límite'
  }

  if (record.isOverdue && typeof record.daysUntilDeadline === 'number') {
    return `Vencido hace ${Math.abs(record.daysUntilDeadline)} días`
  }

  if (hasUpcomingDeadline(record) && typeof record.daysUntilDeadline === 'number') {
    return `Vence en ${record.daysUntilDeadline} días`
  }

  return new Date(record.deadline).toLocaleDateString()
}

const formatFollowUpLabel = (record: Pick<ComplianceRecord, 'reminderSummary'>) => {
  const lastReminder = record.reminderSummary?.lastReminderAt
    || record.reminderSummary?.lastNotificationAt

  if (!lastReminder) {
    return 'Sin seguimiento enviado'
  }

  return new Date(lastReminder).toLocaleString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const getCompliancePriority = (record: ComplianceRecord) => {
  if (record.status === 'overdue') return 0
  if (hasUpcomingDeadline(record)) return 1
  if ((record.reminderSummary?.lastReminderAt || record.reminderSummary?.lastNotificationAt) == null && record.status !== 'completed') return 2
  if (record.status === 'in_progress') return 3
  if (record.status === 'pending') return 4
  return 5
}

const recordKey = (record: Pick<ComplianceRecord, 'userId' | 'courseId'>) => `${record.userId}-${record.courseId}`

const DEFAULT_FILTERS: {
  status: string[]
  userQuery: string
  department: string
  courseId: number | null
  daysUntilDeadline: number | null
} = {
  status: [],
  userQuery: '',
  department: '',
  courseId: null,
  daysUntilDeadline: null
}

const readStoredFilters = (): typeof DEFAULT_FILTERS => {
  try {
    const raw = sessionStorage.getItem('lms:compliance:filters')
    if (!raw) return { ...DEFAULT_FILTERS }
    return { ...DEFAULT_FILTERS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_FILTERS }
  }
}

const LmsComplianceTracker: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(() => {
    const raw = sessionStorage.getItem('lms:compliance:tab')
    // Solo existen dos vistas: registros (0) y por curso (4)
    return raw && Number(raw) === 4 ? 4 : 0
  })
  type QuickFilter = 'all' | 'overdue' | 'soon' | 'pending' | 'completed'
  const [quick, setQuick] = useState<QuickFilter>(
    () => (sessionStorage.getItem('lms:compliance:quick') as QuickFilter) || 'all'
  )
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [selectedRecord, setSelectedRecord] = useState<ComplianceRecord | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [reminderMessage, setReminderMessage] = useState('')
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false)
  const [detailsRecord, setDetailsRecord] = useState<ComplianceRecord | null>(null)

  // Filtros (persistidos en sessionStorage para sobrevivir la navegación)
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLButtonElement | null>(null)
  const [filters, setFilters] = useState(readStoredFilters)

  // Fetch mandatory training status from API
  const { data: trainingData, isLoading, error } = useMandatoryTrainingStatus({
    includeCompleted: true
  })
  const triggerManualRemindersMutation = useTriggerManualReminders()
  const setCompletionMutation = useSetCourseCompletionDate()
  const setUserDatesMutation = useSetUserAssignmentDates()
  const resetProgressMutation = useResetUserCourseProgress()

  // Edición de fechas (modal detalle)
  const [dateScope, setDateScope] = useState<'user' | 'group' | 'group-clear'>('user')
  const [editAssignedAt, setEditAssignedAt] = useState<Date | null>(null)
  const [editDeadline, setEditDeadline] = useState<Date | null>(null)
  const [editCompletedAt, setEditCompletedAt] = useState<Date | null>(null)
  const [savingDates, setSavingDates] = useState(false)

  // Selección múltiple + edición en lote
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkCompletedAt, setBulkCompletedAt] = useState<Date | null>(null)
  const [bulkAssignedAt, setBulkAssignedAt] = useState<Date | null>(null)
  const [bulkDeadline, setBulkDeadline] = useState<Date | null>(null)
  const [bulkSaving, setBulkSaving] = useState(false)

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  // Modo edición oculto por defecto: se habilita con ?show=true (se recuerda
  // en sessionStorage); ?show=false lo apaga. La protección real está en el backend.
  const $userStore = useStore(userStore)
  const canEdit = hasLmsAdminAccess($userStore.rol) || hasTrainingManagerRole($userStore.rol)
  const [editMode, setEditMode] = useState(() => sessionStorage.getItem('lms:compliance:edit') === '1')
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const showParam = searchParams.get('show')
    if (showParam !== 'true' && showParam !== 'false') return

    const next = canEdit && showParam === 'true'
    setEditMode(next)
    sessionStorage.setItem('lms:compliance:edit', next ? '1' : '0')
    if (!next) setSelectedKeys([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, canEdit])

  // Persistir filtros y tab entre navegaciones
  useEffect(() => {
    sessionStorage.setItem('lms:compliance:filters', JSON.stringify(filters))
  }, [filters])

  useEffect(() => {
    sessionStorage.setItem('lms:compliance:tab', String(activeTab))
  }, [activeTab])

  useEffect(() => {
    sessionStorage.setItem('lms:compliance:quick', quick)
  }, [quick])

  // Al cambiar filtros o el indicador activo se vuelve a la primera página
  useEffect(() => {
    setPage(0)
  }, [filters, quick])

  const disableEditMode = () => {
    sessionStorage.setItem('lms:compliance:edit', '0')
    setEditMode(false)
    setSelectedKeys([])
    const next = new URLSearchParams(searchParams)
    next.set('show', 'false')
    setSearchParams(next, { replace: true })
  }

  // Transform API data to component format
  const complianceRecords = useMemo(() => {
    if (!trainingData || !trainingData.mandatoryTraining) {
      return []
    }

    const records = trainingData.mandatoryTraining.map((training: any, index: number) => ({
      id: training.assignmentId || index,
      userId: training.userId,
      userName: training.userName,
      userEmail: training.userEmail || 'N/A',
      department: training.department || training.role || 'N/A',
      courseId: training.courseId,
      courseTitle: training.courseTitle,
      assignedDate: training.assignedDate,
      deadline: training.deadline,
      completedDate: training.completedDate,
      progress: training.progress || 0,
      status: training.status,
      daysUntilDeadline: training.daysUntilDeadline ?? null,
      isOverdue: training.isOverdue || false,
      reminderSummary: training.reminderSummary || {
        totalNotifications: 0,
        reminderNotifications: 0,
        manualReminderNotifications: 0,
        unreadReminderNotifications: 0,
        lastNotificationAt: null,
        lastReminderAt: null,
        lastManualReminderAt: null,
        lastReminderType: null
      }
    }))

    // Deduplicate by userId + courseId (in case backend returns duplicates)
    const seen = new Map<string, ComplianceRecord>()
    records.forEach((record: ComplianceRecord) => {
      const key = `${record.userId}-${record.courseId}`
      if (!seen.has(key)) {
        seen.set(key, record)
      }
    })

    return Array.from(seen.values())
  }, [trainingData])

  // Calculate compliance alerts from data
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'overdue':
        return 'error'
      case 'in_progress':
        return 'warning'
      case 'pending':
        return 'info'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado'
      case 'overdue':
        return 'Vencido'
      case 'in_progress':
        return 'En Progreso'
      case 'pending':
        return 'Pendiente'
      default:
        return status
    }
  }

  const handleSendReminder = (record: ComplianceRecord) => {
    setSelectedRecord(record)
    setReminderMessage(`Recordatorio: El curso "${record.courseTitle}" ${record.isOverdue ? 'está vencido' : `vence el ${new Date(record.deadline).toLocaleDateString()}`}. Por favor, completa las lecciones restantes.`)
    setOpenDialog(true)
  }

  const handleSendReminderConfirm = () => {
    if (!selectedRecord?.id) {
      setOpenDialog(false)
      setReminderMessage('')
      setSelectedRecord(null)
      return
    }

    triggerManualRemindersMutation.mutate({
      assignmentIds: [selectedRecord.id],
      customMessage: reminderMessage.trim() || undefined
    })
    setOpenDialog(false)
    setReminderMessage('')
    setSelectedRecord(null)
  }

  const handleViewDetails = (record: ComplianceRecord) => {
    setDetailsRecord(record)
    setDateScope('user')
    setEditAssignedAt(record.assignedDate ? new Date(record.assignedDate) : null)
    setEditDeadline(record.deadline ? new Date(record.deadline) : null)
    setEditCompletedAt(record.completedDate ? new Date(record.completedDate) : null)
    setOpenDetailsDialog(true)
  }

  const handleCloseDetails = () => {
    setOpenDetailsDialog(false)
    setDetailsRecord(null)
  }

  const handleSaveDates = async () => {
    if (!detailsRecord) return

    if (
      detailsRecord.status === 'completed' &&
      editCompletedAt &&
      editAssignedAt &&
      editCompletedAt < editAssignedAt
    ) {
      setSnackbar({
        open: true,
        message: 'La fecha de finalización no puede ser anterior a la fecha de asignación',
        severity: 'error'
      })
      return
    }

    setSavingDates(true)
    try {
      const jobs: Promise<any>[] = [
        setUserDatesMutation.mutateAsync({
          scope: dateScope,
          userId: detailsRecord.userId,
          courseId: detailsRecord.courseId,
          assignmentId: detailsRecord.id,
          assigned_at: editAssignedAt ? editAssignedAt.toISOString() : null,
          deadline: editDeadline ? editDeadline.toISOString() : null
        })
      ]

      if (detailsRecord.status === 'completed' && editCompletedAt) {
        jobs.push(
          setCompletionMutation.mutateAsync({
            userId: detailsRecord.userId,
            courseId: detailsRecord.courseId,
            completedAt: editCompletedAt.toISOString()
          })
        )
      }

      await Promise.all(jobs)
      setSnackbar({ open: true, message: 'Fechas actualizadas', severity: 'success' })
      handleCloseDetails()
    } catch (e: any) {
      setSnackbar({
        open: true,
        message: e?.message || 'No se pudieron actualizar las fechas',
        severity: 'error'
      })
    } finally {
      setSavingDates(false)
    }
  }

  const handleResetToGroup = async () => {
    if (!detailsRecord) return
    setSavingDates(true)
    try {
      await setUserDatesMutation.mutateAsync({
        scope: 'clear',
        userId: detailsRecord.userId,
        courseId: detailsRecord.courseId
      })
      setSnackbar({ open: true, message: 'Fechas restablecidas al grupo', severity: 'success' })
      handleCloseDetails()
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.message || 'No se pudo restablecer', severity: 'error' })
    } finally {
      setSavingDates(false)
    }
  }

  const handleResetCourse = async () => {
    if (!detailsRecord) return
    const confirmed = window.confirm(
      `¿Reiniciar el avance de ${detailsRecord.userName} en "${detailsRecord.courseTitle}"?\n\nSe borran el progreso y los recordatorios. Los certificados emitidos se conservan.`
    )
    if (!confirmed) return
    try {
      await resetProgressMutation.mutateAsync({
        userId: detailsRecord.userId,
        courseId: detailsRecord.courseId
      })
      setSnackbar({ open: true, message: 'Curso reiniciado', severity: 'success' })
      handleCloseDetails()
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.message || 'No se pudo reiniciar el curso', severity: 'error' })
    }
  }

  const toggleSelect = (key: string) =>
    setSelectedKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))

  const handleBulkApply = async () => {
    const selected = filteredRecords.filter((r) => selectedKeys.includes(recordKey(r)))
    if (selected.length === 0) return

    if (bulkCompletedAt && bulkAssignedAt && bulkCompletedAt < bulkAssignedAt) {
      setSnackbar({
        open: true,
        message: 'La fecha de finalización no puede ser anterior a la fecha de asignación',
        severity: 'error'
      })
      return
    }

    setBulkSaving(true)
    try {
      const jobs: Promise<any>[] = []

      if (bulkCompletedAt) {
        jobs.push(
          setCompletionMutation.mutateAsync({
            completedAt: bulkCompletedAt.toISOString(),
            items: selected.map((r) => ({ userId: r.userId, courseId: r.courseId }))
          })
        )
      }

      if (bulkAssignedAt || bulkDeadline) {
        for (const r of selected) {
          jobs.push(
            setUserDatesMutation.mutateAsync({
              scope: 'user',
              userId: r.userId,
              courseId: r.courseId,
              assigned_at: bulkAssignedAt ? bulkAssignedAt.toISOString() : undefined,
              deadline: bulkDeadline ? bulkDeadline.toISOString() : undefined
            })
          )
        }
      }

      await Promise.all(jobs)
      setSnackbar({ open: true, message: `Fechas aplicadas a ${selected.length} registro(s)`, severity: 'success' })
      setBulkOpen(false)
      setSelectedKeys([])
      setBulkCompletedAt(null)
      setBulkAssignedAt(null)
      setBulkDeadline(null)
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.message || 'No se pudo aplicar en lote', severity: 'error' })
    } finally {
      setBulkSaving(false)
    }
  }

  // Helper function to apply user filters (memoized with useCallback)
  const applyUserFilters = useCallback((records: ComplianceRecord[]) => {
    let filtered = records

    // Filter by status
    if (filters.status.length > 0) {
      filtered = filtered.filter(r => filters.status.includes(r.status))
    }

    // Búsqueda por nombre, correo o curso (parcial, sin distinguir mayúsculas)
    if (filters.userQuery.trim()) {
      const term = filters.userQuery.trim().toLowerCase()
      filtered = filtered.filter(r =>
        (r.userName || '').toLowerCase().includes(term) ||
        (r.userEmail || '').toLowerCase().includes(term) ||
        (r.courseTitle || '').toLowerCase().includes(term)
      )
    }

    // Filter by department
    if (filters.department) {
      filtered = filtered.filter(r => r.department === filters.department)
    }

    // Filter by course
    if (filters.courseId) {
      filtered = filtered.filter(r => r.courseId === filters.courseId)
    }

    // Filter by days until deadline
    if (filters.daysUntilDeadline !== null) {
      filtered = filtered.filter(
        r => typeof r.daysUntilDeadline === 'number' && r.daysUntilDeadline <= filters.daysUntilDeadline!
      )
    }

    return filtered
  }, [filters])

  // Base categories (without user filters)
  const baseOverdueRecords = useMemo(() =>
    complianceRecords.filter(r => r.isOverdue),
    [complianceRecords]
  )

  const baseApproachingDeadline = useMemo(() =>
    complianceRecords.filter(hasUpcomingDeadline),
    [complianceRecords]
  )

  const baseCompletedRecords = useMemo(() =>
    complianceRecords.filter(r => r.status === 'completed'),
    [complianceRecords]
  )

  // Apply user filters to each category
  const filteredRecords = useMemo(() => applyUserFilters(complianceRecords), [complianceRecords, applyUserFilters])
  const prioritizedRecords = useMemo(() => {
    return [...filteredRecords].sort((left, right) => {
      const priorityDiff = getCompliancePriority(left) - getCompliancePriority(right)
      if (priorityDiff !== 0) return priorityDiff

      const leftDeadline = left.deadline ? new Date(left.deadline).getTime() : Number.MAX_SAFE_INTEGER
      const rightDeadline = right.deadline ? new Date(right.deadline).getTime() : Number.MAX_SAFE_INTEGER
      return leftDeadline - rightDeadline
    })
  }, [filteredRecords])
  const overdueRecords = useMemo(() => applyUserFilters(baseOverdueRecords), [baseOverdueRecords, applyUserFilters])
  const approachingDeadline = useMemo(() => applyUserFilters(baseApproachingDeadline), [baseApproachingDeadline, applyUserFilters])
  const completedRecords = useMemo(() => applyUserFilters(baseCompletedRecords), [baseCompletedRecords, applyUserFilters])

  const pendingRecords = useMemo(
    () => filteredRecords.filter((r) => r.status === 'pending'),
    [filteredRecords]
  )

  // Lo que muestra la tabla: filtros del usuario + indicador activo (vencidos, por vencer, etc.)
  const tableRecords = useMemo(() => {
    switch (quick) {
      case 'overdue':
        return prioritizedRecords.filter((r) => r.isOverdue)
      case 'soon':
        return prioritizedRecords.filter(hasUpcomingDeadline)
      case 'pending':
        return prioritizedRecords.filter((r) => r.status === 'pending')
      case 'completed':
        return prioritizedRecords.filter((r) => r.status === 'completed')
      default:
        return prioritizedRecords
    }
  }, [prioritizedRecords, quick])
  const pagedRecords = tableRecords.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  // Selección múltiple sobre los registros visibles
  const visibleKeys = useMemo(() => tableRecords.map(recordKey), [tableRecords])
  const selectedRecords = useMemo(
    () => tableRecords.filter((r) => selectedKeys.includes(recordKey(r))),
    [tableRecords, selectedKeys]
  )
  const allVisibleSelected = visibleKeys.length > 0 && visibleKeys.every((k) => selectedKeys.includes(k))
  const someVisibleSelected = visibleKeys.some((k) => selectedKeys.includes(k)) && !allVisibleSelected

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedKeys((prev) => prev.filter((k) => !visibleKeys.includes(k)))
    } else {
      setSelectedKeys((prev) => Array.from(new Set([...prev, ...visibleKeys])))
    }
  }

  // Get unique values for filter options
  const uniqueDepartments = useMemo(() => {
    return Array.from(new Set(complianceRecords.map(r => r.department))).filter(d => d && d !== 'N/A')
  }, [complianceRecords])

  const uniqueCourses = useMemo(() => {
    const courseMap = new Map<number, string>()
    complianceRecords.forEach(r => {
      if (!courseMap.has(r.courseId)) {
        courseMap.set(r.courseId, r.courseTitle)
      }
    })
    return Array.from(courseMap.entries()).map(([id, title]) => ({ id, title }))
  }, [complianceRecords])

  // Group records by course
  const recordsByCourse = useMemo(() => {
    const grouped = new Map<number, { courseTitle: string; records: ComplianceRecord[] }>()

    filteredRecords.forEach(record => {
      if (!grouped.has(record.courseId)) {
        grouped.set(record.courseId, {
          courseTitle: record.courseTitle,
          records: []
        })
      }
      grouped.get(record.courseId)!.records.push(record)
    })

    return Array.from(grouped.entries()).map(([courseId, data]) => ({
      courseId,
      courseTitle: data.courseTitle,
      records: data.records,
      totalUsers: data.records.length,
      completedUsers: data.records.filter(r => r.status === 'completed').length,
      overdueUsers: data.records.filter(r => r.isOverdue).length,
      completionRate: Math.round((data.records.filter(r => r.status === 'completed').length / data.records.length) * 100)
    }))
  }, [filteredRecords])

  // Export to CSV
  const handleExport = () => {
    const headers = ['Usuario', 'Email', 'Curso', 'Rol', 'Estado', 'Progreso', 'Fecha límite', 'Días restantes']
    const rows = tableRecords.map(r => [
      r.userName,
      r.userEmail,
      r.courseTitle,
      r.department ? getRoleLabelEs(r.department) : 'N/A',
      getStatusLabel(r.status),
      `${r.progress}%`,
      new Date(r.deadline).toLocaleDateString(),
      formatDeadlineLabel(r)
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `compliance_tracker_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleOpenFilters = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchorEl(event.currentTarget)
  }

  const handleCloseFilters = () => {
    setFilterAnchorEl(null)
  }

  const handleStatusFilterChange = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status]
    }))
  }

  const handleClearFilters = () => {
    setFilters({
      status: [],
      userQuery: '',
      department: '',
      courseId: null,
      daysUntilDeadline: null
    })
  }

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.status.length > 0) count++
    if (filters.userQuery.trim()) count++
    if (filters.department) count++
    if (filters.courseId) count++
    if (filters.daysUntilDeadline !== null) count++
    return count
  }, [filters])

  const openFiltersPopover = Boolean(filterAnchorEl)
  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Cargando datos de cumplimiento...
          </Typography>
        </Box>
      </Box>
    )
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center', maxWidth: 500 }}>
          <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" color="error" gutterBottom>
            Error al cargar datos de cumplimiento
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {error instanceof Error ? error.message : 'No se pudieron cargar los datos'}
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
          Seguimiento de Cumplimiento
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitorea el progreso de cursos obligatorios y gestiona vencimientos (Solo usuarios internos)
        </Typography>
      </Box>

      {prioritizedRecords[0] && (
        <Alert severity={prioritizedRecords[0].isOverdue ? 'error' : hasUpcomingDeadline(prioritizedRecords[0]) ? 'warning' : 'info'} sx={{ mb: 3 }}>
          Prioridad actual: <strong>{prioritizedRecords[0].userName}</strong> con <strong>{prioritizedRecords[0].courseTitle}</strong>. {formatDeadlineLabel(prioritizedRecords[0])}. Seguimiento: {formatFollowUpLabel(prioritizedRecords[0])}.
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' },
          gap: 1.5,
          mb: 3
        }}
      >
        {([
          { key: 'all', label: 'Todos los registros', value: filteredRecords.length, color: 'primary' },
          { key: 'overdue', label: 'Vencidos', value: overdueRecords.length, color: 'error' },
          { key: 'soon', label: 'Vencen en 7 días', value: approachingDeadline.length, color: 'warning' },
          { key: 'pending', label: 'Sin comenzar', value: pendingRecords.length, color: 'info' },
          { key: 'completed', label: 'Completados', value: completedRecords.length, color: 'success' }
        ] as Array<{ key: QuickFilter; label: string; value: number; color: 'primary' | 'error' | 'warning' | 'info' | 'success' }>).map((tile) => {
          const active = quick === tile.key && activeTab === 0
          return (
            <Box
              key={tile.key}
              role='button'
              tabIndex={0}
              onClick={() => {
                setQuick(tile.key)
                setActiveTab(0)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  setQuick(tile.key)
                  setActiveTab(0)
                }
              }}
              sx={(theme) => ({
                cursor: 'pointer',
                borderRadius: 3,
                p: 2,
                border: '1px solid',
                borderColor: active ? `${tile.color}.main` : 'divider',
                bgcolor: active ? alpha(theme.palette[tile.color].main, 0.1) : 'background.paper',
                transition: 'box-shadow .15s ease, border-color .15s ease',
                '&:hover': { boxShadow: 2 }
              })}
            >
              <Typography variant='h4' sx={{ fontWeight: 700, color: `${tile.color}.main`, lineHeight: 1.1 }}>
                {tile.value}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {tile.label}
              </Typography>
            </Box>
          )
        })}
      </Box>

      <Tabs value={activeTab === 4 ? 4 : 0} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab value={0} label='Registros' />
        <Tab value={4} label={`Por curso (${recordsByCourse.length})`} />
      </Tabs>

      {activeTab === 0 && (
        <Card variant='outlined' sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
            <TextField
              size='small'
              placeholder='Buscar por nombre, correo o curso...'
              value={filters.userQuery}
              onChange={(event) => setFilters((prev) => ({ ...prev, userQuery: event.target.value }))}
              sx={{ flex: '1 1 260px', minWidth: 220 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon fontSize='small' />
                  </InputAdornment>
                )
              }}
            />
            <FormControl size='small' sx={{ minWidth: 200 }}>
              <InputLabel>Curso</InputLabel>
              <Select
                label='Curso'
                value={filters.courseId ?? ''}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, courseId: event.target.value ? Number(event.target.value) : null }))
                }
              >
                <MenuItem value=''>Todos los cursos</MenuItem>
                {uniqueCourses.map((course) => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size='small' sx={{ minWidth: 160 }}>
              <InputLabel>Rol</InputLabel>
              <Select
                label='Rol'
                value={filters.department}
                onChange={(event) => setFilters((prev) => ({ ...prev, department: String(event.target.value) }))}
              >
                <MenuItem value=''>Todos los roles</MenuItem>
                {uniqueDepartments.map((department) => (
                  <MenuItem key={department} value={department}>
                    {getRoleLabelEs(department)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              startIcon={<FilterListIcon />}
              size='small'
              onClick={handleOpenFilters}
              variant={filters.status.length > 0 || filters.daysUntilDeadline !== null ? 'contained' : 'outlined'}
              color={filters.status.length > 0 || filters.daysUntilDeadline !== null ? 'primary' : 'inherit'}
            >
              Más filtros
            </Button>
            {(activeFiltersCount > 0 || quick !== 'all') && (
              <Button
                size='small'
                onClick={() => {
                  handleClearFilters()
                  setQuick('all')
                }}
              >
                Limpiar todo
              </Button>
            )}
            <Box sx={{ flex: 1 }} />
            {canEdit && editMode && (
              <Chip label='Modo edición — ocultar' color='secondary' variant='outlined' onClick={disableEditMode} />
            )}
            {editMode && selectedRecords.length > 0 && (
              <Button
                startIcon={<EditCalendarIcon />}
                size='small'
                onClick={() => setBulkOpen(true)}
                variant='contained'
                color='secondary'
              >
                Cambiar fechas ({selectedRecords.length})
              </Button>
            )}
            <Button startIcon={<DownloadIcon />} size='small' onClick={handleExport} variant='outlined'>
              Exportar
            </Button>
          </Box>

          <Box sx={{ px: 2, pb: 1.5, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
            <Typography variant='body2' color='text.secondary'>
              {tableRecords.length} de {complianceRecords.length} registros
            </Typography>
            {quick !== 'all' && (
              <Chip
                size='small'
                color='primary'
                label={
                  quick === 'overdue'
                    ? 'Solo vencidos'
                    : quick === 'soon'
                      ? 'Vencen en 7 días'
                      : quick === 'pending'
                        ? 'Sin comenzar'
                        : 'Completados'
                }
                onDelete={() => setQuick('all')}
              />
            )}
            {filters.status.map((status) => (
              <Chip
                key={status}
                size='small'
                label={getStatusLabel(status)}
                onDelete={() => handleStatusFilterChange(status)}
              />
            ))}
            {filters.daysUntilDeadline !== null && (
              <Chip
                size='small'
                label={`Vence en ≤ ${filters.daysUntilDeadline} días`}
                onDelete={() => setFilters((prev) => ({ ...prev, daysUntilDeadline: null }))}
              />
            )}
          </Box>

          <TableContainer sx={{ maxHeight: 640 }}>
            <Table stickyHeader size='small'>
              <TableHead>
                <TableRow>
                  {editMode && (
                    <TableCell padding='checkbox'>
                      <Checkbox
                        indeterminate={someVisibleSelected}
                        checked={allVisibleSelected}
                        onChange={toggleSelectAll}
                        inputProps={{ 'aria-label': 'Seleccionar todos' }}
                      />
                    </TableCell>
                  )}
                  <TableCell>Usuario</TableCell>
                  <TableCell>Curso</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Progreso</TableCell>
                  <TableCell>Último seguimiento</TableCell>
                  <TableCell
                    align='right'
                    sx={{ position: 'sticky', right: 0, zIndex: 3, bgcolor: 'background.paper' }}
                  >
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={editMode ? 7 : 6} align='center' sx={{ py: 8 }}>
                      <Typography variant='body1' color='text.secondary'>
                        No se encontraron registros con los filtros aplicados
                      </Typography>
                      <Button
                        variant='text'
                        onClick={() => {
                          handleClearFilters()
                          setQuick('all')
                        }}
                        sx={{ mt: 2 }}
                      >
                        Limpiar filtros
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedRecords.map((record) => {
                    const deadlineText = record.deadline
                      ? new Date(record.deadline).toLocaleDateString('es-CO')
                      : 'Sin fecha límite'
                    const showDeadlineLabel = record.isOverdue || hasUpcomingDeadline(record)
                    return (
                      <TableRow key={`${record.userId}-${record.courseId}`} hover>
                        {editMode && (
                          <TableCell padding='checkbox'>
                            <Checkbox
                              checked={selectedKeys.includes(recordKey(record))}
                              onChange={() => toggleSelect(recordKey(record))}
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <Typography variant='body2' fontWeight='medium'>
                            {record.userName}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {record.userEmail}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 260 }}>
                          <Typography variant='body2'>{record.courseTitle}</Typography>
                          <Typography variant='caption' color='text.secondary'>
                            Rol: {getRoleLabelEs(record.department)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(record.status)}
                            color={getStatusColor(record.status) as any}
                            size='small'
                          />
                          <Typography
                            variant='caption'
                            display='block'
                            sx={{ mt: 0.5 }}
                            color={record.isOverdue ? 'error.main' : hasUpcomingDeadline(record) ? 'warning.main' : 'text.secondary'}
                          >
                            {deadlineText}
                            {showDeadlineLabel ? ` · ${formatDeadlineLabel(record)}` : ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 110 }}>
                            <LinearProgress
                              variant='determinate'
                              value={record.progress}
                              sx={{ flex: 1, height: 6, borderRadius: 3 }}
                            />
                            <Typography variant='caption'>{record.progress}%</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>{formatFollowUpLabel(record)}</Typography>
                        </TableCell>
                        <TableCell
                          align='right'
                          sx={{
                            position: 'sticky',
                            right: 0,
                            bgcolor: 'background.paper',
                            boxShadow: '-6px 0 8px -6px rgba(0,0,0,0.15)'
                          }}
                        >
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                            <Tooltip title='Ver detalle'>
                              <IconButton size='small' onClick={() => handleViewDetails(record)}>
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            {record.status !== 'completed' && (
                              <Tooltip title='Enviar recordatorio'>
                                <IconButton size='small' color='primary' onClick={() => handleSendReminder(record)}>
                                  <SendIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component='div'
            count={tableRecords.length}
            page={page}
            onPageChange={(_event, next) => setPage(next)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10))
              setPage(0)
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage='Filas por página'
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
          />
        </Card>
      )}

      {activeTab === 4 && (
        <Card>
          <CardHeader
            title="Cursos Obligatorios - Vista por Curso"
            subheader={`${recordsByCourse.length} cursos con asignaciones`}
            action={
              <Button
                startIcon={<DownloadIcon />}
                size="small"
                onClick={handleExport}
                variant="outlined"
              >
                Exportar
              </Button>
            }
          />
          <CardContent>
            {recordsByCourse.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <SchoolIcon sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No hay cursos con asignaciones
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No se encontraron cursos obligatorios con usuarios asignados
                </Typography>
              </Box>
            ) : (
              recordsByCourse.map((course) => (
              <Accordion key={course.courseId} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <SchoolIcon color="primary" />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                        {course.courseTitle}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {course.totalUsers} usuarios asignados
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, mr: 2 }}>
                      <Chip
                        label={`${course.completionRate}% Completado`}
                        color={course.completionRate >= 80 ? 'success' : course.completionRate >= 50 ? 'warning' : 'error'}
                        size="small"
                      />
                      {course.overdueUsers > 0 && (
                        <Chip
                          label={`${course.overdueUsers} Vencidos`}
                          color="error"
                          size="small"
                          icon={<WarningIcon />}
                        />
                      )}
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {editMode && (
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={course.records.length > 0 && course.records.every((r) => selectedKeys.includes(recordKey(r)))}
                                indeterminate={course.records.some((r) => selectedKeys.includes(recordKey(r))) && !course.records.every((r) => selectedKeys.includes(recordKey(r)))}
                                onChange={() => {
                                  const keys = course.records.map(recordKey)
                                  const all = keys.every((k) => selectedKeys.includes(k))
                                  setSelectedKeys((prev) => all
                                    ? prev.filter((k) => !keys.includes(k))
                                    : Array.from(new Set([...prev, ...keys])))
                                }}
                              />
                            </TableCell>
                          )}
                          <TableCell>Usuario</TableCell>
                          <TableCell>Rol</TableCell>
                          <TableCell>Progreso</TableCell>
                          <TableCell>Estado</TableCell>
                          <TableCell>Fecha límite</TableCell>
                          <TableCell>Seguimiento</TableCell>
                          <TableCell>Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {course.records.map((record) => (
                          <TableRow key={`${record.userId}-${record.courseId}`}>
                            {editMode && (
                              <TableCell padding="checkbox">
                                <Checkbox
                                  checked={selectedKeys.includes(recordKey(record))}
                                  onChange={() => toggleSelect(recordKey(record))}
                                />
                              </TableCell>
                            )}
                            <TableCell>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {record.userName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {record.userEmail}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip label={getRoleLabelEs(record.department)} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={record.progress}
                                  sx={{ flex: 1, height: 6, borderRadius: 3 }}
                                />
                                <Typography variant="caption">
                                  {record.progress}%
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getStatusLabel(record.status)}
                                color={getStatusColor(record.status) as any}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                color={record.isOverdue ? 'error.main' : hasUpcomingDeadline(record) ? 'warning.main' : 'text.primary'}
                              >
                                {record.deadline ? new Date(record.deadline).toLocaleDateString() : 'Sin fecha límite'}
                              </Typography>
                              {record.isOverdue && (
                                <Typography variant="caption" color="error.main">
                                  {formatDeadlineLabel(record)}
                                </Typography>
                              )}
                              {hasUpcomingDeadline(record) && (
                                <Typography variant="caption" color="warning.main">
                                  {formatDeadlineLabel(record)}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {record.reminderSummary?.reminderNotifications || 0} recordatorio(s)
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatFollowUpLabel(record)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <IconButton
                                  size="small"
                                  title="Ver detalles"
                                  onClick={() => handleViewDetails(record)}
                                >
                                  <VisibilityIcon />
                                </IconButton>
                                {record.status !== 'completed' && (
                                  <IconButton
                                    size="small"
                                    onClick={() => handleSendReminder(record)}
                                    title="Enviar recordatorio"
                                  >
                                    <SendIcon />
                                  </IconButton>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Popover de Filtros */}
      <Popover
        open={openFiltersPopover}
        anchorEl={filterAnchorEl}
        onClose={handleCloseFilters}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 3, minWidth: 320 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Más filtros</Typography>
            <IconButton size="small" onClick={handleCloseFilters}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Estado */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>
              Estado
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.status.includes('pending')}
                    onChange={() => handleStatusFilterChange('pending')}
                  />
                }
                label="Pendiente"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.status.includes('in_progress')}
                    onChange={() => handleStatusFilterChange('in_progress')}
                  />
                }
                label="En Progreso"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.status.includes('completed')}
                    onChange={() => handleStatusFilterChange('completed')}
                  />
                }
                label="Completado"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.status.includes('overdue')}
                    onChange={() => handleStatusFilterChange('overdue')}
                  />
                }
                label="Vencido"
              />
            </FormGroup>
          </Box>

          {/* Días hasta vencimiento */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Días hasta vencimiento</InputLabel>
            <Select
              value={filters.daysUntilDeadline !== null ? filters.daysUntilDeadline : ''}
              onChange={(e) => setFilters(prev => ({ ...prev, daysUntilDeadline: e.target.value ? Number(e.target.value) : null }))}
              label="Días hasta vencimiento"
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value={7}>Próximos 7 días</MenuItem>
              <MenuItem value={14}>Próximos 14 días</MenuItem>
              <MenuItem value={30}>Próximos 30 días</MenuItem>
            </Select>
          </FormControl>

          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button onClick={handleClearFilters} variant="outlined" size="small">
              Limpiar
            </Button>
            <Button onClick={handleCloseFilters} variant="contained" size="small">
              Aplicar
            </Button>
          </Box>
        </Box>
      </Popover>

      {/* Dialog para enviar recordatorio */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Enviar Recordatorio
        </DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Para: {selectedRecord.userName} ({selectedRecord.userEmail})
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Curso: {selectedRecord.courseTitle}
              </Typography>
            </Box>
          )}
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Mensaje del recordatorio"
            value={reminderMessage}
            onChange={(e) => setReminderMessage(e.target.value)}
            placeholder="Escribe un mensaje personalizado..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSendReminderConfirm}
            startIcon={<SendIcon />}
            disabled={!reminderMessage.trim()}
          >
            Enviar Recordatorio
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de detalles de progreso */}
      <Dialog
        open={openDetailsDialog}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Detalles de Progreso</Typography>
            <IconButton size="small" onClick={handleCloseDetails}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {detailsRecord && (
            <Box>
              {/* Header con información general */}
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <PersonIcon color="primary" />
                      <Typography variant="subtitle2" color="text.secondary">
                        Usuario
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight="medium">
                      {detailsRecord.userName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {detailsRecord.userEmail}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <SchoolIcon color="primary" />
                      <Typography variant="subtitle2" color="text.secondary">
                        Curso
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight="medium">
                      {detailsRecord.courseTitle}
                    </Typography>
                    <Chip
                      label={getRoleLabelEs(detailsRecord.department)}
                      size="small"
                      variant="outlined"
                      sx={{ mt: 0.5 }}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Progreso y Estado */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 2 }}>
                  Progreso General
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Avance del curso
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" color="primary">
                        {detailsRecord.progress}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={detailsRecord.progress}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Estado
                      </Typography>
                      <Chip
                        label={getStatusLabel(detailsRecord.status)}
                        color={getStatusColor(detailsRecord.status) as any}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Fecha Finalización
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight="medium"
                        color={detailsRecord.completedDate ? 'success.main' : 'text.secondary'}
                      >
                        {detailsRecord.completedDate
                          ? new Date(detailsRecord.completedDate).toLocaleDateString()
                          : 'No finalizado'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Fecha Límite
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight="medium"
                        color={detailsRecord.isOverdue ? 'error.main' : hasUpcomingDeadline(detailsRecord) ? 'warning.main' : 'inherit'}
                      >
                        {detailsRecord.deadline ? new Date(detailsRecord.deadline).toLocaleDateString() : 'Sin fecha límite'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Fechas editables (calendario de cumplimiento) — visibles con ?show=true */}
              {editMode && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 2 }}>
                  Editar fechas
                </Typography>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label="Fecha de asignación"
                        value={editAssignedAt}
                        onChange={(newValue) => setEditAssignedAt(newValue)}
                        slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label="Fecha límite"
                        value={editDeadline}
                        onChange={(newValue) => setEditDeadline(newValue)}
                        slotProps={{ textField: { fullWidth: true, size: 'small', helperText: 'Vacío = sin fecha límite' } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      {detailsRecord.status === 'completed' ? (
                        <DatePicker
                          label="Fecha de finalización"
                          value={editCompletedAt}
                          onChange={(newValue) => setEditCompletedAt(newValue)}
                          minDate={editAssignedAt ?? undefined}
                          maxDate={new Date()}
                          slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                        />
                      ) : (
                        <TextField
                          fullWidth
                          size="small"
                          label="Fecha de finalización"
                          value="Solo cursos completados"
                          disabled
                        />
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Aplicar a</InputLabel>
                        <Select
                          label="Aplicar a"
                          value={dateScope}
                          onChange={(e) => setDateScope(e.target.value as any)}
                        >
                          <MenuItem value="user">Solo este usuario</MenuItem>
                          <MenuItem value="group">Todo el grupo (asignación)</MenuItem>
                          <MenuItem value="group-clear">Todo el grupo + limpiar personalizados</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </LocalizationProvider>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                  <Button size="small" variant="outlined" onClick={handleResetToGroup} disabled={savingDates}>
                    Restablecer al grupo
                  </Button>
                  <Button size="small" variant="contained" onClick={handleSaveDates} disabled={savingDates}>
                    Guardar fechas
                  </Button>
                </Box>
              </Box>
              )}

              {/* Información de tiempo */}
              <Box sx={{ mb: 3 }}>
                <Alert
                  severity={detailsRecord.isOverdue ? 'error' : hasUpcomingDeadline(detailsRecord) ? 'warning' : 'info'}
                  icon={detailsRecord.isOverdue ? <WarningIcon /> : <ScheduleIcon />}
                >
                  {detailsRecord.isOverdue ? (
                    <Typography variant="body2">
                      <strong>{formatDeadlineLabel(detailsRecord)}</strong> - Se requiere acción inmediata
                    </Typography>
                  ) : detailsRecord.status === 'completed' ? (
                    <Typography variant="body2">
                      <strong>Completado el {detailsRecord.completedDate ? new Date(detailsRecord.completedDate).toLocaleDateString() : 'N/A'}</strong>
                    </Typography>
                  ) : (
                    <Typography variant="body2">
                      {hasUpcomingDeadline(detailsRecord) ? (
                        <>
                          <strong>{formatDeadlineLabel(detailsRecord)}</strong> - Fecha límite próxima
                        </>
                      ) : (
                        <>
                          {formatDeadlineLabel(detailsRecord)}
                        </>
                      )}
                    </Typography>
                  )}
                </Alert>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 2 }}>
                  Seguimiento enviado
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Recordatorios
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {detailsRecord.reminderSummary?.reminderNotifications || 0}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Manuales
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {detailsRecord.reminderSummary?.manualReminderNotifications || 0}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Último seguimiento
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {formatFollowUpLabel(detailsRecord)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Información adicional */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 2 }}>
                  Información Adicional
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <AssignmentIcon fontSize="small" color="action" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          ID de Asignación
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          #{detailsRecord.id}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <PersonIcon fontSize="small" color="action" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Rol
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {getRoleLabelEs(detailsRecord.department)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Nota informativa */}
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Para ver el contenido detallado del curso y el progreso completo por módulos y lecciones,
                  haz clic en "Ver Curso Completo" abajo.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>
            Cerrar
          </Button>
          {detailsRecord && detailsRecord.status !== 'completed' && (
            <Button
              variant="outlined"
              startIcon={<SendIcon />}
              onClick={() => {
                handleCloseDetails()
                handleSendReminder(detailsRecord)
              }}
            >
              Enviar Recordatorio
            </Button>
          )}
          {editMode && (
            <Button
              color="error"
              onClick={handleResetCourse}
              disabled={resetProgressMutation.isLoading}
            >
              Reiniciar curso
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<SchoolIcon />}
            onClick={() => {
              if (detailsRecord) {
                navigate(`/lms/admin/users/${detailsRecord.userId}/courses/${detailsRecord.courseId}/review`)
              }
            }}
          >
            Ver Curso Completo
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de edición de fechas en lote */}
      <Dialog open={bulkOpen} onClose={() => setBulkOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cambiar fechas ({selectedRecords.length} registro(s))</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Solo se modifica la fecha de finalización de los registros ya completados; el resto se omite.
          </Alert>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12}>
                <DatePicker
                  label="Fecha de finalización"
                  value={bulkCompletedAt}
                  onChange={(newValue) => setBulkCompletedAt(newValue)}
                  minDate={bulkAssignedAt ?? undefined}
                  maxDate={new Date()}
                  slotProps={{ textField: { fullWidth: true, size: 'small', helperText: 'Solo aplica a usuarios con el curso completado' } }}
                />
              </Grid>
              <Grid item xs={12}>
                <DatePicker
                  label="Fecha de asignación (opcional)"
                  value={bulkAssignedAt}
                  onChange={(newValue) => setBulkAssignedAt(newValue)}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </Grid>
              <Grid item xs={12}>
                <DatePicker
                  label="Fecha límite (opcional)"
                  value={bulkDeadline}
                  onChange={(newValue) => setBulkDeadline(newValue)}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleBulkApply}
            disabled={bulkSaving || (!bulkCompletedAt && !bulkAssignedAt && !bulkDeadline)}
          >
            Aplicar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default LmsComplianceTracker
