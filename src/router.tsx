import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import RequireAuth from "./Components/Authentication/RequireAuth";
import Layout from "./Components/Layout";
import NewPassword from "./Components/NewPassword";
import Clientes from "./pages/Clientes";
import Customer from "./pages/Customer";
import Customers from "./pages/Customers";
import Equipos from "./pages/Equipos";
import Files from "./pages/Files";
import Login from "./pages/Login";
import TiposDeCertificados from "./pages/TiposdeCertificado";
import Dashboard from "./pages/Dashboard";
import PasswordRecovery from "./pages/PasswordRecovery";
import Certificates from "./pages/Certificates";

function Router() {
  const protectedLayout = (
    <RequireAuth>
      <Layout />
    </RequireAuth>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Routes>
        <Route path="/" element={<Outlet />}>
          <Route index element={<Navigate to="/dashboard" />} />
        </Route>
        <Route path="/dashboard" element={protectedLayout}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Clientes />} />
          <Route path="customers">
            <Route index element={<Customers />} />
            <Route path=":id" element={<Customer />} />
          </Route>
          <Route path="calibraciones">
            <Route path="equipos" element={<Equipos />} />
            <Route
              path="tipos-de-certificado"
              element={<TiposDeCertificados />}
            />
            <Route path="certificados">
              <Route index element={<Files />} />
              <Route path=":id" element={<Certificates />} />
            </Route>
          </Route>
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/new-password" element={<NewPassword />} />
        <Route path="password-recovery" element={<PasswordRecovery />} />
      </Routes>
    </LocalizationProvider>
  );
}

export default Router;
