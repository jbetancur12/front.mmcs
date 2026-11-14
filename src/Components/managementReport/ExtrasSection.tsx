import { Grid, Typography } from '@mui/material'
import {
  AutorenewOutlined,
  HourglassTopOutlined,
  PersonAddAltOutlined
} from '@mui/icons-material'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import { formatInt } from 'src/utils/formatNumber'
import type { ManagementReportExtras } from 'src/types/managementReport'

const percent = (value: number | null | undefined) =>
  value === null || value === undefined
    ? 'Sin dato'
    : `${(value * 100).toLocaleString('es-CO', { maximumFractionDigits: 1 })} %`

const millions = (value?: number) =>
  value === undefined
    ? ''
    : `$${(value / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 0 })} M`

const monthsText = (months: number | null | undefined) =>
  months === null || months === undefined
    ? 'Sin dato'
    : `${months.toLocaleString('es-CO', { maximumFractionDigits: 1 })} meses`

/** Resumen de una línea para la cabecera plegada. */
export const extrasSummary = (extras: ManagementReportExtras) => {
  const parts: string[] = []
  if (extras.renewals?.expired) {
    parts.push(
      `${formatInt(extras.renewals.renewed)} de ${formatInt(extras.renewals.expired)} equipos vencidos recalibrados`
    )
  }
  if (extras.customerMix) {
    parts.push(
      `${formatInt(extras.customerMix.newCustomers)} clientes nuevos y ${formatInt(extras.customerMix.recurringCustomers)} recurrentes`
    )
  }
  if (extras.queue?.months !== undefined && extras.queue.months !== null) {
    parts.push(`${monthsText(extras.queue.months)} de trabajo en cola`)
  }
  return parts.join(' · ') || 'Renovaciones, clientes nuevos y trabajo en cola'
}

const ExtrasSection = ({ extras }: { extras: ManagementReportExtras }) => {
  const { renewals, customerMix, queue } = extras
  return (
    <>
      <Grid container spacing={2} sx={{ mb: 1 }}>
        {renewals && (
          <Grid item xs={12} md={4}>
            <LmsStatCard
              label='Renovaciones'
              value={`${formatInt(renewals.renewed)} de ${formatInt(renewals.expired)}`}
              icon={<AutorenewOutlined />}
              tone='teal'
              caption={`${percent(renewals.share)} de los equipos vencidos al cierre del mes anterior se recalibró este mes`}
              compact
            />
          </Grid>
        )}
        {customerMix && (
          <Grid item xs={12} md={4}>
            <LmsStatCard
              label='Clientes nuevos y recurrentes'
              value={`${formatInt(customerMix.newCustomers)} y ${formatInt(customerMix.recurringCustomers)}`}
              icon={<PersonAddAltOutlined />}
              tone='blue'
              caption={
                customerMix.newValue !== undefined
                  ? `Nuevos: ${millions(customerMix.newValue)} · Recurrentes: ${millions(customerMix.recurringValue)} (sin IVA)`
                  : 'Nuevos: primera compra aprobada en el mes'
              }
              compact
            />
          </Grid>
        )}
        {queue && (
          <Grid item xs={12} md={4}>
            <LmsStatCard
              label='Trabajo en cola'
              value={monthsText(queue.months)}
              icon={<HourglassTopOutlined />}
              tone='orange'
              caption={
                queue.queueValue !== undefined
                  ? `${millions(queue.queueValue)} aprobados por ejecutar, contra ${millions(queue.monthlyAverage ?? undefined)} facturados al mes`
                  : 'Meses de facturación que equivale lo aprobado por ejecutar'
              }
              compact
            />
          </Grid>
        )}
      </Grid>
      <Typography variant='caption' color='text.secondary'>
        Renovaciones: equipos con certificado vencido al cierre del mes anterior
        que tienen certificado nuevo en el mes (detalle por cliente en el
        Excel). Cliente nuevo: su primera compra aprobada cae en el mes; como la
        plataforma tiene poco historial, los nuevos pueden estar inflados.
        Trabajo en cola: lo aprobado por ejecutar entre lo que se factura al mes
        (promedio de los últimos 6 meses, sin IVA); si parte de ese trabajo ya
        se hizo y no se registró, la cifra sale alta.
      </Typography>
    </>
  )
}

export default ExtrasSection
