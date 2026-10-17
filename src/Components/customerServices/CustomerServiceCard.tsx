import React from 'react'
import { Chip } from '@mui/material'
import {
  CALIBRATION_SERVICE_STATUS_COLORS,
  CALIBRATION_SERVICE_STATUS_LABELS
} from 'src/constants/calibrationServices'
import { CustomerServiceSummary } from 'src/types/customerIndicators'
import ListItemCard from '../Common/ListItemCard'
import {
  TEAL_TEXT,
  formatCount,
  formatDate,
  formatSigned
} from '../customerIndicators/indicatorFormat'
import ServiceDocumentButtons from './ServiceDocumentButtons'

interface Props {
  customerId: number | string
  service: CustomerServiceSummary
}

/** Un servicio con ODS emitida: estado, equipos finales y sus documentos. Nunca muestra precios. */
const CustomerServiceCard: React.FC<Props> = ({ customerId, service }) => {
  const detail = [
    `${formatCount(service.quoted)} cotizados`,
    service.adjustmentsNet !== 0
      ? `${formatSigned(service.adjustmentsNet)} novedad`
      : null
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <ListItemCard
      title={<span style={{ color: TEAL_TEXT }}>{service.odsCode}</span>}
      subtitle={`Emitida el ${formatDate(service.odsGeneratedAt)}${
        service.site ? ` · ${service.site}` : ''
      }`}
      highlight={`${formatCount(service.effective)} equipos (${detail})`}
      status={
        <Chip
          size='small'
          variant='outlined'
          color={CALIBRATION_SERVICE_STATUS_COLORS[service.status]}
          label={
            CALIBRATION_SERVICE_STATUS_LABELS[service.status] ?? service.status
          }
        />
      }
      actions={
        <ServiceDocumentButtons
          customerId={customerId}
          serviceId={service.id}
          odsCode={service.odsCode}
          documents={service.documents}
        />
      }
    />
  )
}

export default CustomerServiceCard
