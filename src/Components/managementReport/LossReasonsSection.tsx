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
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { type MRT_ColumnDef } from 'material-react-table'
import DataTable from 'src/Components/Common/DataTable'
import { brand, intent, neutral } from 'src/theme/designTokens'
import type {
  ManagementReportLossBlock,
  ManagementReportTeamRange
} from 'src/types/managementReport'

type Customer = ManagementReportLossBlock['topCustomers'][number]
type Person = ManagementReportLossBlock['byPerson'][number]

const money = (value?: number) =>
  value === undefined
    ? ''
    : value.toLocaleString('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
      })

const percent = (value: number | null) =>
  value === null
    ? 'Sin dato'
    : `${(value * 100).toLocaleString('es-CO', { maximumFractionDigits: 1 })} %`

const RIGHT = {
  muiTableHeadCellProps: { align: 'right' },
  muiTableBodyCellProps: { align: 'right' }
} as const

const TABLE_PROPS = {
  enableTopToolbar: false,
  enableBottomToolbar: false,
  enablePagination: false,
  enableGlobalFilter: false,
  enableColumnFilters: false,
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

const customerColumns = (showMoney: boolean): MRT_ColumnDef<Customer>[] => [
  {
    accessorKey: 'name',
    header: 'Cliente',
    muiTableBodyCellProps: { sx: { fontWeight: 600 } }
  },
  { accessorKey: 'count', header: 'Perdidas', ...RIGHT },
  ...(showMoney
    ? [
        {
          accessorKey: 'lostValue',
          header: 'Valor perdido',
          Cell: ({ row }: { row: { original: Customer } }) =>
            money(row.original.lostValue),
          ...RIGHT
        } as MRT_ColumnDef<Customer>
      ]
    : [])
]

const personColumns = (showMoney: boolean): MRT_ColumnDef<Person>[] => [
  {
    accessorKey: 'name',
    header: 'Persona',
    muiTableBodyCellProps: { sx: { fontWeight: 600 } }
  },
  { accessorKey: 'lost', header: 'Perdidas', ...RIGHT },
  { accessorKey: 'noResponse', header: 'No respondió', ...RIGHT },
  { accessorKey: 'rejected', header: 'Rechazadas', ...RIGHT },
  ...(showMoney
    ? [
        {
          accessorKey: 'lostValue',
          header: 'Valor perdido',
          Cell: ({ row }: { row: { original: Person } }) =>
            money(row.original.lostValue),
          ...RIGHT
        } as MRT_ColumnDef<Person>
      ]
    : [])
]

interface LossReasonsSectionProps {
  loss: Record<'month' | 'year', ManagementReportLossBlock>
  periodLabel: string
}

const LossReasonsSection = ({ loss, periodLabel }: LossReasonsSectionProps) => {
  const [range, setRange] = useState<ManagementReportTeamRange>('month')
  const block = loss[range]
  const showMoney = block.lostValue !== undefined
  const customers = useMemo(() => customerColumns(showMoney), [showMoney])
  const people = useMemo(() => personColumns(showMoney), [showMoney])

  const chartData = block.categories.map((category) => ({
    ...category,
    name: category.label
  }))
  const noResponse = block.categories.find((item) => item.key === 'no_response')

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
            Cotizaciones de calibración y equipos que no se vendieron:
            rechazadas y vencidas sin respuesta.
          </Typography>
        </Box>
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

      {block.total === 0 ? (
        <Alert severity='info'>
          No hubo cotizaciones perdidas en este periodo.
        </Alert>
      ) : (
        <>
          {!block.insufficientData && noResponse && (
            <Alert
              severity={(noResponse.share ?? 0) >= 0.5 ? 'warning' : 'info'}
              sx={{ mb: 2 }}
            >
              De {block.total} cotizaciones perdidas, {noResponse.count} (
              {percent(noResponse.share)}) fueron porque el cliente no
              respondió. Rechazadas expresamente: {block.coverage.rejected}.
            </Alert>
          )}
          {block.insufficientData && (
            <Alert severity='info' sx={{ mb: 2 }}>
              Menos de {block.minRecords} perdidas: los porcentajes salen “sin
              dato”.
            </Alert>
          )}

          <Box
            sx={{ width: '100%', height: 40 + chartData.length * 44, mb: 2 }}
          >
            <ResponsiveContainer>
              <BarChart
                data={chartData}
                layout='vertical'
                margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
              >
                <CartesianGrid stroke={neutral.border} horizontal={false} />
                <XAxis
                  type='number'
                  allowDecimals={false}
                  tick={{ fill: neutral.textMuted, fontSize: 12 }}
                />
                <YAxis
                  type='category'
                  dataKey='name'
                  width={190}
                  tick={{ fill: neutral.textBody, fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number, _name, item) => [
                    `${value} (${percent(
                      (item.payload as { share: number | null }).share
                    )})`,
                    'Cotizaciones'
                  ]}
                />
                <Bar dataKey='count' radius={[0, 6, 6, 0]}>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={
                        entry.key === 'no_response'
                          ? intent.warning
                          : brand.main
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>

          <Typography
            variant='caption'
            color='text.secondary'
            sx={{ display: 'block', mb: 2 }}
          >
            {block.coverage.rejected === 0
              ? 'No hubo rechazos con motivo que revisar.'
              : `Motivo escrito en ${block.coverage.withReason} de ${block.coverage.rejected} rechazadas (${percent(block.coverage.share)}). Las vencidas no tienen motivo: no hubo respuesta.`}
            {showMoney
              ? ` Valor perdido: ${money(block.lostValue)} (sin IVA).`
              : ''}
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' sx={{ mb: 1 }}>
                Clientes donde más se pierde
              </Typography>
              <DataTable
                key={`c-${range}-${showMoney}`}
                columns={customers}
                data={block.topCustomers}
                {...TABLE_PROPS}
                getRowId={(row) => row.name}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' sx={{ mb: 1 }}>
                Por persona que creó la cotización
              </Typography>
              <DataTable
                key={`p-${range}-${showMoney}`}
                columns={people}
                data={block.byPerson}
                {...TABLE_PROPS}
                getRowId={(row) => String(row.key ?? 'sin-autor')}
              />
            </Grid>
          </Grid>
        </>
      )}
    </Paper>
  )
}

export default LossReasonsSection
