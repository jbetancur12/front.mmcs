import { Typography, Container, Paper, Button } from '@mui/material'

import { ArrowBack, Email } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import EmailNotificationSettings from 'src/Components/Iot/emails/EmailNotificationSettings'

const EmailSettingsPage = () => {
  const navigate = useNavigate()
  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/iot')}
        sx={{ mb: 1, color: 'text.secondary', textTransform: 'none', fontWeight: 600 }}
      >
        Volver a dispositivos
      </Button>

      <LmsPageHeader
        title='Configuración de Notificaciones'
        subtitle='Correos que reciben las alarmas de los dispositivos IoT'
        icon={<Email />}
      />

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
