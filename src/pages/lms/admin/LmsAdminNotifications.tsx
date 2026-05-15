import React from 'react'
import { Box, Alert, Typography } from '@mui/material'
import { useStore } from '@nanostores/react'
import { userStore } from '../../../store/userStore'
import LmsNotificationCenter from '../shared/LmsNotificationCenter'

const LmsAdminNotifications: React.FC = () => {
  const $userStore = useStore(userStore)

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant='h4' sx={{ fontWeight: 700, mb: 1 }}>
          Notificaciones LMS
        </Typography>
        <Typography color='text.secondary'>
          Revisa aquí los avisos recientes del LMS y entra rápido al punto correcto del flujo.
        </Typography>
      </Box>

      <Alert severity='info' sx={{ mb: 3 }}>
        Usa esta vista para revisar asignaciones nuevas, recordatorios, cierres de curso y
        certificados emitidos sin tener que buscar el contexto en varias pantallas.
      </Alert>

      <LmsNotificationCenter
        userRole='admin'
        userId={$userStore.customer?.id || 1}
      />
    </Box>
  )
}

export default LmsAdminNotifications
