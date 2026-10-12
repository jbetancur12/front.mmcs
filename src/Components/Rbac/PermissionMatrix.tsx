import React, { useMemo, useState } from 'react'
import {
  Box,
  Checkbox,
  Chip,
  IconButton,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import LockIcon from '@mui/icons-material/Lock'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import EditIcon from '@mui/icons-material/Edit'
import BlockIcon from '@mui/icons-material/Block'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import SearchIcon from '@mui/icons-material/Search'
import { ROLE_LABELS_ES } from 'src/constants/roles'
import { PERMISSION_SCREENS } from 'src/constants/permissionScreens'
import { RbacMatrix, RbacRole } from '../../types/rbac'

/** Nombre legible de cada módulo del catálogo; si falta, se muestra la clave. */
export const RBAC_MODULE_LABELS: Record<string, string> = {
  maintenance: 'Mantenimiento',
  purchases: 'Compras',
  sales: 'Venta de equipos',
  customers: 'Clientes y módulos',
  laboratory: 'Laboratorio',
  iot: 'IoT',
  nonconform: 'Trabajo no conforme',
  users: 'Usuarios y perfiles',
  system: 'Sistema',
  calibration: 'Calibración',
  lms: 'Academia (LMS)',
  fleet: 'Flota',
  assets: 'Activos de TI',
  repositories: 'Repositorios',
  tools: 'Utilidades',
  rbac: 'Administración de permisos'
}

const MAX_VISIBLE_SCREENS = 3

/** Dónde se usa una capacidad en la plataforma: pantallas (URL del front) y acciones dentro de ellas. */
const ScreenInfo: React.FC<{ permissionKey: string }> = ({ permissionKey }) => {
  const screens = PERMISSION_SCREENS[permissionKey] ?? []
  if (screens.length === 0) {
    return (
      <Typography variant='caption' color='text.disabled' component='div'>
        Sin pantalla propia: regla interna o acción sin botón visible
      </Typography>
    )
  }
  const visible = screens.slice(0, MAX_VISIBLE_SCREENS)
  const hidden = screens.slice(MAX_VISIBLE_SCREENS)
  const describe = (s: (typeof screens)[number]) =>
    `${s.label} (${s.path})${
      s.kind === 'action'
        ? ' · botón o sección dentro de la pantalla'
        : s.kind === 'related'
          ? ' · pantalla que realiza esta operación'
          : ''
    }`
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
      {visible.map((s) => (
        <Tooltip key={s.path + s.kind} title={describe(s)}>
          <Chip
            size='small'
            variant='outlined'
            label={s.label}
            sx={{
              height: 22,
              fontSize: 11,
              borderStyle: s.kind === 'related' ? 'dashed' : 'solid',
              borderColor: s.kind === 'screen' ? '#00BFA5' : 'divider',
              color: s.kind === 'screen' ? '#00897B' : 'text.secondary',
              bgcolor: s.kind === 'screen' ? '#E0F7F4' : 'transparent'
            }}
          />
        </Tooltip>
      ))}
      {hidden.length > 0 && (
        <Tooltip
          title={
            <Box component='span' sx={{ whiteSpace: 'pre-line' }}>
              {hidden.map(describe).join('\n')}
            </Box>
          }
        >
          <Chip
            size='small'
            variant='outlined'
            label={`+${hidden.length} más`}
            sx={{ height: 22, fontSize: 11 }}
          />
        </Tooltip>
      )}
    </Box>
  )
}

export const moduleLabel = (module: string) =>
  RBAC_MODULE_LABELS[module] ?? module

/**
 * Nombre que se muestra de un rol: la etiqueta conocida; si es un rol creado desde el panel, su
 * descripción (el nombre es un identificador técnico); y si no, el nombre tal cual.
 */
export const roleDisplayName = (role: Pick<RbacRole, 'name' | 'description'>) =>
  ROLE_LABELS_ES[role.name] ?? (role.description || role.name)

const TEAL = '#00BFA5'
const FIRST_COL_WIDTH = 340

interface PermissionMatrixProps {
  matrix: RbacMatrix
  /**
   * Claves "rolId|capacidad" que HOY están concedidas, ya con los cambios pendientes aplicados.
   * Si no se pasa, se usa lo que viene del servidor.
   */
  effectiveGrants?: Set<string>
  /** Claves "rolId|capacidad" con un cambio pendiente de guardar (se resaltan). */
  changedCells?: Set<string>
  /** Si es false, las casillas quedan bloqueadas (solo lectura). */
  editable?: boolean
  /** Motivo por el que una casilla concreta no se puede cambiar (candado y tooltip). */
  lockedReason?: (roleId: number, permissionKey: string) => string | null
  onToggle?: (roleId: number, permissionKey: string, granted: boolean) => void
  /** Muestra el menú de cada rol (editar, activar/desactivar). Solo quien puede gestionar. */
  canManage?: boolean
  onEditRole?: (role: RbacRole) => void
  onToggleRole?: (role: RbacRole) => void
}

export const cellKey = (roleId: number, permissionKey: string) =>
  `${roleId}|${permissionKey}`

const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
  matrix,
  effectiveGrants,
  changedCells,
  editable = false,
  lockedReason,
  onToggle,
  canManage = false,
  onEditRole,
  onToggleRole
}) => {
  const [search, setSearch] = useState('')
  const [menu, setMenu] = useState<{ anchor: HTMLElement; role: RbacRole } | null>(
    null
  )
  const [moduleFilter, setModuleFilter] = useState<string | null>(null)

  const serverGrants = useMemo(
    () =>
      new Set(matrix.grants.map((g) => cellKey(g.roleId, g.permissionKey))),
    [matrix.grants]
  )
  const grants = effectiveGrants ?? serverGrants

  const modules = useMemo(
    () => Array.from(new Set(matrix.permissions.map((p) => p.module))),
    [matrix.permissions]
  )

  const visibleGroups = useMemo(() => {
    const term = search.trim().toLowerCase()
    const filtered = matrix.permissions.filter((p) => {
      if (moduleFilter && p.module !== moduleFilter) return false
      if (!term) return true
      return (
        p.key.toLowerCase().includes(term) ||
        (p.description ?? '').toLowerCase().includes(term) ||
        (PERMISSION_SCREENS[p.key] ?? []).some(
          (s) =>
            s.label.toLowerCase().includes(term) ||
            s.path.toLowerCase().includes(term)
        )
      )
    })
    return modules
      .map((module) => ({
        module,
        items: filtered.filter((p) => p.module === module)
      }))
      .filter((group) => group.items.length > 0)
  }, [matrix.permissions, modules, moduleFilter, search])

  const renderRoleHeader = (role: RbacRole) => (
    <TableCell
      key={role.id}
      align='center'
      sx={{
        minWidth: 118,
        fontWeight: 600,
        bgcolor: '#f5f5f5',
        opacity: role.isActive ? 1 : 0.55
      }}
    >
      <Tooltip title={role.description || role.name}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
            <Typography variant='body2' fontWeight={600} noWrap>
              {roleDisplayName(role)}
            </Typography>
            {canManage && (
              <IconButton
                size='small'
                aria-label={`Opciones del rol ${roleDisplayName(role)}`}
                onClick={(e) => setMenu({ anchor: e.currentTarget, role })}
                sx={{ p: 0.25 }}
              >
                <MoreVertIcon fontSize='small' />
              </IconButton>
            )}
          </Box>
          <Typography variant='caption' color='text.secondary'>
            {role.userCount} {role.userCount === 1 ? 'usuario' : 'usuarios'}
          </Typography>
          {!role.isActive && (
            <Box>
              <Chip size='small' label='Inactivo' sx={{ mt: 0.5 }} />
            </Box>
          )}
        </Box>
      </Tooltip>
    </TableCell>
  )

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box
        sx={{
          p: 2,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'center',
          bgcolor: '#fafafa',
          borderBottom: '1px solid #eee'
        }}
      >
        <TextField
          size='small'
          placeholder='Buscar capacidad…'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon fontSize='small' />
              </InputAdornment>
            )
          }}
          inputProps={{ 'aria-label': 'Buscar capacidad' }}
        />
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label='Todos los módulos'
            clickable
            onClick={() => setModuleFilter(null)}
            sx={
              moduleFilter === null
                ? { bgcolor: TEAL, color: '#fff', '&:hover': { bgcolor: '#00897B' } }
                : undefined
            }
            variant={moduleFilter === null ? 'filled' : 'outlined'}
          />
          {modules.map((module) => (
            <Chip
              key={module}
              label={moduleLabel(module)}
              clickable
              onClick={() => setModuleFilter(module)}
              sx={
                moduleFilter === module
                  ? { bgcolor: TEAL, color: '#fff', '&:hover': { bgcolor: '#00897B' } }
                  : undefined
              }
              variant={moduleFilter === module ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
      </Box>

      <TableContainer sx={{ maxHeight: '62vh' }}>
        <Table stickyHeader size='small' aria-label='Matriz de capacidades por rol'>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  position: 'sticky',
                  left: 0,
                  zIndex: 3,
                  minWidth: FIRST_COL_WIDTH,
                  bgcolor: '#f5f5f5',
                  fontWeight: 600
                }}
              >
                Capacidad
              </TableCell>
              {matrix.roles.map(renderRoleHeader)}
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleGroups.length === 0 && (
              <TableRow>
                <TableCell colSpan={matrix.roles.length + 1}>
                  <Typography color='text.secondary' sx={{ py: 3 }} align='center'>
                    Ninguna capacidad coincide con la búsqueda.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {visibleGroups.map((group) => (
              <React.Fragment key={group.module}>
                <TableRow>
                  <TableCell
                    colSpan={matrix.roles.length + 1}
                    sx={{
                      bgcolor: '#E0F7F4',
                      color: '#00695C',
                      fontWeight: 700,
                      letterSpacing: 0.3
                    }}
                  >
                    {moduleLabel(group.module)} · {group.items.length}
                  </TableCell>
                </TableRow>
                {group.items.map((permission) => (
                  <TableRow
                    key={permission.key}
                    hover
                    sx={{ '&:hover': { bgcolor: 'rgba(0,191,165,0.04)' } }}
                  >
                    <TableCell
                      sx={{
                        position: 'sticky',
                        left: 0,
                        zIndex: 2,
                        bgcolor: '#fff',
                        minWidth: FIRST_COL_WIDTH
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          variant='body2'
                          sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                        >
                          {permission.key}
                        </Typography>
                        {permission.isSensitive && (
                          <Tooltip title='Capacidad sensible: solo un super administrador puede otorgarla o quitarla'>
                            <Chip
                              size='small'
                              color='warning'
                              variant='outlined'
                              icon={<LockIcon sx={{ fontSize: 14 }} />}
                              label='Sensible'
                            />
                          </Tooltip>
                        )}
                      </Box>
                      <Typography variant='caption' color='text.secondary'>
                        {permission.description}
                      </Typography>
                      <ScreenInfo permissionKey={permission.key} />
                    </TableCell>
                    {matrix.roles.map((role) => {
                      const key = cellKey(role.id, permission.key)
                      const checked = grants.has(key)
                      const reason = lockedReason?.(role.id, permission.key) ?? null
                      const disabled = !editable || Boolean(reason)
                      const changed = changedCells?.has(key) ?? false
                      return (
                        <TableCell
                          key={role.id}
                          align='center'
                          padding='checkbox'
                          sx={{
                            opacity: role.isActive ? 1 : 0.55,
                            bgcolor: changed ? 'rgba(255,152,0,0.16)' : undefined
                          }}
                        >
                          <Tooltip title={reason ?? ''} disableHoverListener={!reason}>
                            <span>
                              <Checkbox
                                checked={checked}
                                disabled={disabled}
                                onChange={(e) =>
                                  onToggle?.(role.id, permission.key, e.target.checked)
                                }
                                inputProps={{
                                  'aria-label': `${permission.key} para ${roleDisplayName(role)}`
                                }}
                                sx={{
                                  color: '#bdbdbd',
                                  '&.Mui-checked': { color: TEAL },
                                  '&.Mui-checked.Mui-disabled': {
                                    color: 'rgba(0,191,165,0.55)'
                                  }
                                }}
                              />
                            </span>
                          </Tooltip>
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={menu?.anchor}
        open={Boolean(menu)}
        onClose={() => setMenu(null)}
      >
        <MenuItem
          onClick={() => {
            if (menu) onEditRole?.(menu.role)
            setMenu(null)
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize='small' />
          </ListItemIcon>
          <ListItemText>Editar descripción</ListItemText>
        </MenuItem>
        <MenuItem
          disabled={Boolean(menu?.role.isSystem)}
          onClick={() => {
            if (menu) onToggleRole?.(menu.role)
            setMenu(null)
          }}
        >
          <ListItemIcon>
            {menu?.role.isActive ? (
              <BlockIcon fontSize='small' />
            ) : (
              <CheckCircleIcon fontSize='small' />
            )}
          </ListItemIcon>
          <ListItemText
            secondary={menu?.role.isSystem ? 'Los roles de sistema no se desactivan' : undefined}
          >
            {menu?.role.isActive ? 'Desactivar rol' : 'Activar rol'}
          </ListItemText>
        </MenuItem>
      </Menu>
    </Paper>
  )
}

export default PermissionMatrix
