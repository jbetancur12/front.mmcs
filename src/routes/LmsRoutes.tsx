import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'
import { LMS_ADMIN_ROUTE_ROLES } from 'src/utils/lmsIdentity'

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
const LmsReporting = lazy(() => import('../pages/lms/admin/LmsReporting'))
const LmsCourseAssignments = lazy(() => import('../pages/lms/admin/LmsCourseAssignments'))
const LmsQuizManagement = lazy(() => import('../pages/lms/admin/LmsQuizManagement'))
const LmsQuestionBank = lazy(() => import('../pages/lms/admin/LmsQuestionBank'))
const LmsQuizAnalytics = lazy(() => import('../pages/lms/admin/LmsQuizAnalytics'))
const LmsQuizValidator = lazy(() => import('../pages/lms/admin/LmsQuizValidator'))
const LmsCourseAssignmentInterface = lazy(() => import('../pages/lms/admin/LmsCourseAssignmentInterface'))
const LmsComplianceTracker = lazy(() => import('../pages/lms/admin/LmsComplianceTracker'))
const LmsCertificateTemplates = lazy(() => import('../pages/lms/admin/LmsCertificateTemplates'))
const LmsCertificateView = lazy(() => import('../pages/lms/course/LmsCertificateView'))
const LmsJobManagement = lazy(() => import('../pages/lms/admin/LmsJobManagement'))

const LmsRoutes = (role: string[]) => {
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
        <Route path='lms' element={<LmsDashboard />} />
        <Route path='lms/employee' element={<LmsEmployee />} />
        <Route path='lms/client' element={<LmsClient />} />
        <Route path='lms/course/:courseId' element={<LmsCourseView />} />
        <Route
          path='lms/course/:courseId/preview'
          element={<LmsCoursePreview />}
        />
        <Route path='lms/certificate/:certificateId' element={<LmsCertificateView />} />
        <Route path='lms/certificates' element={<LmsCertificateView />} />
      </Route>

      <Route
        element={
          <ProtectedRoute
            isAuthenticated={localStorage.getItem('accessToken') !== null}
            userRole={role}
            roles={[...LMS_ADMIN_ROUTE_ROLES]}
          />
        }
      >
        <Route path='lms/admin' element={<LmsAdmin />} />
        <Route path='lms/admin/courses' element={<LmsCourseManagement />} />
        <Route
          path='lms/admin/courses/:courseId/content'
          element={<LmsCourseContentEditor />}
        />
        <Route path='lms/admin/dashboard' element={<LmsCourseDashboard />} />
        <Route path='lms/admin/users' element={<LmsUserManagement />} />
        <Route path='lms/admin/analytics' element={<LmsAnalytics />} />
        <Route path='lms/admin/reporting' element={<LmsReporting />} />
        <Route path='lms/admin/reports' element={<LmsReporting />} />
        <Route path='lms/admin/courses/:courseId/assignments' element={<LmsCourseAssignments />} />
        <Route path='lms/admin/quiz-management' element={<LmsQuizManagement />} />
        <Route path='lms/admin/question-bank' element={<LmsQuestionBank />} />
        <Route path='lms/admin/quiz-analytics' element={<LmsQuizAnalytics />} />
        <Route path='lms/admin/quiz-validator' element={<LmsQuizValidator />} />
        <Route path='lms/admin/assignments' element={<LmsCourseAssignmentInterface />} />
        <Route path='lms/admin/compliance' element={<LmsComplianceTracker />} />
        <Route path='lms/admin/certificate-templates' element={<LmsCertificateTemplates />} />
        <Route path='lms/admin/jobs' element={<LmsJobManagement />} />
      </Route>
    </>
  )
}

export default LmsRoutes
