import { useMemo } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Button,
  Grid,
  Link,
  Paper,
  Stack,
  Typography
} from '@mui/material'
import {
  EventBusyOutlined,
  GridOnOutlined,
  PaymentsOutlined
} from '@mui/icons-material'
import { type MRT_ColumnDef } from 'material-react-table'
import DataTable from 'src/Components/Common/DataTable'
import { brand, neutral } from 'src/theme/designTokens'
import type {
  ManagementReportActionLists,
  ManagementReportDebtorRow,
  ManagementReportExpiringRow
} from 'src/types/managementReport'

/** Filas que se ven en pantalla; el resto va en el Excel. */
export const ACTION_LIST_SCREEN_LIMIT = 10

const RIGHT = {
  muiTableHeadCellProps: { align: 'right' },
  muiTableBodyCellProps: { align: 'right', sx: { whiteSpace: 'nowrap' } }
} as const

const TABLE_PROPS = {
  enableTopToolbar: false,
  enableBottomToolbar: false,
  enablePagination: false,
  enableGlobalFilter: false,
  enableColumnFilters: false,
  enableSorting: false,
  enableStickyHeader: false,
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

const millions = (value?: number) =>
  value === undefined
    ? ''
    : `$${(value / 1_000_000).toLocaleString('es-CO', {
        maximumFractionDigits: 1
      })} M`

const buildExpiringColumns = (
  showMoney: boolean
): MRT_ColumnDef<ManagementReportExpiringRow>[] => [
  {
    accessorKey: 'customerName',
    header: 'Cliente',
    muiTableBodyCellProps: { sx: { fontWeight: 600 } }
  },
  {
    accessorKey: 'code',
    header: 'Cotización',
    Cell: ({ row }) => (
      <Link
        component={RouterLink}
        to={row.original.link}
        underline='hover'
        sx={{ color: brand.ink, fontWeight: 600 }}
      >
        {row.original.code}
      </Link>
    )
  },
  { accessorKey: 'kind', header: 'Tipo' },
  ...(showMoney
    ? [
        {
          id: 'valor',
          header: 'Valor sin IVA',
          accessorFn: (row) => row.valor ?? 0,
          Cell: ({ row }) => millions(row.original.valor),
          ...RIGHT
        } as MRT_ColumnDef<ManagementReportExpiringRow>
      ]
    : []),
  {
    id: 'when',
    header: 'Plazo',
    accessorFn: (row) => row.reason,
    ...RIGHT
  },
  {
    id: 'sent',
    header: 'Enviada hace',
    accessorFn: (row) => `${row.daysSinceSent} días`,
    ...RIGHT
  },
  { accessorKey: 'createdByName', header: 'La creó' }
]

const buildDebtorColumns = (
  showMoney: boolean
): MRT_ColumnDef<ManagementReportDebtorRow>[] => {
  const bucket = (
    id: string,
    header: string,
    count: keyof ManagementReportDebtorRow,
    value: keyof ManagementReportDebtorRow
  ): MRT_ColumnDef<ManagementReportDebtorRow> => ({
    id,
    header,
    accessorFn: (row) => Number(row[showMoney ? value : count] ?? 0),
    Cell: ({ row }) => {
      const amount = Number(row.original[showMoney ? value : count] ?? 0)
      if (!amount) return '—'
      return showMoney ? millions(amount) : amount
    },
    ...RIGHT
  })
  return [
    {
      accessorKey: 'customerName',
      header: 'Cliente',
      muiTableBodyCellProps: { sx: { fontWeight: 600 } }
    },
    bucket('b1', '0–30 días', 'count0a30', 'openValue0a30'),
    bucket('b2', '31–60 días', 'count31a60', 'openValue31a60'),
    bucket('b3', '61–90 días', 'count61a90', 'openValue61a90'),
    bucket('b4', 'Más de 90 días', 'countOver90', 'openValueOver90'),
    ...(showMoney
      ? [
          {
            id: 'total',
            header: 'Total',
            accessorFn: (row) => row.openValue ?? 0,
            Cell: ({ row }) => <b>{millions(row.original.openValue)}</b>,
            ...RIGHT
          } as MRT_ColumnDef<ManagementReportDebtorRow>
        ]
      : []),
    { accessorKey: 'invoices', header: 'Facturas', ...RIGHT },
    {
      id: 'oldest',
      header: 'Más antigua',
      accessorFn: (row) => row.oldestDays ?? 0,
      Cell: ({ row }) =>
        row.original.oldestCode
          ? `${row.original.oldestCode} · ${row.original.oldestDays} días`
          : '—'
    }
  ]
}

const ListCard = ({
  icon,
  title,
  summary,
  shown,
  total,
  note,
  onDownloadExcel,
  children
}: {
  icon: JSX.Element
  title: string
  summary: string
  shown: number
  total: number
  note: string
  onDownloadExcel: () => void
  children: JSX.Element
}) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      height: '100%',
      border: `1px solid ${neutral.border}`,
      borderRadius: 3
    }}
  >
    <Stack direction='row' spacing={1} alignItems='center' mb={0.5}>
      <Box sx={{ color: brand.ink, display: 'flex' }}>{icon}</Box>
      <Typography variant='h6'>{title}</Typography>
    </Stack>
    <Typography variant='body2' color='text.secondary' mb={1.5}>
      {summary}
    </Typography>
    <Box sx={{ overflowX: 'auto' }}>{children}</Box>
    {total > shown && (
      <Stack direction='row' alignItems='center' spacing={1} mt={1}>
        <Typography variant='body2' color='text.secondary'>
          Se muestran {shown} de {total}.
        </Typography>
        <Button
          size='small'
          startIcon={<GridOnOutlined />}
          onClick={onDownloadExcel}
          sx={{ textTransform: 'none' }}
        >
          Ver todas en el Excel
        </Button>
      </Stack>
    )}
    <Typography
      variant='caption'
      color='text.secondary'
      sx={{ display: 'block', mt: 1 }}
    >
      {note}
    </Typography>
  </Paper>
)

interface ActionListsSectionProps {
  lists: ManagementReportActionLists
  onDownloadExcel: () => void
}

/** Las dos listas de trabajo bajo las decisiones: qué cotizaciones llamar y a quién cobrar. */
const ActionListsSection = ({
  lists,
  onDownloadExcel
}: ActionListsSectionProps) => {
  const { expiringQuotes, debtors } = lists
  const showMoney = debtors.openValue !== undefined
  const expiringColumns = useMemo(
    () => buildExpiringColumns(showMoney),
    [showMoney]
  )
  const debtorColumns = useMemo(
    () => buildDebtorColumns(showMoney),
    [showMoney]
  )
  const expiringRows = expiringQuotes.rows.slice(0, ACTION_LIST_SCREEN_LIMIT)
  const debtorRows = debtors.rows.slice(0, ACTION_LIST_SCREEN_LIMIT)

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} lg={6}>
        <ListCard
          icon={<EventBusyOutlined />}
          title='Cotizaciones por vencer'
          summary={
            expiringQuotes.count
              ? `${expiringQuotes.count} cotizaciones para llamar: calibración que vence en los próximos ${expiringQuotes.horizonDays} días y equipos sin respuesta hace más de ${expiringQuotes.staleDays} días${showMoney && expiringQuotes.totalValue !== undefined ? `, por ${millions(expiringQuotes.totalValue)}` : ''}.`
              : 'No hay cotizaciones por vencer.'
          }
          shown={expiringRows.length}
          total={expiringQuotes.count}
          note='Fotografía a la fecha de corte del reporte: el estado de cada cotización es el de la fecha en que se generó.'
          onDownloadExcel={onDownloadExcel}
        >
          <DataTable
            columns={expiringColumns}
            data={expiringRows}
            {...TABLE_PROPS}
            getRowId={(row) => `${row.kind}-${row.id}`}
          />
        </ListCard>
      </Grid>
      <Grid item xs={12} lg={6}>
        <ListCard
          icon={<PaymentsOutlined />}
          title='Quién debe'
          summary={
            debtors.count
              ? `${debtors.invoices} facturas sin pago de ${debtors.count} clientes${showMoney && debtors.openValue !== undefined ? `, por ${millions(debtors.openValue)}` : ''}. Primero, los de más de 90 días.`
              : 'No hay facturas pendientes de pago.'
          }
          shown={debtorRows.length}
          total={debtors.count}
          note='Fotografía a la fecha de corte del reporte, con los pagos registrados hasta la fecha en que se generó. Con IVA.'
          onDownloadExcel={onDownloadExcel}
        >
          <DataTable
            columns={debtorColumns}
            data={debtorRows}
            {...TABLE_PROPS}
            getRowId={(row) => String(row.customerId)}
          />
        </ListCard>
      </Grid>
    </Grid>
  )
}

export default ActionListsSection
