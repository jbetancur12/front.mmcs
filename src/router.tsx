// import { LocalizationProvider } from '@mui/x-date-pickers'
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
// import { Route, Routes } from 'react-router-dom'
// import RequireAuth from './Components/Authentication/RequireAuth'
// import Layout from './Components/Layout'
// import NewPassword from './Components/NewPassword'
// import Clientes from './pages/Clientes'
// import Customer from './pages/Customer'
// import Customers from './pages/Customers'
// import Equipos from './pages/Equipos'
// import Files from './pages/Files'
// import Login from './pages/Login'
// import TiposDeCertificados from './pages/TiposdeCertificado'
// import Dashboard from './pages/Dashboard'
// import PasswordRecovery from './pages/PasswordRecovery'
// import Certificates from './pages/Certificates'
// import { Cotizaciones } from './pages/Cotizaciones'
// import { ProductosServicios } from './pages/ProductosServicios'
// import NewQuote from './pages/NewQuote'
// import Quote from './pages/Quote'
// import { Settings } from './pages/Settings'
// import Profiles from './pages/Profiles'

// import Profile from './pages/Profile'
// import Traceability from './pages/Traceability'

// import ExcelManipulation from './Components/ExcelManipulation/ExcelManipulation'
// import Repository from './pages/Repository'
// import ScriptGenerator from './Components/ScriptGenerator'
// import Gotemberg from './Components/Gotemberg'
// import Zip from './pages/Zip'
// import Templates from './pages/Templates'
// import NotFound from './pages/NotFound'

// import DatasheetsList from './Components/DataSheet/ListDataSheet'
// import DataSheetDetail from './Components/DataSheet/DataSheetDetails'
// import InspectionMaintenance from './Components/DataSheet/InspectionMaintenance'
// import InspectionMaintenanceForm from './Components/DataSheet/InspectionMaintenanceForm'
// import InspectionPDF from './Components/DataSheet/InspectionPDFBridge'
// import CalibrationForm from './Components/DataSheet/CalibrationForm'
// import CalibrationProgramPDF from './Components/DataSheet/CalibrationProgramPDF'
// import CalibrationSchedulePDF from './Components/DataSheet/MaintenanceSchedulePDF'
// import InventoryPDF from './Components/DataSheet/InventoryPDF'
// import EquipmentInOut from './Components/DataSheet/EquipmentInOutForm'
// import EquipmentInOutPDF from './Components/DataSheet/EquipmentInOutPDF'
// import EquipmentInOutTable from './Components/DataSheet/EquipmentInOutTable'
// import Fleet from './pages/Fleet'
// import Documents from './Components/Fleet/Documents'

// import TripsTable from './Components/Fleet/Trips'

// function Router() {
//   const protectedLayout = (
//     <RequireAuth>
//       <Layout />
//     </RequireAuth>
//   )

//   return (
//     <LocalizationProvider dateAdapter={AdapterDateFns}>
//       <Routes>
//         {/* <Route path='/' element={<Outlet />}>
//           <Route index element={<Navigate to='/dashboard' />} />
//         </Route> */}
//         <Route path='/' element={protectedLayout}>
//           <Route index element={<Dashboard />} />
//           <Route path='fleet'>
//             <Route index element={<Fleet />} />
//             <Route path=':id/documents' element={<Documents />} />
//             <Route path=':id/trip' element={<TripsTable />} />
//           </Route>
//           <Route path='datasheets'>
//             <Route index element={<DatasheetsList />} />
//             <Route
//               path=':id/new-maintenance'
//               element={<InspectionMaintenanceForm />}
//             />
//             <Route path='inventory' element={<InventoryPDF />} />
//             <Route
//               path='calibration-program'
//               element={<CalibrationProgramPDF />}
//             />
//             <Route path=':id/in-out-report' element={<EquipmentInOutPDF />} />
//             <Route path=':id/in-out-table' element={<EquipmentInOutTable />} />
//             <Route
//               path='calibration-schedule'
//               element={<CalibrationSchedulePDF />}
//             />
//             <Route path=':id/new-calibration' element={<CalibrationForm />} />
//             <Route path=':id' element={<DataSheetDetail />} />
//             <Route path=':id/in-out' element={<EquipmentInOut />} />
//             <Route
//               path=':id/inspection-maintenance'
//               element={<InspectionMaintenance />}
//             />
//             <Route
//               path=':id/inspection-maintenance/:id'
//               element={<InspectionPDF />}
//             />
//           </Route>
//           <Route path='users' element={<Clientes />} />
//           <Route path='customers'>
//             <Route index element={<Customers />} />
//             <Route path=':id' element={<Customer />} />
//           </Route>
//           <Route path='calibraciones'>
//             <Route path='templates' element={<Templates />} />
//             <Route path='equipos' element={<Equipos />} />
//             <Route
//               path='tipos-de-certificado'
//               element={<TiposDeCertificados />}
//             />
//             <Route path='subir-excel' element={<Zip />}></Route>
//             <Route path='certificados'>
//               <Route index element={<Files />} />
//               <Route path=':id' element={<Certificates />} />
//             </Route>
//           </Route>
//           {/* <Route path="analisis-excel" element={<AnalyzeExcelComponent />} /> */}
//           <Route path='zip' element={<Zip />} />
//           <Route path='report' element={<ExcelManipulation />} />
//           <Route path='repositorio' element={<Repository />} />
//           <Route path='script' element={<ScriptGenerator />} />
//           <Route path='pdf' element={<Gotemberg />} />

//           <Route path='cotizaciones'>
//             <Route index element={<Cotizaciones />} />
//             <Route path='new-quote' element={<NewQuote />} />
//             <Route path='edit-quote/:id' element={<NewQuote />} />
//             <Route path=':id' element={<Quote />} />
//           </Route>
//           <Route path='profiles'>
//             <Route index element={<Profiles />} />
//             <Route path=':id' element={<Profile />} />
//           </Route>
//           <Route path='settings' element={<Settings />} />
//           <Route path='trazabilidad' element={<Traceability />} />
//           <Route
//             path='productos-y-servicios'
//             element={<ProductosServicios />}
//           />
//         </Route>
//         <Route path='/login' element={<Login />} />
//         <Route path='/new-password' element={<NewPassword />} />
//         <Route path='password-recovery' element={<PasswordRecovery />} />
//         <Route path='*' element={<NotFound />} />
//       </Routes>
//     </LocalizationProvider>
//   )
// }

// export default Router

import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { Route, Routes } from 'react-router-dom'
import RequireAuth from './Components/Authentication/RequireAuth'
import Layout from './Components/Layout'

// Páginas principales
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import NewPassword from './Components/NewPassword'
import PasswordRecovery from './pages/PasswordRecovery'
import NotFound from './pages/NotFound'

// Clientes y usuarios
import Clientes from './pages/Clientes'
import Customers from './pages/Customers'
import Customer from './pages/Customer'

// Gestión de equipos
import Equipos from './pages/Equipos'
import Files from './pages/Files'
import TiposDeCertificados from './pages/TiposdeCertificado'
import Certificates from './pages/Certificates'

// Cotizaciones y productos/servicios
//import Cotizaciones from './pages/Cotizaciones' // Página de cotizaciones
import { ProductosServicios } from './pages/ProductosServicios'
import NewQuote from './pages/NewQuote'
import Quote from './pages/Quote'

// Configuración y perfiles
import { Settings } from './pages/Settings'
import Profiles from './pages/Profiles'
import Profile from './pages/Profile'

// Trazabilidad y otros
import Traceability from './pages/Traceability'
import Zip from './pages/Zip'
import Repository from './pages/Repository'

// Componentes adicionales
import ExcelManipulation from './Components/ExcelManipulation/ExcelManipulation'
import ScriptGenerator from './Components/ScriptGenerator'
import Gotemberg from './Components/Gotemberg'

// Datos y mantenimiento
import DatasheetsList from './Components/DataSheet/ListDataSheet'
import DataSheetDetail from './Components/DataSheet/DataSheetDetails'
import InspectionMaintenance from './Components/DataSheet/InspectionMaintenance'
import InspectionMaintenanceForm from './Components/DataSheet/InspectionMaintenanceForm'
import InspectionPDF from './Components/DataSheet/InspectionPDFBridge'
import CalibrationForm from './Components/DataSheet/CalibrationForm'
import CalibrationProgramPDF from './Components/DataSheet/CalibrationProgramPDF'
import CalibrationSchedulePDF from './Components/DataSheet/MaintenanceSchedulePDF'
import InventoryPDF from './Components/DataSheet/InventoryPDF'
import EquipmentInOut from './Components/DataSheet/EquipmentInOutForm'
import EquipmentInOutPDF from './Components/DataSheet/EquipmentInOutPDF'
import EquipmentInOutTable from './Components/DataSheet/EquipmentInOutTable'

// Gestión de flota
import Fleet from './pages/Fleet'
import Documents from './Components/Fleet/Documents'
import TripsTable from './Components/Fleet/Trips'
import Templates from './pages/Templates'
import { Cotizaciones } from './pages/Cotizaciones'
import NewTrip from './Components/Fleet/NewTrip'
import InspectionsTable from './Components/Fleet/InspectionTable'

import MaintenanceRecords from './Components/Fleet/MaintenanceRecords'
import InterventionTypes from './Components/Fleet/InterventionTypes'
import VehicleDataSheetPDF from './Components/Fleet/VehicleDataSheetPDF'
import CalibrationTimeline from './Components/CalibrationTimeline'

function Router() {
  const protectedLayout = (
    <RequireAuth>
      <Layout />
    </RequireAuth>
  )

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Routes>
        {/* Rutas protegidas */}
        <Route path='/' element={protectedLayout}>
          <Route index element={<Dashboard />} />

          {/*//! Gestión de flota */}
          <Route path='fleet'>
            <Route index element={<Fleet />} />
            <Route path='interventions' element={<InterventionTypes />} />
            <Route path=':id/documents' element={<Documents />} />
            <Route path=':id/data-sheet' element={<VehicleDataSheetPDF />} />
            <Route path=':id/inspections'>
              <Route index element={<InspectionsTable />} />
            </Route>
            <Route path=':id/trip' element={<TripsTable />} />
            <Route path=':id/trip/new' element={<NewTrip />} />
            <Route path=':id/interventions' element={<MaintenanceRecords />} />
          </Route>

          {/* Hojas de datos */}
          <Route path='datasheets'>
            <Route index element={<DatasheetsList />} />
            <Route
              path=':id/new-maintenance'
              element={<InspectionMaintenanceForm />}
            />
            <Route path='inventory' element={<InventoryPDF />} />
            <Route
              path='calibration-program'
              element={<CalibrationProgramPDF />}
            />
            <Route path=':id/in-out-report' element={<EquipmentInOutPDF />} />
            <Route path=':id/in-out-table' element={<EquipmentInOutTable />} />
            <Route
              path='calibration-schedule'
              element={<CalibrationSchedulePDF />}
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
              element={<InspectionPDF />}
            />
          </Route>

          {/* Clientes y usuarios */}
          <Route path='users' element={<Clientes />} />
          <Route path='customers'>
            <Route index element={<Customers />} />
            <Route path=':id' element={<Customer />} />
            <Route path=':id/schedule' element={<CalibrationTimeline />} />
          </Route>

          {/* Calibraciones */}
          <Route path='calibraciones'>
            <Route path='templates' element={<Templates />} />
            <Route path='equipos' element={<Equipos />} />
            <Route
              path='tipos-de-certificado'
              element={<TiposDeCertificados />}
            />
            <Route path='subir-excel' element={<Zip />} />
            <Route path='certificados'>
              <Route index element={<Files />} />
              <Route path=':id' element={<Certificates />} />
            </Route>
          </Route>

          {/* Cotizaciones y productos/servicios */}
          <Route path='cotizaciones'>
            <Route index element={<Cotizaciones />} />
            <Route path='new-quote' element={<NewQuote />} />
            <Route path='edit-quote/:id' element={<NewQuote />} />
            <Route path=':id' element={<Quote />} />
          </Route>
          <Route
            path='productos-y-servicios'
            element={<ProductosServicios />}
          />

          {/* Configuración y perfiles */}
          <Route path='profiles'>
            <Route index element={<Profiles />} />
            <Route path=':id' element={<Profile />} />
          </Route>
          <Route path='settings' element={<Settings />} />

          {/* Trazabilidad */}
          <Route path='trazabilidad' element={<Traceability />} />
        </Route>

        {/* Rutas públicas */}
        <Route path='/login' element={<Login />} />
        <Route path='/new-password' element={<NewPassword />} />
        <Route path='password-recovery' element={<PasswordRecovery />} />

        {/* Rutas adicionales */}
        <Route path='zip' element={<Zip />} />
        <Route path='report' element={<ExcelManipulation />} />
        <Route path='repositorio' element={<Repository />} />
        <Route path='script' element={<ScriptGenerator />} />
        <Route path='pdf' element={<Gotemberg />} />

        {/* Ruta no encontrada */}
        <Route path='*' element={<NotFound />} />
      </Routes>
    </LocalizationProvider>
  )
}

export default Router
