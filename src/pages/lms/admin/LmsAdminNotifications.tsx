import React from 'react'
import { Box, Typography } from '@mui/material'
import { useStore } from '@nanostores/react'
import { userStore } from '../../../store/userStore'
import LmsNotificationCenter from '../shared/LmsNotificationCenter'

const LmsAdminNotifications: React.FC = () => {
  const $userStore = useStore(userStore)

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant='h4' sx={{ fontWeight: 700, mb: 1 }}>
          Mis notificaciones
        </Typography>
        <Typography color='text.secondary'>
          Tus avisos del LMS (asignaciones, recordatorios y certificados). Para ver el estado de todos los
          usuarios, usa Cumplimiento.
        </Typography>
      </Box>

      <LmsNotificationCenter
        userRole='admin'
        userId={$userStore.customer?.id || 1}
      />
    </Box>
  )
}

export default LmsAdminNotifications
