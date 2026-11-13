import { useMemo, useState } from 'react'
import {
  Box,
  Grid,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'
import {
  CheckCircleOutlined,
  DescriptionOutlined,
  GroupsOutlined,
  PercentOutlined
} from '@mui/icons-material'
import { type MRT_ColumnDef } from 'material-react-table'
import DataTable from 'src/Components/Common/DataTable'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import { brand, neutral } from 'src/theme/designTokens'
import type {
  ManagementReport,
  ManagementReportTeamKind,
  ManagementReportTeamRange,
  ManagementReportTeamRow
} from 'src/types/managementReport'

type Team = NonNullable<ManagementReport['team']>

const money = (value?: number) =>
  value === undefined
    ? ''
    : value.toLocaleString('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
      })

// Para las tarjetas: millones, como el resto del reporte
const moneyShort = (value?: number) =>
  value === undefined
    ? ''
    : `${(value / 1_000_000).toLocaleString('es-CO', {
        maximumFractionDigits: 1
      })} M`

const percent = (row: ManagementReportTeamRow) =>
  row.winRate === null
    ? 'Sin dato'
    : `${(row.winRate * 100).toLocaleString('es-CO', {
        maximumFractionDigits: 1
      })} %`

const days = (row: ManagementReportTeamRow) =>
  row.medianApprovalDays === null ? '—' : `${row.medianApprovalDays} días`

const RIGHT = {
  muiTableHeadCellProps: { align: 'right' },
  muiTableBodyCellProps: { align: 'right' },
  muiTableFooterCellProps: { align: 'right' }
} as const

const buildColumns = (
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
    Cell: ({ row }) => days(row.original),
    Footer: () => <b>{days(totals)}</b>,
    ...RIGHT
  })
  return columns
}

const KIND_LABEL: Record<ManagementReportTeamKind, string> = {
  calibration: 'Calibración',
  equipment: 'Equipos',
  both: 'Ambos'
}

interface TeamSectionProps {
  team: Team
  periodLabel: string
}

const TeamSection = ({ team, periodLabel }: TeamSectionProps) => {
  const [kind, setKind] = useState<ManagementReportTeamKind>('calibration')
  const [range, setRange] = useState<ManagementReportTeamRange>('month')

  const table = team[range][kind]
  const { totals } = table
  const showMoney = totals.approvedValue !== undefined
  const columns = useMemo(
    () => buildColumns(totals, showMoney),
    [totals, showMoney]
  )

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 3,
        border: `1px solid ${neutral.border}`,
        borderRadius: 3,
        overflowX: 'auto'
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent='space-between'
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1}
        mb={2}
      >
        <Box>
          <Typography variant='h6' sx={{ color: brand.ink }}>
            Equipo
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            ¿Quién está trayendo negocio? Cada cotización se cuenta a quien la
            creó.
          </Typography>
        </Box>
        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
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

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} md={3}>
          <LmsStatCard
            label='Cotizaciones creadas'
            value={totals.created}
            icon={<DescriptionOutlined />}
            tone='blue'
            compact
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <LmsStatCard
            label='Aprobadas'
            value={totals.approved}
            icon={<CheckCircleOutlined />}
            tone='green'
            compact
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <LmsStatCard
            label='% ganadas'
            value={percent(totals)}
            icon={<PercentOutlined />}
            tone='teal'
            compact
            caption={
              totals.insufficientData
                ? `Menos de ${team.minDecisions} decisiones`
                : `${totals.decisions} decisiones`
            }
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <LmsStatCard
            label={showMoney ? 'Valor aprobado' : 'Personas con cotizaciones'}
            value={
              showMoney ? moneyShort(totals.approvedValue) : table.rows.length
            }
            icon={<GroupsOutlined />}
            tone='orange'
            compact
          />
        </Grid>
      </Grid>

      <DataTable
        key={`${range}-${kind}-${showMoney}`}
        columns={columns}
        data={table.rows}
        enableTopToolbar={false}
        enableBottomToolbar={false}
        enablePagination={false}
        enableGlobalFilter={false}
        enableColumnFilters={false}
        enableStickyHeader={false}
        enableStickyFooter
        initialState={{ sorting: [{ id: 'created', desc: true }] }}
        muiTableContainerProps={{ sx: { maxHeight: 'none' } }}
        muiTablePaperProps={{
          elevation: 0,
          sx: {
            borderRadius: '12px',
            border: `1px solid ${neutral.border}`,
            overflow: 'hidden'
          }
        }}
        getRowId={(row) => String(row.userId ?? 'sin-autor')}
      />
      <Typography
        variant='caption'
        color='text.secondary'
        sx={{ display: 'block', mt: 1 }}
      >
        % ganadas = aprobadas ÷ (aprobadas + rechazadas + vencidas). Con menos
        de {team.minDecisions} decisiones se muestra “Sin dato”. Las
        cotizaciones de equipos no vencen por tiempo.
      </Typography>
    </Paper>
  )
}

export default TeamSection
