import { useState } from 'react'
import {
  AccessTimeOutlined,
  BuildOutlined,
  CheckCircleOutlined,
  DescriptionOutlined,
  EventBusyOutlined,
  HourglassTopOutlined,
  LocalShippingOutlined,
  PercentOutlined,
  ReceiptLongOutlined,
  ShoppingCartOutlined
} from '@mui/icons-material'
import MonthIndicatorsStrip from 'src/Components/Common/MonthIndicatorsStrip'
import {
  useMaintenanceIndicators,
  usePurchaseIndicators,
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
 * Franja del mes en curso sobre el listado de cotizaciones: creadas,
 * aprobadas, % ganadas y en espera. El filtro «Creada por» lo controla la
 * pantalla para que franja y listado filtren juntos. Los valores en pesos
 * solo llegan a quien puede verlos.
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
    <MonthIndicatorsStrip
      periodLabel={data.periodLabel}
      filterLabel='Creada por'
      allLabel='Todas las personas'
      options={data.creators.map((creator) => ({
        value: String(creator.userId),
        name: creator.name
      }))}
      filterValue={userId === null ? null : String(userId)}
      onFilterChange={(value) => onUserChange(value ? Number(value) : null)}
      cards={[
        {
          label: 'Creadas',
          value: totals.created,
          icon: <DescriptionOutlined />,
          tone: 'blue'
        },
        {
          label: 'Aprobadas',
          value: totals.approved,
          icon: <CheckCircleOutlined />,
          tone: 'green',
          caption: showMoney
            ? `${millions(totals.approvedValue)} sin IVA`
            : undefined
        },
        {
          label: '% ganadas',
          value: winRate,
          icon: <PercentOutlined />,
          tone: 'teal',
          caption:
            totals.winRate === null
              ? 'Menos de 5 decisiones'
              : `${totals.decisions} decisiones`
        },
        {
          label: 'En espera',
          value: totals.waiting,
          icon: <HourglassTopOutlined />,
          tone: 'orange',
          caption: showMoney
            ? `${millions(totals.waitingValue)} sin IVA`
            : undefined
        }
      ]}
    />
  )
}

/** Franja del mes sobre el listado de solicitudes de compra. */
export const PurchaseIndicatorsStrip = () => {
  const [person, setPerson] = useState<string | null>(null)
  const { data } = usePurchaseIndicators(person)
  if (!data) return null
  const { totals } = data
  return (
    <MonthIndicatorsStrip
      periodLabel={data.periodLabel}
      filterLabel='Solicitante'
      allLabel='Todas las personas'
      options={data.options}
      filterValue={person}
      onFilterChange={setPerson}
      cards={[
        {
          label: 'Solicitudes creadas',
          value: totals.created,
          icon: <ShoppingCartOutlined />,
          tone: 'blue'
        },
        {
          label: 'Aprobadas',
          value: totals.approved,
          icon: <CheckCircleOutlined />,
          tone: 'green',
          caption: person
            ? 'Se cuentan por quien aprueba, no por quien pide'
            : undefined
        },
        {
          label: 'Órdenes enviadas',
          value: totals.sent,
          icon: <LocalShippingOutlined />,
          tone: 'teal',
          caption:
            totals.sentValue !== undefined
              ? `${millions(totals.sentValue)} con IVA`
              : undefined
        },
        {
          label: 'Sin orden hace más de 15 días',
          value: totals.withoutOrder,
          icon: <EventBusyOutlined />,
          tone: 'red'
        }
      ]}
    />
  )
}

/** Franja del mes sobre el listado de tickets de mantenimiento. */
export const MaintenanceIndicatorsStrip = () => {
  const [technicianId, setTechnicianId] = useState<string | null>(null)
  const { data } = useMaintenanceIndicators(
    technicianId === null ? null : Number(technicianId)
  )
  if (!data) return null
  const { totals } = data
  return (
    <MonthIndicatorsStrip
      periodLabel={data.periodLabel}
      filterLabel='Técnico'
      allLabel='Todos los técnicos'
      options={data.options}
      filterValue={technicianId}
      onFilterChange={setTechnicianId}
      cards={[
        {
          label: 'Tickets creados',
          value: totals.created,
          icon: <BuildOutlined />,
          tone: 'blue'
        },
        {
          label: 'Terminados',
          value: totals.completed,
          icon: <ReceiptLongOutlined />,
          tone: 'green'
        },
        {
          label: 'Abiertos',
          value: totals.open,
          icon: <HourglassTopOutlined />,
          tone: 'orange'
        },
        {
          label: 'Días de atención',
          value:
            totals.medianAttentionDays === null
              ? 'Sin dato'
              : totals.medianAttentionDays.toLocaleString('es-CO'),
          icon: <AccessTimeOutlined />,
          tone: 'teal',
          caption: 'La mitad de los tickets se atendió en ese plazo'
        }
      ]}
    />
  )
}

export default QuotationIndicatorsStrip
