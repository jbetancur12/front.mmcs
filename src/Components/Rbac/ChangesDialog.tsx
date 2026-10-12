import React, { useMemo } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography
} from '@mui/material'
import { RbacMatrix } from '../../types/rbac'
import { roleDisplayName } from './PermissionMatrix'

export interface PendingChange {
  roleId: number
  permissionKey: string
  granted: boolean
}

interface ChangesDialogProps {
  open: boolean
  matrix: RbacMatrix
  changes: PendingChange[]
  /** Nombres de los roles del usuario que está guardando, para avisar si el cambio le afecta */
  ownRoleNames: string[]
  saving: boolean
  /** Mensaje de error por rol (id) tras un intento fallido de guardar */
  errors: Record<number, string>
  onCancel: () => void
  onConfirm: () => void
}

/** Resumen de lo que se va a cambiar y a cuántas personas afecta, antes de guardar. */
const ChangesDialog: React.FC<ChangesDialogProps> = ({
  open,
  matrix,
  changes,
  ownRoleNames,
  saving,
  errors,
  onCancel,
  onConfirm
}) => {
  const groups = useMemo(() => {
    const byRole = new Map<number, PendingChange[]>()
    for (const change of changes) {
      byRole.set(change.roleId, [...(byRole.get(change.roleId) ?? []), change])
    }
    return [...byRole.entries()].map(([roleId, items]) => ({
      role: matrix.roles.find((r) => r.id === roleId),
      items: items.sort((a, b) => a.permissionKey.localeCompare(b.permissionKey))
    }))
  }, [changes, matrix.roles])

  const affectedUsers = groups.reduce(
    (sum, g) => sum + (g.role?.userCount ?? 0),
    0
  )
  const touchesMe = groups.some(
    (g) => g.role && ownRoleNames.includes(g.role.name)
  )
  const hasRevocations = changes.some((c) => !c.granted)
  const touchesMyRevocation = groups.some(
    (g) =>
      g.role &&
      ownRoleNames.includes(g.role.name) &&
      g.items.some((c) => !c.granted)
  )

  return (
    <Dialog open={open} onClose={saving ? undefined : onCancel} maxWidth='sm' fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Revisar cambios ({changes.length})
      </DialogTitle>
      <DialogContent dividers>
        <Alert severity={hasRevocations ? 'warning' : 'info'} sx={{ mb: 2 }}>
          {affectedUsers > 0
            ? `Estos cambios afectan a ${affectedUsers} ${affectedUsers === 1 ? 'usuario activo' : 'usuarios activos'}. `
            : 'Ningún usuario activo tiene estos roles hoy. '}
          Rigen desde la siguiente petición de cada uno, sin que tengan que volver a iniciar sesión.
        </Alert>
        {touchesMe && (
          <Alert severity='warning' sx={{ mb: 2 }}>
            Uno de estos roles es tuyo: el cambio también te afecta a ti.
            {touchesMyRevocation &&
              ' Si te quitas una capacidad, no podrás volver a otorgártela tú: tendría que hacerlo otro rol o un super administrador.'}
          </Alert>
        )}

        {groups.map(({ role, items }) => (
          <Box key={role?.id ?? items[0].roleId} sx={{ mb: 2.5 }}>
            <Typography variant='subtitle1' fontWeight={700}>
              {role ? roleDisplayName(role) : 'Rol desconocido'}
              <Typography
                component='span'
                variant='body2'
                color='text.secondary'
                sx={{ ml: 1 }}
              >
                {role?.userCount ?? 0}{' '}
                {role?.userCount === 1 ? 'usuario' : 'usuarios'}
              </Typography>
            </Typography>
            {items.map((change) => (
              <Box
                key={change.permissionKey}
                sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}
              >
                <Chip
                  size='small'
                  color={change.granted ? 'success' : 'error'}
                  variant='outlined'
                  label={change.granted ? 'Otorgar' : 'Quitar'}
                  sx={{ minWidth: 76 }}
                />
                <Typography
                  variant='body2'
                  sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                >
                  {change.permissionKey}
                </Typography>
              </Box>
            ))}
            {role && errors[role.id] && (
              <Alert severity='error' sx={{ mt: 1 }}>
                {errors[role.id]}
              </Alert>
            )}
          </Box>
        ))}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onCancel} disabled={saving} sx={{ textTransform: 'none' }}>
          Seguir editando
        </Button>
        <Button
          variant='contained'
          onClick={onConfirm}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color='inherit' /> : undefined}
          sx={{
            textTransform: 'none',
            bgcolor: '#00BFA5',
            '&:hover': { bgcolor: '#00897B' }
          }}
        >
          {saving ? 'Guardando…' : 'Confirmar y guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ChangesDialog
