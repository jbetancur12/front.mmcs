import React, { useEffect, useState } from 'react'
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material'
import { Menu as MenuIcon } from '@mui/icons-material'
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined'
import { useStore } from '@nanostores/react'
import { Link } from 'react-router-dom'
import { userStore } from '../store/userStore'
import { useLogout } from './Authentication/Logout'
import UserMenu from './Common/UserMenu'
import useAxiosPrivate from '@utils/use-axios-private'
import AlertsBell from './DataSheet/AlertsBell'
import { useImpersonation } from '../hooks/useImpersonation'
import ImpersonationBar from './ImpersonationBar'
import ImpersonationDialog from './ImpersonationDialog'

import { ROLE_GROUPS, getRoleLabelEs, hasAnyRole } from 'src/constants/roles'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'
interface HeaderProps {
  toggleMobileMenu: () => void
}

function Header({ toggleMobileMenu }: HeaderProps): React.ReactElement {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const axiosPrivate = useAxiosPrivate()
  const $userStore = useStore(userStore)

  const logout = useLogout()
  const [apiVersion, setApiVersion] = useState<string | null>(null)

  useEffect(() => {
    axiosPrivate
      .get('/version')
      .then((response) => setApiVersion(response.data?.version ?? null))
      .catch(() => setApiVersion(null))
    // Solo al montar: la versión de la API no cambia durante la sesión.
  }, [])
  const [impersonationDialogOpen, setImpersonationDialogOpen] = useState(false)
  const {
    isImpersonating,
    impersonator,
    targetUser,
    candidates,
    searching,
    searchUsers,
    startImpersonation,
    stopImpersonation,
    clearSearch
  } = useImpersonation()

  const canImpersonate = useCan(PERMISSIONS.USERS_IMPERSONATION_USE)

  const roleLabel = getRoleLabelEs($userStore.rol?.[0])

  return (
    <>
      {isImpersonating && impersonator && targetUser && (
        <ImpersonationBar
          impersonatorName={impersonator.name}
          targetName={targetUser.name}
          targetRoles={targetUser.roles}
          onStop={stopImpersonation}
        />
      )}
      <AppBar
        position='fixed'
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: '#ffffff',
          color: '#111827',
          // Escala de calibración tenue como borde inferior: marcas cada
          // 8px y una más larga cada 80px, la misma de las pantallas de acceso.
          '&::after': {
            content: '""',
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 7,
            pointerEvents: 'none',
            backgroundImage: [
              'linear-gradient(rgba(0,105,92,0.22), rgba(0,105,92,0.22))',
              'repeating-linear-gradient(to right, rgba(0,105,92,0.45) 0 1px, transparent 1px 80px)',
              'repeating-linear-gradient(to right, rgba(0,105,92,0.25) 0 1px, transparent 1px 8px)'
            ].join(','),
            backgroundSize: '100% 1px, 100% 7px, 100% 4px',
            backgroundPosition: 'bottom, bottom, bottom',
            backgroundRepeat: 'no-repeat'
          }
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 64 }, gap: 1 }}>
          {isMobile && (
            <IconButton
              edge='start'
              aria-label='Abrir menú'
              onClick={toggleMobileMenu}
              sx={{ mr: 0.5, color: '#374151' }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Box
              component={Link}
              to='/'
              aria-label='Ir al inicio'
              sx={{
                display: 'flex',
                alignItems: 'center',
                borderRadius: '8px',
                '&:focus-visible': {
                  outline: '3px solid #00695c',
                  outlineOffset: 4
                }
              }}
            >
              <Box
                component='img'
                src='/images/logo2.png'
                alt='Metromedics'
                sx={{ height: { xs: 32, md: 40 }, width: 'auto' }}
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {!$userStore.lmsOnly &&
              hasAnyRole($userStore.rol, ROLE_GROUPS.METROLOGY_STAFF) &&
              $userStore.email && <AlertsBell email={$userStore.email} />}

            {canImpersonate && !$userStore.lmsOnly && (
              <Tooltip title='Suplantar usuario'>
                <IconButton
                  aria-label='Suplantar usuario'
                  onClick={() => {
                    clearSearch()
                    setImpersonationDialogOpen(true)
                  }}
                  sx={{
                    color: isImpersonating ? '#b45309' : '#4b5563',
                    '&:hover': { bgcolor: '#f3f4f6' }
                  }}
                >
                  <AdminPanelSettingsOutlinedIcon />
                </IconButton>
              </Tooltip>
            )}

            <Box
              sx={{
                width: '1px',
                height: 28,
                bgcolor: '#e5e7eb',
                mx: 1,
                display: { xs: 'none', md: 'block' }
              }}
            />

            <UserMenu
              name={$userStore.nombre}
              email={$userStore.email}
              roleLabel={roleLabel || undefined}
              impersonating={isImpersonating}
              onStopImpersonation={stopImpersonation}
              onLogout={logout}
              versionLabel={`Versión ${import.meta.env.VITE_APP_VERSION}${
                apiVersion ? ` (API ${apiVersion})` : ''
              }`}
            />
          </Box>
        </Toolbar>
      </AppBar>
      <ImpersonationDialog
        open={impersonationDialogOpen}
        searching={searching}
        candidates={candidates}
        onSearch={searchUsers}
        onSelect={(userId) => {
          setImpersonationDialogOpen(false)
          startImpersonation(userId)
        }}
        onClose={() => {
          setImpersonationDialogOpen(false)
          clearSearch()
        }}
      />
    </>
  )
}

export default Header
