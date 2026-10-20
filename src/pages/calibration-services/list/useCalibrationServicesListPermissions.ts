import {
  CALIBRATION_SERVICE_ANALYST_ROLES,
  CALIBRATION_SERVICE_COMMERCIAL_VISIBILITY_ROLES,
  CALIBRATION_SERVICE_TECHNICAL_ROLES
} from '../../../constants/calibrationServices'
import { useHasRole } from '../../../utils/functions'
import { ROLE_GROUPS } from 'src/constants/roles'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'

/** Permisos y vistas (técnica, analista) de la bandeja de servicios de calibración. */
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
  const hasTechnicalRole = useHasRole([...CALIBRATION_SERVICE_TECHNICAL_ROLES])
  const hasCommercialVisibility = useHasRole([
    ...CALIBRATION_SERVICE_COMMERCIAL_VISIBILITY_ROLES
  ])
  const isTechnicalOnlyView = hasTechnicalRole && !hasCommercialVisibility
  const hasAnalystRole = useHasRole([...CALIBRATION_SERVICE_ANALYST_ROLES])
  const isAnalystOnlyView = hasAnalystRole && !hasCommercialVisibility

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
    hasTechnicalRole,
    hasCommercialVisibility,
    isTechnicalOnlyView,
    hasAnalystRole,
    isAnalystOnlyView
  }
}

export type CalibrationServicesListPermissions = ReturnType<
  typeof useCalibrationServicesListPermissions
>

export default useCalibrationServicesListPermissions
