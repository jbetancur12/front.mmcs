import { useStore } from '@nanostores/react'
import { userStore } from 'src/store/userStore'
import { hasPermission, PERMISSIONS } from 'src/constants/permissions'

/**
 * Qué puede hacer el usuario en Gestión tecnológica. Mismo criterio del backend: el personal de Metromedics (gestiona
 * empresas) ve cualquier empresa pero no escribe en tecnovigilancia; el usuario de la IPS solo ve y escribe en la suya.
 */
export const useTechAccess = (customerId?: number | string) => {
  const $userStore = useStore(userStore)
  const permissions = $userStore.permissions
  const ownCustomerId = $userStore.customer?.id || null
  const isStaff = hasPermission(permissions, PERMISSIONS.CUSTOMERS_CUSTOMER_MANAGE)
  const ownsCustomer = !!ownCustomerId && String(ownCustomerId) === String(customerId)

  return {
    isStaff,
    ownCustomerId,
    canManageInventory: hasPermission(permissions, PERMISSIONS.TECH_INVENTORY_MANAGE),
    canViewSurveillance: hasPermission(permissions, PERMISSIONS.TECH_SURVEILLANCE_VIEW),
    canWriteSurveillance:
      !isStaff && ownsCustomer && hasPermission(permissions, PERMISSIONS.TECH_SURVEILLANCE_MANAGE),
    canManageAlerts: hasPermission(permissions, PERMISSIONS.TECH_ALERT_MANAGE)
  }
}
