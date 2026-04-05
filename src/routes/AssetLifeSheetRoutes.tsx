import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from 'src/Components/Authentication/ProtectedRoute'
import { ASSET_LIFE_SHEET_ALLOWED_ROLES } from 'src/constants/assetLifeSheets'

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
          roles={ASSET_LIFE_SHEET_ALLOWED_ROLES}
        />
      }
    >
      <Route path='asset-life-sheets' element={<AssetLifeSheetsPage />} />
    </Route>
  )
}

export default AssetLifeSheetRoutes
