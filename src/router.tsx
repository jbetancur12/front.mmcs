import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { Route, Routes } from 'react-router-dom'

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

import CalibrationForm from './Components/DataSheet/CalibrationForm'
import EquipmentInOut from './Components/DataSheet/EquipmentInOutForm'
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
import { DocumentViewPDF } from './Components/Fleet/DocumentViewPDF'

import PDFViewer from './Components/DataSheet/PDFViewer'
import useSessionTimeoutWarning from '@utils/use-expiry-time'
import RequireAuth from './Components/Authentication/RequireAuth'

function Router() {
  useSessionTimeoutWarning({ expirationTimeInMinutes: 1 })
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Routes>
        {/* Rutas públicas */}

        {/* Rutas protegidas */}
        <Route
          path='/'
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />

          <Route path='profiles'>
            <Route index element={<Profiles />} />
            <Route path=':id' element={<Profile />} />
          </Route>

          {/*//! Gestión de flota */}
          <Route path='fleet'>
            <Route index element={<Fleet />} />
            <Route path='interventions' element={<InterventionTypes />} />
            <Route path=':id/documents' element={<Documents />} />
            <Route path=':id/documents/:id' element={<DocumentViewPDF />} />
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

          {/* Clientes y usuarios */}
          <Route path='users' element={<Clientes />} />
          <Route path='customers'>
            <Route index element={<Customers />} />
            <Route path=':id' element={<Customer />} />
            <Route path=':id/schedule' element={<CalibrationTimeline />} />
            <Route
              path=':id/schedule/pdf'
              element={<PDFViewer path='calibration-schedule' />}
            />
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
