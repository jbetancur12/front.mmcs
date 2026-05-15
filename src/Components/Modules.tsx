import React, { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  Typography,
  FormControlLabel,
  Box,
  Grid,
  Avatar,
  Chip,
  Fade,
  Alert,
  Switch,
  Skeleton,
  Tooltip
} from '@mui/material'
import {
  Extension,
  CheckCircle,
  Cancel,
  Settings,
  Dashboard,
  People,
  Assessment,
  Security,
  Storage,
  CloudSync
} from '@mui/icons-material'
import useAxiosPrivate from '@utils/use-axios-private'
import { Module } from 'src/store/userStore'
import { bigToast } from './ExcelManipulation/Utils'

interface CustomerModulesProps {
  customerId?: string | number
}

const Modules: React.FC<CustomerModulesProps> = ({ customerId }) => {
  const axiosPrivate = useAxiosPrivate()
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<number | null>(null)

  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoading(true)
        const response = await axiosPrivate.get(`/customers/${customerId}/modules`)
        setModules(response.data)
      } catch (error) {
        setError('Error al obtener los módulos')
        bigToast('Error al cargar los módulos', 'error')
      } finally {
        setLoading(false)
      }
    }

    if (customerId) {
      fetchModules()
    }
  }, [customerId, axiosPrivate])

  const handleModuleChange = async (moduleId: number, isActive: boolean) => {
    try {
      setUpdating(moduleId)
      await axiosPrivate.put(`/customers/${customerId}/modules`, {
        moduleId,
        isActive
      })
      
      // Actualiza el estado local
      setModules((prevModules) =>
        prevModules.map((module) =>
          module.id === moduleId
            ? {
                ...module,
                customerModules: { ...module.customerModules, isActive }
              }
            : module
        )
      )
      
      bigToast(
        `Módulo ${isActive ? 'activado' : 'desactivado'} exitosamente`, 
        'success'
      )
    } catch (error) {
      bigToast('Error al actualizar el módulo', 'error')
      console.error('Error updating module:', error)
    } finally {
      setUpdating(null)
    }
  }

  const getModuleIcon = (moduleLabel: string) => {
    const label = moduleLabel.toLowerCase()
    if (label.includes('dashboard') || label.includes('tablero')) return Dashboard
    if (label.includes('user') || label.includes('usuario')) return People
    if (label.includes('report') || label.includes('reporte')) return Assessment
    if (label.includes('security') || label.includes('seguridad')) return Security
    if (label.includes('storage') || label.includes('almacen')) return Storage
    if (label.includes('sync') || label.includes('sincroniz')) return CloudSync
    if (label.includes('config') || label.includes('configurac')) return Settings
    return Extension
  }

  const getModuleColor = (isActive: boolean) => {
    return isActive 
      ? { bg: '#f0fdf4', color: '#059669', border: '#10b981' }
      : { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb' }
  }

  if (loading) {
    return (
      <Box sx={{ py: 2 }}>
        <Box display="flex" alignItems="center" mb={4}>
          <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
          <Box>
            <Skeleton variant="text" width={200} height={24} />
            <Skeleton variant="text" width={150} height={20} />
          </Box>
        </Box>
        
        <Grid container spacing={3}>
          {[...Array(6)].map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rectangular" width="100%" height={120} sx={{ borderRadius: '12px' }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    )
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ 
          borderRadius: '12px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca'
        }}
      >
        <Typography variant="body1" fontWeight="600">
          Error al cargar los módulos
        </Typography>
        <Typography variant="body2">
          {error}
        </Typography>
      </Alert>
    )
  }

  return (
    <Box sx={{ py: 2 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={4}>
        <Avatar 
          sx={{ 
            backgroundColor: '#10b981',
            mr: 2,
            width: 40,
            height: 40
          }}
        >
          <Extension />
        </Avatar>
        <Box>
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#1f2937' }}>
            Módulos del Cliente
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            {modules.length} {modules.length === 1 ? 'módulo disponible' : 'módulos disponibles'}
          </Typography>
        </Box>
      </Box>

      {/* Modules Grid */}
      {modules.length === 0 ? (
        <Alert 
          severity="info" 
          sx={{ 
            borderRadius: '12px',
            backgroundColor: '#f0f9ff',
            border: '1px solid #bfdbfe'
          }}
        >
          <Typography variant="body2">
            No hay módulos disponibles para este cliente.
          </Typography>
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {modules.map((module, index) => {
            const IconComponent = getModuleIcon(module.label)
            const colors = getModuleColor(module.customerModules.isActive)
            const isUpdating = updating === module.id
            
            return (
              <Grid item xs={12} sm={6} md={4} key={module.id}>
                <Fade in={true} timeout={300 + index * 100}>
                  <Card 
                    elevation={0}
                    sx={{ 
                      border: `2px solid ${colors.border}`,
                      borderRadius: '12px',
                      transition: 'all 0.3s ease-in-out',
                      backgroundColor: colors.bg,
                      opacity: isUpdating ? 0.7 : 1,
                      '&:hover': {
                        borderColor: '#10b981',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      {/* Module Header */}
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Box display="flex" alignItems="center">
                          <Avatar 
                            sx={{ 
                              backgroundColor: module.customerModules.isActive ? '#10b981' : '#e5e7eb',
                              mr: 2,
                              width: 40,
                              height: 40
                            }}
                          >
                            <IconComponent 
                              sx={{ 
                                color: module.customerModules.isActive ? 'white' : '#6b7280',
                                fontSize: 20 
                              }} 
                            />
                          </Avatar>
                          <Box>
                            <Typography 
                              variant="h6" 
                              fontWeight="600" 
                              sx={{ 
                                color: colors.color,
                                fontSize: '1rem'
                              }}
                            >
                              {module.label}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Chip
                          icon={module.customerModules.isActive ? <CheckCircle /> : <Cancel />}
                          label={module.customerModules.isActive ? "Activo" : "Inactivo"}
                          size="small"
                          sx={{
                            backgroundColor: module.customerModules.isActive ? '#f0fdf4' : '#fef2f2',
                            color: module.customerModules.isActive ? '#059669' : '#dc2626',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            '& .MuiChip-icon': {
                              color: module.customerModules.isActive ? '#059669' : '#dc2626'
                            }
                          }}
                        />
                      </Box>
                      
                      {/* Module Toggle */}
                      <Box display="flex" justifyContent="center" mt={2}>
                        <Tooltip title={`${module.customerModules.isActive ? 'Desactivar' : 'Activar'} módulo`}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={module.customerModules.isActive}
                                onChange={(e) => handleModuleChange(module.id, e.target.checked)}
                                disabled={isUpdating}
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': {
                                    color: '#10b981',
                                    '&:hover': {
                                      backgroundColor: 'rgba(16, 185, 129, 0.04)',
                                    },
                                  },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                    backgroundColor: '#10b981',
                                  },
                                }}
                              />
                            }
                            label={
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: colors.color,
                                  fontWeight: 600 
                                }}
                              >
                                {module.customerModules.isActive ? 'Desactivar' : 'Activar'}
                              </Typography>
                            }
                            labelPlacement="start"
                            sx={{ 
                              m: 0,
                              width: '100%',
                              justifyContent: 'space-between'
                            }}
                          />
                        </Tooltip>
                      </Box>
                    </CardContent>
                  </Card>
                </Fade>
              </Grid>
            )
          })}
        </Grid>
      )}
    </Box>
  )
}

export default Modules
