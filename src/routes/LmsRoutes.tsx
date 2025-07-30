import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'

const LmsDashboard = lazy(() => import('../pages/lms/LmsDashboard'))
const LmsAdmin = lazy(() => import('../pages/lms/admin/LmsAdmin'))
const LmsEmployee = lazy(() => import('../pages/lms/employee/LmsEmployee'))
const LmsClient = lazy(() => import('../pages/lms/client/LmsClient'))
const LmsCourseManagement = lazy(
  () => import('../pages/lms/admin/LmsCourseManagement')
)
const LmsCourseContentEditor = lazy(
  () => import('../pages/lms/admin/LmsCourseContentEditor')
)
const LmsCourseDashboard = lazy(
  () => import('../pages/lms/admin/LmsCourseDashboard')
)
const LmsCourseView = lazy(() => import('../pages/lms/course/LmsCourseView'))
const LmsCoursePreview = lazy(
  () => import('../pages/lms/course/LmsCoursePreview')
)
const LmsUserManagement = lazy(
  () => import('../pages/lms/admin/LmsUserManagement')
)
const LmsAnalytics = lazy(() => import('../pages/lms/admin/LmsAnalytics'))

const LmsRoutes = (role: string[]) => {
  return (
    <>
      <Route
        element={
          <ProtectedRoute
            isAuthenticated={localStorage.getItem('accessToken') !== null}
            userRole={role}
            roles={['admin', 'employee', 'client']}
          />
        }
      >
        <Route path='lms' element={<LmsDashboard />} />
        <Route path='lms/admin' element={<LmsAdmin />} />
        <Route path='lms/employee' element={<LmsEmployee />} />
        <Route path='lms/client' element={<LmsClient />} />
        <Route path='lms/admin/courses' element={<LmsCourseManagement />} />
        <Route
          path='lms/admin/courses/:courseId/content'
          element={<LmsCourseContentEditor />}
        />
        <Route path='lms/admin/dashboard' element={<LmsCourseDashboard />} />
        <Route path='lms/course/:courseId' element={<LmsCourseView />} />
        <Route
          path='lms/course/:courseId/preview'
          element={<LmsCoursePreview />}
        />
        <Route path='lms/admin/users' element={<LmsUserManagement />} />
        <Route path='lms/admin/analytics' element={<LmsAnalytics />} />
      </Route>
    </>
  )
}

export default LmsRoutes
