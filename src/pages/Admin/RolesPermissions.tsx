import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Tab,
  Tabs,
  Typography
} from '@mui/material'
import { useStore } from '@nanostores/react'
import AddIcon from '@mui/icons-material/Add'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import GroupsIcon from '@mui/icons-material/Groups'
import VpnKeyIcon from '@mui/icons-material/VpnKey'
import ViewModuleIcon from '@mui/icons-material/ViewModule'
import LmsPageHeader from '../../Components/lms/admin/LmsPageHeader'
import LmsStatCard from '../../Components/lms/admin/LmsStatCard'
import PermissionMatrix, {
  cellKey
} from '../../Components/Rbac/PermissionMatrix'
import RolePermissionsView from '../../Components/Rbac/RolePermissionsView'
import RbacAuditTable from '../../Components/Rbac/RbacAuditTable'
import ChangesDialog, {
  PendingChange
} from '../../Components/Rbac/ChangesDialog'
import {
  CreateRoleDialog,
  EditRoleDialog,
  ToggleRoleDialog
} from '../../Components/Rbac/RoleDialogs'
import {
  useRbacMatrix,
  useRefreshRbac,
  useUpdateRolePermissions
} from '../../hooks/useRbac'
import { userStore } from '../../store/userStore'
import { useCan } from '@utils/functions'
import { PERMISSIONS } from 'src/constants/permissions'
import { ROLES } from 'src/constants/roles'
import { RbacRole } from '../../types/rbac'
import { rbacErrorMessage } from '../../utils/rbacErrors'
import { notify } from 'src/utils/notify'

const TEAL = '#00BFA5'

const RolesPermissions: React.FC = () => {
  const [tab, setTab] = useState<'matrix' | 'role' | 'audit'>('role')
  const { data: matrix, isLoading, isError } = useRbacMatrix()
  const refresh = useRefreshRbac()
  const updatePermissions = useUpdateRolePermissions()
  const $userStore = useStore(userStore)
  const canManage = useCan(PERMISSIONS.RBAC_MANAGE)
  const isSuperAdmin = $userStore.rol.includes(ROLES.SUPER_ADMIN)

  // Cambios sin guardar: "rolId|capacidad" -> estado deseado (true = otorgada)
  const [pending, setPending] = useState<Record<string, boolean>>({})
  const [reviewOpen, setReviewOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveErrors, setSaveErrors] = useState<Record<number, string>>({})
  const [createOpen, setCreateOpen] = useState(false)
  const [editRole, setEditRole] = useState<RbacRole | null>(null)
  const [toggleRole, setToggleRole] = useState<RbacRole | null>(null)

  const roleById = useMemo(
    () => new Map((matrix?.roles ?? []).map((r) => [r.id, r])),
    [matrix?.roles]
  )
  const permissionByKey = useMemo(
    () => new Map((matrix?.permissions ?? []).map((p) => [p.key, p])),
    [matrix?.permissions]
  )
  const serverGrants = useMemo(
    () =>
      new Set(
        (matrix?.grants ?? []).map((g) => cellKey(g.roleId, g.permissionKey))
      ),
    [matrix?.grants]
  )

  // Lo concedido ya con los cambios pendientes aplicados
  const effectiveGrants = useMemo(() => {
    const next = new Set(serverGrants)
    for (const [key, granted] of Object.entries(pending)) {
      if (granted) next.add(key)
      else next.delete(key)
    }
    return next
  }, [serverGrants, pending])

  const changedCells = useMemo(() => new Set(Object.keys(pending)), [pending])

  const changes = useMemo<PendingChange[]>(
    () =>
      Object.entries(pending).map(([key, granted]) => {
        const [roleId, ...rest] = key.split('|')
        return { roleId: Number(roleId), permissionKey: rest.join('|'), granted }
      }),
    [pending]
  )

  // Un cambio que vuelve al valor del servidor deja de ser un cambio
  const handleToggle = useCallback(
    (roleId: number, permissionKey: string, granted: boolean) => {
      const key = cellKey(roleId, permissionKey)
      setPending((prev) => {
        const next = { ...prev }
        if (serverGrants.has(key) === granted) delete next[key]
        else next[key] = granted
        return next
      })
    },
    [serverGrants]
  )

  /**
   * Por qué una casilla no se puede cambiar. Son las mismas reglas que aplica el backend
   * (que es quien manda): aquí solo evitan que alguien intente algo que será rechazado.
   */
  const lockedReason = useCallback(
    (roleId: number, permissionKey: string): string | null => {
      const role = roleById.get(roleId)
      const permission = permissionByKey.get(permissionKey)
      if (!role || !permission) return null

      if (permission.isSensitive && !isSuperAdmin) {
        return 'Capacidad sensible: solo un super administrador puede cambiarla'
      }

      const granted = effectiveGrants.has(cellKey(roleId, permissionKey))

      if (
        !granted &&
        $userStore.rol.includes(role.name) &&
        !($userStore.permissions ?? []).includes(permissionKey)
      ) {
        return 'No puedes otorgarte una capacidad que no tienes'
      }

      if (granted && permissionKey === PERMISSIONS.RBAC_MANAGE) {
        const otherHolders = (matrix?.roles ?? []).filter(
          (r) =>
            r.id !== roleId &&
            r.isActive &&
            effectiveGrants.has(cellKey(r.id, permissionKey))
        )
        if (otherHolders.length === 0) {
          return 'Es el último rol activo con esta capacidad: nadie podría volver a gestionar permisos'
        }
      }
      return null
    },
    [
      roleById,
      permissionByKey,
      isSuperAdmin,
      effectiveGrants,
      $userStore.rol,
      $userStore.permissions,
      matrix?.roles
    ]
  )

  // Avisar antes de cerrar la pestaña con cambios sin guardar
  useEffect(() => {
    if (changes.length === 0) return undefined
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [changes.length])

  const save = async () => {
    setSaving(true)
    setSaveErrors({})
    const byRole = new Map<number, { grant: string[]; revoke: string[] }>()
    for (const change of changes) {
      const entry = byRole.get(change.roleId) ?? { grant: [], revoke: [] }
      ;(change.granted ? entry.grant : entry.revoke).push(change.permissionKey)
      byRole.set(change.roleId, entry)
    }

    const errors: Record<number, string> = {}
    const savedRoleIds = new Set<number>()
    // Un rol por petición: cada una es atómica en el servidor. Si una falla, las demás siguen.
    for (const [roleId, { grant, revoke }] of byRole) {
      try {
        await updatePermissions.mutateAsync({ roleId, grant, revoke })
        savedRoleIds.add(roleId)
      } catch (e) {
        errors[roleId] = rbacErrorMessage(e)
      }
    }

    setPending((prev) => {
      const next = { ...prev }
      for (const key of Object.keys(prev)) {
        if (savedRoleIds.has(Number(key.split('|')[0]))) delete next[key]
      }
      return next
    })
    await refresh()
    setSaving(false)

    if (Object.keys(errors).length === 0) {
      setReviewOpen(false)
      notify.success('Cambios guardados. Rigen desde la siguiente petición de cada usuario.')
    } else {
      setSaveErrors(errors)
      notify.error(savedRoleIds.size > 0
            ? 'Algunos roles se guardaron y otros no. Revisa los avisos.'
            : 'No se pudo guardar. Revisa los avisos.')
    }
  }

  const stats = useMemo(() => {
    if (!matrix) return { roles: 0, permissions: 0, modules: 0 }
    return {
      roles: matrix.roles.filter((r) => r.isActive).length,
      permissions: matrix.permissions.length,
      // "rbac" es la propia administración de permisos, no un módulo operativo
      modules: new Set(
        matrix.permissions.filter((p) => p.module !== 'rbac').map((p) => p.module)
      ).size
    }
  }, [matrix])

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Roles y permisos'
        subtitle='Qué puede hacer cada rol en cada módulo y en qué pantallas se refleja'
        icon={<AdminPanelSettingsIcon />}
        actions={
          canManage ? (
            <Button
              variant='contained'
              startIcon={<AddIcon />}
              onClick={() => setCreateOpen(true)}
              sx={{
                textTransform: 'none',
                bgcolor: TEAL,
                '&:hover': { bgcolor: '#00ACC1' }
              }}
            >
              Nuevo rol
            </Button>
          ) : undefined
        }
      />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <LmsStatCard variant='quiet'
            label='Roles activos'
            value={stats.roles}
            icon={<GroupsIcon />}
            tone='teal'
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <LmsStatCard variant='quiet'
            label='Capacidades'
            value={stats.permissions}
            icon={<VpnKeyIcon />}
            tone='blue'
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <LmsStatCard variant='quiet'
            label='Módulos gestionados'
            value={stats.modules}
            icon={<ViewModuleIcon />}
            tone='green'
          />
        </Grid>
      </Grid>

      <Alert severity='info' sx={{ mb: 3 }}>
        Marca o desmarca una capacidad para dar o quitar ese permiso a un rol. Bajo
        cada capacidad verás las pantallas de la plataforma donde interviene. Los
        cambios se aplican de inmediato y quedan en la auditoría.
      </Alert>
      {!canManage && (
        <Alert severity='warning' sx={{ mb: 3 }}>
          Puedes ver los permisos, pero no cambiarlos: te falta la capacidad
          rbac:manage.
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{ mb: 2, borderRadius: 2, border: '1px solid #e5e7eb' }}
      >
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          TabIndicatorProps={{ sx: { bgcolor: TEAL } }}
          sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}
        >
          <Tab value='role' label='Por rol' />
          <Tab value='matrix' label='Comparar roles' />
          <Tab value='audit' label='Auditoría' />
        </Tabs>
      </Paper>

      {(tab === 'matrix' || tab === 'role') && (
        <>
          {isError && (
            <Alert severity='error'>
              No se pudo cargar la matriz de permisos. Intenta de nuevo.
            </Alert>
          )}
          {isLoading && (
            <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
              Cargando matriz…
            </Box>
          )}
          {matrix && tab === 'role' && (
            <RolePermissionsView
              matrix={matrix}
              editable={canManage}
              effectiveGrants={effectiveGrants}
              changedCells={changedCells}
              changes={changes}
              canManage={canManage}
              lockedReason={lockedReason}
              onToggle={handleToggle}
              onDiscard={() => {
                setPending({})
                setSaveErrors({})
              }}
              onReview={() => setReviewOpen(true)}
              onEditRole={setEditRole}
              onToggleRole={setToggleRole}
            />
          )}
          {matrix && tab === 'matrix' && (
            <PermissionMatrix
              matrix={matrix}
              editable={canManage}
              effectiveGrants={effectiveGrants}
              changedCells={changedCells}
              lockedReason={lockedReason}
              onToggle={handleToggle}
              canManage={canManage}
              onEditRole={setEditRole}
              onToggleRole={setToggleRole}
            />
          )}
        </>
      )}
      {tab === 'audit' && <RbacAuditTable />}

      {changes.length > 0 && tab !== 'role' && (
        <Paper
          elevation={8}
          sx={{
            position: 'sticky',
            bottom: 16,
            mt: 2,
            p: 1.5,
            px: 2,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
            border: '1px solid #ffb74d',
            bgcolor: '#fff8e1',
            zIndex: 5
          }}
          role='region'
          aria-label='Cambios sin guardar'
        >
          <Typography fontWeight={600}>
            {changes.length}{' '}
            {changes.length === 1 ? 'cambio sin guardar' : 'cambios sin guardar'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              onClick={() => {
                setPending({})
                setSaveErrors({})
              }}
              sx={{ textTransform: 'none' }}
            >
              Descartar
            </Button>
            <Button
              variant='contained'
              onClick={() => setReviewOpen(true)}
              sx={{
                textTransform: 'none',
                bgcolor: TEAL,
                '&:hover': { bgcolor: '#00897B' }
              }}
            >
              Revisar y guardar
            </Button>
          </Box>
        </Paper>
      )}

      {matrix && (
        <ChangesDialog
          open={reviewOpen}
          matrix={matrix}
          changes={changes}
          ownRoleNames={$userStore.rol}
          saving={saving}
          errors={saveErrors}
          onCancel={() => setReviewOpen(false)}
          onConfirm={save}
        />
      )}
      <CreateRoleDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onDone={(message) => notify.success(message)}
      />
      <EditRoleDialog
        role={editRole}
        onClose={() => setEditRole(null)}
        onDone={(message) => notify.success(message)}
      />
      <ToggleRoleDialog
        role={toggleRole}
        onClose={() => setToggleRole(null)}
        onDone={(message) => notify.success(message)}
      />

    </Container>
  )
}

export default RolesPermissions
