import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  InputAdornment,
  TextField,
  Typography
} from '@mui/material'
import { Business, CampaignOutlined, MedicalServices, Search } from '@mui/icons-material'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import { useTechCustomers } from '@hooks/useTechManagement'
import { useTechAccess } from 'src/Components/techManagement/useTechAccess'
import { TEAL, TEAL_SOFT } from 'src/Components/techManagement/techUi'

/**
 * Entrada al módulo. El usuario de una IPS va directo a su empresa; el personal de Metromedics elige una de las
 * empresas con el módulo activo y tiene a mano el catálogo de alertas del INVIMA.
 */
const TechManagementHome = () => {
  const navigate = useNavigate()
  const access = useTechAccess()
  const { data: customers = [], isLoading, isError } = useTechCustomers()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return customers
    return customers.filter(
      (customer) =>
        customer.nombre.toLowerCase().includes(term) || (customer.identificacion || '').toLowerCase().includes(term)
    )
  }, [customers, search])

  if (access.ownCustomerId) {
    return <Navigate to={`/tech-management/customers/${access.ownCustomerId}`} replace />
  }

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Gestión tecnológica'
        subtitle='Inventario, cronograma, indicador de cumplimiento y tecnovigilancia de cada institución'
        icon={<MedicalServices />}
        actions={
          access.canManageAlerts && (
            <Button
              variant='outlined'
              startIcon={<CampaignOutlined />}
              onClick={() => navigate('/tech-management/alerts')}
              sx={{ textTransform: 'none', fontWeight: 600, borderColor: TEAL, color: TEAL }}
            >
              Alertas INVIMA
            </Button>
          )
        }
      />

      <TextField
        size='small'
        placeholder='Buscar institución'
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        sx={{ mb: 3, width: { xs: '100%', sm: 320 } }}
        inputProps={{ 'aria-label': 'Buscar institución' }}
        InputProps={{
          startAdornment: (
            <InputAdornment position='start'>
              <Search fontSize='small' />
            </InputAdornment>
          )
        }}
      />

      {isLoading && (
        <Box display='flex' justifyContent='center' py={6}>
          <CircularProgress />
        </Box>
      )}
      {isError && <Alert severity='error'>No se pudieron cargar las instituciones.</Alert>}
      {!isLoading && !isError && customers.length === 0 && (
        <Alert severity='info'>
          Ninguna institución tiene el módulo de Gestión tecnológica activo. Actívalo desde el perfil del cliente, en
          Módulos.
        </Alert>
      )}

      <Grid container spacing={3}>
        {filtered.map((customer) => (
          <Grid item xs={12} sm={6} lg={4} key={customer.id}>
            <Card elevation={2} sx={{ borderRadius: 2, height: '100%' }}>
              <CardActionArea
                onClick={() => navigate(`/tech-management/customers/${customer.id}`)}
                sx={{ height: '100%' }}
              >
                <CardContent>
                  <Box display='flex' alignItems='center' gap={1.5} mb={2}>
                    <Avatar sx={{ bgcolor: TEAL, width: 36, height: 36 }}>
                      <Business fontSize='small' />
                    </Avatar>
                    <Box minWidth={0}>
                      <Typography fontWeight={600} noWrap>
                        {customer.nombre}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {[customer.identificacion, customer.ciudad].filter(Boolean).join(' · ')}
                      </Typography>
                    </Box>
                  </Box>
                  <Box display='flex' flexWrap='wrap' gap={1}>
                    <Chip size='small' label={`${customer.equipment} equipos`} sx={{ bgcolor: TEAL_SOFT }} />
                    {customer.overdue > 0 && (
                      <Chip size='small' color='error' variant='outlined' label={`${customer.overdue} vencidos`} />
                    )}
                    {customer.upcoming > 0 && (
                      <Chip size='small' color='warning' variant='outlined' label={`${customer.upcoming} próximos`} />
                    )}
                    {customer.unscheduled > 0 && (
                      <Chip size='small' variant='outlined' label={`${customer.unscheduled} sin programar`} />
                    )}
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  )
}

export default TechManagementHome
