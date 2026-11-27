import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  CalibrationVisit,
  VisitClock,
  VisitClockState
} from '../../../types/calibrationVisit'

export type ChipColor = 'default' | 'success' | 'warning' | 'error' | 'info'

export const CLOCK_META: Record<
  VisitClockState,
  { label: string; color: ChipColor }
> = {
  not_started: { label: 'Sin empezar', color: 'default' },
  on_time: { label: 'En tiempo', color: 'info' },
  due_soon: { label: 'Por vencer', color: 'warning' },
  overdue: { label: 'Vencido', color: 'error' },
  paused: { label: 'En pausa', color: 'default' },
  done_on_time: { label: 'Cumplido a tiempo', color: 'success' },
  done_late: { label: 'Cumplido tarde', color: 'warning' }
}

export const VISIT_STATUS_LABEL: Record<CalibrationVisit['status'], string> = {
  scheduled: 'Programada',
  executed: 'Ejecutada',
  cancelled: 'Cancelada'
}

/** `yyyy-MM-dd` a "3 nov" sin pasar por la zona horaria. */
export const formatDay = (day?: string | null, pattern = 'd MMM') =>
  day ? format(parseISO(day.slice(0, 10)), pattern, { locale: es }) : '—'

export const formatRange = (startDate: string, endDate: string) =>
  startDate === endDate
    ? formatDay(startDate, 'd MMM yyyy')
    : `${formatDay(startDate)} al ${formatDay(endDate, 'd MMM yyyy')}`

export const todayKey = () => format(new Date(), 'yyyy-MM-dd')

export const clockDetail = (clock: VisitClock) => {
  const days = clock.lateBusinessDays
  const late = days
    ? ` · ${days} ${days === 1 ? 'día hábil' : 'días hábiles'} de atraso`
    : ''
  return clock.completedOn
    ? `Cumplido el ${formatDay(clock.completedOn)}${late}`
    : `Vence el ${formatDay(clock.dueDate)}${late}`
}

export const uploadSummary = (visit: Pick<CalibrationVisit, 'quantities'>) => {
  const { uploaded, expectedCertificates } = visit.quantities
  return expectedCertificates
    ? `${uploaded} de ${expectedCertificates} certificados cargados`
    : `${uploaded} certificados cargados`
}
