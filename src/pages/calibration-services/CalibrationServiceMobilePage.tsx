import { getApiErrorReason } from 'src/utils/apiError'
import SignalLoader from 'src/Components/Common/SignalLoader'
import { useEffect, useMemo, useState } from 'react'
import {
  Alert, Autocomplete, Badge, BottomNavigation, BottomNavigationAction, Box, Button, Card, CardContent, Checkbox,
  Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, IconButton, InputLabel, LinearProgress, MenuItem, Paper, Select, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography
} from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from 'react-query'
import { toast } from 'react-hot-toast'
import { axiosPrivate } from '@utils/api'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import InventoryIcon from '@mui/icons-material/Inventory'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import PauseIcon from '@mui/icons-material/Pause'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import BorderColorOutlinedIcon from '@mui/icons-material/BorderColorOutlined'
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined'
import SignaturePad from '../../Components/Maintenance/SignaturePad'
import {
  CalibrationServiceCut, CalibrationServiceDocument, CalibrationServiceOperationalItemStatus, CalibrationServiceStatus
} from '../../types/calibrationService'
import {
  CALIBRATION_SERVICE_STATUS_LABELS,
  CALIBRATION_SERVICE_OPERATIONAL_ITEM_STATUS_LABELS,
  CALIBRATION_SERVICE_ADJUSTMENT_STATUS_LABELS,
  CALIBRATION_SERVICE_ADJUSTMENT_TYPE_LABELS
} from '../../constants/calibrationServices'
import {
  CALIBRATION_SERVICE_QUERY_KEYS,
  useCalibrationService
} from '../../hooks/useCalibrationServices'
import { useCalibrationDeviceSearch } from '../../hooks/calibration/useCalibrationDeviceSearch'

// Figma design palette
const G = {
  green: '#00BFA5', greenLight: '#E0F7F4', greenDark: '#00897B',
  yellow: '#F5A623', yellowLight: '#fff8ec', red: '#e53e3e',
  gray50: '#f0f2f5', gray100: '#e8eaed', gray200: '#d1d5db',
  gray300: '#b0b7c3', gray400: '#9ca3af', gray600: '#4b5563',
  gray800: '#1f2937', dark: '#1a1a2e', white: '#ffffff'
}

const BANNER_BG = 'linear-gradient(135deg, #10b981, #059669)'
const primarySx = {
  borderRadius: '12px', py: 1.5, textTransform: 'none', fontWeight: 600,
  bgcolor: G.green, '&:hover': { bgcolor: '#00ACC1' },
  '&.Mui-disabled': { bgcolor: G.gray100, color: G.gray400 },
  '&:active': { transform: 'scale(0.97)' }
} as const
const outlineSx = {
  borderRadius: '12px', py: 1.5, textTransform: 'none', fontWeight: 600,
  color: G.greenDark, borderColor: G.green,
  '&:hover': { borderColor: G.greenDark, bgcolor: G.greenLight },
  '&:active': { transform: 'scale(0.97)' }
} as const
const chipSx = { fontSize: '0.7rem', fontWeight: 600, px: 1.25, py: 0.3, borderRadius: '999px', border: '1px solid rgba(255,255,255,0.6)', color: 'white' } as const

const STATUS_FLOW: CalibrationServiceOperationalItemStatus[] = ['pending', 'scheduled', 'in_progress', 'completed']
const CUT_STATUSES: Record<string, { label: string; color: string }> = {
  draft: { label: 'Borrador', color: '#b45309' },
  ready_for_invoicing: { label: 'Listo para facturar', color: G.greenDark },
  invoiced: { label: 'Facturado', color: G.gray600 }
}

const getOps = (s: any) => (s?.otherFields?.operations || {})
const getScheduledDate = (s: any) => getOps(s)?.scheduledDate || getOps(s)?.scheduledFor

const getEffectiveQty = (item: any, adjustments: any[] = []) => {
  const base = item.quantity || 1
  const approvedStatuses = ['approved', 'applied_to_cut', 'customer_approved', 'tacitly_accepted']
  const delta = adjustments.filter(a => a.serviceItemId === item.id && approvedStatuses.includes(a.status) && a.changeType !== 'extra_item')
    .reduce((sum: number, a: any) => sum + (a.differenceQuantity || 0), 0)
  return Math.max(base + delta, 0)
}

const sheetSx = {
  '& .MuiDialog-container': { alignItems: 'flex-end' },
  '& .MuiDialog-paper': { m: 0, width: '100%', maxWidth: 430, borderRadius: '24px 24px 0 0' },
  '& .MuiDialogTitle-root': { fontWeight: 700 },
  '& .MuiDialogActions-root': { p: 2, gap: 1 },
  '& .MuiDialogActions-root .MuiButton-root': { minHeight: 44, borderRadius: '12px', textTransform: 'none', fontWeight: 600 }
} as const

const getReleased = (item: any) => {
  const value = item.otherFields?.releasedQuantity
  return typeof value === 'number' ? value : (parseInt(value, 10) || 0)
}

const getSavedExecuted = (item: any, adjustments: any[] = []) => {
  const effective = getEffectiveQty(item, adjustments)
  const stored = Number(item.otherFields?.executedQuantity)
  const recorded = Number.isFinite(stored) && item.otherFields?.executedQuantity !== null && item.otherFields?.executedQuantity !== undefined
    ? stored
    : (item.otherFields?.operationalStatus === 'completed' ? effective : 0)
  return Math.min(Math.max(recorded, getReleased(item)), effective)
}

const MobilePage = () => {
  const { serviceId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: service, isLoading } = useCalibrationService(serviceId)
  const refreshService = () => {
    void queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.detail, serviceId])
    void queryClient.invalidateQueries([CALIBRATION_SERVICE_QUERY_KEYS.all])
  }
  // Las acciones de la vista móvil no se reintentan: un POST repetido duplicaría la operación
  const serviceActionMutation = useMutation((action: () => Promise<any>) => action(), {
    retry: 0,
    onSuccess: refreshService
  })

  const s = service
  const items = s?.items || []
  const cuts = s?.cuts || []
  const status = s?.status || ''
  const scheduledDate = getScheduledDate(s)
  const paused = Boolean((s as any)?.isPaused)

  // Execution state
  const [draftItems, setDraftItems] = useState<Record<number, CalibrationServiceOperationalItemStatus>>({})
  const [draftNotes, setDraftNotes] = useState<Record<number, string>>({})
  const [draftExecuted, setDraftExecuted] = useState<Record<number, number>>({})
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Dialog states
  const [showTrace, setShowTrace] = useState(false)
  const [showCut, setShowCut] = useState(false)
  const [showAdjust, setShowAdjust] = useState(false)
  const [showLogistics, setShowLogistics] = useState(false)

  // Pre-fill logistics fields when dialog opens from service data
  useEffect(() => {
    if (!showLogistics || !s) return
    const existing: any = (s.otherFields as any)?.logistics?.controlSheet || {}
    const cust = s.customer as any || {}
    setLogCompany(existing.requesterCompanyName ?? cust.nombre ?? '')
    setLogOffer(existing.requesterOfferNumber ?? s.quoteCode ?? '')
    setLogIntake(existing.intakeDate ?? '')
    setLogDelivery(existing.deliveryDate ?? '')
    setLogAddress(existing.requesterAddress ?? cust.direccion ?? '')
    setLogPhone(existing.requesterPhone ?? cust.telefono ?? '')
    setLogContact(existing.requesterContactName ?? s.contactName ?? '')
    setLogCity(existing.requesterCity ?? cust.ciudad ?? '')
    setLogEquipment((existing.items || []).map((i: any) => ({
      equipmentName: i.equipmentName || '', brand: i.brand || '', model: i.model || '',
      serial: i.serialNumber || '', asset: i.assetNumber || '', location: i.location || '',
      physIn: i.physicalInspectionIn ?? null, physOut: i.physicalInspectionOut ?? null,
      opIn: i.operationalInspectionIn ?? null, opOut: i.operationalInspectionOut ?? null
    })))
    setLogNoSerial(existing.noSerialAuthorization === true ? 'true' : existing.noSerialAuthorization === false ? 'false' : '')
    setLogCalPoints(existing.calibrationPointsRequested === true ? 'true' : existing.calibrationPointsRequested === false ? 'false' : '')
    setLogSpecialCond(existing.specialCondition === true ? 'true' : existing.specialCondition === false ? 'false' : '')
    setLogCertIncluded(existing.calibrationCertificateIncluded === true ? 'true' : existing.calibrationCertificateIncluded === false ? 'false' : '')
    setLogStamp(existing.stampIncluded === true ? 'true' : existing.stampIncluded === false ? 'false' : '')
    setLogObs(existing.observations ?? '')
    setLogDeliveryName(existing.deliveredToClientName ?? '')
    setLogDeliverySig(existing.deliveredToClientSignature ?? null)
    setLogReceiptName(existing.receivedByClientName ?? '')
    setLogReceiptSig(existing.receivedByClientSignature ?? null)
  }, [showLogistics])

  // Trace fields
  const [traceMovement, setTraceMovement] = useState<'pickup' | 'delivery'>('pickup')
  const [traceContact, setTraceContact] = useState('')
  const [traceLocation, setTraceLocation] = useState('')

  // Cut fields
  const [cutType, setCutType] = useState<'partial' | 'final'>('partial')

  // Adjustment fields
  const [adjItemId, setAdjItemId] = useState('')
  const [adjChangeType, setAdjChangeType] = useState('quantity_more')
  const [adjQuantity, setAdjQuantity] = useState('')
  const [adjReason, setAdjReason] = useState('')

  // Logistics fields
  const [logIntake, setLogIntake] = useState('')
  const [logDelivery, setLogDelivery] = useState('')
  const [logCompany, setLogCompany] = useState('')
  const [logOffer, setLogOffer] = useState('')
  const [logAddress, setLogAddress] = useState('')
  const [logPhone, setLogPhone] = useState('')
  const [logContact, setLogContact] = useState('')
  const [logCity, setLogCity] = useState('')
  const [logEquipment, setLogEquipment] = useState<Array<{
    equipmentName: string; brand: string; model: string; serial: string; asset: string; location: string;
    physIn: string | null; physOut: string | null; opIn: string | null; opOut: string | null
  }>>([])
  const [logNoSerial, setLogNoSerial] = useState<string>('')
  const [logCalPoints, setLogCalPoints] = useState<string>('')
  const [logSpecialCond, setLogSpecialCond] = useState<string>('')
  const [logCertIncluded, setLogCertIncluded] = useState<string>('')
  const [logStamp, setLogStamp] = useState<string>('')
  const [logObs, setLogObs] = useState('')
  const [logDeliveryName, setLogDeliveryName] = useState('')
  const [logDeliverySig, setLogDeliverySig] = useState<string | null>(null)
  const [logReceiptName, setLogReceiptName] = useState('')
  const [logReceiptSig, setLogReceiptSig] = useState<string | null>(null)

  // ODS view
  const [odsLoading, setOdsLoading] = useState(false)

  const handleViewOds = async () => {
    if (!s) return
    setOdsLoading(true)
    // Se abre en el toque: si se abre después de esperar el PDF, el navegador del celular la bloquea
    const viewer = window.open('', '_blank')
    try {
      let odsDoc = (s.documents || []).find((d: CalibrationServiceDocument) => d.documentType === 'ods_pdf')
      if (!odsDoc) {
        odsDoc = await (await axiosPrivate.post(`/calibration-services/${serviceId}/generate-ods-pdf`)).data as CalibrationServiceDocument
        refreshService()
      }
      const blob = await (await axiosPrivate.get(`/calibration-services/${serviceId}/documents/${odsDoc.id}/download`, { responseType: 'blob' })).data as Blob
      const url = URL.createObjectURL(blob)
      if (viewer) viewer.location.href = url
      else window.location.href = url
      setTimeout(() => URL.revokeObjectURL(url), 30000)
    } catch { viewer?.close(); toast.error('No se pudo cargar la ODS') }
    setOdsLoading(false)
  }

  // Signature
  const [deliveryName, setDeliveryName] = useState('')
  const [deliverySignature, setDeliverySignature] = useState<string | null>(null)

  useEffect(() => {
    if (!s) return
    const savedOps = getOps(s)
    setDeliveryName(savedOps.deliveryName || ''); setDeliverySignature(savedOps.deliverySignatureData || null)
  }, [s?.id])

  // Los borradores se rehacen cuando cambia lo guardado (por ejemplo, al iniciar la ejecución el servidor mueve el estado de los ítems)
  const savedItemsKey = JSON.stringify((s?.items || []).map((i: any) => [i.id, i.quantity, i.otherFields?.operationalStatus, i.otherFields?.technicalNotes, i.otherFields?.executedQuantity, i.otherFields?.releasedQuantity])) + (s?.adjustments?.length ?? 0)
  useEffect(() => {
    if (!s) return
    setDraftItems({}); setDraftNotes({}); setDraftExecuted({})
    for (const item of (s.items || [])) {
      const st = (item as any).otherFields?.operationalStatus || 'pending'
      setDraftItems(p => ({ ...p, [item.id]: st }))
      setDraftNotes(p => ({ ...p, [item.id]: (item as any).otherFields?.technicalNotes || '' }))
      setDraftExecuted(p => ({ ...p, [item.id]: getSavedExecuted(item, s.adjustments) }))
    }
  }, [s?.id, savedItemsKey])

  const allCompleted = useMemo(() => items.length > 0 && items.every(i => draftItems[i.id] === 'completed'), [items, draftItems])

  const apiCall = async (method: string, url: string, body?: any) => {
    const res = await axiosPrivate({ method, url, data: body } as any)
    return res.data
  }

  const handleAction = async (key: string, fn: () => Promise<any>, msg: string, onDone?: () => void) => {
    setActionLoading(key)
    try { await serviceActionMutation.mutateAsync(fn); toast.success(msg); onDone?.() }
    catch (e: any) { toast.error(getApiErrorReason(e) || `Error: ${msg}`) }
    setActionLoading(null)
  }

  const progressPayload = () => ({
    items: items.map(i => ({
      itemId: i.id,
      operationalStatus: draftItems[i.id] || 'pending',
      technicalNotes: draftNotes[i.id] || '',
      executedQuantity: draftItems[i.id] === 'completed' ? getEffectiveQty(i, s?.adjustments) : (draftExecuted[i.id] ?? 0)
    }))
  })

  const setItemStatus = (item: any, next: CalibrationServiceOperationalItemStatus) => {
    setDraftItems(p => ({ ...p, [item.id]: next }))
    if (next === 'completed') setDraftExecuted(p => ({ ...p, [item.id]: getEffectiveQty(item, s?.adjustments) }))
  }

  const changeExecuted = (item: any, delta: number) => {
    const max = getEffectiveQty(item, s?.adjustments)
    setDraftExecuted(p => ({ ...p, [item.id]: Math.min(Math.max((p[item.id] ?? 0) + delta, getReleased(item)), max) }))
  }

  const handleSaveProgress = async () => {
    setSaving(true)
    try {
      await serviceActionMutation.mutateAsync(() => apiCall('put', `/calibration-services/${serviceId}/item-progress`, progressPayload()))
      toast.success('Avance guardado')
    } catch { toast.error('Error al guardar') }
    setSaving(false)
  }

type MobileTab = 'work' | 'intake' | 'issues' | 'close'
  const [tab, setTab] = useState<MobileTab>('work')
  const [openNotes, setOpenNotes] = useState<Record<number, boolean>>({})
  const [cutSel, setCutSel] = useState<Record<number, { on: boolean; qty: number }>>({})

  // Lo que se puede liberar a corte: ítems completados o en proceso con unidades sin liberar
  const cutCandidates = items
    .filter(i => ['completed', 'in_progress'].includes(draftItems[i.id] || 'pending'))
    .map(i => ({ item: i, available: Math.max(getEffectiveQty(i, s?.adjustments) - getReleased(i), 0) }))
    .filter(c => c.available > 0)

  useEffect(() => {
    if (!showCut) return
    const next: Record<number, { on: boolean; qty: number }> = {}
    for (const c of cutCandidates) {
      const done = draftItems[c.item.id] === 'completed'
      const executedFree = Math.max((draftExecuted[c.item.id] ?? 0) - getReleased(c.item), 0)
      next[c.item.id] = { on: done, qty: done ? c.available : Math.min(Math.max(executedFree, 1), c.available) }
    }
    setCutSel(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCut])
  const cutSelected = cutCandidates.filter(c => cutSel[c.item.id]?.on && (cutSel[c.item.id]?.qty ?? 0) > 0)

  const adjustments = (s?.adjustments || []) as any[]
  const completedCount = items.filter(i => draftItems[i.id] === 'completed').length
  const pendingCount = items.length - completedCount
  const dirty = items.some(i => {
    const savedStatus = (i as any).otherFields?.operationalStatus || 'pending'
    const savedNotes = (i as any).otherFields?.technicalNotes || ''
    return (draftItems[i.id] || 'pending') !== savedStatus || (draftNotes[i.id] || '') !== savedNotes
      || (draftExecuted[i.id] ?? 0) !== getSavedExecuted(i, s?.adjustments)
  })
  const controlSheet: any = (s?.otherFields as any)?.logistics?.controlSheet || {}
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([s?.address, s?.city].filter(Boolean).join(', '))}`
  const canEditItems = !paused && ['scheduled', 'in_execution'].includes(status)
  const canCreateCut = ['in_execution', 'technically_completed'].includes(status)

  const sectionTitle = { fontSize: '0.95rem', fontWeight: 700, color: G.dark } as const
  const cardSx = { borderRadius: '16px', border: `1px solid ${G.gray100}`, boxShadow: 'none' } as const
  const tileSx = {
    display: 'flex', alignItems: 'center', gap: 1.5, p: 2, borderRadius: '16px', border: `1px solid ${G.gray100}`,
    bgcolor: G.white, cursor: 'pointer', textAlign: 'left', width: '100%', font: 'inherit',
    '&:active': { bgcolor: G.greenLight }
  } as const
  const quickSx = {
    flex: 1, flexDirection: 'column', gap: 0.5, py: 1.25, borderRadius: '14px', textTransform: 'none',
    fontWeight: 600, fontSize: '0.75rem', color: G.greenDark, bgcolor: G.greenLight,
    '&:hover': { bgcolor: '#c9efe9' }, '&.Mui-disabled': { color: G.gray300, bgcolor: G.gray50 }
  } as const

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: G.gray50, pb: 22 }}>
      {isLoading ? <Box sx={{ textAlign: 'center', py: 8 }}><SignalLoader /></Box> :
      !s ? <Box sx={{ p: 2 }}><Alert severity='error'>Servicio no encontrado</Alert></Box> : (
      <Box sx={{ maxWidth: 430, mx: 'auto' }}>
        {/* Encabezado compacto */}
        <Box sx={{ background: BANNER_BG, px: 2, pt: 1.5, pb: 2.5, color: 'white', borderRadius: '0 0 24px 24px' }}>
          <Stack direction='row' alignItems='center' spacing={1}>
            <IconButton aria-label='Volver' onClick={() => navigate(-1)} sx={{ color: 'white', ml: -1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant='h6' fontWeight={700} sx={{ flex: 1 }}>{s.serviceCode}</Typography>
            <Box component='span' sx={{ ...chipSx, bgcolor: 'rgba(255,255,255,0.22)' }}>
              {paused ? 'En pausa' : CALIBRATION_SERVICE_STATUS_LABELS[status as CalibrationServiceStatus]}
            </Box>
          </Stack>
          <Typography variant='body1' fontWeight={600} sx={{ mt: 0.5, lineHeight: 1.3 }}>
            {s.customer?.nombre || s.executionCustomerName || 'Cliente pendiente'}
          </Typography>
          <Typography variant='body2' sx={{ mt: 0.5, opacity: 0.9 }}>
            {[s.odsCode, scheduledDate ? new Date(scheduledDate).toLocaleDateString('es-CO') : ''].filter(Boolean).join('  ·  ')}
          </Typography>
        </Box>

        <Box sx={{ px: 2, mt: 2 }}>
          {/* ===== TRABAJO ===== */}
          {tab === 'work' && (
            <Stack spacing={2}>
              {/* Paso principal */}
              {paused && (
                <Card elevation={0} sx={{ ...cardSx, borderColor: '#f59e0b', bgcolor: '#fffbeb' }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Stack spacing={1.5}>
                      <Typography sx={sectionTitle}>El servicio está en pausa</Typography>
                      <Typography variant='body2' sx={{ color: G.gray600 }}>Mientras esté en pausa no puedes registrar avances. Reanúdalo para seguir trabajando.</Typography>
                      <Button fullWidth variant='contained' disableElevation startIcon={<PlayArrowIcon />}
                        onClick={() => handleAction('resume', () => apiCall('post', `/calibration-services/${serviceId}/resume`, { resumeNotes: null, resumedAt: new Date().toISOString() }), 'Servicio reanudado')}
                        disabled={actionLoading === 'resume'}
                        sx={{ ...primarySx, py: 1.75, fontSize: '1rem' }}>
                        Reanudar servicio
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {!['scheduled', 'in_execution'].includes(status) && (
                <Card elevation={0} sx={cardSx}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Stack spacing={1.25}>
                      <Typography sx={sectionTitle}>
                        {status === 'technically_completed' ? 'Ejecución finalizada'
                          : status === 'closed' ? 'Servicio cerrado'
                          : status === 'cancelled' ? 'Servicio cancelado'
                          : 'Todavía no es hora de trabajar en campo'}
                      </Typography>
                      <Typography variant='body2' sx={{ color: G.gray600 }}>
                        {status === 'technically_completed' ? 'Ya puedes crear el corte y registrar la firma de recepción.'
                          : status === 'closed' ? 'No quedan acciones pendientes en este servicio.'
                          : status === 'cancelled' ? 'Este servicio ya no admite cambios.'
                          : `El servicio está en "${CALIBRATION_SERVICE_STATUS_LABELS[status as CalibrationServiceStatus] || status}". Aparecerán las acciones cuando esté programado.`}
                      </Typography>
                      {status === 'technically_completed' && (
                        <Button fullWidth variant='contained' disableElevation onClick={() => { setTab('close'); window.scrollTo({ top: 0 }) }} sx={primarySx}>
                          Ir a corte y firma
                        </Button>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {!paused && ['scheduled', 'in_execution'].includes(status) && (
                <Card elevation={0} sx={cardSx}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Stack spacing={1.5}>
                      {status === 'scheduled' && (
                        <>
                          <Typography sx={sectionTitle}>Todo listo para empezar</Typography>
                          <Button fullWidth variant='contained' disableElevation startIcon={<PlayArrowIcon />}
                            onClick={() => handleAction('start', () => apiCall('post', `/calibration-services/${serviceId}/start-execution`, { startedAt: new Date().toISOString() }), 'Ejecución iniciada')}
                            disabled={actionLoading === 'start'}
                            sx={{ ...primarySx, py: 1.75, fontSize: '1rem' }}>
                            Iniciar ejecución
                          </Button>
                        </>
                      )}
                      {status === 'in_execution' && (
                        <>
                          <Stack direction='row' justifyContent='space-between' alignItems='baseline'>
                            <Typography sx={sectionTitle}>Avance del servicio</Typography>
                            <Typography variant='body2' fontWeight={700} sx={{ color: G.greenDark }}>{completedCount} de {items.length}</Typography>
                          </Stack>
                          <LinearProgress variant='determinate' value={items.length ? (completedCount / items.length) * 100 : 0}
                            sx={{ height: 10, borderRadius: 999, bgcolor: G.greenLight, '& .MuiLinearProgress-bar': { borderRadius: 999, bgcolor: G.green } }} />
                          <Button fullWidth variant='contained' disableElevation startIcon={<CheckCircleIcon />}
                            onClick={() => handleAction('complete', () => apiCall('post', `/calibration-services/${serviceId}/complete-execution`, { technicallyCompletedAt: new Date().toISOString() }), 'Ejecución finalizada')}
                            disabled={!allCompleted || dirty || actionLoading === 'complete'}
                            sx={{ ...primarySx, py: 1.75, fontSize: '1rem' }}>
                            {!allCompleted ? `Faltan ${pendingCount} ítem${pendingCount === 1 ? '' : 's'}` : dirty ? 'Guarda el avance primero' : 'Finalizar ejecución'}
                          </Button>
                          {!paused && (
                            <Button fullWidth variant='text' color='warning' startIcon={<PauseIcon />}
                              onClick={() => handleAction('pause', () => apiCall('post', `/calibration-services/${serviceId}/pause`, { pauseReason: 'Pausado desde móvil' }), 'Servicio pausado')}
                              disabled={actionLoading === 'pause'}
                              sx={{ textTransform: 'none', fontWeight: 600 }}>
                              Pausar servicio
                            </Button>
                          )}
                        </>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {/* Contacto y accesos rápidos */}
              <Card elevation={0} sx={cardSx}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Stack direction='row' spacing={1.5} alignItems='flex-start'>
                    <BusinessOutlinedIcon sx={{ color: G.gray400, mt: 0.25 }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={700} sx={{ color: G.dark }}>{s.executionSiteName || s.customerSite || 'Sede pendiente'}</Typography>
                      {s.contactName ? <Typography variant='body2' sx={{ color: G.gray600 }}>{s.contactName}</Typography> : null}
                      {s.city || s.address ? <Typography variant='body2' sx={{ color: G.gray600 }}>{[s.address, s.city].filter(Boolean).join(', ')}</Typography> : null}
                    </Box>
                  </Stack>
                  <Stack direction='row' spacing={1} sx={{ mt: 2 }}>
                    <Button component='a' href={s.contactPhone ? `tel:${s.contactPhone}` : undefined} disabled={!s.contactPhone} sx={quickSx}>
                      <PhoneOutlinedIcon /> Llamar
                    </Button>
                    <Button component='a' href={mapsHref} target='_blank' rel='noreferrer' disabled={!s.address && !s.city} sx={quickSx}>
                      <PlaceOutlinedIcon /> Cómo llegar
                    </Button>
                    <Button onClick={handleViewOds} disabled={!s.odsCode || odsLoading} sx={quickSx}>
                      {odsLoading ? <CircularProgress size={24} /> : <DescriptionOutlinedIcon />} {odsLoading ? 'Abriendo' : 'Ver ODS'}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>

              {/* Ítems */}
              <Box>
                <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb: 1 }}>
                  <Typography sx={sectionTitle}>Ítems ({items.length})</Typography>
                  {pendingCount > 0 && items.length > 0 && !paused && ['scheduled', 'in_execution'].includes(status) && (
                    <Button size='small' onClick={() => items.forEach(i => setItemStatus(i, 'completed'))}
                      sx={{ textTransform: 'none', fontWeight: 600, color: G.greenDark }}>
                      Marcar todos completados
                    </Button>
                  )}
                </Stack>
                <Stack spacing={1.25}>
                  {items.map(item => {
                    const current = draftItems[item.id] || 'pending'
                    const noteValue = draftNotes[item.id] || ''
                    const showNote = openNotes[item.id] || Boolean(noteValue)
                    return (
                      <Card key={item.id} elevation={0} sx={{ ...cardSx, borderColor: current === 'completed' ? G.green : G.gray100 }}>
                        <CardContent sx={{ p: 1.75, '&:last-child': { pb: 1.75 } }}>
                          <Stack spacing={1.25}>
                            <Stack direction='row' justifyContent='space-between' alignItems='flex-start' spacing={1}>
                              <Typography fontWeight={700} sx={{ flex: 1, color: G.dark, lineHeight: 1.35 }}>{item.itemName}</Typography>
                              <Typography variant='body2' fontWeight={700} sx={{ color: G.gray600, whiteSpace: 'nowrap' }}>x{getEffectiveQty(item, s?.adjustments)}</Typography>
                            </Stack>
                            <ToggleButtonGroup exclusive fullWidth size='small' value={current} aria-label={`Estado de ${item.itemName}`}
                              disabled={!canEditItems}
                              onChange={(_, v) => { if (v) setItemStatus(item, v) }}>
                              {STATUS_FLOW.map(k => (
                                <ToggleButton key={k} value={k} sx={{
                                  minHeight: 44, px: 0.5, textTransform: 'none', fontSize: '0.72rem', fontWeight: 600, color: G.gray600, borderColor: G.gray200,
                                  '&.Mui-selected': k === 'completed'
                                    ? { bgcolor: G.green, color: 'white', borderColor: G.green, '&:hover': { bgcolor: G.greenDark } }
                                    : { bgcolor: G.greenLight, color: G.greenDark, borderColor: G.green, fontWeight: 700 }
                                }}>
                                  {CALIBRATION_SERVICE_OPERATIONAL_ITEM_STATUS_LABELS[k]}
                                </ToggleButton>
                              ))}
                            </ToggleButtonGroup>
                            {current === 'in_progress' && (
                              <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ bgcolor: G.gray50, borderRadius: '12px', p: 0.75 }}>
                                <Box sx={{ pl: 1 }}>
                                  <Typography variant='body2' fontWeight={600} sx={{ color: G.gray600 }}>Ejecutados</Typography>
                                  {getReleased(item) > 0 && <Typography variant='caption' sx={{ color: G.gray400 }}>{getReleased(item)} ya en corte</Typography>}
                                </Box>
                                <Stack direction='row' alignItems='center' spacing={0.5}>
                                  <IconButton aria-label='Restar uno' onClick={() => changeExecuted(item, -1)} disabled={paused || (draftExecuted[item.id] ?? 0) <= getReleased(item)}
                                    sx={{ bgcolor: G.white, border: `1px solid ${G.gray200}`, width: 44, height: 44 }}><RemoveIcon /></IconButton>
                                  <Typography fontWeight={700} sx={{ minWidth: 64, textAlign: 'center', color: G.dark }}>{draftExecuted[item.id] ?? 0} de {getEffectiveQty(item, s?.adjustments)}</Typography>
                                  <IconButton aria-label='Sumar uno' onClick={() => changeExecuted(item, 1)} disabled={paused || (draftExecuted[item.id] ?? 0) >= getEffectiveQty(item, s?.adjustments)}
                                    sx={{ bgcolor: G.green, color: 'white', width: 44, height: 44, '&:hover': { bgcolor: G.greenDark }, '&.Mui-disabled': { bgcolor: G.gray100, color: G.gray300 } }}><AddIcon /></IconButton>
                                </Stack>
                              </Stack>
                            )}
                            {showNote ? (
                              <TextField size='small' multiline minRows={2} placeholder='Observaciones técnicas del ítem' value={noteValue} disabled={!canEditItems}
                                onChange={e => setDraftNotes(p => ({ ...p, [item.id]: e.target.value }))}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', fontSize: '0.9rem' } }} />
                            ) : !canEditItems ? null : (
                              <Button size='small' startIcon={<EditNoteOutlinedIcon />} onClick={() => setOpenNotes(p => ({ ...p, [item.id]: true }))}
                                sx={{ alignSelf: 'flex-start', textTransform: 'none', fontWeight: 600, color: G.gray600 }}>
                                Agregar nota
                              </Button>
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    )
                  })}
                </Stack>
              </Box>
            </Stack>
          )}

          {/* ===== INGRESO ===== */}
          {tab === 'intake' && (
            <Stack spacing={1.5}>
              <Typography sx={sectionTitle}>Ingreso y entrega de equipos</Typography>
              <Box component='button' type='button' onClick={() => setShowLogistics(true)} sx={tileSx}>
                <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: G.greenLight, color: G.greenDark, display: 'grid', placeItems: 'center', flexShrink: 0 }}><InventoryIcon /></Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography fontWeight={700} sx={{ color: G.dark }}>Control de ingreso y entrega</Typography>
                  <Typography variant='body2' sx={{ color: G.gray600 }}>
                    {[
                      controlSheet.items?.length ? `${controlSheet.items.length} equipo${controlSheet.items.length === 1 ? '' : 's'}` : '',
                      controlSheet.intakeDate ? `Ingreso ${controlSheet.intakeDate}` : '',
                      controlSheet.deliveryDate ? `Entrega ${controlSheet.deliveryDate}` : ''
                    ].filter(Boolean).join('  ·  ') || 'Sin diligenciar'}
                  </Typography>
                </Box>
                <ChevronRightIcon sx={{ color: G.gray300 }} />
              </Box>
              <Box component='button' type='button' onClick={() => setShowTrace(true)} sx={tileSx}>
                <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: G.greenLight, color: G.greenDark, display: 'grid', placeItems: 'center', flexShrink: 0 }}><AddCircleOutlineIcon /></Box>
                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight={700} sx={{ color: G.dark }}>Registrar movimiento físico</Typography>
                  <Typography variant='body2' sx={{ color: G.gray600 }}>Recogida o entrega de equipos</Typography>
                </Box>
                <ChevronRightIcon sx={{ color: G.gray300 }} />
              </Box>
            </Stack>
          )}

          {/* ===== NOVEDADES ===== */}
          {tab === 'issues' && (
            <Stack spacing={1.5}>
              <Button fullWidth variant='outlined' color='warning' startIcon={<WarningAmberIcon />} onClick={() => setShowAdjust(true)}
                sx={{ borderRadius: '14px', py: 1.5, textTransform: 'none', fontWeight: 700, fontSize: '1rem', bgcolor: G.white }}>
                Reportar novedad
              </Button>
              <Typography sx={{ ...sectionTitle, mt: 1 }}>Novedades del servicio ({adjustments.length})</Typography>
              {adjustments.length === 0 ? (
                <Typography variant='body2' sx={{ color: G.gray600 }}>Aún no hay novedades. Si algo no coincide con la cotización, repórtalo aquí.</Typography>
              ) : adjustments.map((adj: any) => (
                <Card key={adj.id} elevation={0} sx={cardSx}>
                  <CardContent sx={{ p: 1.75, '&:last-child': { pb: 1.75 } }}>
                    <Stack spacing={0.75}>
                      <Stack direction='row' justifyContent='space-between' alignItems='flex-start' spacing={1}>
                        <Typography fontWeight={700} sx={{ color: G.dark, lineHeight: 1.35 }}>{adj.itemName || 'Ítem'}</Typography>
                        <Chip size='small' variant='outlined' label={CALIBRATION_SERVICE_ADJUSTMENT_STATUS_LABELS[adj.status as keyof typeof CALIBRATION_SERVICE_ADJUSTMENT_STATUS_LABELS] || adj.status}
                          sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                      </Stack>
                      <Typography variant='body2' sx={{ color: G.gray600 }}>
                        {CALIBRATION_SERVICE_ADJUSTMENT_TYPE_LABELS[adj.changeType as keyof typeof CALIBRATION_SERVICE_ADJUSTMENT_TYPE_LABELS] || adj.changeType}
                        {'  ·  '}Cotizado {adj.quotedQuantity} → Real {adj.actualQuantity}
                      </Typography>
                      {adj.description ? <Typography variant='body2' sx={{ color: G.dark }}>{adj.description}</Typography> : null}
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}

          {/* ===== CIERRE ===== */}
          {tab === 'close' && (
            <Stack spacing={2.5}>
              <Box>
                <Typography sx={{ ...sectionTitle, mb: 1 }}>Firma de recepción</Typography>
                {Boolean(getOps(s).deliverySignatureData) && (
                  <Alert severity='success' icon={<CheckCircleIcon fontSize='inherit' />} sx={{ mb: 1, borderRadius: '12px' }}>
                    Firmada por {getOps(s).deliveryName || 'quien recibe'}. Si firmas de nuevo, se reemplaza.
                  </Alert>
                )}
                <Card elevation={0} sx={cardSx}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <TextField fullWidth size='small' label='Nombre de quien recibe' value={deliveryName} onChange={e => setDeliveryName(e.target.value)} sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                    <SignaturePad value={deliverySignature} onChange={setDeliverySignature} height={140} />
                    <Button fullWidth variant='contained' disableElevation
                      onClick={() => handleAction('sig', () => apiCall('put', `/calibration-services/${serviceId}/delivery-signature`, { deliveryName: deliveryName.trim() || null, deliveryRole: getOps(s).deliveryRole ?? null, deliverySignatureData: deliverySignature }), 'Firma guardada')}
                      disabled={!deliverySignature || actionLoading === 'sig'}
                      sx={{ ...primarySx, mt: 2 }}>
                      Guardar firma
                    </Button>
                  </CardContent>
                </Card>
              </Box>

              <Box>
                <Typography sx={{ ...sectionTitle, mb: 1 }}>Cortes ({cuts.length})</Typography>
                <Stack spacing={1.25}>
                  {cuts.length === 0 && <Typography variant='body2' sx={{ color: G.gray600 }}>Todavía no hay cortes.</Typography>}
                  {cuts.map((cut: CalibrationServiceCut) => {
                    const cs = CUT_STATUSES[cut.status] || { label: cut.status, color: '#6b7280' }
                    return (
                      <Card key={cut.id} elevation={0} sx={cardSx}>
                        <CardContent sx={{ p: 1.75, '&:last-child': { pb: 1.75 } }}>
                          <Stack spacing={1.25}>
                            <Box>
                              <Typography fontWeight={700} sx={{ color: G.dark, wordBreak: 'break-all' }}>{cut.cutCode || `Corte #${cut.id}`}</Typography>
                              <Chip size='small' variant='outlined' label={cs.label} sx={{ borderColor: cs.color, color: cs.color, fontSize: '0.7rem', fontWeight: 600, height: 22, mt: 0.5 }} />
                            </Box>
                            {cut.status === 'draft' && (
                              <Button fullWidth variant='outlined'
                                onClick={() => handleAction(`ready-${cut.id}`, () => apiCall('post', `/calibration-services/${serviceId}/cuts/${cut.id}/ready-for-invoicing`), 'Marcado listo para facturar')}
                                disabled={actionLoading === `ready-${cut.id}`}
                                sx={{ ...outlineSx, py: 0.75 }}>
                                Listo para facturar
                              </Button>
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    )
                  })}
                  {canCreateCut && (
                    <Button fullWidth variant='outlined' startIcon={<AddCircleOutlineIcon />} onClick={() => setShowCut(true)} sx={{ ...outlineSx, bgcolor: G.white }}>
                      Crear corte
                    </Button>
                  )}
                </Stack>
              </Box>
            </Stack>
          )}
        </Box>

        {/* Barra de guardado: aparece solo si hay cambios */}
        {tab === 'work' && dirty && (
          <Box sx={{ position: 'fixed', left: 0, right: 0, bottom: 64, zIndex: 1250, px: 2 }}>
            <Box sx={{ maxWidth: 398, mx: 'auto', bgcolor: G.dark, color: 'white', borderRadius: '16px', p: 1, pl: 2, display: 'flex', alignItems: 'center', gap: 1.5, boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
              <Typography variant='body2' sx={{ flex: 1 }}>Cambios sin guardar</Typography>
              <Button variant='contained' disableElevation onClick={handleSaveProgress} disabled={saving}
                sx={{ ...primarySx, py: 1, px: 2.5 }}>
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </Box>
          </Box>
        )}

        {/* Navegación inferior */}
        <Paper elevation={0} sx={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1200, borderTop: `1px solid ${G.gray100}` }}>
          <BottomNavigation showLabels value={tab} onChange={(_, v) => { setTab(v); window.scrollTo({ top: 0 }) }} sx={{ maxWidth: 430, mx: 'auto', height: 64 }}>
            <BottomNavigationAction value='work' label='Trabajo' icon={<Badge color='primary' badgeContent={status === 'in_execution' && pendingCount > 0 ? pendingCount : 0}><AssignmentTurnedInOutlinedIcon /></Badge>}
              sx={{ '&.Mui-selected': { color: G.greenDark } }} />
            <BottomNavigationAction value='intake' label='Ingreso' icon={<Inventory2OutlinedIcon />} sx={{ '&.Mui-selected': { color: G.greenDark } }} />
            <BottomNavigationAction value='issues' label='Novedades' icon={<Badge color='warning' badgeContent={adjustments.length}><WarningAmberIcon /></Badge>} sx={{ '&.Mui-selected': { color: G.greenDark } }} />
            <BottomNavigationAction value='close' label='Cierre' icon={<Badge color='primary' badgeContent={cuts.length}><BorderColorOutlinedIcon /></Badge>} sx={{ '&.Mui-selected': { color: G.greenDark } }} />
          </BottomNavigation>
        </Paper>

        {/* === DIALOGS === */}

        {/* Logistics Dialog */}
        <Dialog open={showLogistics} onClose={() => setShowLogistics(false)} fullScreen>
          <Box sx={{ minHeight: '100vh', bgcolor: G.gray50, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ background: BANNER_BG, px: 2, pt: 2, pb: 1.5 }}>
              <Stack direction='row' spacing={2} alignItems='center' sx={{ mb: 1 }}>
                <IconButton size='small' aria-label='Volver' onClick={() => setShowLogistics(false)} sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: '50%', width: 32, height: 32 }}>
                  <ArrowBackIcon sx={{ color: 'white', fontSize: 18 }} />
                </IconButton>
                <Box>
                  <Typography variant='body1' fontWeight={700} sx={{ color: 'white', fontSize: '0.9rem' }}>Control de ingreso y entrega</Typography>
                </Box>
              </Stack>
              <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap'>
                <Typography variant='caption' fontWeight={600} sx={{ color: 'white' }}>{s.serviceCode}</Typography>
                <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.85)' }}>{s.customer?.nombre || ''}</Typography>
                <Box component='span' sx={{ ...chipSx, bgcolor: 'rgba(255,255,255,0.22)' }}>
                              {CALIBRATION_SERVICE_STATUS_LABELS[status as CalibrationServiceStatus]}
                </Box>
              </Stack>
            </Box>

            {/* Scrollable content */}
            <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 3, display: 'flex', flexDirection: 'column', gap: 3, pb: 24 }}>
              {/* Fechas */}
              <Box>
                <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: G.dark, mb: 1.5 }}>Fechas</Typography>
                <Card sx={{ borderRadius: '16px', border: `1px solid ${G.gray100}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <CardContent sx={{ p: 2, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 2 }}>
                    <Box>
                      <Typography variant='caption' sx={{ color: G.gray400, fontWeight: 500 }}>Fecha ingreso</Typography>
                      <TextField fullWidth size='small' type='date' value={logIntake} onChange={e => setLogIntake(e.target.value)} InputLabelProps={{ shrink: true }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', mt: 0.5 } }} />
                    </Box>
                    <Box>
                      <Typography variant='caption' sx={{ color: G.gray400, fontWeight: 500 }}>Fecha entrega</Typography>
                      <TextField fullWidth size='small' type='date' value={logDelivery} onChange={e => setLogDelivery(e.target.value)} InputLabelProps={{ shrink: true }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', mt: 0.5 } }} />
                    </Box>
                  </CardContent>
                </Card>
              </Box>

              {/* Solicitante */}
              <Box>
                <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: G.dark, mb: 1.5 }}>Solicitante</Typography>
                <Card sx={{ borderRadius: '16px', border: `1px solid ${G.gray100}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField fullWidth size='small' label='Empresa' value={logCompany} onChange={e => setLogCompany(e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5 }}>
                      <TextField size='small' label='Oferta' value={logOffer} onChange={e => setLogOffer(e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                      <TextField size='small' label='Teléfono' value={logPhone} onChange={e => setLogPhone(e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                    </Box>
                    <TextField fullWidth size='small' label='Contacto' value={logContact} onChange={e => setLogContact(e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5 }}>
                      <TextField size='small' label='Dirección' value={logAddress} onChange={e => setLogAddress(e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                      <TextField size='small' label='Ciudad' value={logCity} onChange={e => setLogCity(e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                    </Box>
                  </CardContent>
                </Card>
              </Box>

              {/* Equipos */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: G.dark }}>Equipos</Typography>
                  <Typography variant='caption' sx={{ color: G.green, fontWeight: 600 }}>{logEquipment.length} equipo{logEquipment.length !== 1 ? 's' : ''}</Typography>
                </Box>
                <DeviceSearch onSelect={(name) => setLogEquipment(p => [...p, {
                  equipmentName: name, brand: '', model: '', serial: '', asset: '', location: '',
                  physIn: null, physOut: null, opIn: null, opOut: null
                }])} />
                <Stack spacing={1.5}>
                  {logEquipment.map((eq, i) => (
                    <Card key={i} variant='outlined' sx={{ borderRadius: '16px', border: `1px solid ${G.gray200}` }}>
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Stack spacing={1.5}>
                          <Stack direction='row' spacing={1} alignItems='center'>
                            <TextField fullWidth size='small' label='Equipo' value={eq.equipmentName}
                              onChange={e => { const n = [...logEquipment]; n[i] = { ...n[i], equipmentName: e.target.value }; setLogEquipment(n) }}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            <IconButton size='small' onClick={() => setLogEquipment(p => p.filter((_, idx) => idx !== i))} sx={{ color: G.red }}>
                              <DeleteOutlineIcon fontSize='small' />
                            </IconButton>
                          </Stack>
                          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1 }}>
                            <TextField size='small' label='Marca' value={eq.brand} onChange={e => { const n = [...logEquipment]; n[i] = { ...n[i], brand: e.target.value }; setLogEquipment(n) }}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            <TextField size='small' label='Modelo' value={eq.model} onChange={e => { const n = [...logEquipment]; n[i] = { ...n[i], model: e.target.value }; setLogEquipment(n) }}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                          </Box>
                          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1 }}>
                            <TextField size='small' label='Serial' value={eq.serial} onChange={e => { const n = [...logEquipment]; n[i] = { ...n[i], serial: e.target.value }; setLogEquipment(n) }}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            <TextField size='small' label='Activo fijo' value={eq.asset} onChange={e => { const n = [...logEquipment]; n[i] = { ...n[i], asset: e.target.value }; setLogEquipment(n) }}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                          </Box>
                          <TextField size='small' label='Ubicación' value={eq.location} onChange={e => { const n = [...logEquipment]; n[i] = { ...n[i], location: e.target.value }; setLogEquipment(n) }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                          {(['physIn', 'physOut', 'opIn', 'opOut'] as const).map(fk => {
                            const labels: Record<string, string> = { physIn: 'Inspección física al ingreso', physOut: 'Inspección física a la salida', opIn: 'Inspección operativa al ingreso', opOut: 'Inspección operativa a la salida' }
                            return (
                              <Box key={fk}>
                                <Typography variant='caption' sx={{ color: G.gray600, fontWeight: 600 }}>{labels[fk]}</Typography>
                                <ToggleButtonGroup exclusive fullWidth size='small' value={eq[fk] || null} aria-label={labels[fk]} sx={{ mt: 0.5 }}
                                  onChange={(_, v) => { const n = [...logEquipment]; n[i] = { ...n[i], [fk]: v || null }; setLogEquipment(n) }}>
                                  {['B', 'M', 'NA', 'SI'].map(o => (
                                    <ToggleButton key={o} value={o} sx={{
                                      minHeight: 40, textTransform: 'none', fontWeight: 600, color: G.gray600, borderColor: G.gray200,
                                      '&.Mui-selected': { bgcolor: G.greenLight, color: G.greenDark, borderColor: G.green, fontWeight: 700 }
                                    }}>{o}</ToggleButton>
                                  ))}
                                </ToggleButtonGroup>
                              </Box>
                            )
                          })}
                          <Typography variant='caption' sx={{ color: G.gray400 }}>B = bueno · M = malo · NA = no aplica · SI = sí</Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
                <Button fullWidth variant='outlined' onClick={() => setLogEquipment(p => [...p, {
                  equipmentName: '', brand: '', model: '', serial: '', asset: '', location: '',
                  physIn: null, physOut: null, opIn: null, opOut: null
                }])}
                  sx={{ mt: 1.5, borderStyle: 'dashed', borderColor: G.green, color: G.greenDark, borderRadius: '12px', textTransform: 'none', fontWeight: 600, '&:active': { transform: 'scale(0.97)' } }}>
                  + Agregar equipo
                </Button>
              </Box>

              {/* Validaciones */}
              <Box>
                <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: G.dark, mb: 1.5 }}>Validaciones</Typography>
                <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${G.gray100}` }}>
                  <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                    {[
                      { label: 'Autoriza codificación', val: logNoSerial, set: setLogNoSerial },
                      { label: 'Define puntos de calibración', val: logCalPoints, set: setLogCalPoints },
                      { label: 'Condición especial', val: logSpecialCond, set: setLogSpecialCond },
                      { label: 'Incluye certificado', val: logCertIncluded, set: setLogCertIncluded },
                      { label: 'Incluye estampilla', val: logStamp, set: setLogStamp },
                    ].map((f, idx) => (
                      <Stack key={f.label} direction='row' alignItems='center' justifyContent='space-between' spacing={1.5}
                        sx={{ px: 2, py: 1.25, borderTop: idx ? `1px solid ${G.gray100}` : 'none' }}>
                        <Typography variant='body2' fontWeight={600} sx={{ color: G.dark, flex: 1 }}>{f.label}</Typography>
                        <ToggleButtonGroup exclusive size='small' value={f.val || null} aria-label={f.label}
                          onChange={(_, v) => f.set(v || '')}>
                          {[{ v: 'true', t: 'Sí' }, { v: 'false', t: 'No' }].map(o => (
                            <ToggleButton key={o.v} value={o.v} sx={{
                              minWidth: 56, minHeight: 40, textTransform: 'none', fontWeight: 600, color: G.gray600, borderColor: G.gray200,
                              '&.Mui-selected': { bgcolor: o.v === 'true' ? G.green : G.greenLight, color: o.v === 'true' ? 'white' : G.greenDark, borderColor: G.green, fontWeight: 700,
                                '&:hover': { bgcolor: o.v === 'true' ? G.greenDark : G.greenLight } }
                            }}>{o.t}</ToggleButton>
                          ))}
                        </ToggleButtonGroup>
                      </Stack>
                    ))}
                  </CardContent>
                </Card>
              </Box>

              {/* Firmas */}
              <Box>
                <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: G.dark, mb: 1.5 }}>Firmas</Typography>
                <Card sx={{ borderRadius: '16px', border: `1px solid ${G.gray100}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box>
                      <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 2, pb: 1, borderBottom: `1px solid ${G.gray100}` }}>
                        <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: G.green, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>1</Box>
                        <Typography variant='body2' fontWeight={600} sx={{ color: G.dark }}>Quien entrega</Typography>
                      </Stack>
                      <TextField fullWidth size='small' label='Nombre completo' value={logDeliveryName} onChange={e => setLogDeliveryName(e.target.value)}
                        sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                      <SignaturePad value={logDeliverySig} onChange={setLogDeliverySig} height={100} />
                    </Box>
                    <Box sx={{ borderTop: `1px solid ${G.gray100}`, pt: 2 }}>
                      <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 2, pb: 1, borderBottom: `1px solid ${G.gray100}` }}>
                        <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: G.greenDark, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>2</Box>
                        <Typography variant='body2' fontWeight={600} sx={{ color: G.dark }}>Quien recibe</Typography>
                      </Stack>
                      <TextField fullWidth size='small' label='Nombre completo' value={logReceiptName} onChange={e => setLogReceiptName(e.target.value)}
                        sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                      <SignaturePad value={logReceiptSig} onChange={setLogReceiptSig} height={100} />
                    </Box>
                  </CardContent>
                </Card>
              </Box>

              <TextField fullWidth size='small' multiline minRows={2} label='Observaciones' value={logObs} onChange={e => setLogObs(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
            </Box>

            {/* Sticky bottom bar */}
            <Box sx={{ position: 'sticky', bottom: 0, left: 0, right: 0, bgcolor: G.white, borderTop: `1px solid ${G.gray100}`, px: 2, py: 1.5 }}>
              <Stack direction='row' spacing={1.5}>
                <Button fullWidth onClick={() => setShowLogistics(false)}
                  sx={{ borderRadius: '12px', py: 1.5, border: `1px solid ${G.gray200}`, color: G.gray600, textTransform: 'none', fontWeight: 600, '&:active': { transform: 'scale(0.97)' } }}>
                  Cancelar
                </Button>
                <Button fullWidth variant='contained' onClick={() => handleAction('log', async () => {
                  const bool = (v: string) => v === 'true' ? true : v === 'false' ? false : null
              await apiCall('put', `/calibration-services/${serviceId}/logistics-control`, {
                intakeDate: logIntake || null, deliveryDate: logDelivery || null,
                requesterCompanyName: logCompany || null, requesterOfferNumber: logOffer || null,
                requesterAddress: logAddress || null, requesterPhone: logPhone || null,
                requesterContactName: logContact || null, requesterCity: logCity || null,
                noSerialAuthorization: bool(logNoSerial), calibrationPointsRequested: bool(logCalPoints),
                specialCondition: bool(logSpecialCond), calibrationCertificateIncluded: bool(logCertIncluded),
                stampIncluded: bool(logStamp), observations: logObs || null,
                deliveredToClientName: logDeliveryName || null, deliveredToClientSignature: logDeliverySig,
                receivedByClientName: logReceiptName || null, receivedByClientSignature: logReceiptSig,
                items: logEquipment.map((e, i) => ({
                  rowNumber: i + 1, equipmentName: e.equipmentName, brand: e.brand || null, model: e.model || null,
                  serialNumber: e.serial || null, assetNumber: e.asset || null, location: e.location || null,
                  serviceScope: 'NA',
                  physicalInspectionIn: e.physIn as any, physicalInspectionOut: e.physOut as any,
                  operationalInspectionIn: e.opIn as any, operationalInspectionOut: e.opOut as any
                }))
              })
            }, 'Control guardado', () => setShowLogistics(false))} disabled={actionLoading === 'log'}
            sx={primarySx} disableElevation>
            Guardar
          </Button>
          </Stack>
          </Box>
          </Box>
        </Dialog>
        {/* end Logistics Dialog */}

        {/* Trace Dialog */}
        <Dialog open={showTrace} onClose={() => setShowTrace(false)} fullWidth sx={sheetSx}>
          <DialogTitle>Registrar movimiento</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControl fullWidth size='small'>
                <InputLabel>Tipo</InputLabel>
                <Select value={traceMovement} label='Tipo' onChange={e => setTraceMovement(e.target.value as any)}>
                  <MenuItem value='pickup'>Recogida</MenuItem>
                  <MenuItem value='delivery'>Entrega</MenuItem>
                </Select>
              </FormControl>
              <TextField fullWidth size='small' label='Contacto' value={traceContact} onChange={e => setTraceContact(e.target.value)} />
              <TextField fullWidth size='small' label='Ubicación' value={traceLocation} onChange={e => setTraceLocation(e.target.value)} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowTrace(false)}>Cancelar</Button>
            <Button variant='contained' disableElevation sx={primarySx} onClick={() => handleAction('trace', () => apiCall('post', `/calibration-services/${serviceId}/physical-traceability`, {
              movementType: traceMovement, occurredAt: new Date().toISOString(), contactName: traceContact, location: traceLocation || null, notes: null
            }), 'Movimiento registrado', () => { setShowTrace(false); setTraceContact(''); setTraceLocation('') })} disabled={actionLoading === 'trace'}>Guardar</Button>
          </DialogActions>
        </Dialog>

        {/* Adjustment Dialog */}
        <Dialog open={showAdjust} onClose={() => setShowAdjust(false)} fullWidth sx={sheetSx}>
          <DialogTitle>Reportar novedad</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControl fullWidth size='small'>
                <InputLabel>Ítem</InputLabel>
                <Select value={adjItemId} label='Ítem' onChange={e => setAdjItemId(e.target.value)}>
                  {items.map(i => <MenuItem key={i.id} value={String(i.id)}>{i.itemName}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth size='small'>
                <InputLabel>Tipo</InputLabel>
                <Select value={adjChangeType} label='Tipo' onChange={e => setAdjChangeType(e.target.value)}>
                  <MenuItem value='quantity_more'>Cantidad mayor</MenuItem>
                  <MenuItem value='quantity_less'>Cantidad menor</MenuItem>
                  <MenuItem value='extra_item'>Ítem extra</MenuItem>
                  <MenuItem value='not_received'>No recibido</MenuItem>
                  <MenuItem value='scope_change'>Cambio de alcance</MenuItem>
                </Select>
              </FormControl>
              <TextField fullWidth size='small' label='Cantidad real' type='number' value={adjQuantity} onChange={e => setAdjQuantity(e.target.value)} helperText='Cantidad que se encontró realmente' />
              <TextField fullWidth size='small' multiline minRows={2} label='Motivo (mín. 5 caracteres)' error={adjReason.length > 0 && adjReason.trim().length < 5} value={adjReason} onChange={e => setAdjReason(e.target.value)} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAdjust(false)}>Cancelar</Button>
            <Button variant='contained' color='warning' onClick={() => handleAction('adj', async () => {
              const quotedQty = items.find(i => String(i.id) === adjItemId)?.quantity || 1
              await apiCall('post', `/calibration-services/${serviceId}/adjustments`, {
                serviceItemId: adjItemId ? Number(adjItemId) : null,
                changeType: adjChangeType,
                quotedQuantity: quotedQty,
                actualQuantity: adjQuantity ? Number(adjQuantity) : 1,
                description: adjReason && adjReason.length >= 5 ? adjReason : `Novedad por ${adjChangeType.replace('_', ' ')}`,
                contractModificationRequired: false
              })
              setShowAdjust(false)
              setAdjItemId(''); setAdjChangeType('quantity_more'); setAdjQuantity(''); setAdjReason('')
            }, 'Novedad reportada')} disabled={actionLoading === 'adj' || (adjChangeType !== 'extra_item' && !adjItemId) || adjQuantity === '' || adjReason.trim().length < 5}>Reportar</Button>
          </DialogActions>
        </Dialog>

        {/* Cut Dialog */}
        <Dialog open={showCut} onClose={() => setShowCut(false)} fullWidth sx={sheetSx}>
          <DialogTitle>Crear corte</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControl fullWidth size='small'>
                <InputLabel>Tipo</InputLabel>
                <Select value={cutType} label='Tipo' onChange={e => {
                  const next = e.target.value as 'partial' | 'final'
                  setCutType(next)
                  // Un corte final libera todo lo pendiente: se marca y se rellena solo
                  if (next === 'final') {
                    setCutSel(Object.fromEntries(cutCandidates.map(c => [c.item.id, { on: true, qty: c.available }])))
                  }
                }}>
                  <MenuItem value='partial'>Parcial</MenuItem>
                  <MenuItem value='final'>Final</MenuItem>
                </Select>
              </FormControl>
              {cutType === 'final' && cutCandidates.some(c => !cutSel[c.item.id]?.on || cutSel[c.item.id].qty < c.available) && (
                <Alert severity='warning'>Este corte no libera todo lo pendiente, así que se guardará como parcial.</Alert>
              )}
              <Typography variant='body2' fontWeight={700} sx={{ color: G.dark }}>Ítems que entran al corte</Typography>
              {cutCandidates.length === 0 ? (
                <Typography variant='body2' sx={{ color: G.gray600 }}>
                  No hay unidades disponibles. Marca un ítem como completado o en proceso, o revisa que no estén ya todas en otro corte.
                </Typography>
              ) : cutCandidates.map(c => {
                const sel = cutSel[c.item.id] || { on: false, qty: 1 }
                const setQty = (q: number) => setCutSel(p => ({ ...p, [c.item.id]: { ...sel, qty: Math.min(Math.max(q, 1), c.available) } }))
                return (
                  <Box key={c.item.id} sx={{ border: `1px solid ${sel.on ? G.green : G.gray100}`, borderRadius: '14px', p: 1.25 }}>
                    <Stack direction='row' alignItems='center' spacing={0.5}>
                      <Checkbox checked={sel.on} onChange={(_, v) => setCutSel(p => ({ ...p, [c.item.id]: { ...sel, on: v } }))}
                        inputProps={{ 'aria-label': `Incluir ${c.item.itemName}` }} sx={{ color: G.gray300, '&.Mui-checked': { color: G.green } }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant='body2' fontWeight={700} sx={{ color: G.dark, lineHeight: 1.3 }}>{c.item.itemName}</Typography>
                        <Typography variant='caption' sx={{ color: G.gray600 }}>{c.available} disponible{c.available === 1 ? '' : 's'}</Typography>
                      </Box>
                    </Stack>
                    {sel.on && (
                      <Stack direction='row' alignItems='center' justifyContent='flex-end' spacing={0.5} sx={{ mt: 0.5 }}>
                        <IconButton aria-label='Restar uno' onClick={() => setQty(sel.qty - 1)} disabled={sel.qty <= 1}
                          sx={{ bgcolor: G.white, border: `1px solid ${G.gray200}`, width: 40, height: 40 }}><RemoveIcon /></IconButton>
                        <Typography fontWeight={700} sx={{ minWidth: 56, textAlign: 'center', color: G.dark }}>{sel.qty} de {c.available}</Typography>
                        <IconButton aria-label='Sumar uno' onClick={() => setQty(sel.qty + 1)} disabled={sel.qty >= c.available}
                          sx={{ bgcolor: G.green, color: 'white', width: 40, height: 40, '&:hover': { bgcolor: G.greenDark }, '&.Mui-disabled': { bgcolor: G.gray100, color: G.gray300 } }}><AddIcon /></IconButton>
                      </Stack>
                    )}
                  </Box>
                )
              })}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCut(false)}>Cancelar</Button>
            <Button variant='contained' disableElevation sx={primarySx} onClick={() => handleAction('cut', async () => {
              if (dirty && ['scheduled', 'in_execution'].includes(status)) await apiCall('put', `/calibration-services/${serviceId}/item-progress`, progressPayload())
              await apiCall('post', `/calibration-services/${serviceId}/cuts`, {
                cutType, notes: null, items: cutSelected.map(c => ({ serviceItemId: c.item.id, quantity: cutSel[c.item.id].qty }))
              })
            }, 'Corte creado', () => setShowCut(false))} disabled={actionLoading === 'cut' || cutSelected.length === 0}>
              {cutSelected.length ? `Crear corte (${cutSelected.length})` : 'Crear corte'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
      )}
    </Box>
  )
}

const DeviceSearch = ({ onSelect }: { onSelect: (name: string) => void }) => {
  const [query, setQuery] = useState('')
  const { options, loading } = useCalibrationDeviceSearch(query)

  return (
    <Autocomplete size='small' options={options} loading={loading} value={null} blurOnSelect inputValue={query} onInputChange={(_, v) => setQuery(v)}
      getOptionLabel={o => o.name} noOptionsText='Escribe para buscar...'
      onChange={(_, v) => { if (v) { onSelect(v.name); setQuery('') } }}
      renderInput={p => <TextField {...p} placeholder='Buscar equipo del catálogo...' InputProps={{ ...p.InputProps, startAdornment: <SearchIcon sx={{ mr: 0.5, color: '#9ca3af', fontSize: 20 }} /> }} />}
      sx={{ mb: 1 }}
    />
  )
}

export default MobilePage