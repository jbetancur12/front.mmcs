import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'

const Templates = lazy(() => import('../pages/Templates'))
const Equipos = lazy(() => import('../pages/Equipos'))
const TiposDeCertificados = lazy(() => import('../pages/TiposdeCertificado'))
const Zip = lazy(() => import('../pages/Zip'))
const Files = lazy(() => import('../pages/Files'))
const Certificates = lazy(() => import('../pages/Certificates'))
const Traceability = lazy(() => import('../pages/Traceability'))

const CalibrationRoutes = (role: string) => {
  return (
    <>
      <Route
        element={
          <ProtectedRoute
            isAuthenticated={localStorage.getItem('accessToken') !== null}
            userRole={role}
            roles={['admin', 'metrologist']}
          />
        }
      >
        <Route path='calibraciones'>
          <Route path='templates' element={<Templates />} />
          <Route path='equipos' element={<Equipos />} />
          <Route
            path='tipos-de-certificado'
            element={<TiposDeCertificados />}
          />
          <Route path='subir-excel' element={<Zip />} />
        </Route>
      </Route>
      <Route
        element={
          <ProtectedRoute
            isAuthenticated={localStorage.getItem('accessToken') !== null}
            userRole={role}
            roles={['*']}
          />
        }
      >
        <Route path='trazabilidad' element={<Traceability />} />
        <Route path='calibraciones/certificados'>
          <Route index element={<Files />} />
          <Route path=':id' element={<Certificates />} />
        </Route>
      </Route>
    </>
  )
}

export default CalibrationRoutes
