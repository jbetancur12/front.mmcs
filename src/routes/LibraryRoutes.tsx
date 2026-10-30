import SignalLoader from 'src/Components/Common/SignalLoader'
import { lazy, Suspense } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'
import { PERMISSIONS } from 'src/constants/permissions'
import Box from '@mui/material/Box'

const LibraryPage = lazy(() => import('src/pages/Library'))

const LibraryRoutes = (role: string[]) => {
  return (
    <Route
      element={
        <ProtectedRoute
          isAuthenticated={localStorage.getItem('accessToken') !== null}
          userRole={role}
          permission={PERMISSIONS.LIBRARY_DOCUMENT_VIEW}
        />
      }
    >
      <Route
        path='library'
        element={
          <Suspense
            fallback={
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '80vh'
                }}
              >
                <SignalLoader />
              </Box>
            }
          >
            <LibraryPage />
          </Suspense>
        }
      />
    </Route>
  )
}

export default LibraryRoutes
