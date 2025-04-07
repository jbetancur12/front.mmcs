import {
  Typography,
  Container,
  Paper,
  Breadcrumbs,
  Link as MuiLink
} from '@mui/material'

import { HomeRounded, Email } from '@mui/icons-material'
import { Link } from 'react-router-dom'
import EmailNotificationSettings from 'src/Components/Iot/emails/EmailNotificationSettings'

const EmailSettingsPage = () => {
  return (
    <Container maxWidth='lg' sx={{ py: 4 }}>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 3 }}>
        <Link to='/iot/map'>
          <MuiLink
            component='span'
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              color: 'text.primary',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            <HomeRounded sx={{ mr: 0.5 }} fontSize='small' />
            Inicio
          </MuiLink>
        </Link>
        <Typography
          sx={{ display: 'flex', alignItems: 'center' }}
          color='text.primary'
        >
          <Email sx={{ mr: 0.5 }} fontSize='small' />
          Configuración de Notificaciones
        </Typography>
      </Breadcrumbs>

      <Typography variant='h4' component='h1' gutterBottom sx={{ mb: 4 }}>
        Configuración de Notificaciones
      </Typography>

      <EmailNotificationSettings />

      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant='h6' gutterBottom>
          Acerca de las notificaciones por correo
        </Typography>

        <Typography variant='body2' color='text.secondary' paragraph>
          El sistema de notificaciones envía correos electrónicos automáticos
          cuando se activan o desactivan alarmas en los dispositivos
          monitoreados. Estos correos contienen información detallada sobre la
          condición que activó la alarma, su severidad y otros datos relevantes.
        </Typography>

        <Typography variant='body2' color='text.secondary' paragraph>
          Características del sistema de notificaciones:
        </Typography>

        <ul>
          <li>
            <Typography variant='body2' color='text.secondary'>
              Notifica activación y desactivación de alarmas
            </Typography>
          </li>
          <li>
            <Typography variant='body2' color='text.secondary'>
              Incluye detalles como el nombre del dispositivo, métrica, umbral y
              severidad
            </Typography>
          </li>
          <li>
            <Typography variant='body2' color='text.secondary'>
              En las notificaciones de desactivación, incluye el tiempo que la
              alarma estuvo activa
            </Typography>
          </li>
          <li>
            <Typography variant='body2' color='text.secondary'>
              Diseño visual que destaca la severidad mediante colores
            </Typography>
          </li>
        </ul>
      </Paper>
    </Container>
  )
}

export default EmailSettingsPage
