import { useHasRole } from '../../../utils/functions'
import { ROLE_GROUPS } from 'src/constants/roles'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'
import useCalibrationVisibility from '../../../hooks/useCalibrationVisibility'

/** Permisos y vistas (técnica, sin precios) de la bandeja de servicios de calibración. */
const useCalibrationServicesListPermissions = () => {
  const canCreateServices = useCan(PERMISSIONS.CALIBRATION_SERVICE_CREATE)
  const canTakeApprovalDecision = useCan(PERMISSIONS.CALIBRATION_SERVICE_DECIDE)
  const canIssueOds = useCan(PERMISSIONS.CALIBRATION_SERVICE_ODS)
  const canScheduleService = useCan(PERMISSIONS.CALIBRATION_SERVICE_SCHEDULE)
  const canRunExecution = useCan(PERMISSIONS.CALIBRATION_SERVICE_EXECUTE)
  const canViewModule = useCan(PERMISSIONS.CALIBRATION_SERVICE_VIEW)
  const canViewAnalytics = useCan(PERMISSIONS.CALIBRATION_ANALYTICS_VIEW)
  const isAdmin = useHasRole(ROLE_GROUPS.ADMINS)
  const canManageSequenceConfig = canCreateServices
  const canManageSlaConfig = useCan(PERMISSIONS.CALIBRATION_CONFIG_SLA_MANAGE)
  // Qué ve de los servicios: sale de capacidades de visibilidad, no del nombre del rol
  const { isTechnicalOnlyView, isAnalystOnlyView, canViewCommercial } =
    useCalibrationVisibility()

  return {
    canCreateServices,
    canTakeApprovalDecision,
    canIssueOds,
    canScheduleService,
    canRunExecution,
    canViewModule,
    canViewAnalytics,
    isAdmin,
    canManageSequenceConfig,
    canManageSlaConfig,
    hasCommercialVisibility: canViewCommercial,
    isTechnicalOnlyView,
    isAnalystOnlyView
  }
}

export type CalibrationServicesListPermissions = ReturnType<
  typeof useCalibrationServicesListPermissions
>

export default useCalibrationServicesListPermissions
