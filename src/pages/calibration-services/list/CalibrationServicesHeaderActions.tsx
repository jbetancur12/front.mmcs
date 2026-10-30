import { useState } from 'react'
import { Button, IconButton, Menu, MenuItem, Stack } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import AddBusinessOutlinedIcon from '@mui/icons-material/AddBusinessOutlined'
import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import { useNavigate } from 'react-router-dom'
import CalibrationNotificationBell from '../CalibrationNotificationBell'
import CalibrationBillingGuide from '../CalibrationBillingGuide'
import { CalibrationServicesListPermissions } from './useCalibrationServicesListPermissions'
import { CalibrationServicesListActions } from './useCalibrationServicesListActions'

interface CalibrationServicesHeaderActionsProps {
  permissions: CalibrationServicesListPermissions
  actions: CalibrationServicesListActions
}

/** Acciones del encabezado: accesos, campana, menú de configuración y nuevo servicio. */
const CalibrationServicesHeaderActions = ({
  permissions,
  actions
}: CalibrationServicesHeaderActionsProps) => {
  const navigate = useNavigate()
  const [moreAnchorEl, setMoreAnchorEl] = useState<HTMLElement | null>(null)
  const {
    canViewAnalytics,
    canViewModule,
    canCreateServices,
    canManageSlaConfig,
    canManageSequenceConfig
  } = permissions
  const {
    sequenceConfig,
    setIsSlaConfigDialogOpen,
    setIsSequenceDialogOpen,
    handleOpenTemplate
  } = actions

  return (
    <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap alignItems='center'>
      {canViewAnalytics ? (
        <Button variant='outlined' startIcon={<AnalyticsOutlinedIcon />} onClick={() => navigate('/calibration-services/analytics')} sx={{ color: '#00897B', borderColor: '#00BFA5', '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' } }}>
          Analíticas
        </Button>
      ) : null}
      {canViewModule ? (
        <Button variant='outlined' startIcon={<CalendarMonthOutlinedIcon />} onClick={() => navigate('/calibration-services/schedule')} sx={{ color: '#00897B', borderColor: '#00BFA5', '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' } }}>
          Agenda
        </Button>
      ) : null}
      {canCreateServices ? (
        <Button variant='outlined' startIcon={<AddBusinessOutlinedIcon />} onClick={() => navigate('/calibration-services/customers')} sx={{ color: '#00897B', borderColor: '#00BFA5', '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' } }}>
          Clientes
        </Button>
      ) : null}
      {canViewModule ? (
        <Button variant='outlined' startIcon={<MenuBookOutlinedIcon />} onClick={() => navigate('/calibration-services/guia')} sx={{ color: '#00897B', borderColor: '#00BFA5', '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' } }}>
          Guía del flujo
        </Button>
      ) : null}
      <CalibrationBillingGuide />
      <CalibrationNotificationBell />
      <IconButton
        aria-label='Más acciones'
        aria-haspopup='menu'
        onClick={(e) => setMoreAnchorEl(e.currentTarget)}
      >
        <MoreVertIcon />
      </IconButton>
  <Menu
    anchorEl={moreAnchorEl}
    open={Boolean(moreAnchorEl)}
    onClose={() => setMoreAnchorEl(null)}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
  >
    {canCreateServices ? (
      <MenuItem onClick={() => { setMoreAnchorEl(null); navigate('/calibration-services/productos-y-servicios') }}>
        <Inventory2OutlinedIcon fontSize='small' sx={{ mr: 1 }} /> Productos
      </MenuItem>
    ) : null}
    {canManageSlaConfig ? (
      <MenuItem onClick={() => { setMoreAnchorEl(null); setIsSlaConfigDialogOpen(true) }}>
        <SettingsOutlinedIcon fontSize='small' sx={{ mr: 1 }} /> Configuración SLA
      </MenuItem>
    ) : null}
    {canManageSequenceConfig ? (
      <MenuItem onClick={() => { setMoreAnchorEl(null); setIsSequenceDialogOpen(true) }}>
        <SettingsOutlinedIcon fontSize='small' sx={{ mr: 1 }} /> Config. secuencia
      </MenuItem>
    ) : null}
    {canCreateServices ? (
      <MenuItem onClick={() => { setMoreAnchorEl(null); handleOpenTemplate() }}>
        <SaveOutlinedIcon fontSize='small' sx={{ mr: 1 }} /> Plantilla términos
      </MenuItem>
    ) : null}
  </Menu>
      {canCreateServices ? (
        <Button
          variant='contained'
          startIcon={<AddIcon />}
          onClick={() => navigate('/calibration-services/new')}
          disabled={canManageSequenceConfig && !sequenceConfig?.initialized}
          sx={{ bgcolor: '#00BFA5', whiteSpace: 'nowrap', '&:hover': { bgcolor: '#00ACC1' } }}
        >
          Nuevo servicio
        </Button>
      ) : null}
    </Stack>
  )
}

export default CalibrationServicesHeaderActions
