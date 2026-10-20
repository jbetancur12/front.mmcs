import {
  CalibrationService,
  CalibrationServiceLogisticsControlItem,
  CalibrationServiceLogisticsControlSheet,
  CalibrationServicePhysicalTraceabilityEntry
} from '../../../types/calibrationService'
import { CalibrationServiceOdsDialogValues } from '../CalibrationServiceOdsDialog'
import { CalibrationServiceScheduleDialogValues } from '../CalibrationServiceScheduleDialog'
import { CalibrationServiceRescheduleDialogValues } from '../CalibrationServiceRescheduleDialog'
import { CalibrationServiceReassignDialogValues } from '../CalibrationServiceReassignDialog'
import { CalibrationServicePhysicalTraceabilityDialogValues } from '../CalibrationServicePhysicalTraceabilityDialog'
import { CalibrationServiceLogisticsControlDialogValues } from '../CalibrationServiceLogisticsControlDialog'
import {
  buildTodayValue,
  getCustomerResponseType,
  getLatestChangeRequest,
  getLogisticsDetails,
  getOperationsDetails,
  getOtherFieldRecord,
  getOtherFieldText,
  toNumber
} from './calibrationServiceDetailUtils'

/**
 * Datos derivados del servicio que usa la vista de detalle: textos de la ficha,
 * totales con novedades aprobadas, documentos agrupados y valores iniciales de
 * los diálogos. Es una función pura: solo depende del servicio.
 */
export const getCalibrationServiceDetailData = (service: CalibrationService) => {
  const approvalNotes = getOtherFieldText(service.otherFields, 'approvalNotes')
  const customerResponseType = getCustomerResponseType(service.otherFields)
  const latestChangeRequest = getLatestChangeRequest(service.otherFields)
  const latestChangeRequestReason =
    typeof latestChangeRequest?.changeRequestReason === 'string'
      ? latestChangeRequest.changeRequestReason
      : ''
  const commercialCustomerName = service.customer?.nombre || 'Sin registrar'
  const executionCustomerName =
    service.executionCustomerName || service.customer?.nombre || 'Sin registrar'
  const executionSiteName =
    service.executionSiteName || service.customerSite || 'Sin registrar'
  const hasDifferentExecutionCustomer =
    Boolean(service.executionCustomerName) &&
    service.executionCustomerName !== service.customer?.nombre
  const rawExecutionCustomerName = service.executionCustomerName || null
  const rawExecutionSiteName = service.executionSiteName || null
  const odsDetails = getOtherFieldRecord(service.otherFields, 'ods')
  const operationsDetails = getOperationsDetails(service.otherFields)
  const logisticsDetails = getLogisticsDetails(service.otherFields)
  const odsScheduleWindow =
    typeof odsDetails?.scheduleWindow === 'string'
      ? odsDetails.scheduleWindow
      : ''
  const odsSignerName =
    typeof odsDetails?.signerName === 'string' ? odsDetails.signerName : ''
  const odsCustomerAgreements =
    typeof odsDetails?.customerAgreements === 'string'
      ? odsDetails.customerAgreements
      : ''
  const operationsCommitmentDate =
    typeof operationsDetails?.commitmentDate === 'string'
      ? operationsDetails.commitmentDate
      : ''
  const operationsScheduledDate =
    typeof operationsDetails?.scheduledDate === 'string'
      ? operationsDetails.scheduledDate
      : typeof odsDetails?.scheduledFor === 'string'
        ? odsDetails.scheduledFor
        : ''
  const operationsAssignedMetrologistUserIds = (() => {
    const raw = operationsDetails?.assignedMetrologistUserIds
    if (Array.isArray(raw) && raw.length > 0) return (raw as number[]).map(String)
    const legacyId = operationsDetails?.assignedMetrologistUserId
    return legacyId ? [String(legacyId)] : []
  })()
  const operationsAssignedMetrologistNames = (() => {
    const raw: any = operationsDetails?.assignedMetrologists
    if (Array.isArray(raw) && raw.length > 0) return raw.map((m: any) => m.name).join(', ')
    const legacyName = operationsDetails?.assignedMetrologistName
    return legacyName || ''
  })()
  const operationsResponsibleName: string =
    typeof (operationsDetails as any)?.operationalResponsibleName === 'string'
      ? (operationsDetails as any).operationalResponsibleName
      : (operationsAssignedMetrologistNames || '')
  const operationsResponsibleRole =
    typeof operationsDetails?.operationalResponsibleRole === 'string'
      ? operationsDetails.operationalResponsibleRole
      : ''
  const operationsProgrammingNotes =
    typeof operationsDetails?.programmingNotes === 'string'
      ? operationsDetails.programmingNotes
      : ''
  const logisticsHistory: CalibrationServicePhysicalTraceabilityEntry[] =
    Array.isArray(logisticsDetails?.history)
      ? ((logisticsDetails?.history ||
          []) as CalibrationServicePhysicalTraceabilityEntry[])
      : []
  const logisticsControlSheet: CalibrationServiceLogisticsControlSheet =
    (() => {
      const rawControlSheet =
        logisticsDetails?.controlSheet &&
        typeof logisticsDetails.controlSheet === 'object' &&
        !Array.isArray(logisticsDetails.controlSheet)
          ? (logisticsDetails.controlSheet as Record<string, unknown>)
          : {}

      const existingItems =
        Array.isArray(rawControlSheet.items) && rawControlSheet.items.length
          ? rawControlSheet.items
          : []

      const normalizedItems: CalibrationServiceLogisticsControlItem[] =
        existingItems.map((item, index) => ({
          rowNumber:
            typeof item?.rowNumber === 'number' && item.rowNumber > 0
              ? item.rowNumber
              : index + 1,
          serviceItemId:
            typeof item?.serviceItemId === 'number' ? item.serviceItemId : null,
          equipmentName:
            typeof item?.equipmentName === 'string' ? item.equipmentName : '',
          brand: typeof item?.brand === 'string' ? item.brand : '',
          model: typeof item?.model === 'string' ? item.model : '',
          serialNumber:
            typeof item?.serialNumber === 'string' ? item.serialNumber : '',
          assetNumber:
            typeof item?.assetNumber === 'string' ? item.assetNumber : '',
          location: typeof item?.location === 'string' ? item.location : '',
          serviceScope: item?.serviceScope === 'AC' ? 'AC' : 'NA',
          physicalInspectionIn:
            typeof item?.physicalInspectionIn === 'string'
              ? item.physicalInspectionIn
              : null,
          physicalInspectionOut:
            typeof item?.physicalInspectionOut === 'string'
              ? item.physicalInspectionOut
              : null,
          operationalInspectionIn:
            typeof item?.operationalInspectionIn === 'string'
              ? item.operationalInspectionIn
              : null,
          operationalInspectionOut:
            typeof item?.operationalInspectionOut === 'string'
              ? item.operationalInspectionOut
              : null
        }))

      return {
        intakeDate:
          typeof rawControlSheet.intakeDate === 'string'
            ? rawControlSheet.intakeDate
            : '',
        deliveryDate:
          typeof rawControlSheet.deliveryDate === 'string'
            ? rawControlSheet.deliveryDate
            : '',
        requesterCompanyName:
          typeof rawControlSheet.requesterCompanyName === 'string'
            ? rawControlSheet.requesterCompanyName
            : service.customer?.nombre || service.executionCustomerName || '',
        requesterOfferNumber:
          typeof rawControlSheet.requesterOfferNumber === 'string'
            ? rawControlSheet.requesterOfferNumber
            : service.quoteCode || service.serviceCode,
        requesterAddress:
          typeof rawControlSheet.requesterAddress === 'string'
            ? rawControlSheet.requesterAddress
            : service.address || service.customer?.direccion || '',
        requesterPhone:
          typeof rawControlSheet.requesterPhone === 'string'
            ? rawControlSheet.requesterPhone
            : service.contactPhone || service.customer?.telefono || '',
        requesterContactName:
          typeof rawControlSheet.requesterContactName === 'string'
            ? rawControlSheet.requesterContactName
            : service.contactName || '',
        requesterCity:
          typeof rawControlSheet.requesterCity === 'string'
            ? rawControlSheet.requesterCity
            : service.city || service.customer?.ciudad || '',
        items: normalizedItems.length
          ? normalizedItems
          : [
              {
                rowNumber: 1,
                serviceItemId: null,
                equipmentName: '',
                brand: '',
                model: '',
                serialNumber: '',
                assetNumber: '',
                location: '',
                serviceScope: 'NA' as const,
                physicalInspectionIn: null,
                physicalInspectionOut: null,
                operationalInspectionIn: null,
                operationalInspectionOut: null
              }
            ],
        noSerialAuthorization:
          typeof rawControlSheet.noSerialAuthorization === 'boolean'
            ? rawControlSheet.noSerialAuthorization
            : null,
        calibrationPointsRequested:
          typeof rawControlSheet.calibrationPointsRequested === 'boolean'
            ? rawControlSheet.calibrationPointsRequested
            : null,
        calibrationPointsDetails:
          typeof rawControlSheet.calibrationPointsDetails === 'string'
            ? rawControlSheet.calibrationPointsDetails
            : '',
        specialCondition:
          typeof rawControlSheet.specialCondition === 'boolean'
            ? rawControlSheet.specialCondition
            : null,
        specialConditionDetails:
          typeof rawControlSheet.specialConditionDetails === 'string'
            ? rawControlSheet.specialConditionDetails
            : '',
        calibrationCertificateIncluded:
          typeof rawControlSheet.calibrationCertificateIncluded === 'boolean'
            ? rawControlSheet.calibrationCertificateIncluded
            : null,
        stampIncluded:
          typeof rawControlSheet.stampIncluded === 'boolean'
            ? rawControlSheet.stampIncluded
            : null,
        observations:
          typeof rawControlSheet.observations === 'string'
            ? rawControlSheet.observations
            : '',
        receivedTransportCompany:
          typeof rawControlSheet.receivedTransportCompany === 'string'
            ? rawControlSheet.receivedTransportCompany
            : '',
        receivedGuide:
          typeof rawControlSheet.receivedGuide === 'string'
            ? rawControlSheet.receivedGuide
            : '',
        receivedByMetromedicsName:
          typeof rawControlSheet.receivedByMetromedicsName === 'string'
            ? rawControlSheet.receivedByMetromedicsName
            : '',
        receivedByMetromedicsRole:
          typeof rawControlSheet.receivedByMetromedicsRole === 'string'
            ? rawControlSheet.receivedByMetromedicsRole
            : '',
        deliveredByMetromedicsName:
          typeof rawControlSheet.deliveredByMetromedicsName === 'string'
            ? rawControlSheet.deliveredByMetromedicsName
            : '',
        deliveredByMetromedicsRole:
          typeof rawControlSheet.deliveredByMetromedicsRole === 'string'
            ? rawControlSheet.deliveredByMetromedicsRole
            : '',
        sentTransportCompany:
          typeof rawControlSheet.sentTransportCompany === 'string'
            ? rawControlSheet.sentTransportCompany
            : '',
        sentGuide:
          typeof rawControlSheet.sentGuide === 'string'
            ? rawControlSheet.sentGuide
            : '',
        deliveredToClientName:
          typeof rawControlSheet.deliveredToClientName === 'string'
            ? rawControlSheet.deliveredToClientName
            : '',
        deliveredToClientSignature:
          typeof rawControlSheet.deliveredToClientSignature === 'string'
            ? rawControlSheet.deliveredToClientSignature
            : '',
        receivedByClientName:
          typeof rawControlSheet.receivedByClientName === 'string'
            ? rawControlSheet.receivedByClientName
            : '',
        receivedByClientSignature:
          typeof rawControlSheet.receivedByClientSignature === 'string'
            ? rawControlSheet.receivedByClientSignature
            : '',
        lastUpdatedAt:
          typeof rawControlSheet.lastUpdatedAt === 'string'
            ? rawControlSheet.lastUpdatedAt
            : '',
        lastUpdatedByUserId:
          typeof rawControlSheet.lastUpdatedByUserId === 'number'
            ? rawControlSheet.lastUpdatedByUserId
            : null,
        lastUpdatedByName:
          typeof rawControlSheet.lastUpdatedByName === 'string'
            ? rawControlSheet.lastUpdatedByName
            : ''
      }
    })()
  const deliveryName =
    typeof operationsDetails?.deliveryName === 'string'
      ? operationsDetails.deliveryName
      : null
  const deliveryRole =
    typeof operationsDetails?.deliveryRole === 'string'
      ? operationsDetails.deliveryRole
      : null
  const deliverySignatureData =
    typeof operationsDetails?.deliverySignatureData === 'string'
      ? operationsDetails.deliverySignatureData
      : null
  const operationsCompletionNotes =
    typeof operationsDetails?.completionNotes === 'string'
      ? operationsDetails.completionNotes
      : ''
  const approvedAdjustmentsImpact = (service.adjustments || []).reduce(
    (accumulator, adjustment) => {
      if (!['approved', 'applied_to_cut'].includes(adjustment.status)) {
        return accumulator
      }

      if (
        adjustment.changeType === 'extra_item' &&
        adjustment.serviceItemId &&
        (service.items || []).some(
          (item) => item.id === adjustment.serviceItemId
        )
      ) {
        return accumulator
      }

      const taxTotalFromOtherFields =
        adjustment.approvedTaxTotal ??
        (adjustment.otherFields &&
        typeof adjustment.otherFields.approvedTaxTotal === 'number'
          ? adjustment.otherFields.approvedTaxTotal
          : adjustment.otherFields &&
              typeof adjustment.otherFields.approvedTaxTotal === 'string'
            ? adjustment.otherFields.approvedTaxTotal
            : 0)

      return {
        subtotal: accumulator.subtotal + toNumber(adjustment.approvedSubtotal),
        taxTotal: accumulator.taxTotal + toNumber(taxTotalFromOtherFields),
        grandTotal: accumulator.grandTotal + toNumber(adjustment.approvedTotal)
      }
    },
    { subtotal: 0, taxTotal: 0, grandTotal: 0 }
  )
  const baseSubtotal = (service.items || []).reduce(
    (accumulator, item) => accumulator + toNumber(item.subtotal),
    0
  )
  const baseTaxTotal = (service.items || []).reduce(
    (accumulator, item) => accumulator + toNumber(item.taxTotal),
    0
  )
  const subtotal = baseSubtotal + approvedAdjustmentsImpact.subtotal
  const baseTaxTotalValue = baseTaxTotal + approvedAdjustmentsImpact.taxTotal
  const discountAmount = service.hasDiscount
    ? service.discountType === 'percentage'
      ? subtotal * (toNumber(service.discountValue) / 100)
      : toNumber(service.discountValue)
    : 0
  const discountedSubtotal = subtotal - discountAmount
  const effectiveTaxRate = subtotal > 0 ? baseTaxTotalValue / subtotal : 0
  const taxTotal = effectiveTaxRate > 0 ? discountedSubtotal * effectiveTaxRate : baseTaxTotalValue
  const grandTotal = discountedSubtotal + taxTotal
  const decisionDocuments = service.documents?.filter((document) =>
    ['approval_evidence', 'rejection_evidence'].includes(document.documentType)
  )
  const adjustmentCustomerResponseDocuments = service.documents?.filter(
    (document) => document.documentType === 'adjustment_customer_response_pdf'
  )
  const officialPdfDocuments = service.documents?.filter((document) =>
    [
      'quote_pdf',
      'ods_pdf',
      'adjustment_pdf',
      'adjustment_summary_pdf',
      'adjustment_customer_response_pdf',
      'logistics_control_pdf',
      'technical_progress_pdf'
    ].includes(document.documentType)
  )
  const supportDocuments = service.documents?.filter(
    (document) =>
      ![
        'quote_pdf',
        'ods_pdf',
        'adjustment_pdf',
        'adjustment_summary_pdf',
        'adjustment_customer_response_pdf',
        'logistics_control_pdf',
        'technical_progress_pdf',
        'approval_evidence',
        'rejection_evidence'
      ].includes(document.documentType)
  )
  const unresolvedCommercialAdjustments = (service.adjustments || []).filter(
    (adjustment) =>
      adjustment.requiresCommercialAdjustment &&
      [
        'reported',
        'pending_customer_approval',
        'customer_changes_requested'
      ].includes(adjustment.status)
  )
  const blockingAdjustments = (service.adjustments || []).filter(
    (adjustment) =>
      [
        'reported',
        'pending_customer_approval',
        'customer_changes_requested'
      ].includes(adjustment.status) ||
      (adjustment.status === 'customer_rejected' &&
        adjustment.otherFields?.contractModificationRequired !== false)
  )
  const odsDialogInitialValues: CalibrationServiceOdsDialogValues = {
    issuedAt: buildTodayValue(),
    executionCustomerName:
      service.executionCustomerName || service.customer?.nombre || '',
    executionSiteName: service.executionSiteName || service.customerSite || '',
    internalNotes: service.internalNotes || '',
    scheduledFor:
      typeof odsDetails?.scheduledFor === 'string'
        ? odsDetails.scheduledFor.slice(0, 10)
        : '',
    scheduleWindow: odsScheduleWindow,
    serviceComments:
      typeof odsDetails?.serviceComments === 'string'
        ? odsDetails.serviceComments
        : '',
    modificationReason:
      typeof odsDetails?.modificationReason === 'string'
        ? odsDetails.modificationReason
        : '',
    customerAgreements: odsCustomerAgreements,
    signerName: odsSignerName || service.contactName || '',
    signerRole:
      typeof odsDetails?.signerRole === 'string' ? odsDetails.signerRole : '',
    externalReference:
      typeof odsDetails?.externalReference === 'string'
        ? odsDetails.externalReference
        : '',
    receptionNotes:
      typeof odsDetails?.receptionNotes === 'string'
        ? odsDetails.receptionNotes
        : '',
    generatePdfImmediately: true
  }
  const scheduleDialogInitialValues: CalibrationServiceScheduleDialogValues = {
    commitmentDate: operationsCommitmentDate
      ? operationsCommitmentDate.slice(0, 10)
      : '',
    scheduledDate: operationsScheduledDate
      ? operationsScheduledDate.slice(0, 10)
      : '',
    assignedMetrologistUserIds: operationsAssignedMetrologistUserIds,
    operationalResponsibleName: operationsResponsibleName,
    operationalResponsibleRole: operationsResponsibleRole || 'Metrologo',
    programmingNotes:
      operationsProgrammingNotes ||
      (odsScheduleWindow
        ? `Ventana indicada en la ODS: ${odsScheduleWindow}`
        : '')
  }
  const rescheduleDialogInitialValues: CalibrationServiceRescheduleDialogValues =
    {
      commitmentDate: operationsCommitmentDate
        ? operationsCommitmentDate.slice(0, 10)
        : '',
      scheduledDate: operationsScheduledDate
        ? operationsScheduledDate.slice(0, 10)
        : '',
      reprogrammingReason: '',
      programmingNotes: operationsProgrammingNotes
    }
  const reassignDialogInitialValues: CalibrationServiceReassignDialogValues = {
    assignedMetrologistUserIds: operationsAssignedMetrologistUserIds,
    operationalResponsibleName: operationsResponsibleName,
    operationalResponsibleRole: operationsResponsibleRole || 'Metrologo',
    reassignmentReason: ''
  }
  const physicalTraceabilityInitialValues: CalibrationServicePhysicalTraceabilityDialogValues =
    {
      movementType: 'pickup',
      occurredAt: new Date().toISOString().slice(0, 16),
      contactName: service.contactName || '',
      contactRole: '',
      location:
        service.executionSiteName ||
        service.customerSite ||
        service.address ||
        '',
      notes: ''
    }
  const logisticsControlInitialValues: CalibrationServiceLogisticsControlDialogValues =
    logisticsControlSheet
  const lastCertificateSent = (service?.events ?? [])
    .filter((event) => event.eventType === 'certificate_sent')
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    )[0]
  const customerSignatureData =
    (service.otherFields?.customerSignatureData as string | undefined) ?? null

  return {
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
    odsCustomerAgreements,
    logisticsHistory,
    logisticsControlSheet,
    deliveryName,
    deliveryRole,
    deliverySignatureData,
    operationsCompletionNotes,
    subtotal,
    discountAmount,
    taxTotal,
    grandTotal,
    decisionDocuments,
    adjustmentCustomerResponseDocuments,
    officialPdfDocuments,
    supportDocuments,
    unresolvedCommercialAdjustments,
    blockingAdjustments,
    odsDialogInitialValues,
    scheduleDialogInitialValues,
    rescheduleDialogInitialValues,
    reassignDialogInitialValues,
    physicalTraceabilityInitialValues,
    logisticsControlInitialValues,
    lastCertificateSent,
    customerSignatureData
  }
}

export type CalibrationServiceDetailData = ReturnType<
  typeof getCalibrationServiceDetailData
>
