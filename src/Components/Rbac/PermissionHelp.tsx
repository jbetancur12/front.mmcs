import React, { useState } from 'react'
import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import LockIcon from '@mui/icons-material/Lock'
import { getPermissionHelp } from 'src/constants/permissionHelp'
import { PERMISSION_SCREENS } from 'src/constants/permissionScreens'
import { RbacPermission, RbacRole } from '../../types/rbac'
import { requirementName } from './requirements'

const TEAL = '#00BFA5'
const TEAL_DARK = '#00897B'

/** Texto sencillo de una capacidad: lo escrito a mano y, si falta, la descripción técnica del catálogo. */
export const permissionPlainText = (permission: RbacPermission) => {
  const help = getPermissionHelp(permission.key)
  return {
    name: help?.name ?? permission.key,
    what: help?.what ?? permission.description ?? '',
    where: help?.where ?? null
  }
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children
}) => (
  <Box sx={{ mt: 2 }}>
    <Typography
      variant='caption'
      sx={{ color: TEAL_DARK, fontWeight: 700, letterSpacing: 0.4 }}
    >
      {title.toUpperCase()}
    </Typography>
    <Box sx={{ mt: 0.5 }}>{children}</Box>
  </Box>
)

interface PermissionHelpButtonProps {
  permission: RbacPermission
  /** Roles que hoy tienen la capacidad (con los cambios pendientes). Se pide solo al abrir el detalle. */
  getGrantedRoles: () => string[]
}

/** Botón "?" que abre la explicación de una capacidad: qué hace, dónde se nota y quién la tiene. */
export const PermissionHelpButton: React.FC<PermissionHelpButtonProps> = ({
  permission,
  getGrantedRoles
}) => {
  const [open, setOpen] = useState(false)
  const text = permissionPlainText(permission)
  const screens = (PERMISSION_SCREENS[permission.key] ?? []).filter(
    (s) => s.kind !== 'related'
  )
  const related = (PERMISSION_SCREENS[permission.key] ?? []).filter(
    (s) => s.kind === 'related'
  )

  return (
    <>
      <Tooltip title='¿Qué hace esta capacidad?'>
        <IconButton
          size='small'
          aria-label={`Explicación de ${text.name}`}
          onClick={() => setOpen(true)}
          sx={{
            p: 0.25,
            color: 'text.secondary',
            '&:hover': { color: TEAL_DARK }
          }}
        >
          <HelpOutlineIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
      {open && (
        <Dialog
          open
          onClose={() => setOpen(false)}
          fullWidth
          maxWidth='sm'
          aria-labelledby='permission-help-title'
        >
          <DialogTitle
            id='permission-help-title'
            sx={{ display: 'flex', alignItems: 'flex-start', pr: 6 }}
          >
            <Box>
              <Typography variant='h6' fontWeight={700} component='span'>
                {text.name}
              </Typography>
              <Typography
                variant='caption'
                component='div'
                sx={{ fontFamily: 'monospace', color: 'text.secondary' }}
              >
                {permission.key}
              </Typography>
            </Box>
            <IconButton
              aria-label='Cerrar'
              onClick={() => setOpen(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {permission.isSensitive && (
              <Chip
                size='small'
                color='warning'
                variant='outlined'
                icon={<LockIcon sx={{ fontSize: 14 }} />}
                label='Sensible: solo un super administrador puede otorgarla o quitarla'
                sx={{ mb: 1 }}
              />
            )}
            <Section title='Qué permite'>
              <Typography variant='body2'>{text.what}</Typography>
            </Section>
            {text.where && (
              <Section title='Dónde se nota'>
                <Typography variant='body2'>{text.where}</Typography>
              </Section>
            )}
            {screens.length > 0 && (
              <Section title='Pantallas y botones que controla'>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {screens.map((s) => (
                    <Tooltip key={s.path + s.kind} title={s.path}>
                      <Chip
                        size='small'
                        variant='outlined'
                        label={
                          s.kind === 'action' ? `${s.label} (botón)` : s.label
                        }
                        sx={{
                          borderColor: s.kind === 'screen' ? TEAL : 'divider',
                          color:
                            s.kind === 'screen' ? TEAL_DARK : 'text.secondary'
                        }}
                      />
                    </Tooltip>
                  ))}
                </Box>
              </Section>
            )}
            {related.length > 0 && (
              <Section title='Pantallas que la usan por detrás'>
                <Typography variant='body2' color='text.secondary'>
                  {related.map((s) => s.label).join(' · ')}
                </Typography>
              </Section>
            )}
            {(permission.requires ?? []).length > 0 && (
              <Section title='Necesita también'>
                <Typography variant='body2'>
                  {(permission.requires ?? []).map(requirementName).join(', ')}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  Sin estas, la persona vería pantallas vacías o botones que no
                  puede usar. El panel avisa, pero no lo impide.
                </Typography>
              </Section>
            )}
            <Section title='Quién la tiene hoy'>
              <RolesList getGrantedRoles={getGrantedRoles} />
            </Section>
            <Section title='Detalle técnico'>
              <Typography variant='caption' color='text.secondary'>
                {permission.description}
              </Typography>
            </Section>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

const RolesList: React.FC<{ getGrantedRoles: () => string[] }> = ({
  getGrantedRoles
}) => {
  const roles = getGrantedRoles()
  if (roles.length === 0) {
    return (
      <Typography variant='body2' color='text.secondary'>
        Ningún rol la tiene.
      </Typography>
    )
  }
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {roles.map((name) => (
        <Chip key={name} size='small' label={name} />
      ))}
    </Box>
  )
}

/** Helpers para filtrar por rol sin repetir la lógica en las dos vistas. */
export const grantedRoleNames = (
  roles: RbacRole[],
  isGranted: (roleId: number) => boolean,
  display: (role: RbacRole) => string
) => roles.filter((r) => isGranted(r.id)).map(display)
