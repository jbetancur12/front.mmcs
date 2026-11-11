import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { Box, Typography } from '@mui/material'
import { MaintenanceStatus, MaintenanceTicket } from 'src/types/maintenance'
import { brand, intent, neutral, withAlpha } from 'src/theme/designTokens'

/** Alto de cada fila del tablero y espacio entre filas (px). */
const ROW_HEIGHT = 108
const ROW_GAP = 8
/** Segundos que dura cada página de una columna con más tickets de los que caben. */
const PAGE_SECONDS = 12

interface BoardColumn {
  key: string
  title: string
  color: string
  statuses: string[]
}

const COLUMNS: BoardColumn[] = [
  {
    key: 'new',
    title: 'Pendientes',
    color: intent.warning,
    statuses: [MaintenanceStatus.PENDING]
  },
  {
    key: 'assigned',
    title: 'Asignados',
    color: intent.info,
    statuses: [MaintenanceStatus.ASSIGNED]
  },
  {
    key: 'in_progress',
    title: 'En progreso',
    color: brand.main,
    statuses: [MaintenanceStatus.IN_PROGRESS]
  },
  {
    key: 'waiting',
    title: 'En espera',
    color: neutral.textMuted,
    statuses: [
      MaintenanceStatus.ON_HOLD,
      MaintenanceStatus.WAITING_PARTS,
      MaintenanceStatus.WAITING_CUSTOMER
    ]
  }
]

const STATUS_LABEL: Record<string, string> = {
  [MaintenanceStatus.ON_HOLD]: 'En pausa',
  [MaintenanceStatus.WAITING_PARTS]: 'Espera repuestos',
  [MaintenanceStatus.WAITING_CUSTOMER]: 'Espera cliente'
}

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3
}

const isUrgent = (t: MaintenanceTicket) =>
  Boolean((t as { isEmergency?: boolean }).isEmergency) ||
  t.priority === 'urgent'

const sortTickets = (a: MaintenanceTicket, b: MaintenanceTicket) => {
  const pa = isUrgent(a) ? 0 : PRIORITY_ORDER[a.priority] ?? 4
  const pb = isUrgent(b) ? 0 : PRIORITY_ORDER[b.priority] ?? 4
  if (pa !== pb) return pa - pb
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
}

const priorityColor = (t: MaintenanceTicket) => {
  if (isUrgent(t)) return intent.danger
  if (t.priority === 'high') return intent.warning
  return neutral.border
}

const ageDays = (createdAt: string) =>
  Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000)

const ageLabel = (days: number) => {
  if (days < 1) return 'hoy'
  if (days < 30) return `${days} d`
  const months = Math.floor(days / 30)
  return `${months} ${months === 1 ? 'mes' : 'meses'}`
}

/** Más viejo, más rojo: se nota de lejos qué se está quedando. */
const ageColor = (days: number) =>
  days >= 30
    ? intent.dangerInk
    : days >= 7
      ? intent.warningInk
      : neutral.textBody

interface TicketRowProps {
  ticket: MaintenanceTicket
  showStatus: boolean
}

const TicketRow: React.FC<TicketRowProps> = ({ ticket, showStatus }) => {
  const days = ageDays(ticket.createdAt)
  const technician = ticket.assignedTechnician?.name
  const urgent = isUrgent(ticket)
  const flag = urgent ? 'Urgente' : ticket.priority === 'high' ? 'Alta' : ''

  return (
    <Box
      sx={{
        height: ROW_HEIGHT,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 0.25,
        px: 1.5,
        borderRadius: '12px',
        border: `1px solid ${urgent ? intent.danger : neutral.border}`,
        borderLeft: `10px solid ${priorityColor(ticket)}`,
        bgcolor: urgent ? intent.dangerSoft : neutral.surface,
        minWidth: 0
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
        <Typography
          sx={{
            fontWeight: 800,
            color: brand.ink,
            fontSize: { xs: '1rem', xl: '1.65rem' },
            lineHeight: 1.1,
            whiteSpace: 'nowrap'
          }}
        >
          {ticket.ticketCode}
        </Typography>
        {flag && (
          <Typography
            sx={{
              fontWeight: 800,
              color: urgent ? intent.dangerInk : intent.warningInk,
              fontSize: { xs: '0.7rem', xl: '1rem' },
              textTransform: 'uppercase'
            }}
          >
            {flag}
          </Typography>
        )}
        <Typography
          sx={{
            ml: 'auto',
            fontWeight: 700,
            color: ageColor(days),
            fontSize: { xs: '0.8rem', xl: '1.3rem' },
            whiteSpace: 'nowrap'
          }}
        >
          {ageLabel(days)}
        </Typography>
      </Box>
      <Typography
        noWrap
        sx={{
          fontWeight: 700,
          color: neutral.text,
          fontSize: { xs: '0.9rem', xl: '1.45rem' },
          lineHeight: 1.15
        }}
      >
        {ticket.equipmentType}
      </Typography>
      <Typography
        noWrap
        sx={{
          color: technician ? neutral.textBody : intent.warningInk,
          fontWeight: technician ? 500 : 800,
          fontSize: { xs: '0.8rem', xl: '1.2rem' },
          lineHeight: 1.15
        }}
      >
        {technician ?? 'Sin técnico'}
        {showStatus && ` · ${STATUS_LABEL[ticket.status] ?? ''}`}
        {' · '}
        {ticket.customerName}
      </Typography>
    </Box>
  )
}

interface ColumnProps {
  column: BoardColumn
  tickets: MaintenanceTicket[]
}

const BoardColumnView: React.FC<ColumnProps> = ({ column, tickets }) => {
  const listRef = useRef<HTMLDivElement>(null)
  const [perPage, setPerPage] = useState(6)
  const [page, setPage] = useState(0)

  // Cuántas filas caben según el alto real de la columna
  useLayoutEffect(() => {
    const el = listRef.current
    if (!el) return
    const measure = () =>
      setPerPage(
        Math.max(
          1,
          Math.floor((el.clientHeight + ROW_GAP) / (ROW_HEIGHT + ROW_GAP))
        )
      )
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const pages = Math.max(1, Math.ceil(tickets.length / perPage))

  useEffect(() => {
    if (pages <= 1) {
      setPage(0)
      return
    }
    const id = setInterval(
      () => setPage((p) => (p + 1) % pages),
      PAGE_SECONDS * 1000
    )
    return () => clearInterval(id)
  }, [pages])

  const visible = tickets.slice(page * perPage, page * perPage + perPage)

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        minHeight: 0,
        borderRadius: '16px',
        bgcolor: withAlpha(column.color, 0.07),
        border: `1px solid ${neutral.border}`,
        p: 1,
        gap: 1
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          px: 0.5,
          flexShrink: 0
        }}
      >
        <Box
          sx={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            bgcolor: column.color
          }}
        />
        <Typography
          sx={{
            fontWeight: 800,
            color: neutral.text,
            fontSize: { xs: '1rem', xl: '1.6rem' },
            textTransform: 'uppercase',
            letterSpacing: '0.4px'
          }}
        >
          {column.title}
        </Typography>
        <Typography
          sx={{
            ml: 'auto',
            fontWeight: 800,
            color: neutral.text,
            fontSize: { xs: '1.4rem', xl: '2.4rem' },
            lineHeight: 1
          }}
        >
          {tickets.length}
        </Typography>
      </Box>

      <Box
        ref={listRef}
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: `${ROW_GAP}px`
        }}
      >
        {visible.length === 0 ? (
          <Typography
            sx={{
              m: 'auto',
              color: neutral.textMuted,
              fontWeight: 600,
              fontSize: { xs: '0.9rem', xl: '1.2rem' }
            }}
          >
            Sin tickets
          </Typography>
        ) : (
          visible.map((ticket) => (
            <TicketRow
              key={ticket.id}
              ticket={ticket}
              showStatus={column.key === 'waiting'}
            />
          ))
        )}
      </Box>

      {pages > 1 && (
        <Typography
          sx={{
            textAlign: 'center',
            color: neutral.textMuted,
            fontWeight: 700,
            fontSize: { xs: '0.75rem', xl: '1rem' },
            flexShrink: 0
          }}
        >
          Página {page + 1} de {pages} · {tickets.length} en total
        </Typography>
      )}
    </Box>
  )
}

interface StatusBoardProps {
  /** Tickets abiertos (sin los completados que esperan reporte técnico). */
  tickets: MaintenanceTicket[]
}

/** Tablero por estado para proyectar en TV: todo lo abierto se ve a la vez. */
const StatusBoard: React.FC<StatusBoardProps> = ({ tickets }) => {
  const byColumn = useMemo(
    () =>
      COLUMNS.map((column) => ({
        column,
        tickets: tickets
          .filter((t) => column.statuses.includes(t.status))
          .sort(sortTickets)
      })),
    [tickets]
  )

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, minmax(0, 1fr))',
          lg: 'repeat(4, minmax(0, 1fr))'
        },
        gap: 1.25
      }}
    >
      {byColumn.map(({ column, tickets: columnTickets }) => (
        <BoardColumnView
          key={column.key}
          column={column}
          tickets={columnTickets}
        />
      ))}
    </Box>
  )
}

export default StatusBoard
