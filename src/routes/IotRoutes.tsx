import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'

const Iot = lazy(() => import('../pages/Iot'))
const IotTable = lazy(() => import('../pages/IotTable'))

const IotRoutes = (role: string[]) => {
  return (
    <>
      <Route
        element={
          <ProtectedRoute
            isAuthenticated={localStorage.getItem('accessToken') !== null}
            userRole={role}
            roles={['*']}
          />
        }
      >
        <Route path='iot'>
          <Route index element={<IotTable />} />
          <Route path='map' element={<Iot />} />
        </Route>
      </Route>
    </>
  )
}

export default IotRoutes
