import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Grid,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'
import {
  AccessTimeOutlined,
  AssignmentTurnedInOutlined,
  CheckCircleOutlined,
  DescriptionOutlined,
  GroupsOutlined,
  PercentOutlined,
  ReplayOutlined,
  SentimentSatisfiedOutlined,
  ShoppingCartOutlined,
  VerifiedOutlined
} from '@mui/icons-material'
import { type MRT_ColumnDef } from 'material-react-table'
import DataTable from 'src/Components/Common/DataTable'
import LmsStatCard, {
  type LmsStatTone
} from 'src/Components/lms/admin/LmsStatCard'
import { neutral } from 'src/theme/designTokens'
import type {
  ManagementReport,
  ManagementReportAreaKey,
  ManagementReportAreaRow,
  ManagementReportAreaTable,
  ManagementReportSharedAccountWarning,
  ManagementReportTeamArea,
  ManagementReportTeamKind,
  ManagementReportTeamRange,
  ManagementReportTeamRow
} from 'src/types/managementReport'

type Team = NonNullable<ManagementReport['team']>

const money = (value?: number | null) =>
  value === undefined || value === null
    ? ''
    : value.toLocaleString('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
      })

// Para las tarjetas: millones, como el resto del reporte
const moneyShort = (value?: number | null) =>
  value === undefined || value === null
    ? ''
    : `$${(value / 1_000_000).toLocaleString('es-CO', {
        maximumFractionDigits: 1
      })} M`

const percent = (row: ManagementReportTeamRow) =>
  row.winRate === null
    ? 'Sin dato'
    : `${(row.winRate * 100).toLocaleString('es-CO', {
        maximumFractionDigits: 1
      })} %`

const days = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : `${value} días`

const RIGHT = {
  muiTableHeadCellProps: { align: 'right' },
  muiTableBodyCellProps: { align: 'right' },
  muiTableFooterCellProps: { align: 'right' }
} as const

const TABLE_PROPS = {
  enableTopToolbar: false,
  enableBottomToolbar: false,
  enablePagination: false,
  enableGlobalFilter: false,
  enableColumnFilters: false,
  enableStickyHeader: false,
  enableStickyFooter: true,
  muiTableContainerProps: { sx: { maxHeight: 'none' } },
  muiTablePaperProps: {
    elevation: 0,
    sx: {
      borderRadius: '12px',
      border: `1px solid ${neutral.border}`,
      overflow: 'hidden'
    }
  }
} as const

/* ------------------------------- Cotizaciones ------------------------------ */

const buildQuotationColumns = (
  totals: ManagementReportTeamRow,
  showMoney: boolean
): MRT_ColumnDef<ManagementReportTeamRow>[] => {
  const columns: MRT_ColumnDef<ManagementReportTeamRow>[] = [
    {
      accessorKey: 'name',
      header: 'Persona',
      Footer: () => <b>Total</b>,
      muiTableBodyCellProps: { sx: { fontWeight: 600 } }
    },
    {
      accessorKey: 'created',
      header: 'Creadas',
      Footer: () => <b>{totals.created}</b>,
      ...RIGHT
    },
    {
      accessorKey: 'approved',
      header: 'Aprobadas',
      Footer: () => <b>{totals.approved}</b>,
      ...RIGHT
    },
    {
      accessorKey: 'rejected',
      header: 'Rechazadas',
      Footer: () => <b>{totals.rejected}</b>,
      ...RIGHT
    },
    {
      accessorKey: 'expired',
      header: 'Vencidas',
      Footer: () => <b>{totals.expired}</b>,
      ...RIGHT
    },
    {
      id: 'winRate',
      header: '% ganadas',
      accessorFn: (row) => row.winRate ?? -1,
      Cell: ({ row }) => percent(row.original),
      Footer: () => <b>{percent(totals)}</b>,
      ...RIGHT
    }
  ]
  if (showMoney) {
    columns.push({
      accessorKey: 'approvedValue',
      header: 'Valor aprobado',
      Cell: ({ row }) => money(row.original.approvedValue),
      Footer: () => <b>{money(totals.approvedValue)}</b>,
      ...RIGHT
    })
  }
  columns.push({
    accessorKey: 'waiting',
    header: 'En espera',
    Footer: () => <b>{totals.waiting}</b>,
    ...RIGHT
  })
  if (showMoney) {
    columns.push({
      accessorKey: 'waitingValue',
      header: 'Valor en espera',
      Cell: ({ row }) => money(row.original.waitingValue),
      Footer: () => <b>{money(totals.waitingValue)}</b>,
      ...RIGHT
    })
  }
  columns.push({
    id: 'medianApprovalDays',
    header: 'Días hasta aprobación',
    accessorFn: (row) => row.medianApprovalDays ?? -1,
    Cell: ({ row }) => days(row.original.medianApprovalDays),
    Footer: () => <b>{days(totals.medianApprovalDays)}</b>,
    ...RIGHT
  })
  return columns
}

/* ----------------------------- Otras áreas -------------------------------- */

type AreaRow = ManagementReportAreaRow

const num = (row: AreaRow, field: string) => {
  const value = row[field]
  return typeof value === 'number' ? value : null
}

interface AreaColumn {
  field: string
  header: string
  /** Solo se muestra con el perfil con valores (el campo existe en el JSON). */
  money?: boolean
  format?: (row: AreaRow) => string
}

interface AreaCard {
  label: string
  icon: JSX.Element
  tone: LmsStatTone
  value: (totals: AreaRow, rows: AreaRow[]) => string | number
  caption?: (totals: AreaRow) => string | undefined
}

interface AreaConfig {
  label: string
  question: string
  firstColumn: string
  columns: AreaColumn[]
  cards: AreaCard[]
  note?: string
}

const sinDato = (value: number | null, suffix = '') =>
  value === null ? 'Sin dato' : `${value.toLocaleString('es-CO')}${suffix}`

const hours = (minutes: number | null) =>
  minutes === null
    ? '0 h'
    : `${(minutes / 60).toLocaleString('es-CO', { maximumFractionDigits: 1 })} h`

const AREAS: Record<ManagementReportAreaKey, AreaConfig> = {
  adjustments: {
    label: 'Novedades',
    question: '¿Quién reporta y quién revisa las novedades de los servicios?',
    firstColumn: 'Persona',
    columns: [
      { field: 'reported', header: 'Reportadas' },
      { field: 'reviewed', header: 'Revisadas' },
      { field: 'approved', header: 'Aprobadas por quien revisa' },
      { field: 'rejected', header: 'Rechazadas por quien revisa' },
      {
        field: 'medianReviewDays',
        header: 'Días de revisión',
        format: (row) => days(num(row, 'medianReviewDays'))
      }
    ],
    cards: [
      {
        label: 'Reportadas',
        icon: <DescriptionOutlined />,
        tone: 'blue',
        value: (totals) => num(totals, 'reported') ?? 0
      },
      {
        label: 'Revisadas',
        icon: <CheckCircleOutlined />,
        tone: 'green',
        value: (totals) => num(totals, 'reviewed') ?? 0
      },
      {
        label: 'Rechazadas',
        icon: <ReplayOutlined />,
        tone: 'orange',
        value: (totals) => num(totals, 'rejected') ?? 0
      },
      {
        label: 'Días de revisión',
        icon: <AccessTimeOutlined />,
        tone: 'teal',
        value: (totals) => days(num(totals, 'medianReviewDays'))
      }
    ],
    note: 'Una novedad es un cambio de precio o un ítem extra que se reporta sobre un servicio aprobado. Los días de revisión se cuentan a quien la revisa.'
  },
  certificates: {
    label: 'Certificados',
    question: '¿Quién mueve los certificados hasta liberarlos?',
    firstColumn: 'Persona',
    columns: [
      { field: 'uploaded', header: 'Subidos' },
      { field: 'reviewed', header: 'Revisados' },
      { field: 'signed', header: 'Firmados' },
      { field: 'released', header: 'Liberados' },
      { field: 'returned', header: 'Devueltos' },
      { field: 'replaced', header: 'Reemplazados' },
      {
        field: 'medianReleaseDays',
        header: 'Días de subida a liberación',
        format: (row) => days(num(row, 'medianReleaseDays'))
      }
    ],
    cards: [
      {
        label: 'Subidos',
        icon: <DescriptionOutlined />,
        tone: 'blue',
        value: (totals) => num(totals, 'uploaded') ?? 0
      },
      {
        label: 'Liberados',
        icon: <VerifiedOutlined />,
        tone: 'green',
        value: (totals) => num(totals, 'released') ?? 0
      },
      {
        label: 'Devueltos para ajustes',
        icon: <ReplayOutlined />,
        tone: 'orange',
        value: (totals) => num(totals, 'returned') ?? 0
      },
      {
        label: 'Días hasta liberar',
        icon: <AccessTimeOutlined />,
        tone: 'teal',
        value: (totals) => days(num(totals, 'medianReleaseDays'))
      }
    ],
    note: 'Cada paso se cuenta a quien lo hizo. "Devueltos" son los certificados que se mandaron a ajustes; "Reemplazados", las versiones nuevas subidas.'
  },
  maintenance: {
    label: 'Mantenimiento',
    question: '¿Cuánto resuelve cada técnico?',
    firstColumn: 'Técnico',
    columns: [
      { field: 'assigned', header: 'Asignados' },
      { field: 'completed', header: 'Terminados' },
      { field: 'open', header: 'Abiertos al corte' },
      {
        field: 'medianAttentionDays',
        header: 'Días de atención',
        format: (row) => days(num(row, 'medianAttentionDays'))
      },
      {
        field: 'minutes',
        header: 'Horas trabajadas',
        format: (row) => hours(num(row, 'minutes'))
      },
      {
        field: 'satisfaction',
        header: 'Satisfacción',
        format: (row) => sinDato(num(row, 'satisfaction'), ' / 5')
      },
      { field: 'reincident', header: 'Equipos reincidentes' },
      {
        field: 'actualCost',
        header: 'Costo real',
        money: true,
        format: (row) => money(num(row, 'actualCost'))
      }
    ],
    cards: [
      {
        label: 'Tickets terminados',
        icon: <AssignmentTurnedInOutlined />,
        tone: 'green',
        value: (totals) => num(totals, 'completed') ?? 0
      },
      {
        label: 'Abiertos al corte',
        icon: <AccessTimeOutlined />,
        tone: 'orange',
        value: (totals) => num(totals, 'open') ?? 0
      },
      {
        label: 'Satisfacción',
        icon: <SentimentSatisfiedOutlined />,
        tone: 'teal',
        value: (totals) => sinDato(num(totals, 'satisfaction'), ' / 5'),
        caption: (totals) => {
          const coverage = num(totals, 'satisfactionCoverage')
          return coverage === null
            ? undefined
            : `${Math.round(coverage * 100)} % de los tickets calificados`
        }
      },
      {
        label: 'Equipos reincidentes',
        icon: <ReplayOutlined />,
        tone: 'red',
        value: (totals) => num(totals, 'reincident') ?? 0
      }
    ],
    note: 'La persona es el técnico asignado al ticket. La satisfacción solo se muestra si al menos la mitad de los tickets terminados fue calificada. Reincidente: el equipo ya se había atendido en los 90 días anteriores.'
  },
  purchases: {
    label: 'Compras',
    question: '¿Quién pide, aprueba y gestiona las compras?',
    firstColumn: 'Persona',
    columns: [
      { field: 'requests', header: 'Solicitudes' },
      { field: 'preApproved', header: 'Preaprobadas' },
      { field: 'approved', header: 'Aprobadas' },
      { field: 'sent', header: 'Órdenes enviadas' },
      { field: 'verified', header: 'Verificaciones' },
      {
        field: 'sentValue',
        header: 'Valor órdenes enviadas',
        money: true,
        format: (row) => money(num(row, 'sentValue'))
      }
    ],
    cards: [
      {
        label: 'Solicitudes',
        icon: <ShoppingCartOutlined />,
        tone: 'blue',
        value: (totals) => num(totals, 'requests') ?? 0
      },
      {
        label: 'Aprobadas',
        icon: <CheckCircleOutlined />,
        tone: 'green',
        value: (totals) => num(totals, 'approved') ?? 0
      },
      {
        label: 'Órdenes enviadas',
        icon: <AssignmentTurnedInOutlined />,
        tone: 'teal',
        value: (totals) => num(totals, 'sent') ?? 0
      },
      {
        label: 'Verificaciones',
        icon: <VerifiedOutlined />,
        tone: 'orange',
        value: (totals) => num(totals, 'verified') ?? 0
      }
    ],
    note: 'Atribución aproximada: la solicitud y la verificación se guardan con el nombre escrito, y la aprobación y el envío con el usuario. Se juntan por nombre sin tildes ni mayúsculas; un nombre mal escrito cuenta como otra persona.'
  }
}

// Columnas que se ocultan cuando ninguna fila tiene dato
const HIDE_WHEN_EMPTY = ['satisfaction', 'actualCost']

const buildAreaColumns = (
  config: AreaConfig,
  totals: AreaRow,
  showMoney: boolean,
  rows: AreaRow[]
): MRT_ColumnDef<AreaRow>[] => [
  {
    accessorKey: 'name',
    header: config.firstColumn,
    Footer: () => <b>Total</b>,
    muiTableBodyCellProps: { sx: { fontWeight: 600 } }
  },
  ...config.columns
    .filter((column) => !column.money || showMoney)
    .filter(
      (column) =>
        !HIDE_WHEN_EMPTY.includes(column.field) ||
        rows.some((row) => (num(row, column.field) ?? 0) > 0)
    )
    .map(
      (column): MRT_ColumnDef<AreaRow> => ({
        id: column.field,
        header: column.header,
        accessorFn: (row) => num(row, column.field) ?? -1,
        Cell: ({ row }) =>
          column.format
            ? column.format(row.original)
            : String(num(row.original, column.field) ?? 0),
        Footer: () => (
          <b>
            {column.format
              ? column.format(totals)
              : String(num(totals, column.field) ?? 0)}
          </b>
        ),
        ...RIGHT
      })
    )
]

/* --------------------------------- Pantalla -------------------------------- */

const AREA_LABEL: Record<ManagementReportTeamArea, string> = {
  quotations: 'Cotizaciones',
  adjustments: AREAS.adjustments.label,
  certificates: AREAS.certificates.label,
  maintenance: AREAS.maintenance.label,
  purchases: AREAS.purchases.label
}

const KIND_LABEL: Record<ManagementReportTeamKind, string> = {
  calibration: 'Calibración',
  equipment: 'Equipos',
  both: 'Ambos'
}

const SharedAccountNotice = ({
  warning
}: {
  warning?: ManagementReportSharedAccountWarning | null
}) =>
  warning ? (
    <Alert severity='warning' sx={{ mt: 1 }}>
      {warning.message} Hoy “{warning.name}” concentra{' '}
      {Math.round(warning.share * 100)} % de los registros ({warning.count} de{' '}
      {warning.total}).
    </Alert>
  ) : null

const Cards = ({
  items
}: {
  items: Array<[string, string | number, JSX.Element, LmsStatTone, string?]>
}) => (
  <Grid container spacing={2} sx={{ mb: 2 }}>
    {items.map(([label, value, icon, tone, caption]) => (
      <Grid item xs={6} md={3} key={label}>
        <LmsStatCard
          label={label}
          value={value}
          icon={icon}
          tone={tone}
          caption={caption}
          compact
        />
      </Grid>
    ))}
  </Grid>
)

const QuotationsView = ({
  team,
  range,
  kind
}: {
  team: Team
  range: ManagementReportTeamRange
  kind: ManagementReportTeamKind
}) => {
  const table = team[range][kind]
  const { totals } = table
  const showMoney = totals.approvedValue !== undefined
  const columns = useMemo(
    () => buildQuotationColumns(totals, showMoney),
    [totals, showMoney]
  )
  if (table.usable === false) {
    return <Alert severity='info'>{table.reason}</Alert>
  }
  return (
    <>
      <Cards
        items={[
          [
            'Cotizaciones creadas',
            totals.created,
            <DescriptionOutlined key='i' />,
            'blue'
          ],
          [
            'Aprobadas',
            totals.approved,
            <CheckCircleOutlined key='i' />,
            'green'
          ],
          [
            '% ganadas',
            percent(totals),
            <PercentOutlined key='i' />,
            'teal',
            totals.insufficientData
              ? `Menos de ${team.minDecisions} decisiones`
              : `${totals.decisions} decisiones`
          ],
          [
            showMoney ? 'Valor aprobado' : 'Personas con cotizaciones',
            showMoney ? moneyShort(totals.approvedValue) : table.rows.length,
            <GroupsOutlined key='i' />,
            'orange'
          ]
        ]}
      />
      <DataTable
        key={`q-${range}-${kind}-${showMoney}`}
        columns={columns}
        data={table.rows}
        {...TABLE_PROPS}
        initialState={{ sorting: [{ id: 'created', desc: true }] }}
        getRowId={(row) => String(row.userId ?? 'sin-autor')}
      />
      <SharedAccountNotice warning={table.sharedAccountWarning} />
      <Typography
        variant='caption'
        color='text.secondary'
        sx={{ display: 'block', mt: 1 }}
      >
        % ganadas = aprobadas ÷ (aprobadas + rechazadas + vencidas). Con menos
        de {team.minDecisions} decisiones se muestra “Sin dato”. Las
        cotizaciones de equipos no vencen por tiempo.
      </Typography>
    </>
  )
}

const AreaView = ({
  area,
  table,
  range
}: {
  area: ManagementReportAreaKey
  table: ManagementReportAreaTable | undefined
  range: ManagementReportTeamRange
}) => {
  const config = AREAS[area]
  const showMoney = Boolean(
    table && config.columns.some((c) => c.money && c.field in table.totals)
  )
  const columns = useMemo(
    () =>
      table
        ? buildAreaColumns(config, table.totals, showMoney, table.rows)
        : [],
    [config, table, showMoney]
  )
  if (!table) {
    return (
      <Alert severity='info'>Este reporte no trae datos de esta área.</Alert>
    )
  }
  if (table.usable === false) {
    return <Alert severity='info'>{table.reason}</Alert>
  }
  return (
    <>
      <Cards
        items={config.cards.map((card) => [
          card.label,
          card.value(table.totals, table.rows),
          card.icon,
          card.tone,
          card.caption?.(table.totals)
        ])}
      />
      <DataTable
        key={`${area}-${range}-${showMoney}`}
        columns={columns}
        data={table.rows}
        {...TABLE_PROPS}
        initialState={{
          sorting: [{ id: config.columns[0].field, desc: true }]
        }}
        getRowId={(row) => String(row.key ?? 'sin-responsable')}
      />
      <SharedAccountNotice warning={table.sharedAccountWarning} />
      {config.note && (
        <Typography
          variant='caption'
          color='text.secondary'
          sx={{ display: 'block', mt: 1 }}
        >
          {config.note}
        </Typography>
      )}
    </>
  )
}

interface TeamSectionProps {
  team: Team
  periodLabel: string
}

const TeamSection = ({ team, periodLabel }: TeamSectionProps) => {
  const [area, setArea] = useState<ManagementReportTeamArea>('quotations')
  const [kind, setKind] = useState<ManagementReportTeamKind>('calibration')
  const [range, setRange] = useState<ManagementReportTeamRange>('month')

  return (
    <Paper elevation={0} sx={{ overflowX: 'auto' }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent='space-between'
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1}
        mb={2}
      >
        <Box>
          <Typography variant='body2' color='text.secondary'>
            {area === 'quotations'
              ? '¿Quién está trayendo negocio? Cada cotización se cuenta a quien la creó.'
              : AREAS[area].question}
          </Typography>
        </Box>
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
          <ToggleButtonGroup
            exclusive
            size='small'
            value={area}
            onChange={(_event, next) => next && setArea(next)}
            aria-label='Área'
          >
            {(Object.keys(AREA_LABEL) as ManagementReportTeamArea[]).map(
              (key) => (
                <ToggleButton key={key} value={key}>
                  {AREA_LABEL[key]}
                </ToggleButton>
              )
            )}
          </ToggleButtonGroup>
          {area === 'quotations' && (
            <ToggleButtonGroup
              exclusive
              size='small'
              value={kind}
              onChange={(_event, next) => next && setKind(next)}
              aria-label='Tipo de cotización'
            >
              {(Object.keys(KIND_LABEL) as ManagementReportTeamKind[]).map(
                (key) => (
                  <ToggleButton key={key} value={key}>
                    {KIND_LABEL[key]}
                  </ToggleButton>
                )
              )}
            </ToggleButtonGroup>
          )}
          <ToggleButtonGroup
            exclusive
            size='small'
            value={range}
            onChange={(_event, next) => next && setRange(next)}
            aria-label='Periodo'
          >
            <ToggleButton value='month'>{periodLabel}</ToggleButton>
            <ToggleButton value='year'>Año acumulado</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Stack>

      {area === 'quotations' ? (
        <QuotationsView team={team} range={range} kind={kind} />
      ) : (
        <AreaView area={area} table={team[area]?.[range]} range={range} />
      )}
    </Paper>
  )
}

export default TeamSection
