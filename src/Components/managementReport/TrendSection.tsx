import { useState } from 'react'
import {
  Box,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { accent, brand, intent, neutral } from 'src/theme/designTokens'
import type { ManagementReportTrendPoint } from 'src/types/managementReport'

type Row = ManagementReportTrendPoint &
  Record<string, number | string | null | undefined>

interface SeriesLine {
  key: string
  label: string
  color: string
  value: (point: ManagementReportTrendPoint) => number | null
}

interface View {
  id: string
  label: string
  money: boolean
  percent?: boolean
  lines: SeriesLine[]
}

const sum = (...values: Array<number | undefined>) =>
  values.reduce<number>((total, value) => total + (value ?? 0), 0)

const VIEWS: View[] = [
  {
    id: 'money',
    label: 'Ventas, facturado y cobrado',
    money: true,
    lines: [
      {
        key: 'sales',
        label: 'Ventas aprobadas',
        color: brand.main,
        value: (p) => sum(p.salesCalibrationValue, p.salesEquipmentValue)
      },
      {
        key: 'billed',
        label: 'Facturado',
        color: intent.info,
        value: (p) => p.billedValue ?? 0
      },
      {
        key: 'paid',
        label: 'Cobrado',
        color: intent.warning,
        value: (p) => p.paidValue ?? 0
      }
    ]
  },
  {
    id: 'counts',
    label: 'Cantidades',
    money: false,
    lines: [
      {
        key: 'sales',
        label: 'Negocios aprobados',
        color: brand.main,
        value: (p) => p.salesCalibrationCount + p.salesEquipmentCount
      },
      {
        key: 'billed',
        label: 'Cortes facturados',
        color: intent.info,
        value: (p) => p.billedCount
      },
      {
        key: 'paid',
        label: 'Cortes cobrados',
        color: intent.warning,
        value: (p) => p.paidCount
      }
    ]
  },
  {
    id: 'split',
    label: 'Calibración y equipos',
    money: false,
    lines: [
      {
        key: 'calibration',
        label: 'Calibración aprobada',
        color: brand.main,
        value: (p) => p.salesCalibrationCount
      },
      {
        key: 'equipment',
        label: 'Equipos aprobados',
        color: accent.main,
        value: (p) => p.salesEquipmentCount
      }
    ]
  },
  {
    id: 'quotes',
    label: 'Cotizaciones creadas',
    money: false,
    lines: [
      {
        key: 'created',
        label: 'Cotizaciones creadas',
        color: intent.info,
        value: (p) => p.createdCount
      }
    ]
  },
  {
    id: 'win',
    label: '% ganadas',
    money: false,
    percent: true,
    lines: [
      {
        key: 'win',
        label: 'Cotizaciones ganadas (%)',
        color: intent.success,
        value: (p) => (p.winRate === null ? null : p.winRate * 100)
      }
    ]
  },
  {
    id: 'open',
    label: 'Por cobrar al cierre',
    money: true,
    lines: [
      {
        key: 'open',
        label: 'Dinero por cobrar',
        color: intent.danger,
        value: (p) => p.openValue ?? 0
      }
    ]
  }
]

const millions = (value: number) =>
  `$${(value / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 0 })} M`

const shortMonth = (label: string) => {
  const [name, year] = label.split(' ')
  return `${name.slice(0, 3)} ${year?.slice(2) ?? ''}`.trim()
}

interface TrendSectionProps {
  series: ManagementReportTrendPoint[]
}

const TrendSection = ({ series }: TrendSectionProps) => {
  const hasMoney = series.some(
    (point) => point.salesCalibrationValue !== undefined
  )
  const views = VIEWS.filter((view) => hasMoney || !view.money)
  const [viewId, setViewId] = useState(views[0].id)
  const view = views.find((item) => item.id === viewId) ?? views[0]

  const data: Row[] = series.map((point) => ({
    ...point,
    month: shortMonth(point.label),
    ...Object.fromEntries(
      view.lines.map((line) => [line.key, line.value(point)])
    )
  }))

  const formatValue = (value: number) =>
    view.money
      ? millions(value)
      : view.percent
        ? `${value.toLocaleString('es-CO', { maximumFractionDigits: 1 })} %`
        : value.toLocaleString('es-CO')

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 3,
        border: `1px solid ${neutral.border}`,
        borderRadius: 3
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent='space-between'
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={1}
        mb={2}
      >
        <Box>
          <Typography variant='h6' sx={{ color: brand.ink }}>
            Tendencia
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            ¿Vamos mejor o peor que hace un año? Los últimos 12 meses.
          </Typography>
        </Box>
        <ToggleButtonGroup
          exclusive
          size='small'
          value={view.id}
          onChange={(_event, next) => next && setViewId(next)}
          aria-label='Serie de la tendencia'
          sx={{ flexWrap: 'wrap' }}
        >
          {views.map((item) => (
            <ToggleButton key={item.id} value={item.id}>
              {item.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>

      <Box sx={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart
            data={data}
            margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid stroke={neutral.border} strokeDasharray='3 3' />
            <XAxis
              dataKey='month'
              tick={{ fill: neutral.textMuted, fontSize: 12 }}
            />
            <YAxis
              width={view.money ? 64 : 44}
              tick={{ fill: neutral.textMuted, fontSize: 12 }}
              tickFormatter={(value: number) => formatValue(value)}
            />
            <Tooltip
              formatter={(value) =>
                typeof value === 'number' ? formatValue(value) : 'Sin dato'
              }
            />
            <Legend />
            {view.lines.map((line) => (
              <Line
                key={line.key}
                type='monotone'
                dataKey={line.key}
                name={line.label}
                stroke={line.color}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Box>
      <Typography variant='caption' color='text.secondary'>
        {view.percent
          ? 'Los meses con menos de 5 decisiones salen sin dato. '
          : ''}
        {view.id === 'open'
          ? 'Lo que seguía sin pago al cierre de cada mes, reconstruido con las fechas de pago. '
          : ''}
        Valores sin IVA, salvo facturado, cobrado y por cobrar, que incluyen
        IVA.
      </Typography>
    </Paper>
  )
}

export default TrendSection
