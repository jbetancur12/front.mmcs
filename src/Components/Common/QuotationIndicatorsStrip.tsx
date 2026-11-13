import { Grid, MenuItem, Stack, TextField, Typography } from '@mui/material'
import {
  CheckCircleOutlined,
  DescriptionOutlined,
  HourglassTopOutlined,
  PercentOutlined
} from '@mui/icons-material'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import {
  useQuotationIndicators,
  type QuotationIndicatorsKind
} from 'src/hooks/useQuotationIndicators'

const millions = (value?: number) =>
  value === undefined
    ? ''
    : `$${(value / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 0 })} M`

interface QuotationIndicatorsStripProps {
  kind: QuotationIndicatorsKind
  /** Quién creó las cotizaciones; el mismo valor filtra el listado en el servidor. */
  userId: number | null
  onUserChange: (userId: number | null) => void
}

/**
 * Franja de indicadores del mes en curso sobre el listado de cotizaciones:
 * creadas, aprobadas, % ganadas y en espera, con filtro por quien las creó.
 * Los números salen de un endpoint ligero (no del reporte gerencial); los
 * valores en pesos solo llegan a quien puede verlos. El filtro «Creada por» lo
 * controla la pantalla para que franja y listado filtren juntos.
 */
const QuotationIndicatorsStrip = ({
  kind,
  userId,
  onUserChange
}: QuotationIndicatorsStripProps) => {
  const { data } = useQuotationIndicators(kind, userId)
  if (!data) return null
  const { totals } = data
  const showMoney = totals.approvedValue !== undefined
  const winRate =
    totals.winRate === null
      ? 'Sin dato'
      : `${(totals.winRate * 100).toLocaleString('es-CO', { maximumFractionDigits: 1 })} %`

  return (
    <Stack spacing={1.5} sx={{ mb: 3 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent='space-between'
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1}
      >
        <Typography variant='subtitle1' fontWeight={700}>
          {`Este mes · ${data.periodLabel}`}
        </Typography>
        <TextField
          select
          size='small'
          label='Creada por'
          value={userId === null ? '' : String(userId)}
          onChange={(event) =>
            onUserChange(event.target.value ? Number(event.target.value) : null)
          }
          SelectProps={{ displayEmpty: true }}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value=''>Todas las personas</MenuItem>
          {data.creators.map((creator) => (
            <MenuItem key={creator.userId} value={String(creator.userId)}>
              {creator.name}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <LmsStatCard
            label='Creadas'
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
            caption={
              showMoney
                ? `${millions(totals.approvedValue)} sin IVA`
                : undefined
            }
            compact
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <LmsStatCard
            label='% ganadas'
            value={winRate}
            icon={<PercentOutlined />}
            tone='teal'
            caption={
              totals.winRate === null
                ? 'Menos de 5 decisiones'
                : `${totals.decisions} decisiones`
            }
            compact
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <LmsStatCard
            label='En espera'
            value={totals.waiting}
            icon={<HourglassTopOutlined />}
            tone='orange'
            caption={
              showMoney ? `${millions(totals.waitingValue)} sin IVA` : undefined
            }
            compact
          />
        </Grid>
      </Grid>
    </Stack>
  )
}

export default QuotationIndicatorsStrip
