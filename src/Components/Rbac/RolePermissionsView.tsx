import React, { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  InputAdornment,
  MenuItem,
  Paper,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography
} from '@mui/material'
import LockIcon from '@mui/icons-material/Lock'
import SearchIcon from '@mui/icons-material/Search'
import { PERMISSION_SCREENS } from 'src/constants/permissionScreens'
import { RbacMatrix, RbacRole } from '../../types/rbac'
import {
  ScreenInfo,
  cellKey,
  moduleLabel,
  roleDisplayName
} from './PermissionMatrix'

const TEAL = '#00BFA5'

type StatusFilter = 'all' | 'granted' | 'missing'

interface RolePermissionsViewProps {
  matrix: RbacMatrix
  /** Claves "rolId|capacidad" concedidas, con los cambios pendientes ya aplicados. */
  effectiveGrants: Set<string>
  /** Claves con un cambio pendiente de guardar (se resaltan). */
  changedCells: Set<string>
  editable: boolean
  lockedReason: (roleId: number, permissionKey: string) => string | null
  onToggle: (roleId: number, permissionKey: string, granted: boolean) => void
}

/**
 * Vista "Por rol": se elige un rol y se ven (y editan) todas sus capacidades, agrupadas por módulo.
 * Comparte el estado de cambios pendientes con la matriz: lo que se marque aquí se ve allá y viceversa.
 */
const RolePermissionsView: React.FC<RolePermissionsViewProps> = ({
  matrix,
  effectiveGrants,
  changedCells,
  editable,
  lockedReason,
  onToggle
}) => {
  const sortedRoles = useMemo(
    () =>
      [...matrix.roles].sort((a, b) =>
        roleDisplayName(a).localeCompare(roleDisplayName(b), 'es')
      ),
    [matrix.roles]
  )
  const [roleId, setRoleId] = useState<number | ''>(
    () => sortedRoles.find((r) => r.name === 'admin')?.id ?? sortedRoles[0]?.id ?? ''
  )
  const [moduleFilter, setModuleFilter] = useState<string>('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')

  const role: RbacRole | undefined = matrix.roles.find((r) => r.id === roleId)
  const has = (key: string) =>
    role ? effectiveGrants.has(cellKey(role.id, key)) : false

  const modules = useMemo(
    () =>
      Array.from(new Set(matrix.permissions.map((p) => p.module))).sort((a, b) =>
        moduleLabel(a).localeCompare(moduleLabel(b), 'es')
      ),
    [matrix.permissions]
  )

  const countsByModule = useMemo(() => {
    const out = new Map<string, { granted: number; total: number }>()
    for (const p of matrix.permissions) {
      const c = out.get(p.module) ?? { granted: 0, total: 0 }
      c.total += 1
      if (role && effectiveGrants.has(cellKey(role.id, p.key))) c.granted += 1
      out.set(p.module, c)
    }
    return out
  }, [matrix.permissions, effectiveGrants, role])

  const totalGranted = useMemo(
    () =>
      Array.from(countsByModule.values()).reduce((n, c) => n + c.granted, 0),
    [countsByModule]
  )

  const groups = useMemo(() => {
    const term = search.trim().toLowerCase()
    const filtered = matrix.permissions.filter((p) => {
      if (moduleFilter && p.module !== moduleFilter) return false
      const granted = role ? effectiveGrants.has(cellKey(role.id, p.key)) : false
      if (status === 'granted' && !granted) return false
      if (status === 'missing' && granted) return false
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
      .filter((g) => g.items.length > 0)
  }, [matrix.permissions, modules, moduleFilter, status, search, effectiveGrants, role])

  const setAll = (keys: string[], granted: boolean) => {
    if (!role) return
    for (const key of keys) {
      if (lockedReason(role.id, key)) continue
      if (has(key) !== granted) onToggle(role.id, key, granted)
    }
  }

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, p: 2.5 }}>
      <Box
        sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}
      >
        <TextField
          select
          size='small'
          label='Rol'
          value={roleId}
          onChange={(e) => setRoleId(Number(e.target.value))}
          sx={{ minWidth: 260 }}
        >
          {sortedRoles.map((r) => (
            <MenuItem key={r.id} value={r.id}>
              {roleDisplayName(r)}
              {!r.isActive ? ' (inactivo)' : ''}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size='small'
          label='Módulo'
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          sx={{ minWidth: 260 }}
        >
          <MenuItem value=''>Todos los módulos</MenuItem>
          {modules.map((m) => {
            const c = countsByModule.get(m)
            return (
              <MenuItem key={m} value={m}>
                {moduleLabel(m)} ({c?.granted ?? 0}/{c?.total ?? 0})
              </MenuItem>
            )
          })}
        </TextField>
        <ToggleButtonGroup
          exclusive
          size='small'
          value={status}
          onChange={(_, v: StatusFilter | null) => v && setStatus(v)}
          aria-label='Filtrar por estado'
        >
          <ToggleButton value='all' sx={{ textTransform: 'none' }}>
            Todas
          </ToggleButton>
          <ToggleButton value='granted' sx={{ textTransform: 'none' }}>
            Las que tiene
          </ToggleButton>
          <ToggleButton value='missing' sx={{ textTransform: 'none' }}>
            Las que no tiene
          </ToggleButton>
        </ToggleButtonGroup>
        <TextField
          size='small'
          placeholder='Buscar capacidad, pantalla o URL…'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 280, flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon fontSize='small' />
              </InputAdornment>
            )
          }}
        />
      </Box>

      {role && (
        <Box
          sx={{
            mt: 2,
            p: 1.5,
            borderRadius: 2,
            bgcolor: '#E0F7F4',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 1.5
          }}
        >
          <Typography fontWeight={700}>{roleDisplayName(role)}</Typography>
          <Chip
            size='small'
            label={`${totalGranted} de ${matrix.permissions.length} capacidades`}
            sx={{ bgcolor: TEAL, color: '#fff', fontWeight: 600 }}
          />
          <Chip
            size='small'
            variant='outlined'
            label={`${role.userCount} ${role.userCount === 1 ? 'usuario' : 'usuarios'}`}
          />
          {!role.isActive && (
            <Chip size='small' color='warning' label='Rol inactivo' />
          )}
          {role.description && (
            <Typography variant='caption' color='text.secondary'>
              {role.description}
            </Typography>
          )}
        </Box>
      )}

      {groups.length === 0 && (
        <Typography color='text.secondary' sx={{ py: 4, textAlign: 'center' }}>
          No hay capacidades que coincidan con el filtro.
        </Typography>
      )}

      {groups.map((group) => {
        const c = countsByModule.get(group.module)
        const keys = group.items.map((p) => p.key)
        return (
          <Box key={group.module} sx={{ mt: 2.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1,
                px: 1.5,
                py: 0.75,
                borderRadius: 1.5,
                bgcolor: '#e0f2f1'
              }}
            >
              <Typography fontWeight={700} sx={{ color: '#00695c' }}>
                {moduleLabel(group.module)} · {c?.granted ?? 0}/{c?.total ?? 0}
              </Typography>
              {editable && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size='small'
                    onClick={() => setAll(keys, true)}
                    sx={{ textTransform: 'none' }}
                  >
                    Dar todas
                  </Button>
                  <Button
                    size='small'
                    color='inherit'
                    onClick={() => setAll(keys, false)}
                    sx={{ textTransform: 'none' }}
                  >
                    Quitar todas
                  </Button>
                </Box>
              )}
            </Box>
            {group.items.map((p) => {
              const granted = has(p.key)
              const reason = role ? lockedReason(role.id, p.key) : null
              const disabled = !editable || Boolean(reason) || !role
              const changed = role
                ? changedCells.has(cellKey(role.id, p.key))
                : false
              return (
                <Box
                  key={p.key}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    px: 1.5,
                    py: 1,
                    borderBottom: '1px solid #eee',
                    bgcolor: changed ? '#fff8e1' : 'transparent'
                  }}
                >
                  <Tooltip title={reason ?? ''} disableHoverListener={!reason}>
                    <span>
                      <Switch
                        checked={granted}
                        disabled={disabled}
                        onChange={(e) =>
                          role && onToggle(role.id, p.key, e.target.checked)
                        }
                        color='primary'
                        inputProps={{
                          'aria-label': `${p.key} para ${role ? roleDisplayName(role) : ''}`
                        }}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': { color: TEAL },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':
                            { bgcolor: TEAL }
                        }}
                      />
                    </span>
                  </Tooltip>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant='body2'
                        sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                      >
                        {p.key}
                      </Typography>
                      {p.isSensitive && (
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
                      {changed && (
                        <Chip
                          size='small'
                          color='warning'
                          label='Sin guardar'
                          sx={{ height: 20, fontSize: 11 }}
                        />
                      )}
                    </Box>
                    <Typography variant='caption' color='text.secondary'>
                      {p.description}
                    </Typography>
                    <ScreenInfo permissionKey={p.key} />
                  </Box>
                </Box>
              )
            })}
          </Box>
        )
      })}
    </Paper>
  )
}

export default RolePermissionsView
