import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Chip,
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
import TodayOutlinedIcon from '@mui/icons-material/TodayOutlined'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import AddIcon from '@mui/icons-material/Add'
import { useNavigate } from 'react-router-dom'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  startOfMonth
} from 'date-fns'
import { es } from 'date-fns/locale'
import { axiosPrivate } from '@utils/api'
import SignalLoader from 'src/Components/Common/SignalLoader'
import AsyncSelectField from '../../../Components/Common/AsyncSelectField'
import FormDialog from '../../../Components/Common/FormDialog'
import ListItemCard from '../../../Components/Common/ListItemCard'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'
import { useVisitCalendar } from '../../../hooks/useCalibrationVisits'
import { useCalibrationService } from '../../../hooks/useCalibrationServices'
import { CalibrationService } from '../../../types/calibrationService'
import { CalendarVisit } from '../../../types/calibrationVisit'
import CalibrationServiceScheduleReportDialog from '../CalibrationServiceScheduleReportDialog'
import VisitFormDialog from './VisitFormDialog'
import { CLOCK_META, formatDay, formatRange, uploadSummary } from './visitUtils'
import { brand, intent, neutral } from 'src/theme/designTokens'

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const SCHEDULABLE = [
  'ods_issued',
  'pending_programming',
  'scheduled',
  'in_execution'
]

interface ServiceOption {
  value: number
  label: string
}

const searchServices = async (search: string): Promise<ServiceOption[]> => {
  const responses = await Promise.all(
    SCHEDULABLE.map((status) =>
      axiosPrivate.get<{ services: CalibrationService[] }>(
        '/calibration-services',
        { params: { search, status, limit: 8 } }
      )
    )
  )
  return responses
    .flatMap((response) => response.data.services || [])
    .map((s) => ({
      value: s.id,
      label: `${s.odsCode || s.serviceCode} · ${s.customer?.nombre || s.executionCustomerName || 'Sin cliente'}`
    }))
}

/** Elegir la orden y luego programar la visita en el día tocado. */
const ScheduleFromAgenda = ({
  date,
  onClose
}: {
  date: string | null
  onClose: () => void
}) => {
  const [option, setOption] = useState<ServiceOption | null>(null)
  const [confirmed, setConfirmed] = useState<string | undefined>()
  const { data: service } = useCalibrationService(confirmed)
  const close = () => {
    setOption(null)
    setConfirmed(undefined)
    onClose()
  }
  if (!date) return null
  if (confirmed && service)
    return (
      <VisitFormDialog
        open
        service={service}
        initialDate={date}
        onClose={close}
      />
    )
  return (
    <FormDialog
      open
      onClose={close}
      title='Programar visita'
      subtitle={formatDay(date, "EEEE d 'de' MMMM")}
      submitLabel='Continuar'
      submitDisabled={!option}
      loading={Boolean(confirmed)}
      onSubmit={() => option && setConfirmed(String(option.value))}
      maxWidth='sm'
    >
      <Box sx={{ pt: 1 }}>
        <AsyncSelectField<ServiceOption>
          label='Orden de servicio'
          value={option}
          onChange={setOption}
          loadOptions={searchServices}
          helperText='Busca por ODS, código o cliente'
        />
      </Box>
    </FormDialog>
  )
}

/** Agenda por visitas: una orden aparece en cada día en que se programó. */
const CalibrationVisitsAgenda = () => {
  const navigate = useNavigate()
  const canSchedule = useCan(PERMISSIONS.CALIBRATION_SERVICE_SCHEDULE)
  const todayKey = format(new Date(), 'yyyy-MM-dd')
  const [month, setMonth] = useState(new Date())
  const [selected, setSelected] = useState(todayKey)
  const [reportOpen, setReportOpen] = useState(false)
  const [scheduleDate, setScheduleDate] = useState<string | null>(null)

  const from = format(startOfMonth(month), 'yyyy-MM-dd')
  const to = format(endOfMonth(month), 'yyyy-MM-dd')
  const { data, isLoading, isError, refetch } = useVisitCalendar(from, to)
  const visits = useMemo(() => data?.visits || [], [data])

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfMonth(month),
        end: endOfMonth(month)
      }).map((day) => format(day, 'yyyy-MM-dd')),
    [month]
  )
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarVisit[]>()
    for (const day of days)
      map.set(
        day,
        visits.filter((v) => v.startDate <= day && day <= v.endDate)
      )
    return map
  }, [days, visits])

  const dayVisits = byDay.get(selected) || []
  const overdue = visits.filter((v) => v.upload?.state === 'overdue').length

  const goTo = (next: Date) => {
    setMonth(next)
    setSelected(format(startOfMonth(next), 'yyyy-MM-dd'))
  }

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Agenda de visitas'
        subtitle='Toca un día para ver sus visitas o programar una.'
        icon={<CalendarMonthOutlinedIcon />}
        actions={
          <Button
            variant='contained'
            startIcon={<FileDownloadOutlinedIcon />}
            onClick={() => setReportOpen(true)}
          >
            Descargar reporte
          </Button>
        }
      />
      <CalibrationServiceScheduleReportDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        initialMonth={month}
      />
      <ScheduleFromAgenda
        date={scheduleDate}
        onClose={() => setScheduleDate(null)}
      />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={6} md={4}>
          <LmsStatCard
            label='Visitas del mes'
            value={visits.length}
            icon={<EventAvailableOutlinedIcon />}
            tone='teal'
          />
        </Grid>
        <Grid item xs={6} md={4}>
          <LmsStatCard
            label='Hoy'
            value={
              visits.filter(
                (v) => v.startDate <= todayKey && todayKey <= v.endDate
              ).length
            }
            icon={<TodayOutlinedIcon />}
            tone='green'
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <LmsStatCard
            label='Con carga vencida'
            value={overdue}
            icon={<ErrorOutlineIcon />}
            tone='red'
          />
        </Grid>
      </Grid>

      {isError && (
        <Alert
          severity='error'
          sx={{ mb: 2 }}
          action={<Button onClick={() => void refetch()}>Reintentar</Button>}
        >
          No pudimos cargar la agenda.
        </Alert>
      )}

      <Grid container spacing={3} alignItems='flex-start'>
        <Grid item xs={12} lg={8}>
          <Paper elevation={2} sx={{ borderRadius: 2, p: { xs: 1.5, md: 3 } }}>
            <Stack
              direction='row'
              justifyContent='space-between'
              alignItems='center'
              sx={{ mb: 2 }}
            >
              <Typography
                variant='h6'
                fontWeight={700}
                sx={{ textTransform: 'capitalize' }}
              >
                {format(month, 'MMMM yyyy', { locale: es })}
              </Typography>
              <Stack direction='row' spacing={1} alignItems='center'>
                <IconButton
                  size='small'
                  aria-label='Mes anterior'
                  onClick={() => goTo(addMonths(month, -1))}
                >
                  <ChevronLeftIcon />
                </IconButton>
                <Button
                  size='small'
                  variant='outlined'
                  onClick={() => {
                    setMonth(new Date())
                    setSelected(todayKey)
                  }}
                >
                  Hoy
                </Button>
                <IconButton
                  size='small'
                  aria-label='Mes siguiente'
                  onClick={() => goTo(addMonths(month, 1))}
                >
                  <ChevronRightIcon />
                </IconButton>
              </Stack>
            </Stack>

            {isLoading ? (
              <SignalLoader />
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                  gap: 0.75
                }}
              >
                {WEEKDAYS.map((day) => (
                  <Typography
                    key={day}
                    variant='caption'
                    color='text.secondary'
                    textAlign='center'
                  >
                    {day}
                  </Typography>
                ))}
                {Array.from({ length: getDay(startOfMonth(month)) }).map(
                  (_, index) => (
                    <span key={`blank-${index}`} />
                  )
                )}
                {days.map((day) => {
                  const list = byDay.get(day) || []
                  const late = list.some((v) => v.upload?.state === 'overdue')
                  return (
                    <ButtonBase
                      key={day}
                      onClick={() => setSelected(day)}
                      aria-pressed={selected === day}
                      aria-label={`${formatDay(day, "d 'de' MMMM")}: ${list.length} visitas`}
                      sx={{
                        minHeight: { xs: 52, md: 76 },
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        p: 0.75,
                        borderRadius: 1.5,
                        border: `2px solid ${selected === day ? brand.main : neutral.border}`,
                        bgcolor: list.length ? brand.soft : 'transparent',
                        color: list.length ? brand.ink : 'text.secondary'
                      }}
                    >
                      <Typography
                        variant='caption'
                        fontWeight={day === todayKey ? 800 : 500}
                      >
                        {Number(day.slice(8))}
                      </Typography>
                      {list.length > 0 && (
                        <Typography
                          variant='body2'
                          fontWeight={700}
                          sx={{
                            color: late ? intent.dangerInk : 'inherit',
                            fontSize: { xs: '0.75rem', md: '0.875rem' }
                          }}
                        >
                          {list.length}
                          <Box
                            component='span'
                            sx={{ display: { xs: 'none', md: 'inline' } }}
                          >
                            {list.length === 1 ? ' visita' : ' visitas'}
                          </Box>
                        </Typography>
                      )}
                    </ButtonBase>
                  )
                })}
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Stack spacing={1.5}>
            <Typography variant='h6' fontWeight={700}>
              {formatDay(selected, "EEEE d 'de' MMMM")}
            </Typography>
            {canSchedule && (
              <Button
                variant='contained'
                startIcon={<AddIcon />}
                onClick={() => setScheduleDate(selected)}
              >
                Programar visita este día
              </Button>
            )}
            {dayVisits.length === 0 && (
              <Typography variant='body2' color='text.secondary'>
                No hay visitas este día.
              </Typography>
            )}
            {dayVisits.map((visit) => (
              <ListItemCard
                key={visit.id}
                title={`${visit.odsCode || visit.serviceCode} · visita ${visit.visitNumber}`}
                subtitle={visit.customerName || 'Sin cliente'}
                meta={[
                  formatRange(visit.startDate, visit.endDate),
                  visit.metrologists.map((m) => m.name).join(', ') ||
                    'Sin personal'
                ]}
                status={
                  visit.upload ? (
                    <Chip
                      size='small'
                      color={CLOCK_META[visit.upload.state].color}
                      label={CLOCK_META[visit.upload.state].label}
                    />
                  ) : undefined
                }
                highlight={uploadSummary(visit)}
                onClick={() =>
                  navigate(
                    `/calibration-services/${visit.serviceId}?tab=visits`
                  )
                }
              />
            ))}
          </Stack>
        </Grid>
      </Grid>
    </Container>
  )
}

export default CalibrationVisitsAgenda
