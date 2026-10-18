import { useSearchParams } from 'react-router-dom'
import { Container, Paper, Tab, Tabs } from '@mui/material'
import { Apps } from '@mui/icons-material'

import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import ModulesView from 'src/Components/Modules/components/ModulesView'
import CustomerModulesMatrix from 'src/Components/Modules/components/CustomerModulesMatrix'
import { useCan } from '@utils/functions'
import { PERMISSIONS } from 'src/constants/permissions'

type ModulesTab = 'catalogo' | 'clientes'

const Modules = () => {
  const canViewCustomers = useCan(PERMISSIONS.CUSTOMERS_MODULE_VIEW)
  const [searchParams, setSearchParams] = useSearchParams()
  // Por defecto abre la matriz por cliente; el catálogo queda en ?tab=catalogo
  const tab: ModulesTab =
    canViewCustomers && searchParams.get('tab') !== 'catalogo' ? 'clientes' : 'catalogo'

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Módulos'
        subtitle={
          tab === 'clientes'
            ? 'Qué clientes tienen habilitado cada módulo; actívalos o desactívalos uno a uno o en grupo'
            : 'Módulos de la plataforma que se pueden asignar a cada empresa'
        }
        icon={<Apps />}
      />

      {canViewCustomers && (
        <Paper elevation={0} sx={{ mb: 3, borderRadius: 2, border: '1px solid #e5e7eb' }}>
          <Tabs
            value={tab}
            onChange={(_, value: ModulesTab) =>
              setSearchParams(value === 'catalogo' ? { tab: 'catalogo' } : {}, { replace: true })
            }
            TabIndicatorProps={{ sx: { bgcolor: '#00BFA5' } }}
            sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}
          >
            <Tab value='catalogo' label='Catálogo' />
            <Tab value='clientes' label='Por cliente' />
          </Tabs>
        </Paper>
      )}

      {tab === 'clientes' ? <CustomerModulesMatrix /> : <ModulesView />}
    </Container>
  )
}

export default Modules
