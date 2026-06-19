import { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Typography
} from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { axiosPrivate } from '@utils/api'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  startOfMonth,
  subMonths
} from 'date-fns'
import { es } from 'date-fns/locale'
import {
  CalibrationService
} from '../../types/calibrationService'

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

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

const CalibrationServiceSchedulePage = () => {
  const navigate = useNavigate()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

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

  const selectedServices = selectedDate ? servicesByDate.get(selectedDate) || [] : []

  const prevMonth = () => setCurrentMonth((d) => subMonths(d, 1))
  const nextMonth = () => setCurrentMonth((d) => addMonths(d, 1))

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f9fafb', px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box sx={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)', borderRadius: '20px', p: { xs: 3, md: 4 } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent='space-between' alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
            <Box>
              <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 1 }}>
                <Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Metromédica</Typography>
                <Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.4)' }}>/</Typography>
                <Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>Agenda</Typography>
              </Stack>
              <Typography variant='h4' fontWeight={800} sx={{ color: '#fff', lineHeight: 1.2 }}>Agenda de servicios</Typography>
              <Typography variant='body2' sx={{ mt: 1, color: 'rgba(255,255,255,0.8)' }}>
                Calendario mensual de servicios programados y en ejecución.
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Month navigation */}
        <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid #e5e7eb' }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb: 2 }}>
              <Stack direction='row' spacing={1} alignItems='center'>
                <CalendarMonthOutlinedIcon sx={{ color: '#6b7280' }} />
                <Typography variant='h6' fontWeight={700}>{format(currentMonth, 'MMMM yyyy', { locale: es })}</Typography>
              </Stack>
              <Stack direction='row' spacing={1}>
                <IconButton size='small' onClick={prevMonth}><ChevronLeftIcon /></IconButton>
                <Button size='small' variant='outlined' onClick={() => setCurrentMonth(new Date())}>Hoy</Button>
                <IconButton size='small' onClick={nextMonth}><ChevronRightIcon /></IconButton>
              </Stack>
            </Stack>

            {/* Legend */}
            <Stack direction='row' spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
              <Stack direction='row' spacing={0.5} alignItems='center'>
                <Box sx={{ width: 12, height: 12, borderRadius: '2px', bgcolor: '#10b981' }} />
                <Typography variant='caption' color='text.secondary'>Programado</Typography>
              </Stack>
              <Stack direction='row' spacing={0.5} alignItems='center'>
                <Box sx={{ width: 12, height: 12, borderRadius: '2px', bgcolor: '#3b82f6' }} />
                <Typography variant='caption' color='text.secondary'>En ejecución</Typography>
              </Stack>
            </Stack>

            {isLoading ? (
              <Stack alignItems='center' py={4}><CircularProgress /></Stack>
            ) : (
              <>
                {/* Calendar grid */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
                  {WEEKDAYS.map((day) => (
                    <Typography key={day} variant='caption' fontWeight={700} sx={{ textAlign: 'center', py: 0.5, color: '#6b7280' }}>
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
                    const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

                    return (
                      <Box
                        key={key}
                        onClick={() => setSelectedDate(isSelected ? null : key)}
                        sx={{
                          minHeight: 90,
                          borderRadius: 1.5,
                          border: '1px solid',
                          borderColor: isSelected ? '#10b981' : isToday ? '#10b981' : '#e5e7eb',
                          bgcolor: isSelected ? '#f0fdf4' : 'white',
                          p: 0.5,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          '&:hover': { borderColor: '#10b981', bgcolor: '#f0fdf4' },
                          overflow: 'hidden'
                        }}
                      >
                        <Typography variant='caption' fontWeight={isToday ? 800 : 600} sx={{ color: isToday ? '#10b981' : '#374151', display: 'block', mb: 0.25 }}>
                          {format(day, 'd')}
                        </Typography>
                        <Stack spacing={0.25}>
                          {dayServices.slice(0, 3).map((s) => (
                            <Chip
                              key={s.id}
                              size='small'
                              label={s.odsCode || s.serviceCode}
                              color={s.status === 'in_execution' ? 'info' : 'success'}
                              variant='outlined'
                              onClick={(e) => { e.stopPropagation(); navigate(`/calibration-services/${s.id}`) }}
                              sx={{ height: 20, '& .MuiChip-label': { fontSize: '0.6rem', px: 0.5 } }}
                            />
                          ))}
                          {dayServices.length > 3 ? (
                            <Typography variant='caption' sx={{ color: '#6b7280', textAlign: 'center' }}>
                              +{dayServices.length - 3}
                            </Typography>
                          ) : null}
                        </Stack>
                      </Box>
                    )
                  })}
                </Box>

                {/* Selected day detail */}
                {selectedDate && (
                  <Card variant='outlined' sx={{ mt: 3, borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant='subtitle1' fontWeight={700} sx={{ mb: 2 }}>
                        {format(new Date(selectedDate + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es })} — {selectedServices.length} servicio{selectedServices.length === 1 ? '' : 's'}
                      </Typography>
                      {selectedServices.length === 0 ? (
                        <Typography variant='body2' color='text.secondary'>Sin servicios programados en esta fecha.</Typography>
                      ) : (
                        <Stack spacing={1}>
                          {selectedServices.map((s) => (
                            <Card
                              key={s.id}
                              variant='outlined'
                              sx={{ borderRadius: 2, cursor: 'pointer', '&:hover': { borderColor: '#10b981' } }}
                              onClick={() => navigate(`/calibration-services/${s.id}`)}
                            >
                              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Stack direction='row' justifyContent='space-between' alignItems='center'>
                                  <Box>
                                    <Typography variant='body2' fontWeight={700}>{s.odsCode || s.serviceCode}</Typography>
                                    <Typography variant='caption' color='text.secondary'>
                                      {s.customer?.nombre || s.executionCustomerName || '—'}
                                    </Typography>
                                    <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                                      {getMetrologistNames(s).join(', ') || 'Sin metrólogo'}
                                    </Typography>
                                  </Box>
                                  <Chip size='small' label={s.status === 'in_execution' ? 'En ejecución' : 'Programado'} color={s.status === 'in_execution' ? 'info' : 'success'} variant='outlined' />
                                </Stack>
                              </CardContent>
                            </Card>
                          ))}
                        </Stack>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Box>
  )
}

export default CalibrationServiceSchedulePage