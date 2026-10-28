import React, { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  InputAdornment,
  List,
  ListItemButton,
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
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { PERMISSION_SCREENS } from 'src/constants/permissionScreens'
import { RbacMatrix, RbacRole } from '../../types/rbac'
import { PendingChange } from './ChangesDialog'
import {
  PermissionHelpButton,
  grantedRoleNames,
  permissionPlainText
} from './PermissionHelp'
import { missingRequirements, requirementName } from './requirements'
import {
  ScreenInfo,
  cellKey,
  moduleLabel,
  roleDisplayName
} from './PermissionMatrix'

const TEAL = '#00BFA5'
const TEAL_DARK = '#00897B'
const TEAL_SOFT = '#E0F7F4'
const AMBER_SOFT = '#fff8e1'
const AMBER = '#ffb74d'

type StatusFilter = 'all' | 'granted' | 'missing'

interface RolePermissionsViewProps {
  matrix: RbacMatrix
  /** Claves "rolId|capacidad" concedidas, con los cambios pendientes ya aplicados. */
  effectiveGrants: Set<string>
  /** Claves con un cambio pendiente de guardar (se resaltan). */
  changedCells: Set<string>
  /** Cambios pendientes de todos los roles, para el panel "Lo que cambia". */
  changes: PendingChange[]
  editable: boolean
  canManage: boolean
  lockedReason: (roleId: number, permissionKey: string) => string | null
  onToggle: (roleId: number, permissionKey: string, granted: boolean) => void
  onDiscard: () => void
  onReview: () => void
  onEditRole: (role: RbacRole) => void
  onToggleRole: (role: RbacRole) => void
}

/** Pantallas (no botones) que una capacidad abre o cierra: es lo que el administrador percibe. */
const screensOf = (key: string) =>
  (PERMISSION_SCREENS[key] ?? []).filter((s) => s.kind === 'screen')

/**
 * Vista "Por rol": roles a la izquierda, capacidades del rol elegido al centro y, a la derecha, un panel fijo
 * "Lo que cambia" con cada cambio pendiente, a cuántas personas toca y qué pantallas aparecen o desaparecen.
 * Comparte el estado de cambios pendientes con la matriz.
 */
const RolePermissionsView: React.FC<RolePermissionsViewProps> = ({
  matrix,
  effectiveGrants,
  changedCells,
  changes,
  editable,
  canManage,
  lockedReason,
  onToggle,
  onDiscard,
  onReview,
  onEditRole,
  onToggleRole
}) => {
  const sortedRoles = useMemo(
    () =>
      [...matrix.roles].sort((a, b) =>
        roleDisplayName(a).localeCompare(roleDisplayName(b), 'es')
      ),
    [matrix.roles]
  )
  const [roleId, setRoleId] = useState<number | ''>(
    () =>
      sortedRoles.find((r) => r.name === 'admin')?.id ?? sortedRoles[0]?.id ?? ''
  )
  const [moduleFilter, setModuleFilter] = useState<string>('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [roleSearch, setRoleSearch] = useState('')

  const role: RbacRole | undefined = matrix.roles.find((r) => r.id === roleId)
  const has = (key: string) =>
    role ? effectiveGrants.has(cellKey(role.id, key)) : false

  const permissionByKey = useMemo(
    () => new Map(matrix.permissions.map((p) => [p.key, p])),
    [matrix.permissions]
  )
  const roleById = useMemo(
    () => new Map(matrix.roles.map((r) => [r.id, r])),
    [matrix.roles]
  )

  const modules = useMemo(
    () =>
      Array.from(new Set(matrix.permissions.map((p) => p.module))).sort((a, b) =>
        moduleLabel(a).localeCompare(moduleLabel(b), 'es')
      ),
    [matrix.permissions]
  )

  const grantedByRole = useMemo(() => {
    const out = new Map<number, number>()
    for (const key of effectiveGrants) {
      const id = Number(key.split('|')[0])
      out.set(id, (out.get(id) ?? 0) + 1)
    }
    return out
  }, [effectiveGrants])

  const pendingByRole = useMemo(() => {
    const out = new Map<number, number>()
    for (const c of changes) out.set(c.roleId, (out.get(c.roleId) ?? 0) + 1)
    return out
  }, [changes])

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

  const roleList = useMemo(() => {
    const term = roleSearch.trim().toLowerCase()
    if (!term) return sortedRoles
    return sortedRoles.filter((r) =>
      roleDisplayName(r).toLowerCase().includes(term)
    )
  }, [sortedRoles, roleSearch])

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
        permissionPlainText(p).name.toLowerCase().includes(term) ||
        permissionPlainText(p).what.toLowerCase().includes(term) ||
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

  // Capacidades que el rol tiene sin otras que necesitan (con los cambios pendientes ya aplicados)
  const unmet = useMemo(
    () =>
      role
        ? matrix.permissions
            .filter((p) => effectiveGrants.has(cellKey(role.id, p.key)))
            .map((p) => ({
              permission: p,
              missing: missingRequirements(p, (key) =>
                effectiveGrants.has(cellKey(role.id, key))
              )
            }))
            .filter((item) => item.missing.length > 0)
        : [],
    [matrix.permissions, effectiveGrants, role]
  )
  const giveMissing = (keys: string[]) => {
    if (!role) return
    for (const key of new Set(keys)) {
      if (!lockedReason(role.id, key)) onToggle(role.id, key, true)
    }
  }

  // --- panel "Lo que cambia"
  const affectedUsers = useMemo(
    () =>
      Array.from(new Set(changes.map((c) => c.roleId))).reduce(
        (n, id) => n + (roleById.get(id)?.userCount ?? 0),
        0
      ),
    [changes, roleById]
  )
  const changesByRole = useMemo(() => {
    const out = new Map<number, PendingChange[]>()
    for (const c of changes) out.set(c.roleId, [...(out.get(c.roleId) ?? []), c])
    return Array.from(out.entries())
  }, [changes])

  const renderRoleItem = (r: RbacRole) => {
    const pending = pendingByRole.get(r.id) ?? 0
    const selected = r.id === roleId
    return (
      <ListItemButton
        key={r.id}
        selected={selected}
        onClick={() => setRoleId(r.id)}
        sx={{
          borderRadius: 1.5,
          mb: 0.5,
          alignItems: 'flex-start',
          opacity: r.isActive ? 1 : 0.55,
          '&.Mui-selected': { bgcolor: TEAL_SOFT, boxShadow: `inset 3px 0 0 ${TEAL}` },
          '&.Mui-selected:hover': { bgcolor: TEAL_SOFT }
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant='body2' fontWeight={selected ? 700 : 500} noWrap>
            {roleDisplayName(r)}
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            {r.userCount} {r.userCount === 1 ? 'usuario' : 'usuarios'} ·{' '}
            {grantedByRole.get(r.id) ?? 0} capacidades
            {!r.isActive ? ' · inactivo' : ''}
          </Typography>
        </Box>
        {pending > 0 && (
          <Tooltip title={`${pending} cambios sin guardar en este rol`}>
            <Chip
              size='small'
              label={pending}
              sx={{ bgcolor: AMBER, color: '#5d4037', fontWeight: 700, height: 20 }}
            />
          </Tooltip>
        )}
      </ListItemButton>
    )
  }

  return (
    <Grid container spacing={2} alignItems='flex-start'>
      {/* Roles */}
      <Grid item xs={12} md={3} lg={2.5}>
        <Paper elevation={2} sx={{ borderRadius: 2, p: 1.5 }}>
          <TextField
            size='small'
            fullWidth
            placeholder='Buscar rol…'
            value={roleSearch}
            onChange={(e) => setRoleSearch(e.target.value)}
            sx={{ mb: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon fontSize='small' />
                </InputAdornment>
              )
            }}
          />
          <List
            disablePadding
            sx={{ maxHeight: { xs: 260, md: 'calc(100vh - 280px)' }, overflowY: 'auto' }}
            aria-label='Roles'
          >
            {roleList.map(renderRoleItem)}
            {roleList.length === 0 && (
              <Typography variant='caption' color='text.secondary' sx={{ p: 1 }}>
                Ningún rol coincide con la búsqueda.
              </Typography>
            )}
          </List>
        </Paper>
      </Grid>

      {/* Capacidades del rol */}
      <Grid item xs={12} md={6} lg={6.5}>
        <Paper elevation={2} sx={{ borderRadius: 2, p: 2 }}>
          {role && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: TEAL_SOFT,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 1.5
              }}
            >
              <Typography variant='h6' fontWeight={700}>
                {roleDisplayName(role)}
              </Typography>
              <Chip
                size='small'
                label={`${grantedByRole.get(role.id) ?? 0} de ${matrix.permissions.length} capacidades`}
                sx={{ bgcolor: TEAL, color: '#fff', fontWeight: 600 }}
              />
              {!role.isActive && (
                <Chip size='small' color='warning' label='Rol inactivo' />
              )}
              {role.description && (
                <Typography variant='caption' color='text.secondary' sx={{ flexBasis: '100%' }}>
                  {role.description}
                </Typography>
              )}
              {canManage && (
                <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                  <Button
                    size='small'
                    onClick={() => onEditRole(role)}
                    sx={{ textTransform: 'none' }}
                  >
                    Editar rol
                  </Button>
                  {!role.isSystem && (
                    <Button
                      size='small'
                      color='inherit'
                      onClick={() => onToggleRole(role)}
                      sx={{ textTransform: 'none' }}
                    >
                      {role.isActive ? 'Desactivar' : 'Activar'}
                    </Button>
                  )}
                </Box>
              )}
            </Box>
          )}

          {/* Módulos: índice con contador del rol elegido */}
          <Box
            sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 2 }}
            role='group'
            aria-label='Filtrar por módulo'
          >
            <Chip
              label='Todos'
              onClick={() => setModuleFilter('')}
              sx={{
                bgcolor: moduleFilter === '' ? TEAL : 'transparent',
                color: moduleFilter === '' ? '#fff' : 'text.primary',
                border: '1px solid',
                borderColor: moduleFilter === '' ? TEAL : 'divider',
                fontWeight: 600
              }}
            />
            {modules.map((m) => {
              const c = countsByModule.get(m)
              const active = moduleFilter === m
              const empty = (c?.granted ?? 0) === 0
              return (
                <Chip
                  key={m}
                  onClick={() => setModuleFilter(active ? '' : m)}
                  label={`${moduleLabel(m)} ${c?.granted ?? 0}/${c?.total ?? 0}`}
                  sx={{
                    bgcolor: active ? TEAL : 'transparent',
                    color: active ? '#fff' : empty ? 'text.disabled' : 'text.primary',
                    border: '1px solid',
                    borderColor: active ? TEAL : 'divider'
                  }}
                />
              )
            })}
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 2 }}>
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
              sx={{ flex: 1, minWidth: 220 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon fontSize='small' />
                  </InputAdornment>
                )
              }}
            />
          </Box>

          {unmet.length > 0 && (
            <Alert
              severity='warning'
              icon={<WarningAmberIcon />}
              sx={{ mt: 2 }}
              action={
                editable ? (
                  <Button
                    color='inherit'
                    size='small'
                    onClick={() =>
                      giveMissing(unmet.flatMap((item) => item.missing))
                    }
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Dar las que faltan
                  </Button>
                ) : undefined
              }
            >
              {unmet.length === 1
                ? '1 capacidad de este rol necesita otras que no tiene.'
                : `${unmet.length} capacidades de este rol necesitan otras que no tiene.`}{' '}
              Sin ellas la persona vería pantallas vacías o botones que no puede
              usar.
            </Alert>
          )}

          {groups.length === 0 && (
            <Typography color='text.secondary' sx={{ py: 4, textAlign: 'center' }}>
              Ninguna capacidad coincide con el filtro. Cambia el módulo o
              limpia la búsqueda.
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
                    bgcolor: '#f5f5f5'
                  }}
                >
                  <Typography fontWeight={700}>
                    {moduleLabel(group.module)}{' '}
                    <Typography component='span' color='text.secondary'>
                      {c?.granted ?? 0} de {c?.total ?? 0}
                    </Typography>
                  </Typography>
                  {editable && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size='small'
                        onClick={() => setAll(keys, true)}
                        sx={{ textTransform: 'none', color: TEAL_DARK }}
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
                        bgcolor: changed ? AMBER_SOFT : 'transparent',
                        boxShadow: changed ? `inset 3px 0 0 ${AMBER}` : 'none'
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant='body2' sx={{ fontWeight: 600 }}>
                            {permissionPlainText(p).name}
                          </Typography>
                          <PermissionHelpButton
                            permission={p}
                            getGrantedRoles={() =>
                              grantedRoleNames(
                                matrix.roles,
                                (id) => effectiveGrants.has(cellKey(id, p.key)),
                                roleDisplayName
                              )
                            }
                          />
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
                        </Box>
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          component='div'
                        >
                          {permissionPlainText(p).what}
                        </Typography>
                        <Typography
                          variant='caption'
                          color='text.disabled'
                          component='div'
                          sx={{ fontFamily: 'monospace', fontSize: 10.5 }}
                        >
                          {p.key}
                        </Typography>
                        <ScreenInfo permissionKey={p.key} />
                        {granted &&
                          (() => {
                            const missing = missingRequirements(p, has)
                            if (missing.length === 0) return null
                            const givable = missing.filter(
                              (key) => !role || !lockedReason(role.id, key)
                            )
                            return (
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.75,
                                  flexWrap: 'wrap',
                                  mt: 0.75
                                }}
                              >
                                <WarningAmberIcon
                                  sx={{ fontSize: 16, color: '#d97706' }}
                                />
                                <Typography
                                  variant='caption'
                                  sx={{ color: '#92400e' }}
                                >
                                  Necesita también:{' '}
                                  {missing.map(requirementName).join(', ')}
                                </Typography>
                                {editable && givable.length > 0 && (
                                  <Button
                                    size='small'
                                    onClick={() => giveMissing(givable)}
                                    sx={{
                                      textTransform: 'none',
                                      py: 0,
                                      color: TEAL_DARK
                                    }}
                                  >
                                    Dar las que faltan
                                  </Button>
                                )}
                              </Box>
                            )
                          })()}
                      </Box>
                    </Box>
                  )
                })}
              </Box>
            )
          })}
        </Paper>
      </Grid>

      {/* Lo que cambia */}
      <Grid item xs={12} md={3} lg={3}>
        <Paper
          elevation={2}
          sx={{
            borderRadius: 2,
            p: 2,
            position: { md: 'sticky' },
            top: { md: 16 },
            border: changes.length > 0 ? `1px solid ${AMBER}` : '1px solid transparent',
            bgcolor: changes.length > 0 ? AMBER_SOFT : 'background.paper'
          }}
          role='region'
          aria-label='Lo que cambia'
        >
          <Typography variant='subtitle1' fontWeight={700}>
            Lo que cambia
          </Typography>
          {changes.length === 0 ? (
            <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
              Aún no hay cambios. Marca o desmarca una capacidad y verás aquí a
              quién afecta y qué pantallas aparecen o desaparecen.
            </Typography>
          ) : (
            <>
              <Typography variant='body2' sx={{ mt: 0.5 }}>
                {changes.length}{' '}
                {changes.length === 1 ? 'cambio sin guardar' : 'cambios sin guardar'}
                {affectedUsers > 0
                  ? `, hasta ${affectedUsers} ${affectedUsers === 1 ? 'usuario' : 'usuarios'}`
                  : ''}
              </Typography>
              <Box sx={{ maxHeight: { md: 'calc(100vh - 360px)' }, overflowY: 'auto', mt: 1 }}>
                {changesByRole.map(([id, items]) => {
                  const r = roleById.get(id)
                  return (
                    <Box key={id} sx={{ mb: 1.5 }}>
                      <Typography variant='caption' fontWeight={700}>
                        {r ? roleDisplayName(r) : 'Rol desconocido'}
                        {r ? ` · ${r.userCount} ${r.userCount === 1 ? 'usuario' : 'usuarios'}` : ''}
                      </Typography>
                      {items.map((c) => {
                        const screens = screensOf(c.permissionKey)
                        const perm = permissionByKey.get(c.permissionKey)
                        return (
                          <Box
                            key={c.permissionKey}
                            sx={{ display: 'flex', gap: 1, mt: 0.5 }}
                          >
                            <Typography
                              component='span'
                              fontWeight={700}
                              sx={{ color: c.granted ? TEAL_DARK : 'error.main', width: 14 }}
                            >
                              {c.granted ? '+' : '−'}
                            </Typography>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                variant='caption'
                                sx={{ fontFamily: 'monospace', fontWeight: 600, wordBreak: 'break-all' }}
                              >
                                {c.permissionKey}
                              </Typography>
                              {perm?.description && (
                                <Typography variant='caption' color='text.secondary' component='div'>
                                  {perm.description}
                                </Typography>
                              )}
                              {screens.length > 0 && (
                                <Typography variant='caption' color='text.secondary' component='div'>
                                  {c.granted ? 'Se habilita' : 'Se oculta'}:{' '}
                                  {screens.slice(0, 2).map((s) => s.label).join(', ')}
                                  {screens.length > 2 ? ` y ${screens.length - 2} más` : ''}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        )
                      })}
                    </Box>
                  )
                })}
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                <Button onClick={onDiscard} sx={{ textTransform: 'none' }}>
                  Descartar
                </Button>
                <Button
                  fullWidth
                  variant='contained'
                  onClick={onReview}
                  sx={{
                    textTransform: 'none',
                    bgcolor: TEAL,
                    '&:hover': { bgcolor: TEAL_DARK }
                  }}
                >
                  Revisar y guardar
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Grid>
    </Grid>
  )
}

export default RolePermissionsView
