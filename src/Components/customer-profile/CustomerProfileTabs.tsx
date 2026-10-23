import {
  Assignment,
  Business,
  CalendarToday,
  Devices,
  Insights,
  People,
  School,
  Settings,
  TrendingUp
} from '@mui/icons-material'
import { Box, Card, Tab, Tabs } from '@mui/material'
import React from 'react'

import { TabValue } from './types'

interface CustomerProfileTabsProps {
  activeTab: TabValue
  handleTabChange: (tab: TabValue) => void
  isMobile: boolean
  sedeCount: number
  showIndicatorsTab: boolean
  showServicesTab: boolean
  canListCustomerUsers: boolean
  canViewModules: boolean
  canManageLmsCourses: boolean
}

/** Etiqueta de pestaña con su conteo en una pastilla turquesa suave. */
const CountLabel = ({ text, count }: { text: string; count: number }) => (
  <Box
    component='span'
    sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}
  >
    {text}
    <Box
      component='span'
      sx={{
        px: 0.75,
        minWidth: 20,
        borderRadius: '999px',
        bgcolor: '#E0F7F4',
        color: '#00695C',
        fontSize: '0.75rem',
        fontWeight: 700,
        lineHeight: '20px',
        textAlign: 'center'
      }}
    >
      {count}
    </Box>
  </Box>
)

/** Pestañas de navegación de la ficha del cliente. */
const CustomerProfileTabs: React.FC<CustomerProfileTabsProps> = ({
  activeTab,
  handleTabChange,
  isMobile,
  sedeCount,
  showIndicatorsTab,
  showServicesTab,
  canListCustomerUsers,
  canViewModules,
  canManageLmsCourses
}) => (
  <Card
    elevation={0}
    sx={{ borderRadius: '16px', border: '1px solid #e5e7eb', mb: 3 }}
  >
    <Tabs
      value={activeTab}
      onChange={(_event, newValue) => {
        handleTabChange(newValue)
      }}
      variant={isMobile ? 'scrollable' : 'fullWidth'}
      scrollButtons='auto'
      sx={{
        '& .MuiTab-root': {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          minHeight: 72,
          minWidth: 0,
          px: 1,
          gap: 0.25,
          '&.Mui-selected': {
            color: '#10b981'
          }
        },
        '& .MuiTabs-indicator': {
          backgroundColor: '#10b981',
          height: 3,
          borderRadius: '3px 3px 0 0'
        }
      }}
    >
      <Tab
        value='overview'
        label='Resumen'
        icon={<TrendingUp />}
        iconPosition='top'
      />
      <Tab
        value='equipment'
        label='Equipos'
        icon={<Devices />}
        iconPosition='top'
      />
      {showIndicatorsTab && (
        <Tab
          value='indicators'
          label='Indicadores'
          icon={<Insights />}
          iconPosition='top'
        />
      )}
      {showServicesTab && (
        <Tab
          value='services'
          label='Servicios'
          icon={<Assignment />}
          iconPosition='top'
        />
      )}
      <Tab
        value='headquarters'
        label={<CountLabel text='Sedes' count={sedeCount} />}
        icon={<Business />}
        iconPosition='top'
      />
      <Tab
        value='schedule'
        label='Programación'
        icon={<CalendarToday />}
        iconPosition='top'
      />
      {canListCustomerUsers && (
        <Tab
          value='users'
          label='Usuarios'
          icon={<People />}
          iconPosition='top'
          onClick={() => {
            handleTabChange('users')
          }}
        />
      )}
      {canViewModules && (
        <Tab
          value='modules'
          label='Módulos'
          icon={<Settings />}
          iconPosition='top'
          onClick={() => {
            handleTabChange('modules')
          }}
        />
      )}
      {canManageLmsCourses && (
        <Tab
          value='lmsCourses'
          label='Academia'
          icon={<School />}
          iconPosition='top'
          onClick={() => {
            handleTabChange('lmsCourses')
          }}
        />
      )}
    </Tabs>
  </Card>
)

export default CustomerProfileTabs
