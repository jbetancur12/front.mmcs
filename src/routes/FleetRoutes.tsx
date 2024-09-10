import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'

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

const FleetRoutes = (role: string) => {
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
        <Route path='fleet'>
          <Route index element={<Fleet />} />
          <Route path='interventions' element={<InterventionTypes />} />
          <Route path=':id/documents' element={<Documents />} />
          <Route path=':id/documents/:docId' element={<DocumentViewPDF />} />
          <Route path=':id/data-sheet' element={<VehicleDataSheetPDF />} />
          <Route path=':id/inspections' element={<InspectionsTable />} />
          <Route path=':id/trip' element={<TripsTable />} />
          <Route path=':id/trip/new' element={<NewTrip />} />
          <Route path=':id/interventions' element={<MaintenanceRecords />} />
        </Route>
      </Route>
    </>
  )
}

export default FleetRoutes
