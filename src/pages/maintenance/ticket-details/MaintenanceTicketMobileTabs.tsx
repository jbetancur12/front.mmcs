import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material'
import {
  AssignmentTurnedInOutlined,
  BorderColorOutlined,
  ChatBubbleOutline,
  Inventory2Outlined
} from '@mui/icons-material'
import { brand, neutral } from 'src/theme/designTokens'

export type TicketMobileTab = 'work' | 'intake' | 'news' | 'close'

/** Alto de la barra inferior; el botón fijo de siguiente paso se apoya encima. */
export const MOBILE_TABS_HEIGHT = 64

interface MaintenanceTicketMobileTabsProps {
  value: TicketMobileTab
  onChange: (tab: TicketMobileTab) => void
}

/** Barra inferior del detalle del ticket en celular: Trabajo, Ingreso, Novedades y Cierre. */
const MaintenanceTicketMobileTabs = ({
  value,
  onChange
}: MaintenanceTicketMobileTabsProps) => {
  const actionSx = { '&.Mui-selected': { color: brand.ink } }

  return (
    <Paper
      elevation={0}
      component='nav'
      aria-label='Secciones del ticket'
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        borderTop: `1px solid ${neutral.border}`,
        pb: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      <BottomNavigation
        showLabels
        value={value}
        onChange={(_, tab: TicketMobileTab) => {
          onChange(tab)
          window.scrollTo({ top: 0 })
        }}
        sx={{ height: MOBILE_TABS_HEIGHT }}
      >
        <BottomNavigationAction
          value='work'
          label='Trabajo'
          icon={<AssignmentTurnedInOutlined />}
          sx={actionSx}
        />
        <BottomNavigationAction
          value='intake'
          label='Ingreso'
          icon={<Inventory2Outlined />}
          sx={actionSx}
        />
        <BottomNavigationAction
          value='news'
          label='Novedades'
          icon={<ChatBubbleOutline />}
          sx={actionSx}
        />
        <BottomNavigationAction
          value='close'
          label='Cierre'
          icon={<BorderColorOutlined />}
          sx={actionSx}
        />
      </BottomNavigation>
    </Paper>
  )
}

export default MaintenanceTicketMobileTabs
