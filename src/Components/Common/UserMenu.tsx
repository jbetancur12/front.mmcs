import React, { useState } from 'react'
import {
  Avatar,
  Box,
  ButtonBase,
  Divider,
  ListItemIcon,
  Menu,
  MenuItem,
  Typography
} from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import DevicesOutlinedIcon from '@mui/icons-material/DevicesOutlined'
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'

interface UserMenuProps {
  name: string
  email: string
  /** Rol principal ya traducido ("Coordinador de metrología"). */
  roleLabel?: string
  /** En suplantación el avatar pasa a ámbar y aparece "Volver a mi sesión". */
  impersonating?: boolean
  onStopImpersonation?: () => void
  onLogout: () => void
  /** Abre la lista de sesiones activas de la cuenta; sin esto el ítem no aparece. */
  onOpenSessions?: () => void
  /** Pie del menú para soporte: "Versión 1.10.1 (API 1.8.2)". */
  versionLabel?: string
}

const TEAL_INK = '#00695c'
const AMBER = '#b45309'

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'U'

/**
 * Bloque de usuario de la barra superior: avatar con iniciales, nombre y
 * rol (en escritorio) y menú con la cuenta, volver de una suplantación y
 * cerrar sesión.
 */
const UserMenu: React.FC<UserMenuProps> = ({
  name,
  email,
  roleLabel,
  impersonating = false,
  onStopImpersonation,
  onLogout,
  onOpenSessions,
  versionLabel
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const accent = impersonating ? AMBER : TEAL_INK
  const displayName = name || 'Usuario'

  return (
    <>
      <ButtonBase
        onClick={(event) => setAnchorEl(event.currentTarget)}
        aria-label={`Cuenta de ${displayName}`}
        aria-haspopup='menu'
        aria-expanded={open}
        aria-controls={open ? 'user-menu' : undefined}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          borderRadius: '12px',
          px: { xs: 0.5, md: 1 },
          py: 0.5,
          textAlign: 'left',
          '&:hover': { bgcolor: '#f3f4f6' },
          '&.Mui-focusVisible': {
            outline: `3px solid ${accent}`,
            outlineOffset: 2
          }
        }}
      >
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: accent,
            fontSize: 14,
            fontWeight: 700
          }}
        >
          {initials(displayName)}
        </Avatar>
        <Box sx={{ display: { xs: 'none', md: 'block' }, minWidth: 0 }}>
          <Typography
            noWrap
            sx={{
              fontSize: 14,
              fontWeight: 600,
              color: '#111827',
              lineHeight: 1.3,
              maxWidth: 200
            }}
          >
            {displayName}
          </Typography>
          {(roleLabel || impersonating) && (
            <Typography
              noWrap
              sx={{
                fontSize: 12,
                color: impersonating ? AMBER : '#4b5563',
                fontWeight: impersonating ? 600 : 400,
                lineHeight: 1.3,
                maxWidth: 200
              }}
            >
              {impersonating ? 'Suplantando' : roleLabel}
            </Typography>
          )}
        </Box>
        <KeyboardArrowDownIcon
          sx={{
            display: { xs: 'none', md: 'block' },
            fontSize: 20,
            color: '#4b5563',
            transition: 'transform .2s',
            transform: open ? 'rotate(180deg)' : 'none'
          }}
        />
      </ButtonBase>

      <Menu
        id='user-menu'
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 260,
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow:
              '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)'
          }
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
            {displayName}
          </Typography>
          <Typography sx={{ fontSize: 13, color: '#4b5563' }}>
            {email}
          </Typography>
          {roleLabel && (
            <Typography
              sx={{
                display: 'inline-block',
                mt: 1,
                px: 1,
                py: 0.25,
                borderRadius: '6px',
                bgcolor: '#e0f7f4',
                color: TEAL_INK,
                fontSize: 12,
                fontWeight: 600
              }}
            >
              {roleLabel}
            </Typography>
          )}
        </Box>
        <Divider />
        {impersonating && onStopImpersonation && (
          <MenuItem
            onClick={() => {
              setAnchorEl(null)
              onStopImpersonation()
            }}
            sx={{ color: AMBER, fontWeight: 600, fontSize: 14, py: 1.25 }}
          >
            <ListItemIcon sx={{ color: AMBER }}>
              <AdminPanelSettingsOutlinedIcon fontSize='small' />
            </ListItemIcon>
            Volver a mi sesión
          </MenuItem>
        )}
        {onOpenSessions && (
          <MenuItem
            onClick={() => {
              setAnchorEl(null)
              onOpenSessions()
            }}
            sx={{ fontSize: 14, py: 1.25 }}
          >
            <ListItemIcon>
              <DevicesOutlinedIcon fontSize='small' />
            </ListItemIcon>
            Sesiones activas
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            setAnchorEl(null)
            onLogout()
          }}
          sx={{ fontSize: 14, py: 1.25 }}
        >
          <ListItemIcon>
            <LogoutIcon fontSize='small' />
          </ListItemIcon>
          Cerrar sesión
        </MenuItem>
        {versionLabel && [
          <Divider key='version-divider' />,
          <Typography
            key='version'
            sx={{ px: 2, pt: 1, pb: 0.5, fontSize: 12, color: '#4b5563' }}
          >
            {versionLabel}
          </Typography>
        ]}
      </Menu>
    </>
  )
}

export default UserMenu
