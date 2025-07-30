import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Badge,
  LinearProgress,
  Grid,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Divider
} from '@mui/material'
import {
  People as PeopleIcon,
  MenuBook as BookOpenIcon,
  EmojiEvents as AwardIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  BarChart as BarChartIcon,
  Logout as LogoutIcon,
  LocalOffer as LocalOfferIcon,
  Person as PersonIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@nanostores/react'
import { userStore } from '../../../store/userStore'

interface User {
  id: number
  email: string
  role: string
  name: string
}

interface AdminDashboardProps {
  user?: User
}

// Mock data para estadísticas
const mockStats = {
  totalUsers: 2547,
  totalCourses: 156,
  totalCertificates: 1203,
  completionRate: 87,
  activeUsers: 1834,
  newUsersThisMonth: 234
}

const LmsAdmin: React.FC<AdminDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState(0)
  const navigate = useNavigate()
  const $userStore = useStore(userStore)

  // Usar el usuario del store si no se proporciona uno
  const currentUser = user || {
    id: $userStore.customer?.id || 1,
    email: $userStore.email || '',
    role: 'admin',
    name: $userStore.nombre || $userStore.email || 'Administrador'
  }

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    navigate('/')
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'create-course':
        navigate('/lms/admin/courses')
        break
      case 'add-user':
        navigate('/lms/admin/users')
        break
      case 'analytics':
        navigate('/lms/admin/analytics')
        break
      case 'categories':
        // Navegar a categorías cuando se implemente
        break
      case 'settings':
        // Navegar a configuración cuando se implemente
        break
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header */}
      <Paper elevation={1} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Box
          sx={{
            maxWidth: 'xl',
            mx: 'auto',
            px: { xs: 2, sm: 3, lg: 4 },
            py: 2
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Box>
              <Typography
                variant='h4'
                component='h1'
                sx={{ fontWeight: 'bold', color: 'text.primary' }}
              >
                Panel de Administración LMS
              </Typography>
              <Typography variant='body1' color='text.secondary'>
                Bienvenido, {currentUser.name}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Badge
                badgeContent='Administrador'
                color='primary'
                sx={{ '& .MuiBadge-badge': { fontSize: '0.75rem' } }}
              />
              <Button
                variant='outlined'
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                size='small'
              >
                Cerrar Sesión
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>

      <Box
        sx={{ maxWidth: 'xl', mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, py: 4 }}
      >
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 4 }}>
          <Tab label='Resumen' />
          <Tab label='Usuarios' />
          <Tab label='Cursos' />
          <Tab label='Analíticas' />
        </Tabs>

        {activeTab === 0 && (
          <Box sx={{ space: 3 }}>
            {/* Estadísticas principales */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} lg={3}>
                <Card>
                  <CardHeader
                    avatar={<PeopleIcon color='primary' />}
                    title='Total Usuarios'
                    titleTypographyProps={{
                      variant: 'body2',
                      color: 'text.secondary'
                    }}
                  />
                  <CardContent>
                    <Typography
                      variant='h4'
                      component='div'
                      sx={{ fontWeight: 'bold' }}
                    >
                      {mockStats.totalUsers.toLocaleString()}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      +{mockStats.newUsersThisMonth} este mes
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} lg={3}>
                <Card>
                  <CardHeader
                    avatar={<BookOpenIcon color='success' />}
                    title='Cursos Activos'
                    titleTypographyProps={{
                      variant: 'body2',
                      color: 'text.secondary'
                    }}
                  />
                  <CardContent>
                    <Typography
                      variant='h4'
                      component='div'
                      sx={{ fontWeight: 'bold' }}
                    >
                      {mockStats.totalCourses}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      12 nuevos este mes
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} lg={3}>
                <Card>
                  <CardHeader
                    avatar={<AwardIcon color='warning' />}
                    title='Certificados Emitidos'
                    titleTypographyProps={{
                      variant: 'body2',
                      color: 'text.secondary'
                    }}
                  />
                  <CardContent>
                    <Typography
                      variant='h4'
                      component='div'
                      sx={{ fontWeight: 'bold' }}
                    >
                      {mockStats.totalCertificates.toLocaleString()}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      +89 esta semana
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} lg={3}>
                <Card>
                  <CardHeader
                    avatar={<TrendingUpIcon color='info' />}
                    title='Tasa de Finalización'
                    titleTypographyProps={{
                      variant: 'body2',
                      color: 'text.secondary'
                    }}
                  />
                  <CardContent>
                    <Typography
                      variant='h4'
                      component='div'
                      sx={{ fontWeight: 'bold' }}
                    >
                      {mockStats.completionRate}%
                    </Typography>
                    <LinearProgress
                      variant='determinate'
                      value={mockStats.completionRate}
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Actividad reciente y acciones rápidas */}
            <Grid container spacing={3}>
              <Grid item xs={12} lg={6}>
                <Card>
                  <CardHeader title='Actividad Reciente' />
                  <CardContent>
                    <Box sx={{ space: 2 }}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: 'success.main',
                            mr: 2
                          }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant='body2' fontWeight='medium'>
                            Nuevo curso creado
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            JavaScript Avanzado - hace 2 horas
                          </Typography>
                        </Box>
                      </Box>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            mr: 2
                          }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant='body2' fontWeight='medium'>
                            Usuario registrado
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            Ana López - hace 4 horas
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: 'warning.main',
                            mr: 2
                          }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant='body2' fontWeight='medium'>
                            Certificado emitido
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            React Fundamentals - hace 6 horas
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} lg={6}>
                <Card>
                  <CardHeader title='Acciones Rápidas' />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Button
                          variant='contained'
                          fullWidth
                          sx={{ height: 80, flexDirection: 'column' }}
                          onClick={() => handleQuickAction('create-course')}
                          startIcon={<AddIcon />}
                        >
                          Crear Curso
                        </Button>
                      </Grid>
                      <Grid item xs={6}>
                        <Button
                          variant='outlined'
                          fullWidth
                          sx={{ height: 80, flexDirection: 'column' }}
                          onClick={() => handleQuickAction('add-user')}
                          startIcon={<PersonIcon />}
                        >
                          Agregar Usuario
                        </Button>
                      </Grid>
                      <Grid item xs={6}>
                        <Button
                          variant='outlined'
                          fullWidth
                          sx={{ height: 80, flexDirection: 'column' }}
                          onClick={() => handleQuickAction('analytics')}
                          startIcon={<BarChartIcon />}
                        >
                          Ver Reportes
                        </Button>
                      </Grid>
                      <Grid item xs={6}>
                        <Button
                          variant='outlined'
                          fullWidth
                          sx={{ height: 80, flexDirection: 'column' }}
                          onClick={() => handleQuickAction('categories')}
                          startIcon={<LocalOfferIcon />}
                        >
                          Categorías
                        </Button>
                      </Grid>
                      <Grid item xs={6}>
                        <Button
                          variant='outlined'
                          fullWidth
                          sx={{ height: 80, flexDirection: 'column' }}
                          onClick={() => handleQuickAction('settings')}
                          startIcon={<SettingsIcon />}
                        >
                          Configuración
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            <Typography variant='h6' sx={{ mb: 2 }}>
              Gestión de Usuarios
            </Typography>
            <Typography color='text.secondary'>
              Funcionalidad de gestión de usuarios en desarrollo...
            </Typography>
          </Box>
        )}

        {activeTab === 2 && (
          <Box>
            <Typography variant='h6' sx={{ mb: 2 }}>
              Gestión de Cursos
            </Typography>
            <Typography color='text.secondary'>
              Funcionalidad de gestión de cursos en desarrollo...
            </Typography>
          </Box>
        )}

        {activeTab === 3 && (
          <Box>
            <Typography variant='h6' sx={{ mb: 2 }}>
              Analíticas
            </Typography>
            <Typography color='text.secondary'>
              Funcionalidad de analíticas en desarrollo...
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default LmsAdmin
