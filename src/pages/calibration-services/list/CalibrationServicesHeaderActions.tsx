import { useState } from 'react'
import { Button, Divider, IconButton, Menu, MenuItem, Stack } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import AddBusinessOutlinedIcon from '@mui/icons-material/AddBusinessOutlined'
import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import { useNavigate } from 'react-router-dom'
import { useCan } from '@utils/functions'
import { PERMISSIONS } from 'src/constants/permissions'
import CalibrationNotificationBell from '../CalibrationNotificationBell'
import { GuideDialog as BillingGuideDialog } from '../CalibrationBillingGuide'
import { CalibrationServicesListPermissions } from './useCalibrationServicesListPermissions'
import { CalibrationServicesListActions } from './useCalibrationServicesListActions'

interface CalibrationServicesHeaderActionsProps {
  permissions: CalibrationServicesListPermissions
  actions: CalibrationServicesListActions
}

const OUTLINED_SX = {
  color: '#00897B',
  borderColor: '#00BFA5',
  whiteSpace: 'nowrap',
  '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' }
} as const

/**
 * Acciones del encabezado: dos accesos frecuentes, campana, menú "Más acciones" (el resto de accesos, guías y
 * configuración) y el botón principal. Son pocas a propósito para que quepan en la misma línea del título.
 */
const CalibrationServicesHeaderActions = ({
  permissions,
  actions
}: CalibrationServicesHeaderActionsProps) => {
  const navigate = useNavigate()
  const canInvoice = useCan(PERMISSIONS.CALIBRATION_SERVICE_INVOICING)
  const [moreAnchorEl, setMoreAnchorEl] = useState<HTMLElement | null>(null)
  const [isBillingGuideOpen, setIsBillingGuideOpen] = useState(false)
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

  const closeMenu = () => setMoreAnchorEl(null)
  const go = (path: string) => () => {
    closeMenu()
    navigate(path)
  }
  const hasGuides = canViewModule || canInvoice
  const hasSettings =
    canCreateServices || canManageSlaConfig || canManageSequenceConfig

  return (
    <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap alignItems='center'>
      {canViewAnalytics ? (
        <Button variant='outlined' startIcon={<AnalyticsOutlinedIcon />} onClick={() => navigate('/calibration-services/analytics')} sx={OUTLINED_SX}>
          Analíticas
        </Button>
      ) : null}
      {canViewModule ? (
        <Button variant='outlined' startIcon={<CalendarMonthOutlinedIcon />} onClick={() => navigate('/calibration-services/schedule')} sx={OUTLINED_SX}>
          Agenda
        </Button>
      ) : null}
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
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {canCreateServices ? (
          <MenuItem onClick={go('/calibration-services/customers')}>
            <AddBusinessOutlinedIcon fontSize='small' sx={{ mr: 1 }} /> Clientes
          </MenuItem>
        ) : null}
        {canViewModule ? (
          <MenuItem onClick={go('/calibration-services/guia')}>
            <MenuBookOutlinedIcon fontSize='small' sx={{ mr: 1 }} /> Guía del flujo
          </MenuItem>
        ) : null}
        {canInvoice ? (
          <MenuItem onClick={() => { closeMenu(); setIsBillingGuideOpen(true) }}>
            <HelpOutlineIcon fontSize='small' sx={{ mr: 1 }} /> Guía de facturación
          </MenuItem>
        ) : null}
        {hasGuides && hasSettings ? <Divider component='li' /> : null}
        {canCreateServices ? (
          <MenuItem onClick={go('/calibration-services/productos-y-servicios')}>
            <Inventory2OutlinedIcon fontSize='small' sx={{ mr: 1 }} /> Productos
          </MenuItem>
        ) : null}
        {canManageSlaConfig ? (
          <MenuItem onClick={() => { closeMenu(); setIsSlaConfigDialogOpen(true) }}>
            <SettingsOutlinedIcon fontSize='small' sx={{ mr: 1 }} /> Configuración SLA
          </MenuItem>
        ) : null}
        {canManageSequenceConfig ? (
          <MenuItem onClick={() => { closeMenu(); setIsSequenceDialogOpen(true) }}>
            <SettingsOutlinedIcon fontSize='small' sx={{ mr: 1 }} /> Config. secuencia
          </MenuItem>
        ) : null}
        {canCreateServices ? (
          <MenuItem onClick={() => { closeMenu(); handleOpenTemplate() }}>
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
      {canInvoice ? (
        <BillingGuideDialog
          open={isBillingGuideOpen}
          onClose={() => setIsBillingGuideOpen(false)}
        />
      ) : null}
    </Stack>
  )
}

export default CalibrationServicesHeaderActions
