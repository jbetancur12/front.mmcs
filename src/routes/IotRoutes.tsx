import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'
import { PERMISSIONS, PermissionKey } from 'src/constants/permissions'

const Iot = lazy(() => import('../pages/Iot/Iot'))
const DeviceList = lazy(() => import('../pages/Iot/DeviceList'))
const EmailSettingsPage = lazy(() => import('../pages/Iot/EmailSettingsPage'))
const CustomersManagement = lazy(
  () => import('../pages/Iot/CustomersManagement')
)

const IotRoutes = (role: string[]) => {
  const isAuthenticated = localStorage.getItem('accessToken') !== null

  // Cada página exige la capacidad que el backend le pide a sus endpoints
  const guard = (permission: PermissionKey | readonly PermissionKey[]) => (
    <ProtectedRoute
      isAuthenticated={isAuthenticated}
      userRole={role}
      permission={permission}
    />
  )

  return (
    <>
      <Route element={guard(PERMISSIONS.IOT_DEVICE_LIST)}>
        <Route path='iot'>
          <Route index element={<DeviceList />} />
          <Route path='map' element={<Iot />} />
        </Route>
      </Route>
      <Route element={guard(PERMISSIONS.IOT_DEVICE_VIEW)}>
        <Route path='iot/email-settings' element={<EmailSettingsPage />} />
      </Route>
      {/* Usa las empresas con módulo IoT (GET /customers/available-modules) */}
      <Route element={guard(PERMISSIONS.CUSTOMERS_CUSTOMER_MANAGE)}>
        <Route
          path='iot/customers-management'
          element={<CustomersManagement />}
        />
      </Route>
    </>
  )
}

export default IotRoutes
