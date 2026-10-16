import { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography
} from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'
import TodayOutlinedIcon from '@mui/icons-material/TodayOutlined'
import PersonOffOutlinedIcon from '@mui/icons-material/PersonOffOutlined'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { axiosPrivate } from '@utils/api'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameMonth,
  startOfMonth,
  subMonths
} from 'date-fns'
import { es } from 'date-fns/locale'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import ListItemCard from 'src/Components/Common/ListItemCard'
import {
  CalibrationService
} from '../../types/calibrationService'

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

// Más servicios en el día, más color: la carga se ve sin abrir cada celda.
const LOAD_STEPS = [
  { min: 6, bg: '#80CBC4', label: '6 o más' },
  { min: 3, bg: '#B2DFDB', label: '3 a 5' },
  { min: 1, bg: '#E0F7F4', label: '1 o 2' }
]
const loadColor = (count: number) => LOAD_STEPS.find((step) => count >= step.min)?.bg ?? '#ffffff'

const getScheduledDate = (service: CalibrationService): string | null => {
  const ops: any = service.otherFields?.operations
  return ops?.scheduledDate || null
}

const getMetrologistNames = (service: CalibrationService): string[] => {
  const ops: any = service.otherFields?.operations
  const arr = ops?.assignedMetrologists
  if (Array.isArray(arr) && arr.length > 0) return arr.map((m: any) => m.name).filter(Boolean)
  const legacy = ops?.assignedMetrologistName
  return legacy ? [legacy] : []
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

const CalibrationServiceSchedulePage = () => {
  const navigate = useNavigate()
  const todayKey = format(new Date(), 'yyyy-MM-dd')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(todayKey)

  const { data, isLoading } = useQuery(
    ['calibration-services', 'schedule', currentMonth.getFullYear(), currentMonth.getMonth()],
    async () => {
      const res = await axiosPrivate.get('/calibration-services', { params: { limit: 500, status: 'scheduled' } })
      const scheduled = res.data?.services as CalibrationService[] || []
      const res2 = await axiosPrivate.get('/calibration-services', { params: { limit: 500, status: 'in_execution' } })
      const execution = res2.data?.services as CalibrationService[] || []
      return [...scheduled, ...execution]
    }
  )

  const services = data || []

  const servicesByDate = useMemo(() => {
    const map = new Map<string, CalibrationService[]>()
    for (const s of services) {
      const date = getScheduledDate(s)
      if (!date) continue
      const key = date.slice(0, 10)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(s)
    }
    return map
  }, [services])

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const startOffset = getDay(startOfMonth(currentMonth))

  const monthServices = useMemo(
    () =>
      services.filter((s) => {
        const date = getScheduledDate(s)
        return date ? isSameMonth(new Date(date.slice(0, 10) + 'T12:00:00'), currentMonth) : false
      }),
    [services, currentMonth]
  )
  const inExecutionCount = monthServices.filter((s) => s.status === 'in_execution').length
  const withoutMetrologistCount = monthServices.filter((s) => getMetrologistNames(s).length === 0).length
  const todayCount = (servicesByDate.get(todayKey) || []).length

  const selectedServices = selectedDate ? servicesByDate.get(selectedDate) || [] : []

  const prevMonth = () => setCurrentMonth((d) => subMonths(d, 1))
  const nextMonth = () => setCurrentMonth((d) => addMonths(d, 1))
  const goToday = () => {
    setCurrentMonth(new Date())
    setSelectedDate(todayKey)
  }

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Agenda de servicios'
        subtitle='Qué servicios están programados o en ejecución y qué días hay más carga.'
        icon={<CalendarMonthOutlinedIcon />}
      />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <LmsStatCard label='En el mes' value={monthServices.length} icon={<EventAvailableOutlinedIcon />} tone='teal' />
        </Grid>
        <Grid item xs={6} md={3}>
          <LmsStatCard label='Hoy' value={todayCount} icon={<TodayOutlinedIcon />} tone='green' />
        </Grid>
        <Grid item xs={6} md={3}>
          <LmsStatCard label='En ejecución' value={inExecutionCount} icon={<PlayCircleOutlineIcon />} tone='blue' />
        </Grid>
        <Grid item xs={6} md={3}>
          <LmsStatCard
            label='Sin metrólogo'
            value={withoutMetrologistCount}
            icon={<PersonOffOutlinedIcon />}
            tone={withoutMetrologistCount > 0 ? 'orange' : 'green'}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} alignItems='flex-start'>
        <Grid item xs={12} lg={8}>
          <Paper elevation={2} sx={{ borderRadius: 2, p: { xs: 2, md: 3 } }}>
            <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb: 2 }}>
              <Typography variant='h6' fontWeight={700}>
                {capitalize(format(currentMonth, 'MMMM yyyy', { locale: es }))}
              </Typography>
              <Stack direction='row' spacing={1} alignItems='center'>
                <IconButton size='small' onClick={prevMonth} aria-label='Mes anterior'><ChevronLeftIcon /></IconButton>
                <Button size='small' variant='outlined' onClick={goToday} sx={{ color: '#00897B', borderColor: '#00BFA5', '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' } }}>
                  Hoy
                </Button>
                <IconButton size='small' onClick={nextMonth} aria-label='Mes siguiente'><ChevronRightIcon /></IconButton>
              </Stack>
            </Stack>

            <Stack direction='row' spacing={2} alignItems='center' sx={{ mb: 2, flexWrap: 'wrap', rowGap: 1 }}>
              <Typography variant='caption' color='text.secondary'>Servicios por día:</Typography>
              {[...LOAD_STEPS].reverse().map((step) => (
                <Stack key={step.label} direction='row' spacing={0.75} alignItems='center'>
                  <Box sx={{ width: 14, height: 14, borderRadius: '4px', bgcolor: step.bg, border: '1px solid rgba(0,0,0,0.08)' }} />
                  <Typography variant='caption' color='text.secondary'>{step.label}</Typography>
                </Stack>
              ))}
              <Stack direction='row' spacing={0.75} alignItems='center'>
                <Box sx={{ width: 14, height: 4, borderRadius: 2, bgcolor: '#3b82f6' }} />
                <Typography variant='caption' color='text.secondary'>En ejecución</Typography>
              </Stack>
            </Stack>

            {isLoading ? (
              <Stack alignItems='center' py={6}><CircularProgress /></Stack>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: { xs: 0.5, md: 0.75 } }}>
                {WEEKDAYS.map((day, index) => (
                  <Typography
                    key={day}
                    variant='caption'
                    fontWeight={600}
                    sx={{ textAlign: 'center', py: 0.5, color: index === 0 || index === 6 ? '#9ca3af' : '#4b5563' }}
                  >
                    {day}
                  </Typography>
                ))}
                {Array.from({ length: startOffset }).map((_, i) => (
                  <Box key={`empty-${i}`} />
                ))}
                {daysInMonth.map((day) => {
                  const key = format(day, 'yyyy-MM-dd')
                  const dayServices = servicesByDate.get(key) || []
                  const isSelected = selectedDate === key
                  const isToday = key === todayKey
                  const executing = dayServices.filter((s) => s.status === 'in_execution').length

                  return (
                    <Box
                      key={key}
                      component='button'
                      type='button'
                      onClick={() => setSelectedDate(isSelected ? null : key)}
                      aria-pressed={isSelected}
                      aria-label={`${format(day, "d 'de' MMMM", { locale: es })}: ${dayServices.length} servicio${dayServices.length === 1 ? '' : 's'}`}
                      sx={{
                        minHeight: { xs: 56, md: 92 },
                        borderRadius: 1.5,
                        border: '2px solid',
                        borderColor: isSelected ? '#00897B' : isToday ? '#00BFA5' : 'transparent',
                        bgcolor: loadColor(dayServices.length),
                        boxShadow: dayServices.length === 0 ? 'inset 0 0 0 1px #e5e7eb' : 'none',
                        p: { xs: 0.5, md: 1 },
                        cursor: 'pointer',
                        textAlign: 'left',
                        font: 'inherit',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'border-color 0.15s',
                        '&:hover': { borderColor: '#00897B' },
                        '&:focus-visible': { outline: '3px solid #00897B', outlineOffset: 2 }
                      }}
                    >
                      <Typography
                        component='span'
                        variant='body2'
                        sx={{ fontWeight: isToday ? 800 : 600, color: isToday ? '#00695C' : '#1f2937', lineHeight: 1 }}
                      >
                        {format(day, 'd')}
                      </Typography>
                      {dayServices.length > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                          <Typography component='span' sx={{ fontSize: { xs: '1rem', md: '1.5rem' }, fontWeight: 700, lineHeight: 1, color: '#00695C' }}>
                            {dayServices.length}
                          </Typography>
                          <Typography component='span' variant='caption' sx={{ color: '#00695C', display: { xs: 'none', md: 'inline' } }}>
                            {dayServices.length === 1 ? 'servicio' : 'servicios'}
                          </Typography>
                        </Box>
                      )}
                      {executing > 0 && (
                        <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, bgcolor: '#3b82f6' }} />
                      )}
                    </Box>
                  )
                })}
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper elevation={2} sx={{ borderRadius: 2, p: { xs: 2, md: 3 }, position: { lg: 'sticky' }, top: { lg: 88 } }}>
            {selectedDate ? (
              <>
                <Typography variant='h6' fontWeight={700}>
                  {capitalize(format(new Date(selectedDate + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es }))}
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                  {selectedServices.length === 0
                    ? 'Sin servicios programados este día.'
                    : `${selectedServices.length} servicio${selectedServices.length === 1 ? '' : 's'} programado${selectedServices.length === 1 ? '' : 's'}.`}
                </Typography>
                <Stack spacing={1.5}>
                  {selectedServices.map((s) => {
                    const metrologists = getMetrologistNames(s)
                    return (
                      <ListItemCard
                        key={s.id}
                        title={s.odsCode || s.serviceCode}
                        subtitle={s.customer?.nombre || s.executionCustomerName || 'Sin cliente'}
                        meta={[metrologists.join(', ') || 'Sin metrólogo asignado']}
                        metaWarning={metrologists.length === 0}
                        status={
                          <Chip
                            size='small'
                            label={s.status === 'in_execution' ? 'En ejecución' : 'Programado'}
                            color={s.status === 'in_execution' ? 'info' : 'success'}
                            variant='outlined'
                          />
                        }
                        onClick={() => navigate(`/calibration-services/${s.id}`)}
                      />
                    )
                  })}
                </Stack>
              </>
            ) : (
              <>
                <Typography variant='h6' fontWeight={700}>Elige un día</Typography>
                <Typography variant='body2' color='text.secondary'>
                  Toca un día del calendario para ver sus servicios y abrir cada uno.
                </Typography>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}

export default CalibrationServiceSchedulePage
