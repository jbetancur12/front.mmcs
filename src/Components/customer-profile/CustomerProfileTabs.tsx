import {
  Business,
  CalendarToday,
  Devices,
  People,
  School,
  Settings,
  TrendingUp
} from '@mui/icons-material'
import { Badge, Card, Tab, Tabs } from '@mui/material'
import React from 'react'

import { TabValue } from './types'

interface CustomerProfileTabsProps {
  activeTab: TabValue
  handleTabChange: (tab: TabValue) => void
  isMobile: boolean
  totalEquipment: number
  sedeCount: number
  canListCustomerUsers: boolean
  canViewModules: boolean
  canManageLmsCourses: boolean
}

/** Pestañas de navegación de la ficha del cliente. */
const CustomerProfileTabs: React.FC<CustomerProfileTabsProps> = ({
  activeTab,
  handleTabChange,
  isMobile,
  totalEquipment,
  sedeCount,
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
      onChange={(event, newValue) => {
        console.log('Tabs onChange triggered:', {
          event,
          newValue,
          currentActiveTab: activeTab
        })
        handleTabChange(newValue)
      }}
      variant={isMobile ? 'scrollable' : 'fullWidth'}
      scrollButtons='auto'
      sx={{
        '& .MuiTab-root': {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          minHeight: 64,
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
        iconPosition='start'
      />
      <Tab
        value='equipment'
        label='Equipos'
        icon={
          <Badge badgeContent={totalEquipment} color='primary'>
            <Devices />
          </Badge>
        }
        iconPosition='start'
      />
      <Tab
        value='headquarters'
        label='Sedes'
        icon={
          <Badge badgeContent={sedeCount} color='primary'>
            <Business />
          </Badge>
        }
        iconPosition='start'
      />
      <Tab
        value='schedule'
        label='Programación'
        icon={<CalendarToday />}
        iconPosition='start'
      />
      {canListCustomerUsers && (
        <Tab
          value='users'
          label='Usuarios'
          icon={<People />}
          iconPosition='start'
          onClick={() => {
            console.log('Users tab clicked directly')
            handleTabChange('users')
          }}
        />
      )}
      {canViewModules && (
        <Tab
          value='modules'
          label='Módulos'
          icon={<Settings />}
          iconPosition='start'
          onClick={() => {
            console.log('Modules tab clicked directly')
            handleTabChange('modules')
          }}
        />
      )}
      {canManageLmsCourses && (
        <Tab
          value='lmsCourses'
          label='Academia'
          icon={<School />}
          iconPosition='start'
          onClick={() => {
            handleTabChange('lmsCourses')
          }}
        />
      )}
    </Tabs>
  </Card>
)

export default CustomerProfileTabs
