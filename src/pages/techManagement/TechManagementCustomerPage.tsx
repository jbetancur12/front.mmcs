import { useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Box, Button, Card, Container, Tab, Tabs } from '@mui/material'
import { ArrowBack, MedicalServices } from '@mui/icons-material'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import { useTechCustomers } from '@hooks/useTechManagement'
import { useTechAccess } from 'src/Components/techManagement/useTechAccess'
import TechDashboardTab from 'src/Components/techManagement/TechDashboardTab'
import InventoryTab from 'src/Components/techManagement/InventoryTab'
import ScheduleTab from 'src/Components/techManagement/ScheduleTab'
import SurveillanceTab from 'src/Components/techManagement/SurveillanceTab'
import AlertMatchesTab from 'src/Components/techManagement/AlertMatchesTab'
import VisitFolderTab from 'src/Components/techManagement/VisitFolderTab'

type TabKey = 'resumen' | 'inventario' | 'cronograma' | 'tecnovigilancia' | 'alertas' | 'visita'

/** Gestión tecnológica de una institución: tablero, inventario, cronograma, tecnovigilancia, alertas y carpeta. */
const TechManagementCustomerPage = () => {
  const { customerId = '' } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const access = useTechAccess(customerId)
  const { data: customers = [] } = useTechCustomers()
  const customer = customers.find((item) => String(item.id) === customerId)

  const tabs = useMemo(() => {
    const list: { key: TabKey; label: string }[] = [
      { key: 'resumen', label: 'Resumen' },
      { key: 'inventario', label: 'Inventario' },
      { key: 'cronograma', label: 'Cronograma' }
    ]
    if (access.canViewSurveillance) {
      list.push({ key: 'tecnovigilancia', label: 'Tecnovigilancia' }, { key: 'alertas', label: 'Alertas INVIMA' })
    }
    list.push({ key: 'visita', label: 'Carpeta de visita' })
    return list
  }, [access.canViewSurveillance])

  const requested = searchParams.get('tab') as TabKey | null
  const current: TabKey = tabs.some((tab) => tab.key === requested) ? (requested as TabKey) : 'resumen'
  const goTo = (tab: TabKey) => setSearchParams({ tab }, { replace: true })

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Gestión tecnológica'
        subtitle={customer?.nombre || 'Inventario, cronograma y tecnovigilancia'}
        icon={<MedicalServices />}
        actions={
          access.isStaff && (
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/tech-management')}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Instituciones
            </Button>
          )
        }
      />

      <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid #e5e7eb', mb: 3 }}>
        <Tabs
          value={current}
          onChange={(_, value: TabKey) => goTo(value)}
          variant='scrollable'
          scrollButtons='auto'
          allowScrollButtonsMobile
          sx={{
            minHeight: 64,
            '& .MuiTab-root': { minHeight: 64, textTransform: 'none', fontWeight: 600 },
            '& .Mui-selected': { color: '#00BFA5 !important' },
            '& .MuiTabs-indicator': { bgcolor: '#00BFA5', height: 3 }
          }}
        >
          {tabs.map((tab) => (
            <Tab key={tab.key} value={tab.key} label={tab.label} />
          ))}
        </Tabs>
      </Card>

      <Box>
        {current === 'resumen' && <TechDashboardTab customerId={customerId} onNavigate={goTo} />}
        {current === 'inventario' && <InventoryTab customerId={customerId} />}
        {current === 'cronograma' && <ScheduleTab customerId={customerId} />}
        {current === 'tecnovigilancia' && <SurveillanceTab customerId={customerId} />}
        {current === 'alertas' && <AlertMatchesTab customerId={customerId} />}
        {current === 'visita' && <VisitFolderTab customerId={customerId} />}
      </Box>
    </Container>
  )
}

export default TechManagementCustomerPage
