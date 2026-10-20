import useCalibrationServiceAdjustmentActions from './useCalibrationServiceAdjustmentActions'
import useCalibrationServiceCutActions from './useCalibrationServiceCutActions'
import useCalibrationServiceDocumentActions from './useCalibrationServiceDocumentActions'
import useCalibrationServiceDocumentViewer from './useCalibrationServiceDocumentViewer'
import useCalibrationServiceLogisticsActions from './useCalibrationServiceLogisticsActions'
import useCalibrationServiceWorkflowActions from './useCalibrationServiceWorkflowActions'

export type { CalibrationServiceDetailData } from './calibrationServiceDetailData'
export type { CalibrationServiceDetailDialogs } from './useCalibrationServiceDetailDialogs'
export type { CalibrationServiceDetailPermissions } from './useCalibrationServiceDetailPermissions'

/** Manejadores de todas las acciones del detalle, agrupados por dominio en sus hooks. */
export type CalibrationServiceDetailActions = ReturnType<
  typeof useCalibrationServiceWorkflowActions
> &
  ReturnType<typeof useCalibrationServiceLogisticsActions> &
  ReturnType<typeof useCalibrationServiceCutActions> &
  ReturnType<typeof useCalibrationServiceAdjustmentActions> &
  ReturnType<typeof useCalibrationServiceDocumentActions> &
  ReturnType<typeof useCalibrationServiceDocumentViewer>

/** Indicadores de carga que bloquean botones mientras corre una mutación. */
export interface CalibrationServiceDetailBusy {
  isDecisionLoading: boolean
  isOdsLoading: boolean
  isOperationalBusy: boolean
  isDocumentBusy: boolean
  isSendingCertificate: boolean
  isUpdatingExecutionCustomer: boolean
  isSavingSequenceConfig: boolean
  isUpdatingDeliverySignature: boolean
  isUpdatingCustomerSignature: boolean
}
