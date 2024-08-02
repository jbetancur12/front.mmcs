import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { Route, Routes } from 'react-router-dom'
import RequireAuth from './Components/Authentication/RequireAuth'
import Layout from './Components/Layout'
import NewPassword from './Components/NewPassword'
import Clientes from './pages/Clientes'
import Customer from './pages/Customer'
import Customers from './pages/Customers'
import Equipos from './pages/Equipos'
import Files from './pages/Files'
import Login from './pages/Login'
import TiposDeCertificados from './pages/TiposdeCertificado'
import Dashboard from './pages/Dashboard'
import PasswordRecovery from './pages/PasswordRecovery'
import Certificates from './pages/Certificates'
import { Cotizaciones } from './pages/Cotizaciones'
import { ProductosServicios } from './pages/ProductosServicios'
import NewQuote from './pages/NewQuote'
import Quote from './pages/Quote'
import { Settings } from './pages/Settings'
import Profiles from './pages/Profiles'

import Profile from './pages/Profile'
import Traceability from './pages/Traceability'

import ExcelManipulation from './Components/ExcelManipulation/ExcelManipulation'
import Repository from './pages/Repository'
import ScriptGenerator from './Components/ScriptGenerator'
import Gotemberg from './Components/Gotemberg'
import Zip from './pages/Zip'
import Templates from './pages/Templates'
import NotFound from './pages/NotFound'

import DatasheetsList from './Components/DataSheet/ListDataSheet'
import DataSheetDetail from './Components/DataSheet/DataSheetDetails'
import InspectionMaintenance from './Components/DataSheet/InspectionMaintenance'
import InspectionMaintenanceForm from './Components/DataSheet/InspectionMaintenanceForm'
import InspectionPDF from './Components/DataSheet/InspectionPDFBridge'
import CalibrationForm from './Components/DataSheet/CalibrationForm'
import CalibrationProgramPDF from './Components/DataSheet/CalibrationProgramPDF'
import CalibrationSchedulePDF from './Components/DataSheet/MaintenanceSchedulePDF'

function Router() {
  const protectedLayout = (
    <RequireAuth>
      <Layout />
    </RequireAuth>
  )

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Routes>
        {/* <Route path='/' element={<Outlet />}>
          <Route index element={<Navigate to='/dashboard' />} />
        </Route> */}
        <Route path='/' element={protectedLayout}>
          <Route index element={<Dashboard />} />
          <Route path='datasheets'>
            <Route index element={<DatasheetsList />} />
            <Route
              path=':id/new-maintenance'
              element={<InspectionMaintenanceForm />}
            />
            <Route
              path='calibration-program'
              element={<CalibrationProgramPDF />}
            />
            <Route
              path='calibration-schedule'
              element={<CalibrationSchedulePDF />}
            />
            <Route path=':id/new-calibration' element={<CalibrationForm />} />
            <Route path=':id' element={<DataSheetDetail />} />
            <Route
              path=':id/inspection-maintenance'
              element={<InspectionMaintenance />}
            />
            <Route
              path=':id/inspection-maintenance/:id'
              element={<InspectionPDF />}
            />
          </Route>
          <Route path='users' element={<Clientes />} />
          <Route path='customers'>
            <Route index element={<Customers />} />
            <Route path=':id' element={<Customer />} />
          </Route>
          <Route path='calibraciones'>
            <Route path='templates' element={<Templates />} />
            <Route path='equipos' element={<Equipos />} />
            <Route
              path='tipos-de-certificado'
              element={<TiposDeCertificados />}
            />
            <Route path='subir-excel' element={<Zip />}></Route>
            <Route path='certificados'>
              <Route index element={<Files />} />
              <Route path=':id' element={<Certificates />} />
            </Route>
          </Route>
          {/* <Route path="analisis-excel" element={<AnalyzeExcelComponent />} /> */}
          <Route path='zip' element={<Zip />} />
          <Route path='report' element={<ExcelManipulation />} />
          <Route path='repositorio' element={<Repository />} />
          <Route path='script' element={<ScriptGenerator />} />
          <Route path='pdf' element={<Gotemberg />} />

          <Route path='cotizaciones'>
            <Route index element={<Cotizaciones />} />
            <Route path='new-quote' element={<NewQuote />} />
            <Route path='edit-quote/:id' element={<NewQuote />} />
            <Route path=':id' element={<Quote />} />
          </Route>
          <Route path='profiles'>
            <Route index element={<Profiles />} />
            <Route path=':id' element={<Profile />} />
          </Route>
          <Route path='settings' element={<Settings />} />
          <Route path='trazabilidad' element={<Traceability />} />
          <Route
            path='productos-y-servicios'
            element={<ProductosServicios />}
          />
        </Route>
        <Route path='/login' element={<Login />} />
        <Route path='/new-password' element={<NewPassword />} />
        <Route path='password-recovery' element={<PasswordRecovery />} />
        <Route path='*' element={<NotFound />} />
      </Routes>
    </LocalizationProvider>
  )
}

export default Router
