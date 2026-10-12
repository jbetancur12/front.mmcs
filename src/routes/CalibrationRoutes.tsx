import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'
import { PERMISSIONS, PermissionKey } from 'src/constants/permissions'

const Templates = lazy(() => import('../pages/Templates'))
const Equipos = lazy(() => import('../pages/Equipos'))
const TiposDeCertificados = lazy(() => import('../pages/TiposdeCertificado'))
const Zip = lazy(() => import('../pages/Zip'))
const Files = lazy(() => import('../pages/Files'))
const Certificates = lazy(() => import('../pages/Certificates'))
const Traceability = lazy(() => import('../pages/Traceability'))

const CalibrationRoutes = (role: string[]) => {
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
      <Route element={guard(PERMISSIONS.CALIBRATION_TEMPLATE_VIEW)}>
        <Route path='calibraciones/templates' element={<Templates />} />
      </Route>
      <Route element={guard(PERMISSIONS.CALIBRATION_DEVICE_VIEW)}>
        <Route path='calibraciones/equipos' element={<Equipos />} />
      </Route>
      <Route element={guard(PERMISSIONS.CALIBRATION_CERTIFICATE_TYPE_MANAGE)}>
        <Route
          path='calibraciones/tipos-de-certificado'
          element={<TiposDeCertificados />}
        />
      </Route>
      {/* Sube el Excel con POST /files/raw */}
      <Route element={guard(PERMISSIONS.CALIBRATION_FILE_CREATE)}>
        <Route path='calibraciones/subir-excel' element={<Zip />} />
      </Route>
      <Route
        element={
          <ProtectedRoute
            isAuthenticated={isAuthenticated}
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
