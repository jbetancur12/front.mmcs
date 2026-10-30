import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'
import { PERMISSIONS } from 'src/constants/permissions'

const CalibrationServicesPage = lazy(
  () => import('../pages/calibration-services/CalibrationServicesPage')
)
const CalibrationServiceMobilePage = lazy(
  () => import('../pages/calibration-services/CalibrationServiceMobilePage')
)
const CalibrationServiceMobileListPage = lazy(
  () => import('../pages/calibration-services/CalibrationServiceMobileListPage')
)
const CalibrationServiceDetailsPage = lazy(
  () => import('../pages/calibration-services/CalibrationServiceDetailsPage')
)
const CalibrationServiceWorkspacePage = lazy(
  () => import('../pages/calibration-services/CalibrationServiceWorkspacePage')
)
const CalibrationServiceCustomersPage = lazy(
  () => import('../pages/calibration-services/CalibrationServiceCustomersPage')
)
const CalibrationServiceAnalyticsPage = lazy(
  () => import('../pages/calibration-services/CalibrationServiceAnalyticsPage')
)
const CalibrationServiceSchedulePage = lazy(
  () => import('../pages/calibration-services/CalibrationServiceSchedulePage')
)
const CalibrationNotificationCenter = lazy(
  () => import('../pages/calibration-services/CalibrationNotificationCenter')
)
const CalibrationDeliveriesPage = lazy(
  () => import('../pages/calibration-services/CalibrationDeliveriesPage')
)
const CalibrationFlowGuidePage = lazy(
  () => import('../pages/calibration-services/guide/CalibrationFlowGuidePage')
)
const ProductosServicios = lazy(() => import('../pages/ProductosServicios'))

const CalibrationServiceRoutes = (role: string[]) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  return (
    <>
      <Route
        path='calibration-services/entregas'
        element={
          <ProtectedRoute
            isAuthenticated={localStorage.getItem('accessToken') !== null}
            userRole={role}
            permission={PERMISSIONS.CALIBRATION_SERVICE_DELIVER}
          />
        }
      >
        <Route index element={<CalibrationDeliveriesPage />} />
      </Route>
      <Route
        element={
          <ProtectedRoute
            isAuthenticated={localStorage.getItem('accessToken') !== null}
            userRole={role}
            permission={PERMISSIONS.CALIBRATION_SERVICE_VIEW}
          />
        }
      >
        <Route
          path='calibration-services'
          element={isMobile ? <CalibrationServiceMobileListPage /> : <CalibrationServicesPage />}
        />
        <Route
          path='calibration-services/analytics'
          element={
            <ProtectedRoute
              isAuthenticated={localStorage.getItem('accessToken') !== null}
              userRole={role}
              permission={PERMISSIONS.CALIBRATION_ANALYTICS_VIEW}
            />
          }
        >
          <Route index element={<CalibrationServiceAnalyticsPage />} />
        </Route>
        <Route
          path='calibration-services/schedule'
          element={<CalibrationServiceSchedulePage />}
        />
        <Route
          path='calibration-services/mobile/:serviceId'
          element={<CalibrationServiceMobilePage />}
        />
        <Route
          path='calibration-services/customers'
          element={<CalibrationServiceCustomersPage />}
        />
        <Route
          path='calibration-services/guia'
          element={<CalibrationFlowGuidePage />}
        />
        <Route
          path='calibration-services/notifications'
          element={<CalibrationNotificationCenter />}
        />
        <Route
          path='calibration-services/productos-y-servicios'
          element={<ProductosServicios />}
        />
        <Route
          path='calibration-services/:serviceId'
          element={isMobile ? <CalibrationServiceMobilePage /> : <CalibrationServiceDetailsPage />}
        />
      </Route>

      <Route
        element={
          <ProtectedRoute
            isAuthenticated={localStorage.getItem('accessToken') !== null}
            userRole={role}
            permission={PERMISSIONS.CALIBRATION_SERVICE_CREATE}
          />
        }
      >
        <Route
          path='calibration-services/new'
          element={<CalibrationServiceWorkspacePage />}
        />
        <Route
          path='calibration-services/:serviceId/edit'
          element={<CalibrationServiceWorkspacePage />}
        />
      </Route>
    </>
  )
}

export default CalibrationServiceRoutes
