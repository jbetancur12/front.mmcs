import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import { Toaster, toast } from 'react-hot-toast'
import { axiosPrivate } from '@utils/api'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import SignaturePad from '../../Components/Maintenance/SignaturePad'
import {
  CalibrationService,
  CalibrationServiceOperationalItemStatus
} from '../../types/calibrationService'
import {
  CALIBRATION_SERVICE_STATUS_COLORS,
  CALIBRATION_SERVICE_STATUS_LABELS,
  CALIBRATION_SERVICE_OPERATIONAL_ITEM_STATUS_LABELS
} from '../../constants/calibrationServices'

const STATUS_FLOW: CalibrationServiceOperationalItemStatus[] = [
  'pending', 'scheduled', 'in_progress', 'completed'
]

const MobilePage = () => {
  const { serviceId } = useParams()
  const navigate = useNavigate()

  const { data: service, isLoading, refetch } = useQuery(
    ['calibration-service', serviceId],
    async () => {
      const res = await axiosPrivate.get(`/calibration-services/${serviceId}`)
      return res.data as CalibrationService
    },
    { enabled: Boolean(serviceId) }
  )

  const [draftItems, setDraftItems] = useState<Record<number, CalibrationServiceOperationalItemStatus>>({})
  const [draftNotes, setDraftNotes] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showTraceDialog, setShowTraceDialog] = useState(false)
  const [showCutDialog, setShowCutDialog] = useState(false)
  const [cutType, setCutType] = useState<'partial' | 'final'>('partial')
  const [deliveryName, setDeliveryName] = useState('')
  const [deliverySignature, setDeliverySignature] = useState<string | null>(null)
  const [traceMovement, setTraceMovement] = useState<'pickup' | 'delivery'>('pickup')
  const [traceContact, setTraceContact] = useState('')
  const [traceLocation, setTraceLocation] = useState('')

  const items = service?.items || []
  const ops: any = service?.otherFields?.operations || {}
  const scheduledDate = ops?.scheduledDate || ops?.scheduledFor

  useEffect(() => {
    if (!service) return
    setDraftItems({})
    setDraftNotes({})
    for (const item of (service.items || [])) {
      const status = (item as any).otherFields?.operationalStatus || 'pending'
      setDraftItems(prev => ({ ...prev, [item.id]: status }))
      const notes = (item as any).otherFields?.technicalNotes || ''
      setDraftNotes(prev => ({ ...prev, [item.id]: notes }))
    }
  }, [service?.id])

  const allItemsCompleted = useMemo(
    () => items.length > 0 && items.every(i => draftItems[i.id] === 'completed'),
    [items, draftItems]
  )

  const handleStartExecution = async () => {
    setActionLoading('start')
    try {
      await axiosPrivate.post(`/calibration-services/${serviceId}/start-execution`, {
        startedAt: new Date().toISOString()
      })
      toast.success('Ejecución iniciada')
      void refetch()
    } catch { toast.error('Error al iniciar ejecución') }
    setActionLoading(null)
  }

  const handleCompleteExecution = async () => {
    setActionLoading('complete')
    try {
      await axiosPrivate.post(`/calibration-services/${serviceId}/complete-execution`, {
        technicallyCompletedAt: new Date().toISOString()
      })
      toast.success('Ejecución finalizada')
      void refetch()
    } catch { toast.error('Error al finalizar') }
    setActionLoading(null)
  }

  const handleSaveProgress = async () => {
    setSaving(true)
    try {
      await axiosPrivate.put(`/calibration-services/${serviceId}/item-progress`, {
        items: (service?.items || []).map(item => ({
          itemId: item.id,
          operationalStatus: draftItems[item.id] || 'pending',
          technicalNotes: draftNotes[item.id] || ''
        }))
      })
      toast.success('Avance guardado')
    } catch { toast.error('Error al guardar avance') }
    setSaving(false)
  }

  const handleRegisterTrace = async () => {
    try {
      await axiosPrivate.post(`/calibration-services/${serviceId}/physical-traceability`, {
        movementType: traceMovement,
        occurredAt: new Date().toISOString(),
        contactName: traceContact,
        location: traceLocation || null,
        notes: null
      })
      toast.success('Movimiento registrado')
      setShowTraceDialog(false)
    } catch { toast.error('Error al registrar') }
  }

  const handleCreateCut = async () => {
    setActionLoading('cut')
    try {
      // Primero guardar avance técnico para que el backend vea el estado actualizado
      if (service?.items?.length) {
        await axiosPrivate.put(`/calibration-services/${serviceId}/item-progress`, {
          items: (service?.items || []).map(item => ({
            itemId: item.id,
            operationalStatus: draftItems[item.id] || 'pending',
            technicalNotes: draftNotes[item.id] || ''
          }))
        })
      }
      await axiosPrivate.post(`/calibration-services/${serviceId}/cuts`, {
        cutType,
        notes: null,
        items: (service?.items || []).filter(i => draftItems[i.id] === 'completed').map(i => ({ serviceItemId: i.id, quantity: 1 }))
      })
      toast.success('Corte creado')
      setShowCutDialog(false)
      void refetch()
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Error al crear corte')
    }
    setActionLoading(null)
  }

  const handleSaveSignature = async () => {
    try {
      await axiosPrivate.put(`/calibration-services/${serviceId}/delivery-signature`, {
        deliveryName: deliveryName.trim() || null,
        deliverySignatureData: deliverySignature
      })
      toast.success('Firma guardada')
    } catch { toast.error('Error al guardar firma') }
  }

  if (isLoading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
  if (!service) return <Box sx={{ p: 2 }}><Alert severity='error'>Servicio no encontrado</Alert></Box>

  const status = service.status

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', pb: 10 }}>
      <Toaster position='top-center' />
      
      {/* Header */}
      <Box sx={{ bgcolor: '#10b981', p: 2, color: 'white' }}>
        <Stack direction='row' alignItems='center' spacing={1} sx={{ mb: 1 }}>
          <ArrowBackIcon fontSize='small' onClick={() => navigate(-1)} sx={{ cursor: 'pointer' }} />
          <Typography variant='body2' sx={{ opacity: 0.8 }}>Servicios</Typography>
        </Stack>
        <Typography variant='h6' fontWeight={800}>{service.serviceCode}</Typography>
        <Typography variant='body2'>{service.customer?.nombre || service.executionCustomerName}</Typography>
        <Stack direction='row' spacing={1} sx={{ mt: 1 }}>
          <Chip size='small' label={CALIBRATION_SERVICE_STATUS_LABELS[status]} color={CALIBRATION_SERVICE_STATUS_COLORS[status] as any} sx={{ color: 'white' }} />
          {scheduledDate && <Chip size='small' label={new Date(scheduledDate).toLocaleDateString('es-CO')} variant='outlined' sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }} />}
        </Stack>
      </Box>

      {/* Execution actions */}
      {['scheduled', 'in_execution'].includes(status) && (
        <Card sx={{ mx: 2, mt: 2, borderRadius: 3 }}>
          <CardContent sx={{ p: 2 }}>
            <Stack spacing={1.5}>
              {status === 'scheduled' && (
                <Button fullWidth variant='contained' startIcon={<PlayArrowIcon />}
                  onClick={handleStartExecution} disabled={actionLoading === 'start'}
                  sx={{ borderRadius: 3, py: 1.5, textTransform: 'none', fontWeight: 700 }}>
                  Iniciar ejecución
                </Button>
              )}
              {status === 'in_execution' && (
                <Button fullWidth variant='contained' color='success' startIcon={<CheckCircleIcon />}
                  onClick={handleCompleteExecution} disabled={!allItemsCompleted || actionLoading === 'complete'}
                  sx={{ borderRadius: 3, py: 1.5, textTransform: 'none', fontWeight: 700 }}>
                  {allItemsCompleted ? 'Finalizar ejecución' : 'Completa todos los ítems primero'}
                </Button>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Items */}
      <Typography variant='subtitle1' fontWeight={700} sx={{ px: 2, mt: 3, mb: 1 }}>
        Ítems del servicio
      </Typography>
      <Stack spacing={1.5} sx={{ px: 2 }}>
        {items.map(item => (
          <Card key={item.id} sx={{ borderRadius: 3 }} elevation={1}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant='subtitle2' fontWeight={700}>{item.itemName}</Typography>
              {(item as any).otherFields?.hasCalibrationPoints !== false && (item as any).otherFields?.calibrationPointCount ? (
                <Typography variant='caption' color='text.secondary'>Puntos: {(item as any).otherFields.calibrationPointCount}</Typography>
              ) : null}
              <FormControl fullWidth size='small' sx={{ mt: 1 }}>
                <InputLabel>Estado técnico</InputLabel>
                <Select value={draftItems[item.id] || 'pending'} label='Estado técnico'
                  onChange={(e) => setDraftItems(p => ({ ...p, [item.id]: e.target.value as CalibrationServiceOperationalItemStatus }))}>
                  {STATUS_FLOW.map(s => (
                    <MenuItem key={s} value={s}>{CALIBRATION_SERVICE_OPERATIONAL_ITEM_STATUS_LABELS[s]}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField fullWidth size='small' multiline minRows={2} placeholder='Notas técnicas'
                value={draftNotes[item.id] || ''}
                onChange={(e) => setDraftNotes(p => ({ ...p, [item.id]: e.target.value }))}
                sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        ))}
        {items.length > 0 && (
          <Button fullWidth variant='contained' onClick={handleSaveProgress} disabled={saving}
            sx={{ borderRadius: 3, py: 1.5, textTransform: 'none', fontWeight: 700 }}>
            {saving ? 'Guardando...' : 'Guardar avance técnico'}
          </Button>
        )}
      </Stack>

      {/* Logistics */}
      <Typography variant='subtitle1' fontWeight={700} sx={{ px: 2, mt: 3, mb: 1 }}>
        Logística
      </Typography>
      <Stack spacing={1} sx={{ px: 2 }}>
        <Button fullWidth variant='outlined' startIcon={<LocalShippingIcon />}
          onClick={() => setShowTraceDialog(true)}
          sx={{ borderRadius: 3, py: 1.5, textTransform: 'none', fontWeight: 600 }}>
          Registrar movimiento físico
        </Button>
      </Stack>

      {/* Signature */}
      <Typography variant='subtitle1' fontWeight={700} sx={{ px: 2, mt: 3, mb: 1 }}>
        Firma de recepción
      </Typography>
      <Card sx={{ mx: 2, borderRadius: 3 }} elevation={1}>
        <CardContent sx={{ p: 2 }}>
          <TextField fullWidth size='small' label='Nombre de quien recibe' value={deliveryName}
            onChange={(e) => setDeliveryName(e.target.value)} sx={{ mb: 2 }} />
          <SignaturePad value={deliverySignature} onChange={setDeliverySignature} height={140} />
          <Button fullWidth variant='contained' onClick={handleSaveSignature}
            disabled={!deliverySignature}
            sx={{ mt: 2, borderRadius: 3, py: 1.5, textTransform: 'none', fontWeight: 700 }}>
            Guardar firma
          </Button>
        </CardContent>
      </Card>

      {/* Cuts */}
      {status === 'in_execution' || status === 'technically_completed' ? (
        <>
          <Typography variant='subtitle1' fontWeight={700} sx={{ px: 2, mt: 3, mb: 1 }}>
            Cortes
          </Typography>
          <Stack spacing={1} sx={{ px: 2 }}>
            <Button fullWidth variant='outlined' onClick={() => setShowCutDialog(true)}
              sx={{ borderRadius: 3, py: 1.5, textTransform: 'none', fontWeight: 600 }}>
              Crear corte
            </Button>
          </Stack>
        </>
      ) : null}

      {/* Traceability Dialog */}
      <Dialog open={showTraceDialog} onClose={() => setShowTraceDialog(false)} fullWidth>
        <DialogTitle>Registrar movimiento</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size='small'>
              <InputLabel>Tipo</InputLabel>
              <Select value={traceMovement} label='Tipo' onChange={(e) => setTraceMovement(e.target.value as any)}>
                <MenuItem value='pickup'>Recogida</MenuItem>
                <MenuItem value='delivery'>Entrega</MenuItem>
              </Select>
            </FormControl>
            <TextField fullWidth size='small' label='Contacto' value={traceContact} onChange={(e) => setTraceContact(e.target.value)} />
            <TextField fullWidth size='small' label='Ubicación' value={traceLocation} onChange={(e) => setTraceLocation(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTraceDialog(false)}>Cancelar</Button>
          <Button variant='contained' onClick={handleRegisterTrace}>Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Cut Dialog */}
      <Dialog open={showCutDialog} onClose={() => setShowCutDialog(false)} fullWidth>
        <DialogTitle>Crear corte</DialogTitle>
        <DialogContent>
          <FormControl fullWidth size='small' sx={{ mt: 1 }}>
            <InputLabel>Tipo de corte</InputLabel>
            <Select value={cutType} label='Tipo de corte' onChange={(e) => setCutType(e.target.value as any)}>
              <MenuItem value='partial'>Parcial</MenuItem>
              <MenuItem value='final'>Final</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCutDialog(false)}>Cancelar</Button>
          <Button variant='contained' onClick={handleCreateCut} disabled={actionLoading === 'cut'}>Crear</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default MobilePage