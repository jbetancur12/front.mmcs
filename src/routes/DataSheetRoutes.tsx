import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'
import DevicesOnLoan from 'src/Components/DataSheet/DevicesOnLoan'
const DatasheetsList = lazy(
  () => import('../Components/DataSheet/ListDataSheet')
)
const DataSheetDetail = lazy(
  () => import('../Components/DataSheet/DataSheetDetails')
)
const InspectionMaintenance = lazy(
  () => import('../Components/DataSheet/InspectionMaintenance')
)
const InspectionMaintenanceForm = lazy(
  () => import('../Components/DataSheet/InspectionMaintenanceForm')
)
const CalibrationForm = lazy(
  () => import('../Components/DataSheet/CalibrationForm')
)
const EquipmentInOut = lazy(
  () => import('../Components/DataSheet/EquipmentInOutForm')
)
const EquipmentInOutTable = lazy(
  () => import('../Components/DataSheet/EquipmentInOutTable')
)
const EquipmentAlertsPage = lazy(
  () => import('../Components/DataSheet/EquipmentAlertPage')
)
const PDFViewer = lazy(() => import('../Components/DataSheet/PDFViewer'))

const DataSheetRoutes = (role: string) => {
  return (
    <>
      <Route
        element={
          <ProtectedRoute
            isAuthenticated={localStorage.getItem('accessToken') !== null}
            userRole={role}
            roles={['admin']}
          />
        }
      >
        <Route path='datasheets'>
          <Route index element={<DatasheetsList />} />
          <Route
            path=':id/new-maintenance'
            element={<InspectionMaintenanceForm />}
          />
          <Route path='alerts' element={<EquipmentAlertsPage />} />
          <Route
            path='inventory-leasing'
            element={<PDFViewer path='inventory-leasing' />}
          />
          <Route path='devices-on-loan' element={<DevicesOnLoan />} />
          <Route path='inventory' element={<PDFViewer path='inventory' />} />
          <Route
            path='calibration-program'
            element={<PDFViewer path='calibration-program' />}
          />
          <Route
            path=':id/in-out-report'
            element={<PDFViewer path='device-in-out' />}
          />
          <Route path=':id/in-out-table' element={<EquipmentInOutTable />} />
          <Route
            path='maintenance-schedule'
            element={<PDFViewer path='maintenance-schedule' />}
          />
          <Route path=':id/new-calibration' element={<CalibrationForm />} />
          <Route path=':id' element={<DataSheetDetail />} />
          <Route path=':id/in-out' element={<EquipmentInOut />} />
          <Route
            path=':id/inspection-maintenance'
            element={<InspectionMaintenance />}
          />
          <Route
            path=':id/inspection-maintenance/:id'
            element={<PDFViewer path='inspection-maintenance' />}
          />
        </Route>
      </Route>
    </>
  )
}

export default DataSheetRoutes
