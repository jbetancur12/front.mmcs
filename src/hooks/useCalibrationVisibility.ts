import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'

/**
 * Qué parte de los servicios de calibración ve el usuario, según sus capacidades de visibilidad (las mismas que
 * aplica el API en api.mmcs/services/calibrationServiceVisibility.service.js). Quien no tiene una capacidad queda
 * restringido; los roles se suman, así que un metrólogo que además es coordinador ve todo sin una regla aparte.
 *
 *  - view_unassigned    sin ella: solo los servicios asignados a la persona
 *  - view_pre_ods       sin ella: solo desde que se emite la ODS
 *  - view_pre_approval  sin ella: solo con la cotización aprobada por el cliente
 *  - view_commercial    sin ella: solo lo técnico (sin datos de cotización, documentos comerciales ni precios)
 *  - view_prices        sin ella: sin precios, descuentos, totales ni PDF de cotización
 */
const useCalibrationVisibility = () => {
  const canViewUnassigned = useCan(
    PERMISSIONS.CALIBRATION_SERVICE_VIEW_UNASSIGNED
  )
  const canViewPreOds = useCan(PERMISSIONS.CALIBRATION_SERVICE_VIEW_PRE_ODS)
  const canViewPreApproval = useCan(
    PERMISSIONS.CALIBRATION_SERVICE_VIEW_PRE_APPROVAL
  )
  const canViewCommercial = useCan(
    PERMISSIONS.CALIBRATION_SERVICE_VIEW_COMMERCIAL
  )
  const canViewPrices = useCan(PERMISSIONS.CALIBRATION_SERVICE_VIEW_PRICES)

  return {
    canViewUnassigned,
    canViewPreOds,
    canViewPreApproval,
    canViewCommercial,
    canViewPrices,
    /** Vista técnica: sin lo comercial (lo que antes era "solo metrólogo"). */
    isTechnicalOnlyView: !canViewCommercial,
    /** Vista con lo comercial pero sin precios (lo que antes era "solo analista"). */
    isAnalystOnlyView: canViewCommercial && !canViewPrices,
    /** Ocultar precios, descuentos y totales: sin precios, o sin lo comercial (que ya los incluye). */
    hideFinancialInfo: !canViewCommercial || !canViewPrices
  }
}

export default useCalibrationVisibility
