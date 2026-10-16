import React from 'react'
import { Container } from '@mui/material'
import { NotificationsActive } from '@mui/icons-material'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import { useStore } from '@nanostores/react'
import { userStore } from '../../../store/userStore'
import LmsNotificationCenter from '../shared/LmsNotificationCenter'

const LmsAdminNotifications: React.FC = () => {
  const $userStore = useStore(userStore)

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Mis notificaciones'
        subtitle='Tus avisos del LMS: asignaciones, recordatorios y certificados. Para ver el estado de todos los usuarios, usa Cumplimiento.'
        icon={<NotificationsActive />}
      />

      <LmsNotificationCenter
        userRole='admin'
        userId={$userStore.customer?.id || 1}
      />
    </Container>
  )
}

export default LmsAdminNotifications
