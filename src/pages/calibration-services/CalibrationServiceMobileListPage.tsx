import { useMemo, useState } from 'react'
import {
  Box,
  Card,
  CardActionArea,
  CircularProgress,
  IconButton,
  InputAdornment,
  LinearProgress,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import RefreshIcon from '@mui/icons-material/Refresh'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import EventOutlinedIcon from '@mui/icons-material/EventOutlined'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { axiosPrivate } from '@utils/api'
import { useStore } from '@nanostores/react'
import { userStore } from 'src/store/userStore'
import { CalibrationService, CalibrationServiceStatus } from '../../types/calibrationService'
import CalibrationServiceStatusChip from './CalibrationServiceStatusChip'

// Misma paleta del detalle móvil
const C = {
  green: '#00BFA5', greenDark: '#00897B', greenLight: '#E0F7F4',
  gray50: '#f0f2f5', gray100: '#e8eaed', gray300: '#b0b7c3', gray400: '#9ca3af', gray600: '#4b5563', dark: '#1a1a2e'
}
const BANNER_BG = 'linear-gradient(135deg, #10b981, #059669)'

const MOBILE_TECH_STATUSES: CalibrationServiceStatus[] = [
  'ods_issued', 'pending_programming', 'scheduled', 'in_execution', 'technically_completed'
]
const TODO_STATUSES: CalibrationServiceStatus[] = ['scheduled', 'in_execution']

type ListFilter = 'todo' | 'done' | 'all'

const getOps = (s: CalibrationService): any => s.otherFields?.operations || {}

const getAssignedEmails = (s: CalibrationService): string[] => {
  const ops = getOps(s)
  if (Array.isArray(ops.assignedMetrologists) && ops.assignedMetrologists.length > 0) {
    return ops.assignedMetrologists.map((m: any) => m.email).filter(Boolean)
  }
  return ops.assignedMetrologistEmail ? [ops.assignedMetrologistEmail] : []
}

const getScheduledDate = (s: CalibrationService): Date | null => {
  const raw = getOps(s).scheduledDate || getOps(s).scheduledFor
  if (!raw) return null
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date
}

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())
const dayDiff = (date: Date, today: Date) => Math.round((startOfDay(date).getTime() - today.getTime()) / 86400000)

const formatDay = (date: Date) => {
  const text = date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const getGroupKey = (s: CalibrationService, today: Date): { key: string; label: string; order: number } => {
  if (s.status === 'in_execution') return { key: 'exec', label: 'En ejecución', order: 0 }
  if (s.status === 'technically_completed') return { key: 'done', label: 'Finalizados', order: 9000 }
  const date = getScheduledDate(s)
  if (!date) return { key: 'nodate', label: 'Sin fecha programada', order: 8000 }
  const diff = dayDiff(date, today)
  if (diff < 0 && s.status === 'scheduled') return { key: 'late', label: 'Atrasados', order: 1 }
  if (diff === 0) return { key: 'today', label: 'Hoy', order: 2 }
  if (diff === 1) return { key: 'tomorrow', label: 'Mañana', order: 3 }
  return { key: `d${startOfDay(date).getTime()}`, label: formatDay(date), order: 10 + diff }
}

const getProgress = (s: CalibrationService) => {
  const items = s.items || []
  const done = items.filter((i: any) => i.otherFields?.operationalStatus === 'completed').length
  return { done, total: items.length }
}

const MobileListPage = () => {
  const navigate = useNavigate()
  const $userStore = useStore(userStore)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ListFilter>('todo')

  const { data, isLoading, isFetching, refetch } = useQuery(
    ['calibration-services', 'mobile-list'],
    async () => {
      const res = await axiosPrivate.get('/calibration-services', { params: { limit: 100 } })
      return (res.data?.services || []) as CalibrationService[]
    }
  )

  const today = useMemo(() => startOfDay(new Date()), [])
  const userEmail = $userStore.email?.trim().toLowerCase()

  // Solo lo asignado al usuario y en un estado que le toca
  const mine = useMemo(
    () => (data || []).filter((s) => {
      const isAssigned = userEmail ? getAssignedEmails(s).some((e) => e.toLowerCase() === userEmail) : false
      return isAssigned && MOBILE_TECH_STATUSES.includes(s.status)
    }),
    [data, userEmail]
  )

  const counts = {
    todo: mine.filter((s) => TODO_STATUSES.includes(s.status)).length,
    done: mine.filter((s) => s.status === 'technically_completed').length,
    all: mine.length
  }
  const running = mine.filter((s) => s.status === 'in_execution').length
  const forToday = mine.filter((s) => s.status === 'scheduled' && getScheduledDate(s) && dayDiff(getScheduledDate(s) as Date, today) === 0).length
  const late = mine.filter((s) => s.status === 'scheduled' && getScheduledDate(s) && dayDiff(getScheduledDate(s) as Date, today) < 0).length

  const groups = useMemo(() => {
    const term = search.trim().toLowerCase()
    const visible = mine.filter((s) => {
      const inFilter = filter === 'all' ? true : filter === 'todo' ? TODO_STATUSES.includes(s.status) : s.status === 'technically_completed'
      const matches = !term
        || s.serviceCode.toLowerCase().includes(term)
        || (s.customer?.nombre || s.executionCustomerName || '').toLowerCase().includes(term)
        || (s.odsCode || '').toLowerCase().includes(term)
        || (s.city || '').toLowerCase().includes(term)
      return inFilter && matches
    })
    const map = new Map<string, { label: string; order: number; services: CalibrationService[] }>()
    for (const s of visible) {
      const g = getGroupKey(s, today)
      if (!map.has(g.key)) map.set(g.key, { label: g.label, order: g.order, services: [] })
      map.get(g.key)?.services.push(s)
    }
    const byDate = (a: CalibrationService, b: CalibrationService) => (getScheduledDate(a)?.getTime() ?? Infinity) - (getScheduledDate(b)?.getTime() ?? Infinity)
    return [...map.values()].map((g) => ({ ...g, services: [...g.services].sort(byDate) })).sort((a, b) => a.order - b.order)
  }, [mine, filter, search, today])

  const filters: Array<{ id: ListFilter; label: string }> = [
    { id: 'todo', label: 'Para hacer' },
    { id: 'done', label: 'Finalizados' },
    { id: 'all', label: 'Todos' }
  ]

  const tile = (value: number, label: string, warn = false) => (
    <Box sx={{ flex: 1, bgcolor: 'rgba(255,255,255,0.18)', borderRadius: '14px', px: 1.5, py: 1 }}>
      <Typography fontWeight={700} sx={{ color: warn && value > 0 ? '#fde68a' : '#fff', fontSize: '1.4rem', lineHeight: 1.1 }}>{value}</Typography>
      <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.9)' }}>{label}</Typography>
    </Box>
  )

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: C.gray50, pb: 6 }}>
      <Box sx={{ maxWidth: 430, mx: 'auto' }}>
        <Box sx={{ background: BANNER_BG, px: 2, pt: 2, pb: 2.5, borderRadius: '0 0 24px 24px' }}>
          <Stack direction='row' alignItems='center' justifyContent='space-between'>
            <Box>
              <Typography variant='h6' fontWeight={700} sx={{ color: '#fff' }}>Mis servicios</Typography>
              <Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.9)' }}>{formatDay(new Date())}</Typography>
            </Box>
            <IconButton aria-label='Actualizar lista' onClick={() => void refetch()} disabled={isFetching} sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.18)' }}>
              {isFetching ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : <RefreshIcon />}
            </IconButton>
          </Stack>
          <Stack direction='row' spacing={1} sx={{ mt: 2 }}>
            {tile(running, 'En ejecución')}
            {tile(forToday, 'Para hoy')}
            {tile(late, 'Atrasados', true)}
          </Stack>
        </Box>

        <Box sx={{ px: 2, mt: 2 }}>
          <TextField fullWidth size='small' placeholder='Buscar por código, cliente, ODS o ciudad' value={search}
            onChange={(e) => setSearch(e.target.value)} inputProps={{ 'aria-label': 'Buscar servicios' }}
            InputProps={{ startAdornment: <InputAdornment position='start'><SearchIcon sx={{ color: C.gray400 }} /></InputAdornment> }}
            sx={{ bgcolor: '#fff', borderRadius: '14px', '& .MuiOutlinedInput-root': { borderRadius: '14px', height: 48 }, '& fieldset': { borderColor: C.gray100 } }} />

          <Stack direction='row' spacing={1} sx={{ mt: 1.5, overflowX: 'auto', pb: 0.5 }}>
            {filters.map((f) => {
              const active = filter === f.id
              return (
                <Box key={f.id} component='button' type='button' onClick={() => setFilter(f.id)} aria-pressed={active}
                  sx={{
                    flexShrink: 0, minHeight: 40, px: 2, borderRadius: '999px', font: 'inherit', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                    border: `1px solid ${active ? C.green : C.gray100}`, bgcolor: active ? C.green : '#fff', color: active ? '#fff' : C.gray600
                  }}>
                  {f.label} · {counts[f.id]}
                </Box>
              )
            })}
          </Stack>
        </Box>

        {isLoading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box>
        ) : groups.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
            <EventOutlinedIcon sx={{ fontSize: 48, color: C.gray300 }} />
            <Typography fontWeight={700} sx={{ color: C.dark, mt: 1 }}>
              {search.trim() ? 'Nada coincide con tu búsqueda' : mine.length === 0 ? 'Aún no tienes servicios asignados' : filter === 'done' ? 'No tienes servicios finalizados' : 'No tienes servicios por hacer'}
            </Typography>
            <Typography variant='body2' sx={{ color: C.gray600, mt: 0.5 }}>
              {search.trim() ? 'Prueba con otro código, cliente o ciudad.' : mine.length === 0 ? 'Cuando coordinación te asigne uno, aparecerá aquí.' : 'Cambia de filtro para ver el resto.'}
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2.5} sx={{ px: 2, mt: 2 }}>
            {groups.map((g) => (
              <Box key={g.label}>
                <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: g.label === 'Atrasados' ? '#b45309' : C.dark, mb: 1 }}>
                  {g.label} <Box component='span' sx={{ color: C.gray400, fontWeight: 600 }}>({g.services.length})</Box>
                </Typography>
                <Stack spacing={1.25}>
                  {g.services.map((s) => {
                    const date = getScheduledDate(s)
                    const { done, total } = getProgress(s)
                    return (
                      <Card key={s.id} elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${C.gray100}` }}>
                        <CardActionArea onClick={() => navigate(`/calibration-services/mobile/${s.id}`)} sx={{ p: 1.75 }}>
                          <Stack direction='row' alignItems='center' spacing={1}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Stack direction='row' justifyContent='space-between' alignItems='center' useFlexGap sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                                <Typography fontWeight={700} sx={{ color: C.dark, whiteSpace: 'nowrap' }}>{s.serviceCode}</Typography>
                                <CalibrationServiceStatusChip status={s.status} />
                              </Stack>
                              <Typography variant='body2' fontWeight={600} sx={{ color: C.dark, mt: 0.5, lineHeight: 1.3 }}>
                                {s.customer?.nombre || s.executionCustomerName || 'Cliente pendiente'}
                              </Typography>
                              <Stack direction='row' spacing={1.5} useFlexGap sx={{ mt: 1, flexWrap: 'wrap', color: C.gray600 }}>
                                {s.city && (
                                  <Stack direction='row' spacing={0.5} alignItems='center'>
                                    <PlaceOutlinedIcon sx={{ fontSize: 16 }} />
                                    <Typography variant='caption' sx={{ textTransform: 'capitalize' }}>{s.city.toLowerCase()}</Typography>
                                  </Stack>
                                )}
                                {date && (
                                  <Stack direction='row' spacing={0.5} alignItems='center'>
                                    <EventOutlinedIcon sx={{ fontSize: 16 }} />
                                    <Typography variant='caption'>{date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}</Typography>
                                  </Stack>
                                )}
                                {s.status === 'scheduled' && date && dayDiff(date, today) < 0 && (
                                  <Typography variant='caption' fontWeight={700} sx={{ color: '#b45309' }}>
                                    {Math.abs(dayDiff(date, today))} día{Math.abs(dayDiff(date, today)) === 1 ? '' : 's'} de atraso
                                  </Typography>
                                )}
                                <Typography variant='caption'>{total} ítem{total === 1 ? '' : 's'}</Typography>
                              </Stack>
                              {s.status === 'in_execution' && total > 0 && (
                                <Box sx={{ mt: 1.25 }}>
                                  <Stack direction='row' justifyContent='space-between'>
                                    <Typography variant='caption' fontWeight={600} sx={{ color: C.greenDark }}>{done} de {total} completados</Typography>
                                  </Stack>
                                  <LinearProgress variant='determinate' value={(done / total) * 100}
                                    sx={{ mt: 0.5, height: 8, borderRadius: 999, bgcolor: C.greenLight, '& .MuiLinearProgress-bar': { borderRadius: 999, bgcolor: C.green } }} />
                                </Box>
                              )}
                            </Box>
                            <ChevronRightIcon sx={{ color: C.gray300 }} />
                          </Stack>
                        </CardActionArea>
                      </Card>
                    )
                  })}
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  )
}

export default MobileListPage
