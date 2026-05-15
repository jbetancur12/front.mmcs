import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'
import {
  CALIBRATION_SERVICE_ALLOWED_ROLES,
  CALIBRATION_SERVICE_ANALYTICS_ROLES,
  CALIBRATION_SERVICE_EDIT_ROLES
} from '../constants/calibrationServices'

const CalibrationServicesPage = lazy(
  () => import('../pages/calibration-services/CalibrationServicesPage')
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

const CalibrationServiceRoutes = (role: string[]) => {
  return (
    <>
      <Route
        element={
          <ProtectedRoute
            isAuthenticated={localStorage.getItem('accessToken') !== null}
            userRole={role}
            roles={[...CALIBRATION_SERVICE_ALLOWED_ROLES]}
          />
        }
      >
        <Route
          path='calibration-services'
          element={<CalibrationServicesPage />}
        />
        <Route
          path='calibration-services/analytics'
          element={
            <ProtectedRoute
              isAuthenticated={localStorage.getItem('accessToken') !== null}
              userRole={role}
              roles={[...CALIBRATION_SERVICE_ANALYTICS_ROLES]}
            />
          }
        >
          <Route index element={<CalibrationServiceAnalyticsPage />} />
        </Route>
        <Route
          path='calibration-services/:serviceId'
          element={<CalibrationServiceDetailsPage />}
        />
        <Route
          path='calibration-services/customers'
          element={<CalibrationServiceCustomersPage />}
        />
      </Route>

      <Route
        element={
          <ProtectedRoute
            isAuthenticated={localStorage.getItem('accessToken') !== null}
            userRole={role}
            roles={[...CALIBRATION_SERVICE_EDIT_ROLES]}
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
