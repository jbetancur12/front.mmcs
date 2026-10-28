import { Alert, Box, Button, Chip, Paper, Typography } from '@mui/material'
import React, { useMemo, useState } from 'react'

import { PERMISSION_SCREENS } from 'src/constants/permissionScreens'
import { moduleLabel } from '../Rbac/PermissionMatrix'
import { requirementName } from '../Rbac/requirements'
import { combinationNotes } from './roleSummary'
import { AssignableRole, Role } from './types'

interface RoleChangePreviewProps {
  /** Roles que tiene hoy la persona (vacío al crear la cuenta). */
  before: Role[]
  /** Roles que quedarían al guardar. */
  after: Role[]
  rolesList?: AssignableRole[]
}

const keysOf = (roles: Role[], byId: Map<number, AssignableRole>) =>
  new Set(roles.flatMap((role) => byId.get(role.id)?.permissions ?? []))

const screensOf = (keys: string[]) => [
  ...new Set(
    keys.flatMap((key) =>
      (PERMISSION_SCREENS[key] ?? [])
        .filter((screen) => screen.kind === 'screen')
        .map((screen) => screen.label)
    )
  )
]

const byModule = (keys: string[]) => {
  const groups = new Map<string, string[]>()
  for (const key of keys) {
    const module = key.split(':')[0]
    groups.set(module, [...(groups.get(module) ?? []), requirementName(key)])
  }
  return [...groups.entries()].sort((a, b) =>
    moduleLabel(a[0]).localeCompare(moduleLabel(b[0]), 'es')
  )
}

// Pantallas que se muestran de entrada; el resto se despliega con "y N más"
const MAX_SCREENS = 8

interface ChangeBlockProps {
  title: string
  keys: string[]
  tone: 'gain' | 'loss'
}

/** Pantallas que aparecen o desaparecen y, desplegable, el detalle de acciones por módulo. */
const ChangeBlock: React.FC<ChangeBlockProps> = ({ title, keys, tone }) => {
  const [open, setOpen] = useState(false)
  const [allScreens, setAllScreens] = useState(false)
  const screens = useMemo(() => screensOf(keys), [keys])
  const groups = useMemo(() => byModule(keys), [keys])
  if (keys.length === 0) return null

  const color = tone === 'gain' ? '#00695C' : '#b45309'
  const bg = tone === 'gain' ? '#E0F7F4' : '#fff7ed'

  return (
    <Box sx={{ mt: 1.5 }}>
      <Typography variant='body2' fontWeight={700} sx={{ color }}>
        {title}
      </Typography>
      {screens.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.5,
            mt: 0.5,
            alignItems: 'center'
          }}
        >
          {(allScreens ? screens : screens.slice(0, MAX_SCREENS)).map(
            (label) => (
              <Chip
                key={label}
                size='small'
                label={label}
                sx={{ bgcolor: bg, color, fontWeight: 500 }}
              />
            )
          )}
          {screens.length > MAX_SCREENS && (
            <Button
              size='small'
              onClick={() => setAllScreens((value) => !value)}
              sx={{ textTransform: 'none', py: 0, color }}
            >
              {allScreens
                ? 'Ver menos'
                : `y ${screens.length - MAX_SCREENS} más`}
            </Button>
          )}
        </Box>
      )}
      <Typography variant='caption' color='text.secondary' component='div'>
        {keys.length} {keys.length === 1 ? 'capacidad' : 'capacidades'} en{' '}
        {groups.length} {groups.length === 1 ? 'módulo' : 'módulos'}
        {screens.length === 0 ? ' (sin pantallas nuevas en el menú)' : ''}
        <Button
          size='small'
          onClick={() => setOpen((value) => !value)}
          sx={{ textTransform: 'none', py: 0, ml: 0.5, color }}
        >
          {open ? 'Ocultar detalle' : 'Ver detalle'}
        </Button>
      </Typography>
      {open && (
        <Box sx={{ mt: 0.5, pl: 1 }}>
          {groups.map(([module, names]) => (
            <Typography key={module} variant='caption' component='div'>
              <strong>{moduleLabel(module)}:</strong> {names.join(', ')}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  )
}

/**
 * Qué cambia para la persona con los roles elegidos: pantallas y capacidades que gana o pierde, y avisos de
 * combinaciones cuyo efecto no se ve en la lista. Se calcula con las capacidades de cada rol
 * (`GET /roles/for-assignment`), así que coincide con lo que el API aplica al guardar.
 */
const RoleChangePreview: React.FC<RoleChangePreviewProps> = ({
  before,
  after,
  rolesList = []
}) => {
  const byId = useMemo(
    () => new Map(rolesList.map((role) => [role.id, role])),
    [rolesList]
  )
  const { gained, lost, changed } = useMemo(() => {
    const previous = keysOf(before, byId)
    const next = keysOf(after, byId)
    const beforeIds = new Set(before.map((role) => role.id))
    const afterIds = new Set(after.map((role) => role.id))
    return {
      gained: [...next].filter((key) => !previous.has(key)).sort(),
      lost: [...previous].filter((key) => !next.has(key)).sort(),
      changed:
        beforeIds.size !== afterIds.size ||
        [...afterIds].some((id) => !beforeIds.has(id))
    }
  }, [before, after, byId])
  const notes = useMemo(
    () => combinationNotes(after.map((role) => role.name)),
    [after]
  )

  if (after.length === 0 && before.length === 0) return null

  const creating = before.length === 0

  return (
    <Paper
      variant='outlined'
      sx={{ p: 1.5, mt: 2, borderRadius: 2, borderColor: '#e5e7eb' }}
      aria-label='Qué cambia con estos roles'
    >
      <Typography variant='subtitle2' fontWeight={700}>
        {creating ? 'Qué podrá hacer' : 'Qué cambia con estos roles'}
      </Typography>
      {!changed && !creating && (
        <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
          Sin cambios en los roles.
        </Typography>
      )}
      {(changed || creating) && gained.length === 0 && lost.length === 0 && (
        <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
          {creating
            ? 'Con estos roles todavía no puede usar ninguna pantalla: elige un rol de trabajo.'
            : 'No cambia lo que la persona puede hacer.'}
        </Typography>
      )}
      <ChangeBlock
        title={creating ? 'Podrá usar' : 'Ganará acceso a'}
        keys={gained}
        tone='gain'
      />
      <ChangeBlock title='Perderá acceso a' keys={lost} tone='loss' />
      {notes.map((note) => (
        <Alert key={note} severity='info' sx={{ mt: 1.5 }}>
          {note}
        </Alert>
      ))}
      {changed && !creating && (
        <Typography
          variant='caption'
          color='text.secondary'
          component='div'
          sx={{ mt: 1.5 }}
        >
          El cambio rige al guardar y queda en la auditoría. Si la persona está
          conectada, ve sus menús nuevos sin cerrar sesión.
        </Typography>
      )}
    </Paper>
  )
}

export default RoleChangePreview
