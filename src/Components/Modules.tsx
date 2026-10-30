import SignalLoader from 'src/Components/Common/SignalLoader'
import React, { useState } from 'react'
import {
  Alert,
  Box,
  Card,
  CardContent,
  Grid,
  Switch,
  Typography
} from '@mui/material'
import {
  Extension,
  Settings,
  Dashboard,
  People,
  Assessment,
  Security,
  Storage,
  CloudSync
} from '@mui/icons-material'
import {
  useCustomerModules,
  useToggleCustomerModule
} from 'src/hooks/modules/useModules'
import { useCan } from '@utils/functions'
import { PERMISSIONS } from 'src/constants/permissions'
import { useStore } from '@nanostores/react'
import { Module, userStore } from 'src/store/userStore'
import { notify } from 'src/utils/notify'
import { BASIC_MODULE } from 'src/constants/modules'
import ConfirmDialog from './Common/ConfirmDialog'
import EmptyState from './Common/EmptyState'
import StatusPill from './Common/StatusPill'

import { logger } from 'src/utils/logger'
interface CustomerModulesProps {
  customerId?: string | number
}

const Modules: React.FC<CustomerModulesProps> = ({ customerId }) => {
  const canAssignModules = useCan(PERMISSIONS.CUSTOMERS_MODULE_ASSIGN)
  const currentUser = useStore(userStore)
  const [updating, setUpdating] = useState<number | null>(null)
  const [pendingOff, setPendingOff] = useState<Module | null>(null)

  const {
    data: customerModules = [],
    isLoading,
    isIdle,
    isError
  } = useCustomerModules<Module>(customerId, {
    onError: () => {
      notify.error('Error al cargar los módulos')
    }
  })
  // Sin customerId la vista se queda en estado de carga, como antes
  const loading = isLoading || isIdle
  // 'Basic' es el marcador de módulos core: siempre visible, su switch no tendría efecto
  const modules = customerModules.filter((m) => m.name !== BASIC_MODULE)
  const error = isError ? 'Error al obtener los módulos' : null
  const toggleModule = useToggleCustomerModule(customerId)

  const handleModuleChange = async (moduleId: number, isActive: boolean) => {
    try {
      setUpdating(moduleId)
      await toggleModule.mutateAsync({
        moduleId,
        isActive,
        updaterName: currentUser?.nombre
      })

      notify.success(
        `Módulo ${isActive ? 'activado' : 'desactivado'} exitosamente`
      )
    } catch (error) {
      notify.error('Error al actualizar el módulo')
      logger.error('Error updating module:', error)
    } finally {
      setUpdating(null)
      setPendingOff(null)
    }
  }

  // Activar es inmediato; quitar el acceso al cliente pide confirmación.
  const requestChange = (module: Module, isActive: boolean) => {
    if (isActive) handleModuleChange(module.id, true)
    else setPendingOff(module)
  }

  const lastChange = (module: Module) => {
    const { isActive, updatedAt, updater } = module.customerModules
    if (!updatedAt) return 'Sin cambios registrados'
    const date = new Date(updatedAt).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
    const who = updater?.nombre ? ` por ${updater.nombre}` : ''
    return `${isActive ? 'Activado' : 'Desactivado'}${who} el ${date}`
  }

  const getModuleIcon = (moduleLabel: string) => {
    const label = moduleLabel.toLowerCase()
    if (label.includes('dashboard') || label.includes('tablero'))
      return Dashboard
    if (label.includes('user') || label.includes('usuario')) return People
    if (label.includes('report') || label.includes('reporte')) return Assessment
    if (label.includes('security') || label.includes('seguridad'))
      return Security
    if (label.includes('storage') || label.includes('almacen')) return Storage
    if (label.includes('sync') || label.includes('sincroniz')) return CloudSync
    if (label.includes('config') || label.includes('configurac'))
      return Settings
    return Extension
  }

  if (loading) {
    return <SignalLoader message='Cargando módulos...' />
  }

  if (error) {
    return <Alert severity='error'>{error}</Alert>
  }

  if (modules.length === 0) {
    return (
      <EmptyState
        icon={<Extension />}
        title='No hay módulos disponibles'
        hint='Este cliente no tiene módulos para configurar.'
      />
    )
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {modules.map((module) => {
          const IconComponent = getModuleIcon(module.label)
          const isActive = module.customerModules.isActive
          const isUpdating = updating === module.id

          return (
            <Grid item xs={12} sm={6} md={4} key={module.id}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  borderRadius: '16px',
                  border: `1px solid ${isActive ? '#00BFA5' : '#e5e7eb'}`,
                  bgcolor: '#fff',
                  boxShadow: 'none',
                  opacity: isUpdating ? 0.7 : 1
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1.5,
                      mb: 2
                    }}
                  >
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}
                    >
                      <Box
                        aria-hidden
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '12px',
                          display: 'grid',
                          placeItems: 'center',
                          bgcolor: isActive ? '#E0F7F4' : '#f3f4f6',
                          color: isActive ? '#00695C' : '#6b7280'
                        }}
                      >
                        <IconComponent sx={{ fontSize: 22 }} />
                      </Box>
                      <Typography
                        variant='subtitle1'
                        fontWeight={700}
                        sx={{ color: '#111827' }}
                      >
                        {module.label}
                      </Typography>
                    </Box>
                    <StatusPill
                      size='small'
                      tone={isActive ? 'success' : 'idle'}
                      label={isActive ? 'Activo' : 'Inactivo'}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'space-between',
                      gap: 1
                    }}
                  >
                    <Typography variant='caption' color='text.secondary'>
                      {lastChange(module)}
                    </Typography>
                    <Switch
                      checked={isActive}
                      onChange={(e) => requestChange(module, e.target.checked)}
                      disabled={isUpdating || !canAssignModules}
                      inputProps={{
                        'aria-label': `${isActive ? 'Desactivar' : 'Activar'} ${module.label}`
                      }}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#00BFA5'
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':
                          { backgroundColor: '#00BFA5' }
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      <ConfirmDialog
        open={Boolean(pendingOff)}
        title={`Desactivar ${pendingOff?.label ?? 'módulo'}`}
        message={
          <>
            Este cliente dejará de tener acceso a{' '}
            <strong>{pendingOff?.label}</strong>. Sus usuarios dejan de ver el
            módulo de inmediato.
          </>
        }
        confirmLabel='Desactivar'
        tone='danger'
        loading={updating !== null}
        onConfirm={() => pendingOff && handleModuleChange(pendingOff.id, false)}
        onClose={() => setPendingOff(null)}
      />
    </Box>
  )
}

export default Modules
