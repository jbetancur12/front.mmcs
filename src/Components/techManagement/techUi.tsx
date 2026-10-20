import { Chip, ChipProps } from '@mui/material'
import Swal from 'sweetalert2'
import {
  ActionStatus,
  ActivityType,
  AlertMatchStatus,
  AlertType,
  DeadlineStatus,
  EventType,
  Methodology,
  ReportStatus,
  ScheduleStatus,
  Severity
} from 'src/types/techManagement'

// Textos, chips y avisos compartidos por las pantallas de Gestión tecnológica.

export const TEAL = '#00BFA5'
export const TEAL_HOVER = '#00897B'
export const TEAL_SOFT = '#E0F7F4'

export const primaryButtonSx = { bgcolor: TEAL, '&:hover': { bgcolor: '#00ACC1' }, textTransform: 'none', fontWeight: 600 }

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  calibration: 'Calibración',
  preventive: 'Mantenimiento preventivo',
  corrective: 'Correctivo'
}

export const SCHEDULE_STATUS: Record<ScheduleStatus, { label: string; color: ChipProps['color'] }> = {
  vencido: { label: 'Vencido', color: 'error' },
  proximo: { label: 'Próximo', color: 'warning' },
  al_dia: { label: 'Al día', color: 'success' },
  sin_programar: { label: 'Sin programar', color: 'default' }
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = { evento: 'Evento adverso', incidente: 'Incidente' }
export const SEVERITY_LABELS: Record<Severity, string> = { serio: 'Serio', no_serio: 'No serio' }

export const REPORT_STATUS: Record<ReportStatus, { label: string; color: ChipProps['color'] }> = {
  borrador: { label: 'Borrador', color: 'default' },
  en_gestion: { label: 'En gestión', color: 'info' },
  reportado: { label: 'Reportado al INVIMA', color: 'primary' },
  cerrado: { label: 'Cerrado', color: 'success' }
}

export const DEADLINE_STATUS: Record<DeadlineStatus, { label: string; color: ChipProps['color'] }> = {
  vencido: { label: 'Plazo vencido', color: 'error' },
  por_vencer: { label: 'Vence pronto', color: 'warning' },
  a_tiempo: { label: 'A tiempo', color: 'success' },
  cumplido: { label: 'Cumplido', color: 'success' },
  sin_plazo: { label: 'Sin clasificar', color: 'default' }
}

export const METHODOLOGY_LABELS: Record<Methodology, string> = {
  espina_pescado: 'Espina de pescado (Ishikawa)',
  protocolo_londres: 'Protocolo de Londres',
  cinco_porques: '5 porqués',
  otro: 'Otra'
}

export const ACTION_STATUS_LABELS: Record<ActionStatus, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  cumplida: 'Cumplida',
  cancelada: 'Cancelada'
}

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  alerta: 'Alerta sanitaria',
  recall: 'Retiro de producto (recall)',
  informe_seguridad: 'Informe de seguridad'
}

export const MATCH_STATUS: Record<AlertMatchStatus, { label: string; color: ChipProps['color'] }> = {
  pendiente: { label: 'Pendiente', color: 'warning' },
  no_aplica: { label: 'No aplica', color: 'default' },
  gestionada: { label: 'Gestionada', color: 'success' }
}

export const MATCHED_BY_LABELS: Record<string, string> = {
  registro_sanitario: 'Registro sanitario',
  marca_modelo: 'Marca y modelo',
  marca_nombre: 'Marca y nombre'
}

export const RISK_CLASSES = ['I', 'IIA', 'IIB', 'III'] as const

/** Fecha YYYY-MM-DD (o ISO) a dd/mm/aaaa sin corrimiento de zona horaria. */
export const formatDate = (value?: string | null) => {
  if (!value) return '—'
  const [year, month, day] = value.slice(0, 10).split('-')
  return day && month && year ? `${day}/${month}/${year}` : value
}

export const todayIso = () => {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

export const percent = (value: number | null | undefined) => (value == null ? '—' : `${value}%`)

export const StatusChip = ({ label, color }: { label: string; color: ChipProps['color'] }) => (
  <Chip size='small' variant='outlined' label={label} color={color} sx={{ fontWeight: 600 }} />
)

export const notifySuccess = (title: string) =>
  Swal.fire({ toast: true, position: 'top-end', icon: 'success', title, showConfirmButton: false, timer: 3000 })

export const notifyError = (title: string) =>
  Swal.fire({ toast: true, position: 'top-end', icon: 'error', title, showConfirmButton: false, timer: 5000 })

export const confirmAction = async (title: string, text?: string, confirmButtonText = 'Sí, continuar') =>
  (
    await Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: TEAL
    })
  ).isConfirmed

/** Texto de la regla de independencia, igual al del backend. */
export const INDEPENDENCE_NOTE =
  'Los registros de tecnovigilancia los crea y gestiona solo el personal de la institución. Metromedics puede consultarlos, no modificarlos.'

/** Estilo común de las tablas (patrón de /customers): encabezado gris claro, hover turquesa y toolbars suaves. */
export const tableStyleProps = {
  muiTablePaperProps: { elevation: 0, sx: { borderRadius: 2, border: '1px solid #e5e7eb' } },
  muiTableHeadCellProps: { sx: { bgcolor: '#f5f5f5', fontWeight: 600 } },
  // Color sólido (no translúcido) para que la columna fija de acciones no deje ver lo que pasa por debajo
  muiTableBodyRowProps: { hover: true, sx: { '&:hover td': { bgcolor: '#f5fcfb' } } },
  muiTopToolbarProps: { sx: { bgcolor: '#fafafa' } },
  muiBottomToolbarProps: { sx: { bgcolor: '#fafafa' } },
  muiSearchTextFieldProps: { size: 'small' as const, variant: 'outlined' as const, sx: { minWidth: 300 } }
}
