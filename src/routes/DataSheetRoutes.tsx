import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'
import { PERMISSIONS, PermissionKey } from 'src/constants/permissions'
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

const DataSheetRoutes = (role: string[]) => {
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
      <Route element={guard(PERMISSIONS.CALIBRATION_DATASHEET_VIEW)}>
        <Route path='datasheets' element={<DatasheetsList />} />
        <Route path='datasheets/alerts' element={<EquipmentAlertsPage />} />
      </Route>
      <Route element={guard(PERMISSIONS.CALIBRATION_DATASHEET_DETAIL)}>
        <Route path='datasheets/:id' element={<DataSheetDetail />} />
      </Route>
      <Route element={guard(PERMISSIONS.CALIBRATION_INSPECTION_MAINTENANCE_MANAGE)}>
        <Route
          path='datasheets/:id/new-maintenance'
          element={<InspectionMaintenanceForm />}
        />
        <Route
          path='datasheets/:id/edit-maintenance'
          element={<InspectionMaintenanceForm />}
        />
      </Route>
      <Route element={guard(PERMISSIONS.CALIBRATION_INSPECTION_MAINTENANCE_VIEW)}>
        <Route
          path='datasheets/:id/inspection-maintenance'
          element={<InspectionMaintenance />}
        />
      </Route>
      <Route element={guard(PERMISSIONS.CALIBRATION_RECORD_MANAGE)}>
        <Route
          path='datasheets/:id/new-calibration'
          element={<CalibrationForm />}
        />
        <Route
          path='datasheets/:id/edit-calibration'
          element={<CalibrationForm />}
        />
      </Route>
      <Route element={guard(PERMISSIONS.CALIBRATION_EQUIPMENT_INOUT_MANAGE)}>
        <Route path='datasheets/:id/in-out' element={<EquipmentInOut />} />
      </Route>
      <Route element={guard(PERMISSIONS.CALIBRATION_EQUIPMENT_INOUT_LIST)}>
        <Route
          path='datasheets/:id/in-out-table'
          element={<EquipmentInOutTable />}
        />
      </Route>
      {/* Informes en PDF y préstamos: GET /reports/* */}
      <Route element={guard(PERMISSIONS.CALIBRATION_REPORT_VIEW)}>
        <Route
          path='datasheets/inventory-leasing'
          element={<PDFViewer path='inventory-leasing' />}
        />
        <Route path='datasheets/devices-on-loan' element={<DevicesOnLoan />} />
        <Route
          path='datasheets/inventory/:id?'
          element={<PDFViewer path='inventory' />}
        />
        <Route
          path='datasheets/calibration-program/:id?'
          element={<PDFViewer path='calibration-program' />}
        />
        <Route
          path='datasheets/:id/in-out-report'
          element={<PDFViewer path='device-in-out' />}
        />
        <Route
          path='datasheets/maintenance-schedule/:id?'
          element={<PDFViewer path='maintenance-schedule' />}
        />
        <Route
          path='datasheets/:id/inspection-maintenance/:id'
          element={<PDFViewer path='inspection-maintenance' />}
        />
      </Route>
    </>
  )
}

export default DataSheetRoutes
