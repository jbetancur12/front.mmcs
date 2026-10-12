import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'
import { PERMISSIONS, PermissionKey } from 'src/constants/permissions'

const Fleet = lazy(() => import('../pages/Fleet'))
const Documents = lazy(() => import('../Components/Fleet/Documents'))
const TripsTable = lazy(() => import('../Components/Fleet/Trips'))
const DocumentViewPDF = lazy(
  () => import('../Components/Fleet/DocumentViewPDF')
)
const NewTrip = lazy(() => import('../Components/Fleet/NewTrip'))
const InspectionsTable = lazy(
  () => import('../Components/Fleet/InspectionTable')
)
const MaintenanceRecords = lazy(
  () => import('../Components/Fleet/MaintenanceRecords')
)
const InterventionTypes = lazy(
  () => import('../Components/Fleet/InterventionTypes')
)
const VehicleDataSheetPDF = lazy(
  () => import('../Components/Fleet/VehicleDataSheetPDF')
)

const FleetRoutes = (role: string[]) => {
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
      <Route element={guard(PERMISSIONS.FLEET_VEHICLE_VIEW)}>
        <Route path='fleet' element={<Fleet />} />
        <Route path='fleet/:id/documents' element={<Documents />} />
        <Route path='fleet/:id/documents/:docId' element={<DocumentViewPDF />} />
        <Route path='fleet/:id/data-sheet' element={<VehicleDataSheetPDF />} />
        <Route path='fleet/:id/inspections' element={<InspectionsTable />} />
      </Route>
      <Route element={guard(PERMISSIONS.FLEET_INTERVENTION_TYPE_VIEW)}>
        <Route path='fleet/interventions' element={<InterventionTypes />} />
      </Route>
      <Route element={guard(PERMISSIONS.FLEET_TRIP_VIEW)}>
        <Route path='fleet/:id/trip' element={<TripsTable />} />
      </Route>
      <Route element={guard(PERMISSIONS.FLEET_TRIP_MANAGE)}>
        <Route path='fleet/:id/trip/new' element={<NewTrip />} />
      </Route>
      <Route element={guard(PERMISSIONS.FLEET_MAINTENANCE_VIEW)}>
        <Route path='fleet/:id/interventions' element={<MaintenanceRecords />} />
      </Route>
    </>
  )
}

export default FleetRoutes
