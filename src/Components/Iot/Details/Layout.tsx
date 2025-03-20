import { useState } from 'react'
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Tabs,
  Tab,
  Paper,
  Grid,
  Box
} from '@mui/material'
import { ArrowBack } from '@mui/icons-material'

const Layout = () => {
  const [selectedTab, setSelectedTab] = useState<string>('resumen')

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setSelectedTab(newValue)
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Barra superior */}
      <AppBar position='static' color='default'>
        <Toolbar>
          <IconButton edge='start' color='inherit' aria-label='volver'>
            <ArrowBack />
          </IconButton>

          <Box sx={{ flexGrow: 1, ml: 2 }}>
            <Typography variant='h6' component='span'>
              Sensor: "Temp"
            </Typography>
            <Typography component='span' sx={{ ml: 2 }}>
              Estado: [
              <Box
                component='span'
                sx={{
                  color: status === 'Online' ? 'success.main' : 'error.main',
                  fontWeight: 'bold'
                }}
              >
                {'status'}
              </Box>
              ]
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Pestañas */}
      <Tabs
        value={selectedTab}
        onChange={handleTabChange}
        variant='fullWidth'
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label='Resumen' value='resumen' />
        <Tab label='Histórico' value='historico' />
        <Tab label='Configuración' value='configuracion' />
        <Tab label='Eventos' value='eventos' />
      </Tabs>

      {/* Contenido principal */}
      <Box sx={{ p: 3 }}>
        {selectedTab === 'resumen' && (
          <>
            <Grid container spacing={3}>
              {/* Gauges */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant='h6'>Gauge: Temperatura (°C)</Typography>
                  {/* Aquí iría el componente del gauge */}
                  <Box sx={{ height: 200, bgcolor: 'grey.100' }} />
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant='h6'>Gauge: Humedad (%)</Typography>
                  {/* Aquí iría el componente del gauge */}
                  <Box sx={{ height: 200, bgcolor: 'grey.100' }} />
                </Paper>
              </Grid>

              {/* Última actualización */}
              <Grid item xs={12}>
                <Typography variant='body2' color='text.secondary'>
                  Última actualización: 14:30
                </Typography>
              </Grid>

              {/* Mapa */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant='h6' gutterBottom>
                    Mini-mapa
                  </Typography>
                  <Box sx={{ height: 200, bgcolor: 'grey.100' }} />
                  <Typography variant='body2' sx={{ mt: 1 }}>
                    Ubicación exacta: Lat, Lon
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </>
        )}

        {selectedTab === 'historico' && (
          <Paper sx={{ p: 2 }}>{/* Contenido histórico */}</Paper>
        )}

        {selectedTab === 'configuracion' && (
          <Paper sx={{ p: 2 }}>{/* Contenido configuración */}</Paper>
        )}

        {selectedTab === 'eventos' && (
          <Paper sx={{ p: 2 }}>{/* Contenido eventos */}</Paper>
        )}
      </Box>
    </Box>
  )
}

export default Layout
