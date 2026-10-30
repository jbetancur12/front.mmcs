import SignalLoader from 'src/Components/Common/SignalLoader'
import React, { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  InputAdornment,
  Paper,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import LockIcon from '@mui/icons-material/Lock'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import SearchIcon from '@mui/icons-material/Search'
import LmsPageHeader from '../../Components/lms/admin/LmsPageHeader'
import {
  moduleLabel,
  roleDisplayName
} from '../../Components/Rbac/PermissionMatrix'
import { permissionPlainText } from '../../Components/Rbac/PermissionHelp'
import { requirementName } from '../../Components/Rbac/requirements'
import { PERMISSION_SCREENS } from 'src/constants/permissionScreens'
import { useRbacMatrix } from '../../hooks/useRbac'
import { RbacPermission } from '../../types/rbac'

const TEAL = '#00BFA5'
const TEAL_DARK = '#00897B'

/** Minúsculas y sin tildes, para que "calibracion" encuentre "calibración". */
const normalize = (text: string) =>
  text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

interface WikiEntry {
  permission: RbacPermission
  name: string
  what: string
  where: string | null
  screens: { label: string; kind: string }[]
  roles: string[]
  haystack: string
}

/**
 * Wiki de capacidades: todas las capacidades del catálogo explicadas en lenguaje sencillo, con un buscador
 * por palabra clave (nombre, explicación, clave técnica, pantallas y roles). Solo lectura: para quien entra al
 * panel de roles (rbac:view). Cada tarjeta tiene su ancla (#clave) para compartir el enlace.
 */
const RolesHelp: React.FC = () => {
  const { data: matrix, isLoading, isError } = useRbacMatrix()
  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState<string | null>(null)

  const entries = useMemo<WikiEntry[]>(() => {
    if (!matrix) return []
    const activeRoles = new Map(
      matrix.roles.filter((r) => r.isActive).map((r) => [r.id, r])
    )
    const rolesByKey = new Map<string, string[]>()
    for (const g of matrix.grants) {
      const role = activeRoles.get(g.roleId)
      if (!role) continue
      const list = rolesByKey.get(g.permissionKey) ?? []
      list.push(roleDisplayName(role))
      rolesByKey.set(g.permissionKey, list)
    }
    return matrix.permissions.map((permission) => {
      const text = permissionPlainText(permission)
      const screens = (PERMISSION_SCREENS[permission.key] ?? []).filter(
        (s) => s.kind !== 'related'
      )
      const roles = rolesByKey.get(permission.key) ?? []
      return {
        permission,
        name: text.name,
        what: text.what,
        where: text.where,
        screens,
        roles,
        haystack: normalize(
          [
            text.name,
            text.what,
            text.where ?? '',
            permission.key,
            permission.description ?? '',
            moduleLabel(permission.module),
            ...screens.map((s) => s.label),
            ...roles
          ].join(' ')
        )
      }
    })
  }, [matrix])

  const visible = useMemo(() => {
    const words = normalize(search).split(/\s+/).filter(Boolean)
    return entries.filter(
      (e) =>
        (!moduleFilter || e.permission.module === moduleFilter) &&
        words.every((w) => e.haystack.includes(w))
    )
  }, [entries, search, moduleFilter])

  const modules = useMemo(
    () =>
      Array.from(new Set(entries.map((e) => e.permission.module))).sort(
        (a, b) => moduleLabel(a).localeCompare(moduleLabel(b), 'es')
      ),
    [entries]
  )

  const groups = useMemo(
    () =>
      modules
        .map((module) => ({
          module,
          items: visible.filter((e) => e.permission.module === module)
        }))
        .filter((g) => g.items.length > 0),
    [modules, visible]
  )

  // Enlace compartido (#clave): al cargar las tarjetas, baja hasta la capacidad
  useEffect(() => {
    if (entries.length === 0 || !window.location.hash) return
    const id = decodeURIComponent(window.location.hash.slice(1))
    document.getElementById(id)?.scrollIntoView({ block: 'start' })
  }, [entries.length])

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Guía de capacidades'
        subtitle='Qué permite cada capacidad, dónde se nota y qué roles la tienen'
        icon={<MenuBookIcon />}
        actions={
          <Button
            component={RouterLink}
            to='/settings/roles'
            startIcon={<ArrowBackIcon />}
            sx={{ textTransform: 'none', color: TEAL_DARK }}
          >
            Volver a Roles y permisos
          </Button>
        }
      />

      <Paper
        elevation={0}
        sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid #e5e7eb' }}
      >
        <TextField
          fullWidth
          size='small'
          autoFocus
          placeholder='Busca por palabra: precio, certificado, WhatsApp, factura, un rol…'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon fontSize='small' />
              </InputAdornment>
            )
          }}
          inputProps={{ 'aria-label': 'Buscar en la guía de capacidades' }}
        />
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
          <Chip
            label={`Todos los módulos ${entries.length}`}
            clickable
            onClick={() => setModuleFilter(null)}
            variant={moduleFilter === null ? 'filled' : 'outlined'}
            sx={
              moduleFilter === null
                ? {
                    bgcolor: TEAL,
                    color: '#fff',
                    '&:hover': { bgcolor: TEAL_DARK }
                  }
                : undefined
            }
          />
          {modules.map((module) => (
            <Chip
              key={module}
              label={`${moduleLabel(module)} ${
                entries.filter((e) => e.permission.module === module).length
              }`}
              clickable
              onClick={() => setModuleFilter(module)}
              variant={moduleFilter === module ? 'filled' : 'outlined'}
              sx={
                moduleFilter === module
                  ? {
                      bgcolor: TEAL,
                      color: '#fff',
                      '&:hover': { bgcolor: TEAL_DARK }
                    }
                  : undefined
              }
            />
          ))}
        </Box>
      </Paper>

      {isError && (
        <Alert severity='error'>
          No se pudo cargar la guía. Intenta de nuevo.
        </Alert>
      )}
      {isLoading && (
        <SignalLoader message='Cargando guía...' />
      )}
      {matrix && groups.length === 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 2,
            border: '1px solid #e5e7eb'
          }}
        >
          <Typography color='text.secondary'>
            Ninguna capacidad coincide con la búsqueda.
          </Typography>
        </Paper>
      )}

      {matrix && groups.length > 0 && (
        <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
          {visible.length} {visible.length === 1 ? 'capacidad' : 'capacidades'}
        </Typography>
      )}

      {groups.map((group) => (
        <Box key={group.module} sx={{ mb: 3 }}>
          <Typography
            variant='h6'
            fontWeight={700}
            sx={{ color: '#00695C', mb: 1.5 }}
          >
            {moduleLabel(group.module)}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'minmax(0, 1fr)',
                md: 'repeat(2, minmax(0, 1fr))'
              },
              gap: 2
            }}
          >
            {group.items.map((e) => (
              <Paper
                key={e.permission.key}
                id={e.permission.key}
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid #e5e7eb',
                  scrollMarginTop: 80
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    flexWrap: 'wrap'
                  }}
                >
                  <Typography fontWeight={700}>{e.name}</Typography>
                  {e.permission.isSensitive && (
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
                  component='div'
                  sx={{ fontFamily: 'monospace', color: 'text.disabled' }}
                >
                  {e.permission.key}
                </Typography>
                <Typography variant='body2' sx={{ mt: 1 }}>
                  {e.what}
                </Typography>
                {e.where && (
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ mt: 0.5 }}
                  >
                    <strong>Dónde se nota:</strong> {e.where}
                  </Typography>
                )}
                {e.screens.length > 0 && (
                  <Box
                    sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}
                  >
                    {e.screens.map((s) => (
                      <Chip
                        key={s.label + s.kind}
                        size='small'
                        variant='outlined'
                        label={
                          s.kind === 'action' ? `${s.label} (botón)` : s.label
                        }
                        sx={{
                          height: 22,
                          fontSize: 11,
                          borderColor: s.kind === 'screen' ? TEAL : 'divider',
                          color:
                            s.kind === 'screen' ? TEAL_DARK : 'text.secondary',
                          bgcolor:
                            s.kind === 'screen' ? '#E0F7F4' : 'transparent'
                        }}
                      />
                    ))}
                  </Box>
                )}
                {(e.permission.requires ?? []).length > 0 && (
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ mt: 0.5 }}
                  >
                    <strong>Necesita también:</strong>{' '}
                    {(e.permission.requires ?? [])
                      .map(requirementName)
                      .join(', ')}
                  </Typography>
                )}
                <Box sx={{ mt: 1.5 }}>
                  <Typography variant='caption' color='text.secondary'>
                    Quién la tiene
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 0.5,
                      mt: 0.5
                    }}
                  >
                    {e.roles.length === 0 ? (
                      <Typography variant='caption' color='text.disabled'>
                        Ningún rol
                      </Typography>
                    ) : (
                      e.roles.map((role) => (
                        <Chip key={role} size='small' label={role} />
                      ))
                    )}
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        </Box>
      ))}
    </Container>
  )
}

export default RolesHelp
