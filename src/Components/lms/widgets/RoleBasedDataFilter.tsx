import React from 'react'
import {
  Box,
  Chip,
  Typography,
  Alert,
  Tooltip,
  IconButton
} from '@mui/material'
import {
  FilterList as FilterIcon,
  School as SchoolIcon,
  AdminPanelSettings as AdminIcon,
  Visibility as VisibilityIcon,
  Info as InfoIcon
} from '@mui/icons-material'
import { useUserLMSRole, useUserPermissions, getRoleDisplayInfo } from '../../../utils/roleUtils'
import { LmsDashboardScope } from '../../../utils/lmsIdentity'

interface RoleBasedDataFilterProps {
  scope?: LmsDashboardScope
  department?: string
  showAlert?: boolean
  showFilterIcon?: boolean
  onScopeInfo?: () => void
}

const colors = {
  primary: '#10b981',
  primaryLight: '#f0fdf4',
  info: '#3b82f6',
  warning: '#d97706',
  gray: {
    500: '#6b7280',
    600: '#4b5563'
  }
}

const RoleBasedDataFilter: React.FC<RoleBasedDataFilterProps> = ({
  scope = 'admin',
  department,
  showAlert = false,
  showFilterIcon = true,
  onScopeInfo
}) => {
  const userRole = useUserLMSRole()
  const permissions = useUserPermissions()
  const roleInfo = getRoleDisplayInfo(userRole)

  const getScopeInfo = () => {
    switch (scope) {
      case 'training_manager':
        return {
          label: 'Vista Gestor de Capacitación',
          description: 'Datos filtrados para cursos bajo su gestión',
          icon: <SchoolIcon sx={{ fontSize: 16 }} />,
          color: colors.primary
        }
      case 'limited':
        return {
          label: `Vista Operativa${department ? ` - ${department}` : ''}`,
          description: 'Datos acotados al contexto operativo disponible',
          icon: <VisibilityIcon sx={{ fontSize: 16 }} />,
          color: colors.info
        }
      default:
        return {
          label: 'Vista Administrador',
          description: 'Vista completa del sistema',
          icon: <AdminIcon sx={{ fontSize: 16 }} />,
          color: colors.gray[600]
        }
    }
  }

  const scopeInfo = getScopeInfo()

  const getFilterDescription = () => {
    const restrictions = []
    
    if (permissions.scopeRestrictions?.coursesOnly) {
      restrictions.push('cursos gestionados')
    }
    if (permissions.scopeRestrictions?.usersOnly) {
      restrictions.push('usuarios asignados')
    }

    if (restrictions.length === 0) {
      return 'Sin restricciones de datos'
    }

    return `Datos limitados a: ${restrictions.join(', ')}`
  }

  if (scope === 'admin' && !showAlert) {
    return null
  }

  return (
    <Box>
      {showAlert && scope !== 'admin' && (
        <Alert
          severity="info"
          sx={{ 
            mb: 2,
            bgcolor: `${scopeInfo.color}08`,
            border: `1px solid ${scopeInfo.color}20`,
            '& .MuiAlert-icon': {
              color: scopeInfo.color
            }
          }}
          icon={scopeInfo.icon}
          action={
            onScopeInfo && (
              <Tooltip title="Información sobre permisos">
                <IconButton
                  size="small"
                  onClick={onScopeInfo}
                  sx={{ color: scopeInfo.color }}
                >
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )
          }
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {scopeInfo.label}
          </Typography>
          <Typography variant="caption" display="block">
            {scopeInfo.description}
          </Typography>
        </Alert>
      )}

      {showFilterIcon && scope !== 'admin' && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1, 
          mb: 1,
          p: 1,
          bgcolor: colors.primaryLight,
          borderRadius: 1,
          border: `1px solid ${colors.primary}20`
        }}>
          <FilterIcon sx={{ color: colors.primary, fontSize: 16 }} />
          <Typography variant="caption" sx={{ 
            color: colors.primary,
            fontWeight: 600,
            flex: 1
          }}>
            {getFilterDescription()}
          </Typography>
          <Chip
            label={roleInfo.label}
            size="small"
            sx={{
              bgcolor: colors.primary,
              color: 'white',
              fontSize: '0.65rem',
              height: 20
            }}
          />
        </Box>
      )}
    </Box>
  )
}

export default RoleBasedDataFilter
