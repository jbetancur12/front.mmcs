import {
  Delete,
  Edit,
  ForwardToInbox,
  Link as LinkIcon,
  MoreVert
} from '@mui/icons-material'
import {
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip
} from '@mui/material'
import React, { useState } from 'react'

import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'

import { UserData } from './types'

// Menú de acciones por fila: un solo botón de tres puntos, sin importar cuántas acciones haya
const UserRowActions: React.FC<{
  user: UserData
  name: string
  busy: boolean
  onEdit: () => void
  onActivationLink: (resend: boolean) => void
  onDelete: () => void
}> = ({ user, name, busy, onEdit, onActivationLink, onDelete }) => {
  const canUpdate = useCan(PERMISSIONS.USERS_USER_UPDATE_INTERNAL)
  const canActivate = useCan(PERMISSIONS.USERS_USER_ACTIVATION)
  const canDelete = useCan(PERMISSIONS.USERS_USER_DELETE)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const close = () => setAnchorEl(null)
  const run = (action: () => void) => () => {
    close()
    action()
  }

  return (
    <>
      <Tooltip arrow title='Acciones'>
        <IconButton
          size='small'
          disabled={busy}
          onClick={(event) => setAnchorEl(event.currentTarget)}
          aria-label={`Acciones para el usuario ${name}`}
          aria-haspopup='menu'
          aria-expanded={Boolean(anchorEl)}
        >
          <MoreVert fontSize='small' />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={close}>
        {canUpdate && (
          <MenuItem onClick={run(onEdit)}>
            <ListItemIcon>
              <Edit fontSize='small' sx={{ color: '#1976d2' }} />
            </ListItemIcon>
            Editar usuario
          </MenuItem>
        )}
        {canActivate && user.active !== true && (
          <MenuItem onClick={run(() => onActivationLink(false))}>
            <ListItemIcon>
              <LinkIcon fontSize='small' />
            </ListItemIcon>
            Enlace de activación
          </MenuItem>
        )}
        {canActivate && user.active !== true && (
          <MenuItem onClick={run(() => onActivationLink(true))}>
            <ListItemIcon>
              <ForwardToInbox fontSize='small' />
            </ListItemIcon>
            Reenviar correo de activación
          </MenuItem>
        )}
        {canDelete && (
          <>
            <Divider />
            <MenuItem onClick={run(onDelete)} sx={{ color: 'error.main' }}>
              <ListItemIcon>
                <Delete fontSize='small' color='error' />
              </ListItemIcon>
              Eliminar usuario
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  )
}

export default UserRowActions
