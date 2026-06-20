import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert, Autocomplete, Box, Button, Card, CardContent,
  Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, IconButton, InputLabel, MenuItem, Select, Stack, TextField, Typography
} from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import { Toaster, toast } from 'react-hot-toast'
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
import SignaturePad from '../../Components/Maintenance/SignaturePad'
import {
  CalibrationService, CalibrationServiceCut, CalibrationServiceOperationalItemStatus
} from '../../types/calibrationService'
import {
  CALIBRATION_SERVICE_STATUS_COLORS, CALIBRATION_SERVICE_STATUS_LABELS,
  CALIBRATION_SERVICE_OPERATIONAL_ITEM_STATUS_LABELS
} from '../../constants/calibrationServices'

// Figma design palette
const G = {
  green: '#00A651', greenLight: '#e8f7ef', greenDark: '#007a3d',
  yellow: '#F5A623', yellowLight: '#fff8ec', red: '#e53e3e',
  gray50: '#f0f2f5', gray100: '#e8eaed', gray200: '#d1d5db',
  gray300: '#b0b7c3', gray400: '#9ca3af', gray600: '#4b5563',
  gray800: '#1f2937', dark: '#1a1a2e', white: '#ffffff'
}

const STATUS_FLOW: CalibrationServiceOperationalItemStatus[] = ['pending', 'scheduled', 'in_progress', 'completed']
const CUT_STATUSES: Record<string, { label: string; color: string }> = {
  draft: { label: 'Borrador', color: G.yellow },
  ready_for_invoicing: { label: 'Listo facturar', color: G.green },
  invoiced: { label: 'Facturado', color: G.gray400 }
}

const getOps = (s: any) => (s?.otherFields?.operations || {})
const getScheduledDate = (s: any) => getOps(s)?.scheduledDate || getOps(s)?.scheduledFor

const MobilePage = () => {
  const { serviceId } = useParams()
  const navigate = useNavigate()
  const { data: service, isLoading, refetch } = useQuery(
    ['calibration-service-mobile', serviceId],
    async () => (await axiosPrivate.get(`/calibration-services/${serviceId}`)).data as CalibrationService,
    { enabled: Boolean(serviceId) }
  )

  const s = service
  const items = s?.items || []
  const cuts = s?.cuts || []
  const status = s?.status || ''
  const scheduledDate = getScheduledDate(s)
  const ops = getOps(s)

  // Execution state
  const [draftItems, setDraftItems] = useState<Record<number, CalibrationServiceOperationalItemStatus>>({})
  const [draftNotes, setDraftNotes] = useState<Record<number, string>>({})
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

  // Signature
  const [deliveryName, setDeliveryName] = useState('')
  const [deliverySignature, setDeliverySignature] = useState<string | null>(null)

  useEffect(() => {
    if (!s) return
    setDraftItems({}); setDraftNotes({})
    for (const item of (s.items || [])) {
      const st = (item as any).otherFields?.operationalStatus || 'pending'
      setDraftItems(p => ({ ...p, [item.id]: st }))
      setDraftNotes(p => ({ ...p, [item.id]: (item as any).otherFields?.technicalNotes || '' }))
    }
  }, [s?.id])

  const allCompleted = useMemo(() => items.length > 0 && items.every(i => draftItems[i.id] === 'completed'), [items, draftItems])

  const apiCall = async (method: string, url: string, body?: any) => {
    const res = await axiosPrivate({ method, url, data: body } as any)
    return res.data
  }

  const handleAction = async (key: string, fn: () => Promise<any>, msg: string) => {
    setActionLoading(key)
    try { await fn(); toast.success(msg); void refetch() }
    catch (e: any) { toast.error(e?.response?.data?.error || `Error: ${msg}`) }
    setActionLoading(null)
  }

  const handleSaveProgress = async () => {
    setSaving(true)
    try {
      await apiCall('put', `/calibration-services/${serviceId}/item-progress`, {
        items: items.map(i => ({ itemId: i.id, operationalStatus: draftItems[i.id] || 'pending', technicalNotes: draftNotes[i.id] || '' }))
      })
      toast.success('Avance guardado')
    } catch { toast.error('Error al guardar') }
    setSaving(false)
  }

return (
    <Box sx={{ minHeight: '100vh', bgcolor: G.gray50, pb: 12 }}>
      <Toaster position='top-center' />
      {isLoading ? <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box> :
      !s ? <Box sx={{ p: 2 }}><Alert severity='error'>Servicio no encontrado</Alert></Box> : (
      <Box sx={{ maxWidth: 430, mx: 'auto' }}>
        {/* Header */}
      <Box sx={{ bgcolor: G.green, px: 2, py: 2, color: 'white' }}>
        <Stack direction='row' alignItems='center' spacing={1} sx={{ mb: 1 }}>
          <ArrowBackIcon fontSize='small' onClick={() => navigate(-1)} sx={{ cursor: 'pointer', opacity: 0.8 }} />
          <Typography variant='body2' sx={{ opacity: 0.75 }}>MetroMedics</Typography>
        </Stack>
        <Typography variant='h6' fontWeight={800}>{s.serviceCode}</Typography>
        <Stack direction='row' alignItems='center' spacing={1.5} sx={{ mt: 1, flexWrap: 'wrap' }}>
          <Typography variant='body2' fontWeight={600} sx={{ fontSize: '0.75rem' }}>{s.customer?.nombre || s.executionCustomerName}</Typography>
          <Box component='span' sx={{ bgcolor: `${G.greenDark}99`, color: 'white', fontSize: '0.65rem', fontWeight: 600, px: 1.5, py: 0.3, borderRadius: '999px' }}>
            {CALIBRATION_SERVICE_STATUS_LABELS[status]}
          </Box>
          {s.odsCode && <Box component='span' sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '0.65rem', fontWeight: 600, px: 1.5, py: 0.3, borderRadius: '999px' }}>{s.odsCode}</Box>}
          {scheduledDate && <Box component='span' sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '0.65rem', fontWeight: 600, px: 1.5, py: 0.3, borderRadius: '999px' }}>{new Date(scheduledDate).toLocaleDateString('es-CO')}</Box>}
        </Stack>
      </Box>

        {/* Execution */}
        {['scheduled', 'in_execution'].includes(status) && (
          <Card sx={{ mx: 2, mt: 2, borderRadius: 3 }}>
            <CardContent sx={{ p: 2 }}>
              <Stack spacing={1.5}>
                {status === 'scheduled' && (
                  <Button fullWidth variant='contained' startIcon={<PlayArrowIcon />}
                    onClick={() => handleAction('start', () => apiCall('post', `/calibration-services/${serviceId}/start-execution`, { startedAt: new Date().toISOString() }), 'Ejecución iniciada')}
                    disabled={actionLoading === 'start'}
                    sx={{ borderRadius: '16px', py: 2, textTransform: 'none', fontWeight: 700, '&:active': { transform: 'scale(0.97)' } }}>
                    Iniciar ejecución
                  </Button>
                )}
                {status === 'in_execution' && (
                  <Button fullWidth variant='contained' color='success' startIcon={<CheckCircleIcon />}
                    onClick={() => handleAction('complete', () => apiCall('post', `/calibration-services/${serviceId}/complete-execution`, { technicallyCompletedAt: new Date().toISOString() }), 'Ejecución finalizada')}
                    disabled={!allCompleted || actionLoading === 'complete'}
                    sx={{ borderRadius: '16px', py: 2, textTransform: 'none', fontWeight: 700, '&:active': { transform: 'scale(0.97)' } }}>
                    {allCompleted ? 'Finalizar ejecución' : 'Completa todos los ítems primero'}
                  </Button>
                )}
                {status === 'in_execution' && !ops?.isPaused && (
                  <Button fullWidth variant='text' color='warning' size='small' startIcon={<PauseIcon />}
                    onClick={() => handleAction('pause', () => apiCall('post', `/calibration-services/${serviceId}/pause`, { pauseReason: 'Pausado desde móvil' }), 'Servicio pausado')}
                    disabled={actionLoading === 'pause'}
                    sx={{ textTransform: 'none' }}>
                    Pausar servicio
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Items */}
        <Typography sx={{ px: 2, mt: 3, mb: 1, fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: G.gray400 }}>Ítems del servicio</Typography>
        <Stack spacing={1.5} sx={{ px: 2 }}>
          {items.map(item => (
            <Card key={item.id} sx={{ borderRadius: '16px', border: `1px solid ${G.gray100}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant='subtitle2' fontWeight={700}>{item.itemName}</Typography>
                <FormControl fullWidth size='small' sx={{ mt: 1 }}>
                  <InputLabel>Estado</InputLabel>
                  <Select value={draftItems[item.id] || 'pending'} label='Estado'
                    onChange={e => setDraftItems(p => ({ ...p, [item.id]: e.target.value as any }))}>
                    {STATUS_FLOW.map(s => <MenuItem key={s} value={s}>{CALIBRATION_SERVICE_OPERATIONAL_ITEM_STATUS_LABELS[s]}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField fullWidth size='small' multiline minRows={2} placeholder='Notas técnicas'
                  value={draftNotes[item.id] || ''} onChange={e => setDraftNotes(p => ({ ...p, [item.id]: e.target.value }))} sx={{ mt: 1 }} />
              </CardContent>
            </Card>
          ))}
          {items.length > 0 && (
            <Button fullWidth variant='contained' onClick={handleSaveProgress} disabled={saving}
              sx={{ borderRadius: '16px', py: 2, textTransform: 'none', fontWeight: 700, '&:active': { transform: 'scale(0.97)' } }}>
              {saving ? 'Guardando...' : 'Guardar avance técnico'}
            </Button>
          )}
        </Stack>

        {/* Logistics */}
        <Typography sx={{ px: 2, mt: 3, mb: 1, fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: G.gray400 }}>Logística</Typography>
        <Stack spacing={1} sx={{ px: 2 }}>
          <Button fullWidth variant='outlined' startIcon={<InventoryIcon />}
            onClick={() => setShowLogistics(true)}
            sx={{ borderRadius: '16px', py: 1.5, textTransform: 'none', fontWeight: 600, '&:active': { transform: 'scale(0.97)' } }}>
            Diligenciar control de ingreso
          </Button>
          <Button fullWidth variant='outlined' startIcon={<AddCircleOutlineIcon />}
            onClick={() => setShowTrace(true)}
            sx={{ borderRadius: '16px', py: 1.5, textTransform: 'none', fontWeight: 600, '&:active': { transform: 'scale(0.97)' } }}>
            Registrar movimiento físico
          </Button>
        </Stack>

        {/* Adjustments */}
        <Typography sx={{ px: 2, mt: 3, mb: 1, fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: G.gray400 }}>Novedades</Typography>
        <Stack spacing={1} sx={{ px: 2 }}>
          <Button fullWidth variant='outlined' color='warning' startIcon={<WarningAmberIcon />}
            onClick={() => setShowAdjust(true)}
            sx={{ borderRadius: '16px', py: 1.5, textTransform: 'none', fontWeight: 600, '&:active': { transform: 'scale(0.97)' } }}>
            Reportar novedad
          </Button>
        </Stack>

        {/* Signature */}
        <Typography sx={{ px: 2, mt: 3, mb: 1, fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: G.gray400 }}>Firma de recepción</Typography>
        <Card sx={{ mx: 2, borderRadius: 3 }} elevation={1}>
          <CardContent sx={{ p: 2 }}>
            <TextField fullWidth size='small' label='Nombre de quien recibe' value={deliveryName} onChange={e => setDeliveryName(e.target.value)} sx={{ mb: 2 }} />
            <SignaturePad value={deliverySignature} onChange={setDeliverySignature} height={120} />
            <Button fullWidth variant='contained' onClick={() => handleAction('sig', () => apiCall('put', `/calibration-services/${serviceId}/delivery-signature`, { deliveryName: deliveryName.trim() || null, deliverySignatureData: deliverySignature }), 'Firma guardada')}
              disabled={!deliverySignature || actionLoading === 'sig'}
              sx={{ mt: 2, borderRadius: 3, py: 1.5, textTransform: 'none', fontWeight: 700 }}>
              Guardar firma
            </Button>
          </CardContent>
        </Card>

        {/* Cuts */}
        <Typography sx={{ px: 2, mt: 3, mb: 1, fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: G.gray400 }}>Cortes</Typography>
        <Stack spacing={1} sx={{ px: 2 }}>
          {cuts.map((cut: CalibrationServiceCut) => {
            const cs = CUT_STATUSES[cut.status] || { label: cut.status, color: '#6b7280' }
            return (
              <Card key={cut.id} sx={{ borderRadius: 2 }} elevation={0} variant='outlined'>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Stack direction='row' justifyContent='space-between' alignItems='center'>
                    <Box>
                      <Typography variant='body2' fontWeight={700}>{cut.cutCode || `Corte #${cut.id}`}</Typography>
                      <Chip size='small' label={cs.label} sx={{ bgcolor: cs.color, color: '#fff', fontSize: '0.65rem', height: 20, mt: 0.25 }} />
                    </Box>
                    {cut.status === 'draft' && (
                      <Button size='small' variant='contained' color='info'
                        onClick={() => handleAction(`ready-${cut.id}`, () => apiCall('post', `/calibration-services/${serviceId}/cuts/${cut.id}/ready-for-invoicing`), 'Marcado listo para facturar')}
                        disabled={actionLoading === `ready-${cut.id}`}
                        sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.75rem' }}>
                        Listo facturar
                      </Button>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            )
          })}
          {['in_execution', 'technically_completed'].includes(status) && (
            <Button fullWidth variant='outlined' onClick={() => setShowCut(true)}
              sx={{ borderRadius: '16px', py: 1.5, textTransform: 'none', fontWeight: 600, '&:active': { transform: 'scale(0.97)' } }}>
              Crear corte
            </Button>
          )}
        </Stack>

        {/* === DIALOGS === */}

        {/* Logistics Dialog */}
        <Dialog open={showLogistics} onClose={() => setShowLogistics(false)} fullScreen>
          <DialogTitle>Control de ingreso y entrega</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant='subtitle2' fontWeight={700}>Fechas</Typography>
              <Stack direction='row' spacing={1}>
                <TextField fullWidth size='small' type='date' label='Fecha ingreso' value={logIntake} onChange={e => setLogIntake(e.target.value)} InputLabelProps={{ shrink: true }} />
                <TextField fullWidth size='small' type='date' label='Fecha entrega' value={logDelivery} onChange={e => setLogDelivery(e.target.value)} InputLabelProps={{ shrink: true }} />
              </Stack>

              <Typography variant='subtitle2' fontWeight={700}>Solicitante</Typography>
              <TextField fullWidth size='small' label='Empresa' value={logCompany} onChange={e => setLogCompany(e.target.value)} />
              <Stack direction='row' spacing={1}>
                <TextField fullWidth size='small' label='Oferta' value={logOffer} onChange={e => setLogOffer(e.target.value)} />
                <TextField fullWidth size='small' label='Teléfono' value={logPhone} onChange={e => setLogPhone(e.target.value)} />
              </Stack>
              <TextField fullWidth size='small' label='Contacto' value={logContact} onChange={e => setLogContact(e.target.value)} />
              <Stack direction='row' spacing={1}>
                <TextField fullWidth size='small' label='Dirección' value={logAddress} onChange={e => setLogAddress(e.target.value)} />
                <TextField fullWidth size='small' label='Ciudad' value={logCity} onChange={e => setLogCity(e.target.value)} />
              </Stack>

              <Typography variant='subtitle2' fontWeight={700}>Equipos</Typography>
              <DeviceSearch
                onSelect={(name) => setLogEquipment(p => [...p, {
                  equipmentName: name, brand: '', model: '', serial: '', asset: '', location: '',
                  physIn: null, physOut: null, opIn: null, opOut: null
                }])}
              />
              {logEquipment.map((eq, i) => (
                <Card key={i} variant='outlined' sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Stack spacing={1}>
                      <Stack direction='row' spacing={1} alignItems='center'>
                        <TextField fullWidth size='small' label='Equipo' value={eq.equipmentName}
                          onChange={e => { const n = [...logEquipment]; n[i] = { ...n[i], equipmentName: e.target.value }; setLogEquipment(n) }} />
                        <IconButton size='small' color='error' onClick={() => setLogEquipment(p => p.filter((_, idx) => idx !== i))}>
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Stack>
                      <Stack direction='row' spacing={1}>
                        <TextField size='small' label='Marca' value={eq.brand} onChange={e => { const n = [...logEquipment]; n[i] = { ...n[i], brand: e.target.value }; setLogEquipment(n) }} sx={{ flex: 1 }} />
                        <TextField size='small' label='Modelo' value={eq.model} onChange={e => { const n = [...logEquipment]; n[i] = { ...n[i], model: e.target.value }; setLogEquipment(n) }} sx={{ flex: 1 }} />
                      </Stack>
                      <Stack direction='row' spacing={1}>
                        <TextField size='small' label='Serial' value={eq.serial} onChange={e => { const n = [...logEquipment]; n[i] = { ...n[i], serial: e.target.value }; setLogEquipment(n) }} sx={{ flex: 1 }} />
                        <TextField size='small' label='Activo fijo' value={eq.asset} onChange={e => { const n = [...logEquipment]; n[i] = { ...n[i], asset: e.target.value }; setLogEquipment(n) }} sx={{ flex: 1 }} />
                      </Stack>
                      <Stack direction='row' spacing={0.5}>
                        {(['physIn', 'physOut', 'opIn', 'opOut'] as const).map(f => {
                          const labels: Record<string, string> = { physIn: 'Fís. ing', physOut: 'Fís. sal', opIn: 'Oper. ing', opOut: 'Oper. sal' }
                          return (
                            <FormControl key={f} size='small' sx={{ flex: 1 }}>
                              <InputLabel>{labels[f]}</InputLabel>
                              <Select value={eq[f as keyof typeof eq] || ''} label={labels[f]}
                                onChange={e => { const n = [...logEquipment]; n[i] = { ...n[i], [f]: e.target.value || null }; setLogEquipment(n) }}>
                                <MenuItem value=''><em>—</em></MenuItem>
                                <MenuItem value='B'>B</MenuItem><MenuItem value='M'>M</MenuItem><MenuItem value='NA'>NA</MenuItem><MenuItem value='SI'>SI</MenuItem>
                              </Select>
                            </FormControl>
                          )
                        })}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
              <Button variant='outlined' size='small' onClick={() => setLogEquipment(p => [...p, {
                equipmentName: '', brand: '', model: '', serial: '', asset: '', location: '',
                physIn: null, physOut: null, opIn: null, opOut: null
              }])} sx={{ borderRadius: 2, textTransform: 'none' }}>
                + Agregar equipo
              </Button>

              <Typography variant='subtitle2' fontWeight={700}>Validaciones</Typography>
              <Stack spacing={1}>
                {[
                  { label: 'Autoriza codificación', val: logNoSerial, set: setLogNoSerial },
                  { label: 'Define pts. calibración', val: logCalPoints, set: setLogCalPoints },
                  { label: 'Condición especial', val: logSpecialCond, set: setLogSpecialCond },
                  { label: 'Incluye certificado', val: logCertIncluded, set: setLogCertIncluded },
                  { label: 'Incluye estampilla', val: logStamp, set: setLogStamp },
                ].map(f => (
                  <FormControl key={f.label} fullWidth size='small'>
                    <InputLabel>{f.label}</InputLabel>
                    <Select value={f.val} label={f.label} onChange={e => f.set(e.target.value)}>
                      <MenuItem value=''>Sin definir</MenuItem><MenuItem value='true'>Sí</MenuItem><MenuItem value='false'>No</MenuItem>
                    </Select>
                  </FormControl>
                ))}
              </Stack>

              <Typography variant='subtitle2' fontWeight={700}>Firmas</Typography>
              <TextField fullWidth size='small' label='Entrega (nombre)' value={logDeliveryName} onChange={e => setLogDeliveryName(e.target.value)} />
              <SignaturePad value={logDeliverySig} onChange={setLogDeliverySig} height={100} />
              <TextField fullWidth size='small' label='Recibe (nombre)' value={logReceiptName} onChange={e => setLogReceiptName(e.target.value)} />
              <SignaturePad value={logReceiptSig} onChange={setLogReceiptSig} height={100} />

              <TextField fullWidth size='small' multiline minRows={2} label='Observaciones' value={logObs} onChange={e => setLogObs(e.target.value)} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowLogistics(false)}>Cancelar</Button>
            <Button variant='contained' onClick={() => handleAction('log', async () => {
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
            }, 'Control guardado')} disabled={actionLoading === 'log'}>Guardar</Button>
          </DialogActions>
        </Dialog>

        {/* Trace Dialog */}
        <Dialog open={showTrace} onClose={() => setShowTrace(false)} fullWidth>
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
            <Button variant='contained' onClick={() => handleAction('trace', () => apiCall('post', `/calibration-services/${serviceId}/physical-traceability`, {
              movementType: traceMovement, occurredAt: new Date().toISOString(), contactName: traceContact, location: traceLocation || null, notes: null
            }), 'Movimiento registrado')} disabled={actionLoading === 'trace'}>Guardar</Button>
          </DialogActions>
        </Dialog>

        {/* Adjustment Dialog */}
        <Dialog open={showAdjust} onClose={() => setShowAdjust(false)} fullWidth>
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
                  <MenuItem value='item_removed'>Ítm retirado</MenuItem>
                  <MenuItem value='other'>Otra</MenuItem>
                </Select>
              </FormControl>
              <TextField fullWidth size='small' label='Cantidad' type='number' value={adjQuantity} onChange={e => setAdjQuantity(e.target.value)} />
              <TextField fullWidth size='small' multiline minRows={2} label='Motivo' value={adjReason} onChange={e => setAdjReason(e.target.value)} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAdjust(false)}>Cancelar</Button>
            <Button variant='contained' color='warning' onClick={() => handleAction('adj', async () => {
              await apiCall('post', `/calibration-services/${serviceId}/adjustments`, {
                adjustments: [{
                  serviceItemId: adjItemId ? Number(adjItemId) : null,
                  changeType: adjChangeType, differenceQuantity: adjQuantity ? Number(adjQuantity) : 0, reason: adjReason || null
                }]
              })
            }, 'Novedad reportada')} disabled={actionLoading === 'adj'}>Reportar</Button>
          </DialogActions>
        </Dialog>

        {/* Cut Dialog */}
        <Dialog open={showCut} onClose={() => setShowCut(false)} fullWidth>
          <DialogTitle>Crear corte</DialogTitle>
          <DialogContent>
            <FormControl fullWidth size='small' sx={{ mt: 1 }}>
              <InputLabel>Tipo</InputLabel>
              <Select value={cutType} label='Tipo' onChange={e => setCutType(e.target.value as any)}>
                <MenuItem value='partial'>Parcial</MenuItem>
                <MenuItem value='final'>Final</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCut(false)}>Cancelar</Button>
            <Button variant='contained' onClick={() => handleAction('cut', async () => {
              if (items.length) await apiCall('put', `/calibration-services/${serviceId}/item-progress`, {
                items: items.map(i => ({ itemId: i.id, operationalStatus: draftItems[i.id] || 'pending', technicalNotes: draftNotes[i.id] || '' }))
              })
              await apiCall('post', `/calibration-services/${serviceId}/cuts`, {
                cutType, notes: null, items: items.filter(i => draftItems[i.id] === 'completed').map(i => ({ serviceItemId: i.id, quantity: 1 }))
              })
            }, 'Corte creado')} disabled={actionLoading === 'cut'}>Crear</Button>
          </DialogActions>
        </Dialog>
      </Box>
      )}
    </Box>
  )
}

const DeviceSearch = ({ onSelect }: { onSelect: (name: string) => void }) => {
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<Array<{ id: number; name: string }>>([])
  const [loading, setLoading] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    clearTimeout(timer.current)
    if (query.trim().length < 2) { setOptions([]); return }
    timer.current = setTimeout(async () => {
      setLoading(true)
      try { const res = await axiosPrivate.get('/devices', { params: { q: query.trim() } }); setOptions((res.data || []).map((d: any) => ({ id: d.id, name: d.name }))) }
      catch { setOptions([]) }
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer.current)
  }, [query])

  return (
    <Autocomplete size='small' options={options} loading={loading} inputValue={query} onInputChange={(_, v) => setQuery(v)}
      getOptionLabel={o => o.name} noOptionsText='Escribe para buscar...'
      onChange={(_, v) => { if (v) { onSelect(v.name); setQuery('') } }}
      renderInput={p => <TextField {...p} placeholder='Buscar equipo del catálogo...' InputProps={{ ...p.InputProps, startAdornment: <SearchIcon sx={{ mr: 0.5, color: '#9ca3af', fontSize: 20 }} /> }} />}
      sx={{ mb: 1 }}
    />
  )
}

export default MobilePage