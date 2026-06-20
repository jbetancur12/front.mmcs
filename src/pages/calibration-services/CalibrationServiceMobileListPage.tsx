import { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { axiosPrivate } from '@utils/api'
import { useStore } from '@nanostores/react'
import { userStore } from 'src/store/userStore'
import {
  CalibrationService,
  CalibrationServiceStatus
} from '../../types/calibrationService'
import {
  CALIBRATION_SERVICE_STATUS_COLORS,
  CALIBRATION_SERVICE_STATUS_LABELS
} from '../../constants/calibrationServices'

const getMetrologistNames = (s: CalibrationService): string[] => {
  const ops: any = s.otherFields?.operations
  const arr = ops?.assignedMetrologists
  if (Array.isArray(arr) && arr.length > 0) return arr.map((m: any) => m.name).filter(Boolean)
  const legacy = ops?.assignedMetrologistName
  return legacy ? [legacy] : []
}

const getScheduledDate = (s: CalibrationService): string | null => {
  const ops: any = s.otherFields?.operations
  return ops?.scheduledDate || null
}

const MOBILE_TECH_STATUSES: CalibrationServiceStatus[] = [
  'ods_issued', 'pending_programming', 'scheduled',
  'in_execution', 'technically_completed'
]

const MobileListPage = () => {
  const navigate = useNavigate()
  const $userStore = useStore(userStore)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery(
    ['calibration-services', 'mobile-list'],
    async () => {
      const res = await axiosPrivate.get('/calibration-services', { params: { limit: 100 } })
      return (res.data?.services || []) as CalibrationService[]
    }
  )

  const services = (data || []).filter((s) => {
    const emails: string[] = (() => {
      const ops: any = s.otherFields?.operations
      const arr = ops?.assignedMetrologists
      if (Array.isArray(arr) && arr.length > 0) return arr.map((m: any) => m.email).filter(Boolean)
      const legacy = ops?.assignedMetrologistEmail
      return legacy ? [legacy] : []
    })()
    const userEmail = $userStore.email?.trim().toLowerCase()
    const isAssigned = userEmail ? emails.some(e => e.toLowerCase() === userEmail) : false
    const isVisible = MOBILE_TECH_STATUSES.includes(s.status)
    const matchesSearch = search.trim() ? (
      s.serviceCode.toLowerCase().includes(search.toLowerCase()) ||
      (s.customer?.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.odsCode || '').toLowerCase().includes(search.toLowerCase())
    ) : true
    return isAssigned && isVisible && matchesSearch
  })

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', pb: 8 }}>
      {/* Header */}
      <Box sx={{ background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', p: 2, pb: 3 }}>
        <Typography variant='h6' fontWeight={800} sx={{ color: '#fff' }}>Mis servicios</Typography>
        <Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
          {services.length} servicio{services.length !== 1 ? 's' : ''} asignados
        </Typography>
      </Box>

      {/* Search */}
      <Box sx={{ px: 2, mt: -1.5, mb: 2 }}>
        <TextField fullWidth size='small' placeholder='Buscar por código, cliente u ODS...'
          value={search} onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: '#9ca3af' }} /> }}
          sx={{ bgcolor: '#fff', borderRadius: 3, '& fieldset': { border: 'none' }, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
      </Box>

      {isLoading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box>
      ) : services.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
          <Typography color='text.secondary'>
            {search.trim() ? 'No hay servicios que coincidan con la búsqueda.' : 'No tienes servicios asignados en este momento.'}
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1.5} sx={{ px: 2 }}>
          {services.map((s) => {
            const sched = getScheduledDate(s)
            const mNames = getMetrologistNames(s)

            return (
              <Card key={s.id} sx={{ borderRadius: 3, cursor: 'pointer' }}
                onClick={() => navigate(`/calibration-services/mobile/${s.id}`)}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Stack direction='row' justifyContent='space-between' alignItems='flex-start'>
                    <Box>
                      <Typography variant='subtitle2' fontWeight={800}>{s.serviceCode}</Typography>
                      {s.odsCode && <Typography variant='caption' color='#059669' fontWeight={600}>{s.odsCode}</Typography>}
                    </Box>
                    <Chip size='small' label={CALIBRATION_SERVICE_STATUS_LABELS[s.status]}
                      color={(CALIBRATION_SERVICE_STATUS_COLORS as any)[s.status] || 'default'} />
                  </Stack>
                  <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                    {s.customer?.nombre || s.executionCustomerName || '—'}
                  </Typography>
                  <Stack direction='row' spacing={1.5} sx={{ mt: 1 }}>
                    {sched && <Typography variant='caption' color='text.secondary'>
                      {new Date(sched).toLocaleDateString('es-CO')}
                    </Typography>}
                    {mNames.length > 0 && <Typography variant='caption' color='text.secondary'>
                      {mNames.join(', ')}
                    </Typography>}
                  </Stack>
                </CardContent>
              </Card>
            )
          })}
        </Stack>
      )}
    </Box>
  )
}

export default MobileListPage