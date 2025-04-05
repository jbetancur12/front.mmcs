import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'

const Iot = lazy(() => import('../pages/Iot/Iot'))
const DeviceList = lazy(() => import('../pages/Iot/DeviceList'))
const EmailSettingsPage = lazy(() => import('../pages/Iot/EmailSettingsPage'))

const IotRoutes = (role: string[]) => {
  return (
    <>
      <Route
        element={
          <ProtectedRoute
            isAuthenticated={localStorage.getItem('accessToken') !== null}
            userRole={role}
            roles={['admin', 'user']}
          />
        }
      >
        <Route path='iot'>
          <Route index element={<DeviceList />} />
          <Route path='map' element={<Iot />} />
          <Route path='email-settings' element={<EmailSettingsPage />} />
        </Route>
      </Route>
    </>
  )
}

export default IotRoutes
