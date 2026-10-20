import {
  Alert,
  IconButton,
  Stack
} from '@mui/material'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { CalibrationService } from '../../../types/calibrationService'
import { ClampedText, DetailCell, DetailField, DetailSection } from '../CalibrationServiceDetailBlocks'
import { formatDateValue } from './calibrationServiceDetailUtils'
import {
  CalibrationServiceDetailPermissions,
  CalibrationServiceDetailData,
  CalibrationServiceDetailDialogs
} from './calibrationServiceDetailTypes'

interface CalibrationServiceSummaryTabProps {
  service: CalibrationService
  permissions: CalibrationServiceDetailPermissions
  data: CalibrationServiceDetailData
  dialogs: CalibrationServiceDetailDialogs
}

/** Pestaña Resumen: cliente, solicitud, respuesta del cliente y datos de la ODS. */
const CalibrationServiceSummaryTab = ({
  service,
  permissions,
  data,
  dialogs
}: CalibrationServiceSummaryTabProps) => {
  const {
    isTechnicalOnlyView,
    canEditExecutionCustomer
  } = permissions
  const {
    approvalNotes,
    customerResponseType,
    latestChangeRequestReason,
    commercialCustomerName,
    executionCustomerName,
    executionSiteName,
    hasDifferentExecutionCustomer,
    rawExecutionCustomerName,
    rawExecutionSiteName,
    odsDetails,
    odsScheduleWindow,
    odsSignerName,
    odsCustomerAgreements
  } = data
  const {
    setIsExecutionCustomerDialogOpen,
    setExecutionCustomerDraft,
    setExecutionSiteDraft
  } = dialogs

  return (
    <>
      {service.status === 'cancelled' ? (
        <Alert severity='error' sx={{ mb: 2 }}>
          Este servicio fue <strong>cancelado formalmente</strong> y
          quedó fuera del flujo operativo.
        </Alert>
      ) : null}
      {service.isPaused ? (
        <Alert severity='warning' sx={{ mb: 2 }}>
          El servicio se encuentra <strong>pausado</strong>. Antes de
          continuar con ejecución, cortes, facturación o control
          documental debes reanudarlo.
        </Alert>
      ) : null}
      {!isTechnicalOnlyView &&
      customerResponseType === 'changes_requested' ? (
        <Alert severity='warning' sx={{ mb: 2 }}>
          El cliente pidió modificar la cotización. El servicio volvió
          a edición para ajustar la propuesta y reenviarla sin perder
          la trazabilidad.
        </Alert>
      ) : null}
      <DetailSection title='Cliente y contacto'>
        {!isTechnicalOnlyView ? (
          <>
            <DetailCell>
              <DetailField label='Cliente de la oferta'>{commercialCustomerName}</DetailField>
            </DetailCell>
            <DetailCell>
              <Stack direction='row' alignItems='flex-start' spacing={1}>
                <DetailField label='Destino del servicio'>
                  {hasDifferentExecutionCustomer
                    ? 'Cliente diferente a la oferta'
                    : 'Mismo cliente de la oferta'}
                </DetailField>
                {canEditExecutionCustomer ? (
                  <IconButton
                    size='small'
                    aria-label='Cambiar el destino del servicio'
                    onClick={() => {
                      setExecutionCustomerDraft(rawExecutionCustomerName ?? '')
                      setExecutionSiteDraft(rawExecutionSiteName ?? '')
                      setIsExecutionCustomerDialogOpen(true)
                    }}
                    sx={{ color: '#00897B' }}
                  >
                    <EditOutlinedIcon fontSize='small' />
                  </IconButton>
                ) : null}
              </Stack>
            </DetailCell>
            {hasDifferentExecutionCustomer ? (
              <>
                <DetailCell>
                  <DetailField label='Cliente de ejecución'>{executionCustomerName}</DetailField>
                </DetailCell>
                <DetailCell>
                  <DetailField label='Sede o referencia de ejecución'>{executionSiteName}</DetailField>
                </DetailCell>
              </>
            ) : null}
          </>
        ) : null}
        <DetailCell>
          <DetailField label='Contacto'>{service.contactName || 'Sin contacto'}</DetailField>
        </DetailCell>
        <DetailCell>
          <DetailField label='Sede'>
            {service.customerSite || service.executionSiteName || 'Sin sede definida'}
          </DetailField>
        </DetailCell>
        <DetailCell>
          <DetailField label='Correo'>{service.contactEmail || 'Sin registrar'}</DetailField>
        </DetailCell>
        <DetailCell>
          <DetailField label='Teléfono'>{service.contactPhone || 'Sin registrar'}</DetailField>
        </DetailCell>
      </DetailSection>

      <DetailSection title='Solicitud'>
        {!isTechnicalOnlyView ? (
          <DetailCell>
            <DetailField label='Canal de solicitud'>{service.requestChannel || 'Sin definir'}</DetailField>
          </DetailCell>
        ) : null}
        <DetailCell>
          <DetailField label='Fecha de creación'>{formatDateValue(service.createdAt)}</DetailField>
        </DetailCell>
        {!isTechnicalOnlyView ? (
          <DetailCell>
            <DetailField label='Forma de pago'>{service.paymentMethod || 'Sin definir'}</DetailField>
          </DetailCell>
        ) : null}
        <DetailCell>
          <DetailField label='Código ODS'>{service.odsCode || 'ODS pendiente'}</DetailField>
        </DetailCell>
        <DetailCell>
          <DetailField label='Fecha de emisión de la ODS'>{formatDateValue(service.odsGeneratedAt)}</DetailField>
        </DetailCell>
      </DetailSection>

      {!isTechnicalOnlyView &&
      (service.approvalStatus !== 'pending' ||
        customerResponseType === 'changes_requested') ? (
        <DetailSection title='Respuesta del cliente'>
          <DetailCell>
            <DetailField label='Medio de respuesta'>{service.approvalChannel || 'Sin registrar'}</DetailField>
          </DetailCell>
          <DetailCell>
            <DetailField label='Contacto de referencia'>{service.approvalReference || 'Sin registrar'}</DetailField>
          </DetailCell>
          <DetailCell>
            <DetailField label='Fecha'>{formatDateValue(service.approvedAt || service.rejectedAt)}</DetailField>
          </DetailCell>
          {service.rejectionReason ? (
            <DetailCell full>
              <DetailField label='Motivo de rechazo'>{service.rejectionReason}</DetailField>
            </DetailCell>
          ) : null}
          {customerResponseType === 'changes_requested' && latestChangeRequestReason ? (
            <DetailCell full>
              <DetailField label='Solicitud de modificación'>{latestChangeRequestReason}</DetailField>
            </DetailCell>
          ) : null}
          {approvalNotes ? (
            <DetailCell full>
              <DetailField label='Observación de la respuesta'>{approvalNotes}</DetailField>
            </DetailCell>
          ) : null}
        </DetailSection>
      ) : null}

      {!isTechnicalOnlyView && service.commercialComments ? (
        <DetailSection title='Comentarios comerciales'>
          <DetailCell full>
            <ClampedText text={String(service.commercialComments)} />
          </DetailCell>
        </DetailSection>
      ) : null}

      {service.odsCode ? (
        <DetailSection title='Datos de la ODS'>
          <DetailCell>
            <DetailField label='Programada para'>
              {formatDateValue(typeof odsDetails?.scheduledFor === 'string' ? odsDetails.scheduledFor : null)}
            </DetailField>
          </DetailCell>
          <DetailCell>
            <DetailField label='Franja'>{odsScheduleWindow || 'Sin registrar'}</DetailField>
          </DetailCell>
          <DetailCell>
            <DetailField label='Firmante'>{odsSignerName || 'Sin registrar'}</DetailField>
          </DetailCell>
          <DetailCell>
            <DetailField label='Referencia externa'>
              {typeof odsDetails?.externalReference === 'string' ? odsDetails.externalReference : 'Sin registrar'}
            </DetailField>
          </DetailCell>
          {odsCustomerAgreements ? (
            <DetailCell full>
              <DetailField label='Acuerdos con el cliente'>
                <ClampedText text={String(odsCustomerAgreements)} />
              </DetailField>
            </DetailCell>
          ) : null}
        </DetailSection>
      ) : null}
    </>
  )
}

export default CalibrationServiceSummaryTab
