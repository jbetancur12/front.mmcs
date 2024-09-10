import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'

const Profiles = lazy(() => import('../pages/Profiles'))
const Profile = lazy(() => import('../pages/Profile'))

const ProfileRoutes = (role: string) => {
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
        <Route path='profiles'>
          <Route index element={<Profiles />} />
          <Route path=':id' element={<Profile />} />
        </Route>
      </Route>
    </>
  )
}

export default ProfileRoutes
