import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useStore } from '@nanostores/react'
import { userStore } from '../../store/userStore'

const LMS_ALLOWED_PREFIXES = ['/lms']

const LmsOnlyGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()
  const $userStore = useStore(userStore)

  if (!$userStore.lmsOnly) {
    return <>{children}</>
  }

  const isAllowedPath = LMS_ALLOWED_PREFIXES.some((prefix) =>
    location.pathname.startsWith(prefix)
  )

  if (!isAllowedPath) {
    return <Navigate to='/lms' replace />
  }

  return <>{children}</>
}

export default LmsOnlyGuard
