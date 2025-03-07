import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'

const Cotizaciones = lazy(() => import('../pages/Cotizaciones'))
const ProductosServicios = lazy(() => import('../pages/ProductosServicios'))
const NewQuote = lazy(() => import('../pages/NewQuote'))
const PDFViewer = lazy(() => import('src/Components/DataSheet/PDFViewer'))

const QuotationRoutes = (role: string[]) => {
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
        <Route path='cotizaciones'>
          <Route index element={<Cotizaciones />} />
          <Route path='new-quote' element={<NewQuote />} />
          <Route path='edit-quote/:id' element={<NewQuote />} />
          <Route path=':id' element={<PDFViewer path='fog-mmcs-31' />} />
        </Route>
        <Route path='productos-y-servicios' element={<ProductosServicios />} />
      </Route>
    </>
  )
}

export default QuotationRoutes
