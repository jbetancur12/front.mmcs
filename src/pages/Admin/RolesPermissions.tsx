import React, { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Container,
  Grid,
  Paper,
  Tab,
  Tabs
} from '@mui/material'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import GroupsIcon from '@mui/icons-material/Groups'
import VpnKeyIcon from '@mui/icons-material/VpnKey'
import ViewModuleIcon from '@mui/icons-material/ViewModule'
import LmsPageHeader from '../../Components/lms/admin/LmsPageHeader'
import LmsStatCard from '../../Components/lms/admin/LmsStatCard'
import PermissionMatrix from '../../Components/Rbac/PermissionMatrix'
import RbacAuditTable from '../../Components/Rbac/RbacAuditTable'
import { useRbacMatrix } from '../../hooks/useRbac'

const RolesPermissions: React.FC = () => {
  const [tab, setTab] = useState<'matrix' | 'audit'>('matrix')
  const { data: matrix, isLoading, isError } = useRbacMatrix()

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
        subtitle='Qué puede hacer cada rol en los módulos que ya se gestionan desde aquí'
        icon={<AdminPanelSettingsIcon />}
      />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <LmsStatCard
            label='Roles activos'
            value={stats.roles}
            icon={<GroupsIcon />}
            tone='teal'
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <LmsStatCard
            label='Capacidades'
            value={stats.permissions}
            icon={<VpnKeyIcon />}
            tone='blue'
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <LmsStatCard
            label='Módulos gestionados'
            value={stats.modules}
            icon={<ViewModuleIcon />}
            tone='green'
          />
        </Grid>
      </Grid>

      <Alert severity='info' sx={{ mb: 3 }}>
        Por ahora solo los módulos que aparecen en la matriz se controlan desde
        este panel. El resto de la aplicación sigue con sus permisos fijos por
        rol y se irá migrando módulo por módulo.
      </Alert>

      <Paper
        elevation={0}
        sx={{ mb: 2, borderRadius: 2, border: '1px solid #e5e7eb' }}
      >
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          TabIndicatorProps={{ sx: { bgcolor: '#00BFA5' } }}
          sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}
        >
          <Tab value='matrix' label='Matriz de permisos' />
          <Tab value='audit' label='Auditoría' />
        </Tabs>
      </Paper>

      {tab === 'matrix' && (
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
          {matrix && <PermissionMatrix matrix={matrix} />}
        </>
      )}
      {tab === 'audit' && <RbacAuditTable />}
    </Container>
  )
}

export default RolesPermissions
