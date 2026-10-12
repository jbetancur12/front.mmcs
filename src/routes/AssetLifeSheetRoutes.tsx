import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'
import { PERMISSIONS } from 'src/constants/permissions'

const AssetLifeSheetsPage = lazy(
  () => import('../pages/assets/AssetLifeSheetsPage')
)

const AssetLifeSheetRoutes = (role: string[]) => {
  return (
    <Route
      element={
        <ProtectedRoute
          isAuthenticated={localStorage.getItem('accessToken') !== null}
          userRole={role}
          permission={PERMISSIONS.ASSETS_LIFE_SHEET_VIEW}
        />
      }
    >
      <Route path='asset-life-sheets' element={<AssetLifeSheetsPage />} />
    </Route>
  )
}

export default AssetLifeSheetRoutes
